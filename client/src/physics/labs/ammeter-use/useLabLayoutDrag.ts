/**
 * 无限画布上的「器材 / 导线」拖动逻辑。
 *
 * 与接线柱拉线（usePointerDrag + 控制器 action）互不干扰：
 *   · 拖接线柱 → 生成/删除导线（改电路拓扑）
 *   · 拖器材   → 平移器材（接线柱与导线端点一起跟随，拓扑不变）
 *   · 拖导线中点 → 调整导线弧度（拓扑不变）
 *
 * 所以学生可以把器材摆成任意构图、把线弯成任意形状，
 * 而电路是否成立始终由 controller 的拓扑分析判定。
 */
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import type { Position } from '../../runtime/types'
import type { AmmeterTerminalId } from './definition'
import {
  bendFromPosition,
  clampComponentPosition,
  componentAt,
  moveComponent,
  rescueComponent,
  setWireBend,
  terminalPosition,
  wireHandleAt,
  type CanvasVisibleRect,
  type LabComponentId,
  type LabLayout,
} from './layout'

interface ComponentDragState {
  pointerId: number
  id: LabComponentId
  /** 指针相对器材中心的偏移，保证拖动时器材不"跳"到指针下方 */
  offset: Position
}

interface WireDragState {
  pointerId: number
  from: AmmeterTerminalId
  to: AmmeterTerminalId
}

export interface LabLayoutDragApi {
  /** 正在拖动的内容（用于视觉反馈） */
  dragging: { kind: 'component'; id: LabComponentId } | { kind: 'wire'; from: AmmeterTerminalId; to: AmmeterTerminalId } | null
  /** 器材本体的拖拽手柄（渲染在器材上，覆盖"本体"区域而不覆盖接线柱） */
  componentHandlers(id: LabComponentId): {
    onPointerDown(event: PointerEvent<SVGElement>): void
    onPointerMove(event: PointerEvent<SVGElement>): void
    onPointerUp(event: PointerEvent<SVGElement>): void
    onPointerCancel(event: PointerEvent<SVGElement>): void
  }
  /** 导线折点手柄 */
  wireHandlers(from: AmmeterTerminalId, to: AmmeterTerminalId): {
    onPointerDown(event: PointerEvent<SVGElement>): void
    onPointerMove(event: PointerEvent<SVGElement>): void
    onPointerUp(event: PointerEvent<SVGElement>): void
    onPointerCancel(event: PointerEvent<SVGElement>): void
  }
}

export interface UseLabLayoutDragOptions {
  layout: LabLayout
  /**
   * 更新布局。
   *
   * 接受函数式更新：松手时的可见性校验需要基于"最新布局"计算，
   * 而事件回调闭包里的 `layout` 可能已经过期（拖动过程中每帧都在 setLayout）。
   */
  setLayout(next: LabLayout | ((current: LabLayout) => LabLayout)): void
  /**
   * 接线柱坐标查询：用于判断「这一按到底是接线还是搬器材」。
   *
   * 判据不是「附近有没有接线柱」（电流表的三只接线柱本来就长在表体上，
   * 随便按表体中心都会落在某个接线柱的吸附半径里），而是
   * **指针离最近接线柱是否比离器材中心更近**。
   * 只有明确按在接线柱上才让位给拉线逻辑，其余区域一律算拖动器材。
   */
  nearestTerminal?(position: Position): { id: AmmeterTerminalId; position: Position } | null
  /**
   * 指针屏幕坐标 → 画布坐标。
   *
   * **必须与 `visibleRect()` 同口径**（都经 `resolveViewport` 反投影）：
   * 拖动映射与可见范围一旦用两套变换，"拖到底"的落点就会比"可见下界"多出若干像素，
   * 那几像素既看不见也不会触发收回（实测 7～8px）。
   */
  scenePosition(event: PointerEvent<SVGElement>): Position | null
  /**
   * 当前可见的画布矩形（布局坐标）。
   *
   * 拖动结束时不变量校验用它：器材只要被拖到可见范围之外，就立刻收回到
   * 最近的合法位置。这是"全屏无限画布 + 拖动不被遮挡"的兜底 ——
   * 以前这里没有这层校验，器材一拖到边缘就整体滑出屏幕，看起来就是"被遮挡/丢了"。
   */
  visibleRect?(): CanvasVisibleRect
}

