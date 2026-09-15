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
import { useRef, useState, type PointerEvent } from 'react'
import {
  Aperture,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Crop,
  FileSpreadsheet,
  FileText,
  Gauge,
  Grid3x3,
  Link2,
  Monitor,
  PenTool,
  PlayCircle,
  Redo2,
  RotateCcw,
  Save,
  Settings2,
  Share2,
  SlidersHorizontal,
  Trash2,
  Undo2,
  ZoomIn,
  Type,
} from 'lucide-react'
import type { TextbookPhysicsExperiment } from '../../curriculum/types'
import PhysicsLabShell, { type PhysicsLabSceneProps } from '../../runtime/PhysicsLabShell'
import { mapClientPointToSvgViewBox } from '../../runtime/svgCoordinates'
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
import { ammeterController, type AmmeterLabState, type CircuitEdge } from './controller'
import { AmmeterA1, BatteryHolderE1, KnifeSwitch, LampHolderL1, TerminalPost } from './CompetitorParts'
import { COMPETITOR_BACKGROUND, COMPETITOR_TEXT_PANEL } from './competitorScene'
import { competitorComponentPoints, competitorTerminalPoints, competitorWirePolylines } from './competitorGeometry'
import { AmmeterSchematic } from './SchematicView'

const workbenchWidth = WORKBENCH_VIEW_WIDTH
const workbenchHeight = WORKBENCH_VIEW_HEIGHT

/** 竞品画布上的器材参考点（世界坐标已映射到视图坐标） */
const canvasBackground = COMPETITOR_BACKGROUND
const chromeBackground = '#22262c'
const chromeBorder = '#33383f'

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Partial<Position>
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function terminalHasWire(state: AmmeterLabState, id: CircuitTerminalId): boolean {
  return state.edges.some((edge) => edge.from === id || edge.to === id)
}

