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
 *
 * ⚠️ 拖动**不做**可见范围门禁（这是「无限画布」的定义，见 `clampComponentWithinView`）：
 * 器材可以被拖到屏幕边沿之外，学生再平移画布把它找回来。
 * 历史上这里在 `onPointerMove` 每帧跑一遍 `rescueComponent`，
 * 于是「拖到靠近边沿就拖不动了」—— 那正是本次要修的缺陷。
 */
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import type { Position } from '../../runtime/types'
import type { AmmeterTerminalId } from './definition'
import {
  bendFromPosition,
  clampComponentWithinView,
  componentAt,
  moveComponent,
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
   * 接受函数式更新：拖动是每帧一次 `setLayout`，而回调闭包里的 `layout`
   * 可能已经过期（同一帧内可能连着派发多次 `pointermove`），
   * 用函数式更新才能从"真实当前位置"出发，位移不被吞掉。
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
  /** 指针屏幕坐标 → 画布坐标（经相机投影反算） */
  scenePosition(event: PointerEvent<SVGElement>): Position | null
  /**
   * 当前可见的画布矩形（布局坐标）。
   *
   * ⚠️ **拖动已经不再读它**。这个参数保留下来，是因为场景侧仍用它驱动
   * 「全部收回」入口；但拖动路径一旦再读它，就会退回
   * "拖到边沿被拽回来"的旧行为（用户原话：并不是无限画布）。
   *
   * @deprecated 拖动不再使用。
   */
  visibleRect?(): CanvasVisibleRect
  /**
   * 屏幕空间的越界量查询（0 = 屏幕内）。
   *
   * @deprecated 拖动不再使用 —— 无限画布不允许按屏幕像素把器材拽回来。
   */
  screenCheck?(id: LabComponentId, center: Position): number
  /**
   * 屏幕空间的"推回最近合法位置"收敛器。
   *
   * @deprecated 拖动不再使用。
   */
  pushIntoView?(id: LabComponentId, center: Position): Position | null
}

/**
 * @deprecated 拖动中不再保留"屏幕余量"。
 *
 * 它原本是"模型投影与浏览器 CSS 的 3D 变换不完全等价"的误差补偿，
 * 但副作用是：器材离屏幕边沿还有 64px 时就被判成"越界"并被拽回来 ——
 * 这正是用户反馈的「拖动靠近边沿就无法拖动」。
 * 保留导出仅为兼容既有引用。
 */
export const DRAG_SCREEN_MARGIN = 64

/** 指针离接线柱必须比离器材中心更近（且足够靠近），才认定为「按在接线柱上」 */
export const TERMINAL_GRAB_RADIUS = 26

function samePosition(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6
}

export function useLabLayoutDrag({ layout, setLayout, nearestTerminal, scenePosition }: UseLabLayoutDragOptions): LabLayoutDragApi {
  const componentRef = useRef<ComponentDragState | null>(null)
  const wireRef = useRef<WireDragState | null>(null)
  const [dragging, setDragging] = useState<LabLayoutDragApi['dragging']>(null)

  /**
   * 松开指针 —— **刻意不做任何"收回可见范围"**。
   *
   * 需求原文：「我要的无限画布功能，你给搞没了；现在我的实验器材无法自由的
   * 拖动到任意位置，比如拖动靠近边沿就无法拖动了，并不是无限画布」。
   *
   * 旧实现在这里调用 `rescueComponent`，把刚放到屏幕边沿的器材**弹回**视野内；
   * 拖动中还有一层同样的门禁（每帧一次）。两层叠起来，学生看到的边界
   * 既不是屏幕边、也不是画布边，而是"回收盒"的内缩线 —— 看起来就是"框住了"。
   *
   * 现在松手即终态：器材停在哪就是哪（唯一约束是防丢失的 ±6000 画布单位）。
   * 想找回屏幕外的器材有两条明确路径：① 平移画布；② 「全部收回」按钮。
   */
  const endComponent = useCallback((event: PointerEvent<SVGElement>) => {
    const active = componentRef.current
    if (active === null || active.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    componentRef.current = null
    setDragging(null)
  }, [])

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
        const wanted = { x: position.x - active.offset.x, y: position.y - active.offset.y }
        /**
         * ⚠️ 必须用**函数式更新**，不能 `moveComponent(layout, …)`。
         *
         * 拖动是每帧一次 `setLayout`，而 `layout` 是这次渲染的闭包值 ——
         * 指针快速移动时，同一帧里会连着派发多次 `pointermove`，
         * 每次都用**同一份**过期 `layout` 做基线，位移就被"吞掉"了：
         * 实测表现为器材先冲出屏幕 7～18px，下一帧才被拉回来（肉眼可见的"甩出去再弹回"）。
         * 用函数式更新拿"最新布局"，每一帧都从真实当前位置出发。
         */
        setLayout((current) => {
          /**
           * 分两层，各管一件事，互不越界：
           *
           *   1. `Math.max(0, scale)` —— 指针坐标除以相机 scale 得到画布位移，
           *      `scale` 理论上恒 > 0，这里只是不让退化值把器材扔到 NaN；
           *   2. `clampComponentWithinView` —— **只有**防丢失兜底（±6000 画布单位）。
           *
           * 这里**不再**比对可见矩形 / 屏幕像素。上一版每帧都跑一遍
           * `rescueComponent`（还额外加 `DRAG_SCREEN_MARGIN = 64` 的"模型误差余量"），
           * 于是器材一接近屏幕边沿就被拽回来 —— 用户的原话是
           * 「拖动靠近边沿就无法拖动了，并不是无限画布」。
           */
          const target = clampComponentWithinView(active.id, wanted, null)
          if (samePosition(current.components[active.id], target)) return current
          return moveComponent(current, active.id, target)
        })
      },
      onPointerUp: endComponent,
      onPointerCancel: endComponent,
    }),
    // `layout` 仍被 `onPointerDown` 用来算指针相对器材中心的偏移（见其注释），必须留在依赖里
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
