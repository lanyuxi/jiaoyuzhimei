/**
 * 「练习使用电流表」实验页面 —— 按竞品（NB 物理实验，s.nobook.com?id=402785）1:1 复原。
 *
 * 版式与交互对齐竞品：
 *   · 顶部深色标题栏（左侧工具条：保存/清空/重置/撤销/恢复/设置，电路图/表格；右侧协作入口）
 *   · 深色画布（#343941），实物器材 + 手绘红色导线，可自由拖动接线柱连线
 *   · 左上角「转电路图」浮层按钮，一键切换实物图 / 原理图
 *   · 右上角「边做边看 / 实验报告 / 交互热点」，左下角「电与磁 / 缩放 / 画笔 / 裁剪 / 放大 / 文字」
 *   · 右侧「实验报告」抽屉：目的/原理/器材/步骤/结论/补充（文案取自竞品原文）
 *   · 底部读数条：实时读数、闭合开关、量程切换、灯泡状态
 */
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import {
  Aperture,
  BookOpen,
  FileText,
  Gauge,
  Grid3x3,
  LayoutGrid,
  PlayCircle,
} from 'lucide-react'
import type { TextbookPhysicsExperiment } from '../../curriculum/types'
import PhysicsLabShell, { type PhysicsLabSceneProps } from '../../runtime/PhysicsLabShell'
import InfiniteCanvas from '../../runtime/immersive/InfiniteCanvas'
import { usePointerDrag } from '../../runtime/usePointerDrag'
import type { LabAction, Position } from '../../runtime/types'
import {
  CIRCUIT_TERMINALS,
  RANGE_SPEC,
  WORKBENCH_VIEW_HEIGHT,
  WORKBENCH_VIEW_WIDTH,
  isTerminalDraggable,
  type AmmeterTerminalId,
  type CircuitTerminalId,
} from './definition'
import { ammeterController, type AmmeterLabState } from './controller'
import { AmmeterA1, BatteryHolderE1, KnifeSwitch, LampHolderL1, TerminalPost } from './CompetitorParts'
import { COMPETITOR_BACKGROUND, COMPETITOR_TEXT_PANEL } from './competitorScene'
import { TERMINAL_DRAW_ORDER } from './competitorGeometry'
import {
  COMPONENT_HIT_RADIUS,
  COMPONENT_LABELS,
  LAB_COMPONENT_IDS,
  createDefaultLayout,
  layoutBounds,
  terminalPosition,
  wireHandlePosition,
  wirePathD,
  type LabComponentId,
  type LabLayout,
} from './layout'
import { useLabLayoutDrag } from './useLabLayoutDrag'
import { AmmeterSchematic } from './SchematicView'

const workbenchWidth = WORKBENCH_VIEW_WIDTH
const workbenchHeight = WORKBENCH_VIEW_HEIGHT

/** 竞品画布上的器材参考点（世界坐标已映射到视图坐标） */
const canvasBackground = COMPETITOR_BACKGROUND
const chromeBorder = '#33383f'

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Partial<Position>
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function terminalHasWire(state: AmmeterLabState, id: CircuitTerminalId): boolean {
  return state.edges.some((edge) => edge.from === id || edge.to === id)
}

interface TerminalProps {
  id: AmmeterTerminalId
  state: AmmeterLabState
  /** 接线柱坐标（由布局推导，拖动器材时会跟着移动） */
  point: { x: number; y: number }
  drag: {
    onPointerDown(event: PointerEvent<SVGElement>): void
    onPointerMove(event: PointerEvent<SVGElement>): void
    onPointerUp(event: PointerEvent<SVGElement>): void
    onPointerCancel(event: PointerEvent<SVGElement>): void
  }
}

/**
 * 可拖拽接线柱：竞品同款外观（立柱+旋帽）叠加透明命中区。
 *
 * 坐标不再写死，而是由 layout.terminalPosition 推导 —— 器材被拖到任何位置，
 * 它的接线柱都与器材本体一起移动，导线端点也随之跟随，绝不会"线和器材脱开"。
 */