/** 已连接的导线：优先用竞品原始手绘折线，保证走线弧度与竞品一致 */
function wirePath(edge: CircuitEdge, index: number): string {
  const polyline = competitorWirePolylines[index]
  if (polyline && polyline.length >= 2) {
    return polyline.map((point, position) => `${position === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  }
  const from = CIRCUIT_TERMINALS[edge.from]
  const to = CIRCUIT_TERMINALS[edge.to]
  if (!from || !to) return ''
  if (Math.abs(from.y - to.y) < 6) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  return `M ${from.x} ${from.y} L ${from.x} ${(from.y + to.y) / 2} L ${to.x} ${(from.y + to.y) / 2} L ${to.x} ${to.y}`
}

interface TerminalProps {
  id: AmmeterTerminalId
  state: AmmeterLabState
  drag: {
    onPointerDown(event: PointerEvent<SVGElement>): void
    onPointerMove(event: PointerEvent<SVGElement>): void
    onPointerUp(event: PointerEvent<SVGElement>): void
    onPointerCancel(event: PointerEvent<SVGElement>): void
  }
}

/**
 * 可拖拽接线柱：竞品同款外观（立柱+旋帽）叠加透明命中区。
 * 命中区必须完整落在画布内，否则 overflow-hidden 会裁掉导致「拖不出导线」。
 */
function CompetitorTerminal({ id, state, drag }: TerminalProps) {
  const terminal = CIRCUIT_TERMINALS[id]
  const point = competitorTerminalPoints.terminals[id] ?? { x: terminal.x, y: terminal.y }
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
        r="17"
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

interface ChromeButtonProps {
  label: string
  onClick?(): void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}

/** 顶部工具条按钮：图标 + 中文标签，竞品同款两行排布 */
function ChromeIcon({ label, onClick, disabled = false, active = false, children }: ChromeButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-[6px] px-1 py-1.5 text-[11px] leading-none transition ${
        active ? 'bg-white/10 text-white' : 'text-[#9aa4b2] hover:bg-white/5 hover:text-white'
      } disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
      <span>{label}</span>
    </button>
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
  const [preview, setPreview] = useState<{ from: AmmeterTerminalId; position: Position } | null>(null)
  const [showSchematic, setShowSchematic] = useState(false)

  const activeTrial = state.activeTrialId === null ? undefined : state.trials.find((trial) => trial.id === state.activeTrialId)
  const reading = activeTrial?.reading ?? 0
  const lit = state.switchClosed && reading > 0
  const s1Closed = state.switchClosed
  const s2Closed = state.switchClosed

  const pointerDrag = usePointerDrag({
    stageRef,
    positionFor: (event) => {
      const svg = svgRef.current
      if (!svg) return null
      return mapClientPointToSvgViewBox(event, {
        rect: svg.getBoundingClientRect(),
        viewBox: { x: 0, y: 0, width: workbenchWidth, height: workbenchHeight },
      })
    },
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
        const target = isPosition(payload?.position) ? terminalAt(payload.position) : null
        if (typeof from !== 'string' || target === null || target === from) {
          dispatch({ type: 'dragCancel', payload: { subject: from } }, 'cancel-wire')
          return
        }
        dispatch({ type: 'connect', payload: { from, to: target } }, 'connect-wire')
      }
    },
  })

  const pointerEvent = (event: PointerEvent<SVGElement>) => event as unknown as PointerEvent<HTMLElement>

  const ammeterPoint = competitorComponentPoints.componentCenters.A1
  const lampPoint = competitorComponentPoints.componentCenters.L1
  const s1Point = competitorComponentPoints.componentCenters.S1
  const s2Point = competitorComponentPoints.componentCenters.S2
  const batteryPoint = competitorComponentPoints.componentCenters.E1

  return (
    <div className="flex h-full w-full min-h-0 flex-col" style={{ background: chromeBackground }}>
      {/* 顶部标题栏 */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2" style={{ borderColor: chromeBorder }}>
        <button type="button" aria-label="返回" title="返回" className="grid size-8 shrink-0 place-items-center rounded-[6px] text-[#9aa4b2] hover:bg-white/5 hover:text-white">
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <ChromeIcon label="保存"><Save className="size-4" aria-hidden="true" /></ChromeIcon>
        <ChromeIcon label="清空"><Trash2 className="size-4" aria-hidden="true" /></ChromeIcon>
        <ChromeIcon label="重置" onClick={() => dispatch({ type: 'resetTrial' }, 'reset-circuit')} disabled={state.switchClosed}><RotateCcw className="size-4" aria-hidden="true" /></ChromeIcon>
        <ChromeIcon label="撤销" disabled><Undo2 className="size-4" aria-hidden="true" /></ChromeIcon>
        <ChromeIcon label="恢复" disabled><Redo2 className="size-4" aria-hidden="true" /></ChromeIcon>
        <ChromeIcon label="设置"><Settings2 className="size-4" aria-hidden="true" /></ChromeIcon>
        <span className="mx-1 h-8 w-px shrink-0" style={{ background: chromeBorder }} />
        <ChromeIcon label="电路图" active={showSchematic} onClick={() => setShowSchematic((current) => !current)}><CircuitIcon /></ChromeIcon>
        <ChromeIcon label="表格" onClick={onOpenReport} active={panelOpen}><FileSpreadsheet className="size-4" aria-hidden="true" /></ChromeIcon>

        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <span className="text-[15px] font-medium text-[#e6ebf1]">练习使用电流表</span>
          <PenTool className="size-3.5 text-[#8b95a2]" aria-hidden="true" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ChromeIcon label="复制链接到PPT"><Monitor className="size-4" aria-hidden="true" /></ChromeIcon>
          <ChromeIcon label="授课演示"><PlayCircle className="size-4" aria-hidden="true" /></ChromeIcon>
          <ChromeIcon label="布置探究作业"><ClipboardList className="size-4" aria-hidden="true" /></ChromeIcon>
          <ChromeIcon label="分享实验"><Share2 className="size-4" aria-hidden="true" /></ChromeIcon>
        </div>
      </header>

      {/* 画布 */}
      <div ref={stageRef} className="relative min-h-0 flex-1 touch-none overflow-hidden" style={{ background: canvasBackground }}>
        {!showSchematic && (
          <svg ref={svgRef} viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="练习使用电流表实验台">
            <rect width={workbenchWidth} height={workbenchHeight} fill={canvasBackground} />

            {/* 器材 */}
            <BatteryHolderE1 x={batteryPoint.x} y={batteryPoint.y} />
            <KnifeSwitch x={s1Point.x} y={s1Point.y} closed={s1Closed} label="S1" />
            <KnifeSwitch x={s2Point.x} y={s2Point.y} closed={s2Closed} label="S2" />
            <LampHolderL1 x={lampPoint.x} y={lampPoint.y} lit={lit} />
            <AmmeterA1 x={ammeterPoint.x} y={ammeterPoint.y} reading={reading} range={state.activeRange} overRange={Boolean(state.overRangeWarning)} label="A1" />

            {/* 导线：竞品同款红色实物导线 */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {state.edges.map((edge, index) => (
                <g key={`${edge.from}-${edge.to}`}>
                  <path d={wirePath(edge, index)} stroke="#000000" strokeWidth="9" opacity="0.25" />
                  <path d={wirePath(edge, index)} stroke="#8c1f16" strokeWidth="7" />
                  <path d={wirePath(edge, index)} stroke="#c0392b" strokeWidth="5" />
                  <path d={wirePath(edge, index)} stroke="#e8756a" strokeWidth="1.6" opacity="0.75" />
                </g>
              ))}
              {preview && (
                <path
                  d={`M ${(competitorTerminalPoints.terminals[preview.from] ?? CIRCUIT_TERMINALS[preview.from]).x} ${(competitorTerminalPoints.terminals[preview.from] ?? CIRCUIT_TERMINALS[preview.from]).y} L ${preview.position.x} ${preview.position.y}`}
                  stroke="#4c9be8"
                  strokeWidth="4"
                  strokeDasharray="9 7"
                />
              )}
            </g>

            {/* 接线柱（可拖拽） */}
            {competitorTerminalPoints.order.map((id) => (
              <CompetitorTerminal
                key={id}
                id={id}
                state={state}
                drag={{
                  onPointerDown: (event) => pointerDrag.onPointerDown(pointerEvent(event), id),
                  onPointerMove: (event) => pointerDrag.onPointerMove(pointerEvent(event)),
                  onPointerUp: (event) => pointerDrag.onPointerUp(pointerEvent(event)),
                  onPointerCancel: (event) => pointerDrag.onPointerCancel(pointerEvent(event)),
                }}
              />
            ))}
          </svg>
        )}

        {showSchematic && (
          <svg viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="练习使用电流表电路图">
            <rect width={workbenchWidth} height={workbenchHeight} fill={canvasBackground} />
            <AmmeterSchematic state={state} reading={reading} />
          </svg>
        )}

        {/* 左上角「转电路图」浮层 */}
        <button
          type="button"
          aria-pressed={showSchematic}
          aria-label={showSchematic ? '回到实物图' : '转电路图'}
          title={showSchematic ? '回到实物图' : '转电路图'}
          onClick={() => setShowSchematic((current) => !current)}
          className="absolute left-4 top-4 flex w-[78px] flex-col items-center gap-1 rounded-[10px] bg-[#3b4048] px-2 py-3 text-[12px] font-medium text-[#e6ebf1] shadow-lg hover:bg-[#454b54]"
        >
          <span className="grid size-9 place-items-center rounded-full bg-white/10"><Grid3x3 className="size-5" aria-hidden="true" /></span>
          <span>{showSchematic ? '实物图' : '转电路图'}</span>
        </button>

        {/* 右上角协作入口 */}
        <div className="absolute right-4 top-4 flex items-start gap-2">
          <CanvasPill label="边做边看" onClick={onTogglePanel} active={panelOpen}><PlayCircle className="size-5" aria-hidden="true" /></CanvasPill>
          <CanvasPill label="实验报告" onClick={onOpenReport}><FileText className="size-5" aria-hidden="true" /></CanvasPill>
          <CanvasPill label="交互热点"><Aperture className="size-5" aria-hidden="true" /></CanvasPill>
        </div>

        {/* 左下角缩放/工具条 */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-[13px] font-medium text-[#e6ebf1]" style={{ background: '#3b4048' }}>
            电与磁 <span className="text-[9px]">▼</span>
          </span>
          <span className="inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-[13px] font-medium text-[#e6ebf1]" style={{ background: '#3b4048' }}>
            <Aperture className="size-4" aria-hidden="true" /> 108% <span className="text-[9px]">▼</span>
          </span>
          <span className="grid size-9 place-items-center rounded-[8px] text-[#e6ebf1]" style={{ background: '#3b4048' }}><Link2 className="size-4" aria-hidden="true" /></span>
          <span className="inline-flex h-9 items-center gap-3 rounded-[8px] px-3 text-[#e6ebf1]" style={{ background: '#3b4048' }}>
            <PenTool className="size-4" aria-hidden="true" />
            <Crop className="size-4" aria-hidden="true" />
            <ZoomIn className="size-4" aria-hidden="true" />
            <Type className="size-4" aria-hidden="true" />
          </span>
        </div>

        {/* 过载提示 */}
        {state.overRangeWarning !== null && (
          <div role="alert" className="absolute left-1/2 top-4 w-[min(560px,86%)] -translate-x-1/2 rounded-[8px] border border-[#c0392b] bg-[#3a2020] px-4 py-3 text-sm text-[#f0b0a8] shadow-lg">
            <span className="mr-2 font-bold">量程过小</span>
            {state.overRangeWarning}
          </div>
        )}
      </div>

      {/* 底部读数条 */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2.5" style={{ background: chromeBackground, borderColor: chromeBorder }}>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e6ebf1]">
          <Gauge className="size-4" aria-hidden="true" />
          {activeTrial ? `读数 ${activeTrial.reading.toFixed(2)} A` : '读数 0.00 A'}
        </span>
        <div role="group" aria-label="选择量程" className="inline-flex rounded-[6px] border border-[#4a5058] p-0.5">
          {(['3A', '0.6A'] as const).map((range) => (
            <button
              key={range}
              type="button"
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

function CircuitIcon() {
  return <SlidersHorizontal className="size-4" aria-hidden="true" />
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

function terminalAt(position: Position): AmmeterTerminalId | null {
  let best: { id: AmmeterTerminalId; distance: number } | null = null
  for (const id of competitorTerminalPoints.order) {
    const point = competitorTerminalPoints.terminals[id]
    if (!point) continue
    const distance = Math.hypot(position.x - point.x, position.y - point.y)
    if (distance <= 26 && (best === null || distance < best.distance)) best = { id, distance }
  }
  return best?.id ?? null
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

export function AmmeterLab({ experiment }: { experiment: TextbookPhysicsExperiment }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#dedad2]">
      <div className="h-[640px] w-full">
        <PhysicsLabShell experiment={experiment} controller={ammeterController} Scene={AmmeterScene} />
      </div>
    </div>
  )
}