/** 指针离接线柱必须比离器材中心更近（且足够靠近），才认定为「按在接线柱上」 */
export const TERMINAL_GRAB_RADIUS = 26

function samePosition(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6
}

export function useLabLayoutDrag({ layout, setLayout, nearestTerminal, scenePosition, visibleRect }: UseLabLayoutDragOptions): LabLayoutDragApi {
  const componentRef = useRef<ComponentDragState | null>(null)
  const wireRef = useRef<WireDragState | null>(null)
  const [dragging, setDragging] = useState<LabLayoutDragApi['dragging']>(null)

  const endComponent = useCallback((event: PointerEvent<SVGElement>) => {
    const active = componentRef.current
    if (active === null || active.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    componentRef.current = null
    setDragging(null)
    /**
     * 松手时的可见性不变量：器材必须仍在可见范围内。
     *
     * 用 setLayout 的函数式更新拿"最新的"布局，而不是在渲染期往 ref 里写值 ——
     * 后者是 React 明确禁止的（`react-hooks/refs`），也会在并发渲染下读到过期快照。
     */
    if (visibleRect !== undefined) {
      const visible = visibleRect()
      if (visible !== null) setLayout((current) => rescueComponent(current, active.id, visible))
    }
  }, [setLayout, visibleRect])

  const endWire = (event: PointerEvent<SVGElement>) => {
    const active = wireRef.current
    if (active === null || active.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    wireRef.current = null
    setDragging(null)
  }

  const componentHandlers = useCallback(
    (id: LabComponentId) => ({
      onPointerDown: (event: PointerEvent<SVGElement>) => {
        if (event.button !== 0 || componentRef.current !== null || wireRef.current !== null) return
        const position = scenePosition(event)
        if (position === null) return
        const center = layout.components[id]
        // 指针明确按在接线柱上（比按在器材本体上更近）时让位给"拉线"，避免想接线却把器材拖走
        if (nearestTerminal !== undefined) {
          const terminal = nearestTerminal(position)
          if (terminal !== null) {
            const toTerminal = Math.hypot(position.x - terminal.position.x, position.y - terminal.position.y)
            const toCenter = Math.hypot(position.x - center.x, position.y - center.y)
            if (toTerminal <= TERMINAL_GRAB_RADIUS && toTerminal < toCenter) return
          }
        }
        componentRef.current = { pointerId: event.pointerId, id, offset: { x: position.x - center.x, y: position.y - center.y } }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.stopPropagation()
        setDragging({ kind: 'component', id })
      },
      onPointerMove: (event: PointerEvent<SVGElement>) => {
        const active = componentRef.current
        if (active === null || active.pointerId !== event.pointerId) return
        const position = scenePosition(event)
        if (position === null) return
        const target = clampComponentPosition(active.id, { x: position.x - active.offset.x, y: position.y - active.offset.y })
        if (samePosition(layout.components[active.id], target)) return
        setLayout(moveComponent(layout, active.id, target))
      },
      onPointerUp: endComponent,
      onPointerCancel: endComponent,
    }),
    [layout, setLayout, scenePosition, nearestTerminal, endComponent],
  )

  const wireHandlers = useCallback(
    (from: AmmeterTerminalId, to: AmmeterTerminalId) => ({
      onPointerDown: (event: PointerEvent<SVGElement>) => {
        if (event.button !== 0 || wireRef.current !== null || componentRef.current !== null) return
        wireRef.current = { pointerId: event.pointerId, from, to }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.stopPropagation()
        setDragging({ kind: 'wire', from, to })
      },
      onPointerMove: (event: PointerEvent<SVGElement>) => {
        const active = wireRef.current
        if (active === null || active.pointerId !== event.pointerId) return
        const position = scenePosition(event)
        if (position === null) return
        setLayout(setWireBend(layout, active.from, active.to, bendFromPosition(layout, active.from, active.to, position)))
      },
      onPointerUp: endWire,
      onPointerCancel: endWire,
    }),
    [layout, setLayout, scenePosition],
  )

  return { dragging, componentHandlers, wireHandlers }
}

/** 供场景复用的纯查询：指针是否落在器材本体命中区 */
export { componentAt, terminalPosition, wireHandleAt }