function CompetitorTerminal({ id, state, point, drag }: TerminalProps) {
  const terminal = CIRCUIT_TERMINALS[id]
  const connected = terminalHasWire(state, id)
  const disabled = !isTerminalDraggable(id, state)
  const handlers = {
    onPointerDown: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerDown(event) },
    onPointerMove: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerMove(event) },
    onPointerUp: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerUp(event) },
    onPointerCancel: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerCancel(event) },
  }
  return (
    <g>
      <TerminalPost x={point.x} y={point.y} polarity={terminal.polarity} connected={connected} />
      <circle
        data-hit-target="ammeter-terminal-knob"
        cx={point.x}
        cy={point.y - 12}
        r="19"
        fill="transparent"
        className={disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}
        role="button"
        tabIndex={0}
        aria-label={terminal.label}
        {...handlers}
      />
    </g>
  )
}

/**
 * 器材本体拖动命中区。
 *
 * 单独抽成一个组件的原因：它必须画在器材本体上、但不能盖住接线柱，
 * 否则「想接线」会变成「把器材拖走」。指针事件里还会再判一次是否落在接线柱上，
 * 命中区只是第一层保险。
 */
function ComponentDragHandle({ id, layout, dragging, drag }: {
  id: LabComponentId
  layout: LabLayout
  dragging: boolean
  drag: {
    onPointerDown(event: PointerEvent<SVGElement>): void
    onPointerMove(event: PointerEvent<SVGElement>): void
    onPointerUp(event: PointerEvent<SVGElement>): void
    onPointerCancel(event: PointerEvent<SVGElement>): void
  }
}) {
  const center = layout.components[id]
  return (
    <g
      data-component-drag={id}
      role="button"
      tabIndex={0}
      aria-label={`拖动${COMPONENT_LABELS[id]}到任意位置`}
      className="cursor-move"
      {...drag}
    >
      {/* 命中区：与器材本体同尺寸的透明矩形（不遮挡接线柱） */}
      <rect
        x={center.x - COMPONENT_HIT_RADIUS[id].rx}
        y={center.y - COMPONENT_HIT_RADIUS[id].ry}
        width={COMPONENT_HIT_RADIUS[id].rx * 2}
        height={COMPONENT_HIT_RADIUS[id].ry * 2}
        rx={12}
        fill="transparent"
      />
      {/* 悬停/拖动时的虚线包围框，给"这件器材可以直接拖"的视觉提示 */}
      <rect
        className="opacity-0 transition-opacity hover:opacity-100"
        style={{ opacity: dragging ? 1 : undefined }}
        x={center.x - COMPONENT_HIT_RADIUS[id].rx}
        y={center.y - COMPONENT_HIT_RADIUS[id].ry}
        width={COMPONENT_HIT_RADIUS[id].rx * 2}
        height={COMPONENT_HIT_RADIUS[id].ry * 2}
        rx={12}
        fill="none"
        stroke="#7aa2ff"
        strokeWidth="1.2"
        strokeDasharray="6 5"
        pointerEvents="none"
      />
    </g>
  )
}

/** 导线折点手柄：拖动即可像真导线一样任意弯折（端点仍牢牢接在接线柱上） */
function WireBendHandle({ from, to, layout, active, drag }: {
  from: AmmeterTerminalId
  to: AmmeterTerminalId
  layout: LabLayout
  active: boolean
  drag: {
    onPointerDown(event: PointerEvent<SVGElement>): void
    onPointerMove(event: PointerEvent<SVGElement>): void
    onPointerUp(event: PointerEvent<SVGElement>): void
    onPointerCancel(event: PointerEvent<SVGElement>): void
  }
}) {
  const handle = wireHandlePosition(layout, from, to)
  return (
    <g
      data-hit-target="wire-bend-handle"
      role="button"
      tabIndex={0}
      aria-label={`弯折${CIRCUIT_TERMINALS[from].label}到${CIRCUIT_TERMINALS[to].label}的导线`}
      className="cursor-grab"
      {...drag}
    >
      <circle cx={handle.x} cy={handle.y} r="18" fill="transparent" />
      <circle
        cx={handle.x}
        cy={handle.y}
        r={active ? 7 : 5}
        fill={active ? '#f0c86a' : '#e8756a'}
        stroke="#2b1410"
        strokeWidth="1.2"
        opacity={active ? 1 : 0.72}
        pointerEvents="none"
      />
    </g>
  )
}

interface CompetitorSceneProps extends PhysicsLabSceneProps<AmmeterLabState> {
  onTogglePanel(): void
  onOpenReport(): void
  panelOpen: boolean
}

function CompetitorSceneCanvas({ state, dispatch, onTogglePanel, onOpenReport, panelOpen }: CompetitorSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cameraRef = useRef<{ scale: number; x: number; y: number }>({ scale: 1, x: 0, y: 0 })
  const [preview, setPreview] = useState<{ from: AmmeterTerminalId; position: Position } | null>(null)
  const [showSchematic, setShowSchematic] = useState(false)
  /**
   * 器材 / 导线布局（无限画布的可变部分）。
   * 初始值 = 竞品原始坐标，所以一进页面依然 1:1 复原；
   * 之后学生可以把每件器材拖到任意位置、把每根导线弯成任意形状。
   */
  const [layout, setLayout] = useState<LabLayout>(createDefaultLayout)
  /**
   * 相机初始聚焦范围固定为「初始构图」。
   * 刻意不跟随实时布局，否则每拖一帧相机都会重新 fitContent，表现为"越拖越跑"。
   */
  const [initialBounds] = useState(() => layoutBounds(createDefaultLayout()))

  const activeTrial = state.activeTrialId === null ? undefined : state.trials.find((trial) => trial.id === state.activeTrialId)
  const reading = activeTrial?.reading ?? 0
  const lit = state.switchClosed && reading > 0
  const s1Closed = state.switchClosed
  const s2Closed = state.switchClosed

  /**
   * 指针坐标 → 画布坐标。
   * 无限画布下 SVG 被相机做 scale + translate，所以必须用相机参数反算，
   * 否则「3D 倾斜 + 缩放」后接线命中会整体偏移。
   */
  const scenePositionFor = useCallback((event: { clientX: number; clientY: number }): Position | null => {
    const stage = stageRef.current
    if (stage === null) return null
    const rect = stage.getBoundingClientRect()
    const camera = cameraRef.current
    return {
      x: (event.clientX - rect.left - camera.x) / camera.scale,
      y: (event.clientY - rect.top - camera.y) / camera.scale,
    }
  }, [])

  // 命中测试需要在事件回调里读取"最新的"布局，用 ref 镜像避免回调频繁重建
  const layoutRef = useRef(layout)
  // eslint-disable-next-line react-hooks/refs -- 事件回调需要读到最新布局，写入 ref 是刻意为之
  layoutRef.current = layout

  /** 最近的接线柱（含坐标）：由布局推导，拖动器材后命中区同步移动 */
  const nearestTerminalTo = useCallback((position: Position) => nearestTerminal(layoutRef.current, position), [])

  const pointerDrag = usePointerDrag({
    stageRef,
    positionFor: scenePositionFor,
    dispatch: (action: LabAction) => {
      const payload = action.payload as { subject?: unknown; position?: unknown } | undefined
      const from = payload?.subject
      if (action.type === 'dragStart' && typeof from === 'string' && from in CIRCUIT_TERMINALS && isPosition(payload?.position)) {
        setPreview({ from: from as AmmeterTerminalId, position: payload.position })
        dispatch({ type: 'dragStart', payload: { subject: from } }, 'start-wire')
        return
      }
      if (action.type === 'dragMove' && isPosition(payload?.position)) {
        const position = payload.position
        setPreview((current) => (current ? { ...current, position } : current))
        return
      }
      if (action.type === 'dragCancel') {
        setPreview(null)
        dispatch({ type: 'dragCancel', payload: { subject: from } }, 'cancel-wire')
        return
      }
      if (action.type === 'dragEnd') {
        setPreview(null)
        const target = isPosition(payload?.position) ? terminalAt(layoutRef.current, payload.position) : null
        if (typeof from !== 'string' || target === null || target === from) {
          dispatch({ type: 'dragCancel', payload: { subject: from } }, 'cancel-wire')
          return
        }
        dispatch({ type: 'connect', payload: { from, to: target } }, 'connect-wire')
      }
    },
  })

  const pointerEvent = (event: PointerEvent<SVGElement>) => event as unknown as PointerEvent<HTMLElement>

  /** 器材 / 导线拖动（无限画布：器材任意摆放、导线任意弯折） */
  const labDrag = useLabLayoutDrag({
    layout,
    setLayout,
    nearestTerminal: nearestTerminalTo,
    scenePosition: scenePositionFor as (event: PointerEvent<SVGElement>) => Position | null,
  })

  const ammeterPoint = layout.components.A1
  const lampPoint = layout.components.L1
  const s1Point = layout.components.S1
  const s2Point = layout.components.S2
  const batteryPoint = layout.components.E1

  return (
    /*
      画布底色：整块纯色，**不再是"中间一块方框"**。
      背景由根容器铺满整个视口（与 SVG 场景不再有尺寸关系），
      所以器材/导线可以被拖到任意位置，看上去永远都还在同一张无限画布上。
    */
    <div className="relative h-full w-full min-h-0" style={{ background: canvasBackground }}>
      {/* 无限画布 + 3D 透视舞台：器材铺满整块屏幕 */}
      {/* SVG 只负责画器材与导线，本身不再绘制任何背景（无桌面矩形、无网格、无暗角） */}
      <InfiniteCanvas
        stageRef={stageRef}
        content={initialBounds}
        viewWidth={workbenchWidth}
        viewHeight={workbenchHeight}
        onCameraChange={(next) => { cameraRef.current = next }}
      >
        <svg
          ref={svgRef}
          width={workbenchWidth}
          height={workbenchHeight}
          viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`}
          className="block"
          role="img"
          aria-label="练习使用电流表实验台"
        >
          {/*
            无限画布上**不再有任何背景方框**：
            原先的桌面矩形 + 桌面渐变 + 40px 网格 + 边缘暗角都会把画布框成一个
            "方框"，与"无限"的语义冲突，已全部移除。
            画布底色统一由外层容器的纯色背景提供（见下方根节点 background）。
          */}

          {!showSchematic && (
            <>
              {/*
                导线画在最底层：实物导线是从器材**下方**绕过去的，
                画在器材之上会把刀开关刀片、电流表表盘挡住，学生就看不清示数了。
              */}
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {state.edges.map((edge) => {
                  const path = wirePathD(layout, edge.from, edge.to)
                  return (
                    <g key={`${edge.from}-${edge.to}`}>
                      <path d={path} stroke="#000000" strokeWidth="9" opacity="0.25" />
                      <path d={path} stroke="#8c1f16" strokeWidth="7" />
                      <path d={path} stroke="#c0392b" strokeWidth="5" />
                      <path d={path} stroke="#e8756a" strokeWidth="1.6" opacity="0.75" />
                    </g>
                  )
                })}
                {preview && (
                  <path
                    d={`M ${terminalPosition(layout, preview.from).x.toFixed(1)} ${terminalPosition(layout, preview.from).y.toFixed(1)} L ${preview.position.x.toFixed(1)} ${preview.position.y.toFixed(1)}`}
                    stroke="#4c9be8"
                    strokeWidth="4"
                    strokeDasharray="9 7"
                  />
                )}
              </g>

              {/* 器材（竞品同款实物）：坐标来自可变布局，可被拖到画布任意位置 */}
              <BatteryHolderE1 x={batteryPoint.x} y={batteryPoint.y} />
              <KnifeSwitch x={s1Point.x} y={s1Point.y} closed={s1Closed} label="S1" />
              <KnifeSwitch x={s2Point.x} y={s2Point.y} closed={s2Closed} label="S2" />
              <LampHolderL1 x={lampPoint.x} y={lampPoint.y} lit={lit} />
              <AmmeterA1 x={ammeterPoint.x} y={ammeterPoint.y} reading={reading} range={state.activeRange} overRange={Boolean(state.overRangeWarning)} label="A1" />

              {/*
                器材本体拖动命中区。
                必须画在器材**之后**：器材自身的零件（表盘刻度、标签文字等）会参与命中测试，
                先画的话指针会被这些零件截走，表现为「器材拖不动」。
                同时它必须画在接线柱与折点手柄**之前**：接线柱要保持最上层，
                否则「想接线」会变成「把器材拖走」。
              */}
              {LAB_COMPONENT_IDS.map((id) => (
                <ComponentDragHandle
                  key={`drag-${id}`}
                  id={id}
                  layout={layout}
                  dragging={labDrag.dragging?.kind === 'component' && labDrag.dragging.id === id}
                  drag={labDrag.componentHandlers(id)}
                />
              ))}

              {/* 导线折点手柄：拖动即弯折（像真导线一样） */}
              {state.edges.map((edge) => (
                <WireBendHandle
                  key={`bend-${edge.from}-${edge.to}`}
                  from={edge.from}
                  to={edge.to}
                  layout={layout}
                  active={labDrag.dragging?.kind === 'wire' && labDrag.dragging.from === edge.from && labDrag.dragging.to === edge.to}
                  drag={labDrag.wireHandlers(edge.from, edge.to)}
                />
              ))}

              {/* 接线柱（可拖拽拉线）：坐标由布局推导，跟随器材移动 */}
              {TERMINAL_DRAW_ORDER.map((id) => (
                <CompetitorTerminal
                  key={id}
                  id={id}
                  state={state}
                  point={terminalPosition(layout, id)}
                  drag={{
                    onPointerDown: (event) => pointerDrag.onPointerDown(pointerEvent(event), id),
                    onPointerMove: (event) => pointerDrag.onPointerMove(pointerEvent(event)),
                    onPointerUp: (event) => pointerDrag.onPointerUp(pointerEvent(event)),
                    onPointerCancel: (event) => pointerDrag.onPointerCancel(pointerEvent(event)),
                  }}
                />
              ))}
            </>
          )}

          {showSchematic && <AmmeterSchematic state={state} reading={reading} />}

        </svg>
      </InfiniteCanvas>

      {/* 左上角浮层：转电路图 + 复位器材摆位 */}
      <button
        type="button"
        data-canvas-pan-block
        aria-pressed={showSchematic}
        aria-label={showSchematic ? '回到实物图' : '转电路图'}
        title={showSchematic ? '回到实物图' : '转电路图'}
        onClick={() => setShowSchematic((current) => !current)}
        className="absolute left-4 top-16 z-30 flex w-[78px] flex-col items-center gap-1 rounded-[10px] bg-[#3b4048] px-2 py-3 text-[12px] font-medium text-[#e6ebf1] shadow-lg hover:bg-[#454b54]"
      >
        <span className="grid size-9 place-items-center rounded-full bg-white/10"><Grid3x3 className="size-5" aria-hidden="true" /></span>
        <span>{showSchematic ? '实物图' : '转电路图'}</span>
      </button>

      {/* 器材摆位复位：把器材与导线恢复到竞品原始构图 */}
      <button
        type="button"
        data-canvas-pan-block
        aria-label="复位器材摆位"
        title="复位器材摆位"
        onClick={() => setLayout(createDefaultLayout())}
        className="absolute left-4 top-[164px] z-30 flex w-[78px] flex-col items-center gap-1 rounded-[10px] bg-[#3b4048] px-2 py-3 text-[12px] font-medium text-[#e6ebf1] shadow-lg hover:bg-[#454b54]"
      >
        <span className="grid size-9 place-items-center rounded-full bg-white/10"><LayoutGrid className="size-5" aria-hidden="true" /></span>
        <span>复位摆位</span>
      </button>

      {/* 操作提示：告诉学生器材和导线都可以直接拖 */}
      <div className="pointer-events-none absolute left-4 top-[224px] z-30 w-[132px] rounded-[8px] border border-white/10 bg-[#22262c]/80 px-3 py-2 text-[11px] leading-5 text-[#9aa4b2] backdrop-blur">
        拖器材任意摆放<br />拖导线中点可弯折<br />拖接线柱接导线
      </div>

      {/* 右侧协作入口 */}
      <div className="absolute right-[68px] top-16 z-30 flex items-start gap-2">
        <CanvasPill label="边做边看" onClick={onTogglePanel} active={panelOpen}><PlayCircle className="size-5" aria-hidden="true" /></CanvasPill>
        <CanvasPill label="实验报告" onClick={onOpenReport}><FileText className="size-5" aria-hidden="true" /></CanvasPill>
        <CanvasPill label="交互热点"><Aperture className="size-5" aria-hidden="true" /></CanvasPill>
      </div>

      {/* 底部读数条：悬浮在画布之上，不占用画布空间 */}
      <div
        data-canvas-pan-block
        className="absolute bottom-4 left-1/2 z-30 flex max-w-[min(1080px,94vw)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-[10px] border border-white/10 bg-[#22262c]/90 px-3 py-2 backdrop-blur"
      >
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e6ebf1]">
          <Gauge className="size-4" aria-hidden="true" />
          {activeTrial ? `读数 ${activeTrial.reading.toFixed(2)} A` : '读数 0.00 A'}
        </span>
        <div role="group" aria-label="选择量程" className="inline-flex rounded-[6px] border border-[#4a5058] p-0.5">
          {(['3A', '0.6A'] as const).map((range) => (
            <button
              key={range}
              type="button"
              data-canvas-pan-block
              aria-pressed={state.activeRange === range}
              onClick={() => dispatch({ type: 'setRange', payload: range }, 'set-ammeter-range')}
              disabled={state.switchClosed}
              className={`h-7 whitespace-nowrap rounded-[4px] px-3 text-[12px] font-bold disabled:opacity-45 ${state.activeRange === range ? 'bg-[#c0392b] text-white' : 'text-[#cdd4dc]'}`}
            >
              {range === '3A' ? '3A 大量程' : '0.6A 小量程'}
            </button>
          ))}
        </div>
        <span className="text-[12px] font-semibold text-[#cdd4dc]">{state.switchClosed ? '电路已接通' : '开关断开'}</span>
        <span className="hidden text-[12px] text-[#8b95a2] sm:inline">
          {state.activeRange === null ? '把电流表串联接入电路（电流从“+”流入）' : `当前量程 ${RANGE_SPEC[state.activeRange].label}（分度值 ${RANGE_SPEC[state.activeRange].division} A）`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            data-canvas-pan-block
            aria-label={state.switchClosed ? '断开开关' : '闭合开关'}
            onClick={() => dispatch({ type: 'setSwitch', payload: state.switchClosed ? 'open' : 'closed' }, 'toggle-switch')}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] px-4 text-[13px] font-bold text-white ${state.switchClosed ? 'bg-[#c0392b]' : 'bg-[#2e7d4f]'}`}
          >
            {state.switchClosed ? '断开开关' : '闭合开关'}
          </button>
          <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${lit ? 'text-[#f0c86a]' : 'text-[#8b95a2]'}`}>
            <BookOpen className="size-4" aria-hidden="true" />
            {lit ? '灯泡发光' : '灯泡未亮'}
          </span>
        </div>
      </div>

      {/* 过载提示 */}
      {state.overRangeWarning !== null && (
        <div role="alert" className="absolute left-1/2 top-20 z-30 w-[min(560px,86%)] -translate-x-1/2 rounded-[8px] border border-[#c0392b] bg-[#3a2020] px-4 py-3 text-sm text-[#f0b0a8] shadow-lg">
          <span className="mr-2 font-bold">量程过小</span>
          {state.overRangeWarning}
        </div>
      )}
    </div>
  )
}

function CanvasPill({ label, onClick, active = false, children }: { label: string; onClick?(): void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex w-[76px] flex-col items-center gap-1 rounded-[10px] px-2 py-2 text-[12px] font-medium text-[#e6ebf1] transition ${active ? 'bg-[#4a5058]' : 'bg-[#3b4048] hover:bg-[#454b54]'}`}
    >
      <span className="grid size-9 place-items-center rounded-full bg-white/10">{children}</span>
      <span>{label}</span>
    </button>
  )
}

/** 右侧实验报告抽屉：文案与竞品 textPanel 完全一致 */
function ReportDrawer({ open, onClose }: { open: boolean; onClose(): void }) {
  if (!open) return null
  return (
    <aside className="absolute right-0 top-12 z-20 flex h-[calc(100%-3rem)] w-[min(420px,92%)] flex-col border-l shadow-2xl" style={{ background: '#fbfaf7', borderColor: chromeBorder }} aria-label="实验报告">
      <header className="flex items-center justify-between border-b border-[#e2ddd3] px-5 py-3">
        <h2 className="text-base font-bold text-[#242424]">实验报告</h2>
        <button type="button" onClick={onClose} className="rounded-[6px] border border-[#d8d2c8] px-3 py-1 text-sm text-[#4b4742]">收起</button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {COMPETITOR_TEXT_PANEL.map((section) => (
          <section key={section.title}>
            <h3 className="text-sm font-bold text-[#165DFF]">{section.title}</h3>
            <div className="mt-2 space-y-1.5">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-[#4b4742]">{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}

/**
 * 最近的接线柱（含坐标）。
 * 坐标由布局推导，因此拖动器材之后命中区会同步移动，
 * 不会出现「看起来接在这、实际要点那里」的错位。
 */
function nearestTerminal(layout: LabLayout, position: Position): { id: AmmeterTerminalId; position: Position } | null {
  let best: { id: AmmeterTerminalId; position: Position; distance: number } | null = null
  for (const id of TERMINAL_DRAW_ORDER) {
    const point = terminalPosition(layout, id)
    const distance = Math.hypot(position.x - point.x, position.y - point.y)
    if (best === null || distance < best.distance) best = { id, position: point, distance }
  }
  return best === null ? null : { id: best.id, position: best.position }
}

/** 接线柱吸附命中（用于拉线落点判定，保持原有手感） */
function terminalAt(layout: LabLayout, position: Position): AmmeterTerminalId | null {
  const nearest = nearestTerminal(layout, position)
  if (nearest === null) return null
  return Math.hypot(position.x - nearest.position.x, position.y - nearest.position.y) <= 28 ? nearest.id : null
}

export function AmmeterScene(props: PhysicsLabSceneProps<AmmeterLabState>) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  return (
    <div className="relative h-full w-full min-h-0">
      <CompetitorSceneCanvas
        {...props}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((current) => !current)}
        onOpenReport={() => setReportOpen((current) => !current)}
      />
      <ReportDrawer open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}

/**
 * 实验详情页入口：沉浸式 + 无限画布。
 *
 * 高度使用 dvh（动态视口高度）而不是固定 640px —— 实验台占满整个屏幕，
 * 不再缩在页面中间一小块；移动端浏览器地址栏收起/展开也不会被裁切。
 */
export function AmmeterLab({ experiment }: { experiment: TextbookPhysicsExperiment }) {
  return (
    <div className="h-[100dvh] w-full">
      <PhysicsLabShell experiment={experiment} controller={ammeterController} Scene={AmmeterScene} backTo="/physics" />
    </div>
  )
}
