import { useRef, useState, type PointerEvent } from 'react'
import { AlertTriangle, CircuitBoard, Gauge, Lightbulb, Power, RotateCcw } from 'lucide-react'
import type { TextbookPhysicsExperiment } from '../../curriculum/types'
import PhysicsLabShell, { type PhysicsLabSceneProps } from '../../runtime/PhysicsLabShell'
import { mapClientPointToSvgViewBox } from '../../runtime/svgCoordinates'
import { usePointerDrag } from '../../runtime/usePointerDrag'
import type { LabAction, Position } from '../../runtime/types'
import {
  CIRCUIT_TERMINALS,
  NEEDLE_LIMIT_ANGLE,
  RANGE_SPEC,
  TERMINAL_HIT_STROKE,
  WORKBENCH_VIEW_HEIGHT,
  WORKBENCH_VIEW_WIDTH,
  isTerminalDraggable,
  needleAngle,
  terminalAtPosition,
  terminalHitSegment,
  type AmmeterPosition,
  type AmmeterRangeId,
  type AmmeterTerminalId,
} from './definition'
import { ammeterController, type AmmeterLabState, type CircuitEdge } from './controller'

const workbenchWidth = WORKBENCH_VIEW_WIDTH
const workbenchHeight = WORKBENCH_VIEW_HEIGHT

const caseFill = '#d9d4cb'
const caseStroke = '#8d867c'
const metal = '#b9b3a8'

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Partial<Position>
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

/** 导线走线：贴近实物图的正交折线 */
function edgePath(edge: CircuitEdge): string {
  const from = CIRCUIT_TERMINALS[edge.from]
  const to = CIRCUIT_TERMINALS[edge.to]
  if (!from || !to) return ''
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  if (Math.abs(from.x - to.x) < 4 || Math.abs(from.y - to.y) < 4) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }
  if (Math.abs(from.y - to.y) > Math.abs(from.x - to.x)) {
    return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`
  }
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`
}

function terminalHasWire(state: AmmeterLabState, id: AmmeterTerminalId): boolean {
  return state.edges.some((edge) => edge.from === id || edge.to === id)
}

export interface TerminalPointerDrag {
  onPointerDown(event: PointerEvent<SVGElement>): void
  onPointerMove(event: PointerEvent<SVGElement>): void
  onPointerUp(event: PointerEvent<SVGElement>): void
  onPointerCancel(event: PointerEvent<SVGElement>): void
}

interface TerminalProps {
  id: AmmeterTerminalId
  state: AmmeterLabState
  drag: TerminalPointerDrag
}

/**
 * 接线柱：红色旋钮 + 铜柱，与实物一致。
 * 旋钮与一段加粗的透明命中区都绑定指针事件，鼠标/触屏都能从接线柱拖出导线。
 */
function Terminal({ id, state, drag }: TerminalProps) {
  const terminal = CIRCUIT_TERMINALS[id]
  const connected = terminalHasWire(state, id)
  const segment = terminalHitSegment(id)
  const disabled = !isTerminalDraggable(id, state)
  const handlers = {
    onPointerDown: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerDown(event) },
    onPointerMove: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerMove(event) },
    onPointerUp: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerUp(event) },
    onPointerCancel: (event: PointerEvent<SVGElement>) => { if (!disabled) drag.onPointerCancel(event) },
  }
  return (
    <g>
      <rect x={terminal.x - 8} y={terminal.y - 6} width="16" height="12" rx="2" fill={metal} stroke="#7d766c" strokeWidth="1" />
      <circle
        data-hit-target="ammeter-terminal-knob"
        cx={terminal.x}
        cy={terminal.y - 9}
        r="16"
        fill="transparent"
        className="cursor-crosshair"
        role="button"
        tabIndex={0}
        aria-label={terminal.label}
        {...handlers}
      />
      <circle cx={terminal.x} cy={terminal.y - 9} r="11" fill={connected ? '#c0392b' : '#a33a30'} stroke="#7b2a22" strokeWidth="1.5" pointerEvents="none" />
      <circle cx={terminal.x} cy={terminal.y - 9} r="5" fill="#e9e4dc" pointerEvents="none" />
      <path
        data-hit-target="ammeter-terminal"
        d={`M ${segment.x1} ${segment.y1} L ${segment.x2} ${segment.y2}`}
        fill="none"
        stroke="transparent"
        strokeWidth={TERMINAL_HIT_STROKE}
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
        pointerEvents="stroke"
        className="cursor-crosshair"
        aria-label={terminal.label}
        role="button"
        tabIndex={0}
        {...handlers}
      />
    </g>
  )
}

interface AmmeterProps {
  x: number
  y: number
  reading: number
  range: AmmeterRangeId | null
  overRange: boolean
  label: string
}

/** 电流表表盘：0～0.6A / 0～3A 双量程刻度，指针实时偏转 */
function Ammeter({ x, y, reading, range, overRange, label }: AmmeterProps) {
  const radius = 78
  const activeRange = range ?? '0.6A'
  const spec = RANGE_SPEC[activeRange]
  const angle = needleAngle(reading, activeRange)
  const ticks: Array<{ angle: number; major: boolean; label?: string }> = []
  for (let index = 0; index <= 30; index += 1) {
    const ratio = index / 30
    ticks.push({
      angle: -NEEDLE_LIMIT_ANGLE + ratio * NEEDLE_LIMIT_ANGLE * 2,
      major: index % 5 === 0,
      label: index % 5 === 0 ? (ratio * spec.max).toFixed(activeRange === '0.6A' ? 1 : 0) : undefined,
    })
  }

  const polar = (angleDeg: number, distance: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: Math.sin(rad) * distance, y: -Math.cos(rad) * distance }
  }

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-116" y="-92" width="232" height="176" rx="10" fill={caseFill} stroke={caseStroke} strokeWidth="3" />
      <rect x="-116" y="-92" width="232" height="176" rx="10" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
      <rect x="-96" y="-72" width="192" height="116" rx="8" fill="#f6f4ef" stroke="#8d867c" strokeWidth="2" />
      <text x="0" y="-56" fill="#2f2b26" fontSize="15" fontWeight="700" textAnchor="middle">A</text>
      <g transform="translate(0 20)">
        {ticks.map((tick, index) => {
          const outer = polar(tick.angle, tick.major ? radius - 6 : radius - 12)
          const inner = polar(tick.angle, radius - 20)
          const textPoint = polar(tick.angle, radius - 30)
          return (
            <g key={index}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#2f2b26" strokeWidth={tick.major ? 2.4 : 1.2} strokeLinecap="round" />
              {tick.label && <text x={textPoint.x} y={textPoint.y + 4} fill="#2f2b26" fontSize="10" fontWeight={tick.major ? 700 : 400} textAnchor="middle">{tick.label}</text>}
            </g>
          )
        })}
        <g transform={`rotate(${angle})`}>
          <rect x="-1.5" y={-(radius - 24)} width="3" height={radius - 24} rx="1.5" fill={overRange ? '#c0392b' : '#1b1b1b'} />
        </g>
        <circle cx="0" cy="0" r="7" fill="#4a463f" />
        <circle cx="0" cy="0" r="3" fill="#d9d4cb" />
      </g>
      <text x="0" y="-104" fill="#3d3831" fontSize="16" fontWeight="700" textAnchor="middle">{label}</text>
      {/* 下方接线柱标注：与 definition.ts 中的接线柱坐标对应 */}
      <g>
        <text x="-118" y="98" fill="#5c554c" fontSize="13" fontWeight="700" textAnchor="middle">－</text>
        <text x="12" y="98" fill="#5c554c" fontSize="13" fontWeight="700" textAnchor="middle">0.6A</text>
        <text x="98" y="98" fill="#5c554c" fontSize="13" fontWeight="700" textAnchor="middle">3A</text>
      </g>
      <rect x="-108" y="70" width="216" height="6" rx="3" fill="#8d867c" />
    </g>
  )
}

function Battery({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-112" y="-26" width="224" height="52" rx="6" fill="#3a3a3c" stroke="#1f1f21" strokeWidth="2" />
      <rect x="-112" y="-26" width="224" height="18" rx="6" fill="#4c4c4f" />
      <rect x="-64" y="-18" width="60" height="36" rx="4" fill="#b5651d" />
      <rect x="6" y="-18" width="60" height="36" rx="4" fill="#c9a227" />
      <rect x="-108" y="-24" width="12" height="48" rx="3" fill="#8b8b8d" />
      <rect x="96" y="-24" width="12" height="48" rx="3" fill="#8b8b8d" />
      <text x="-40" y="-6" fill="#fff5e6" fontSize="16" fontWeight="700" textAnchor="middle">+</text>
      <text x="36" y="-6" fill="#fff5e6" fontSize="16" fontWeight="700" textAnchor="middle">-</text>
      <text x="0" y="58" fill="#4b4742" fontSize="16" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
}

function KnifeSwitch({ x, y, closed, label }: { x: number; y: number; closed: boolean; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-64" y="-22" width="128" height="44" rx="5" fill={caseFill} stroke={caseStroke} strokeWidth="2" />
      <rect x="-64" y="-22" width="128" height="10" rx="4" fill="#eae6df" />
      <g transform={`rotate(${closed ? 0 : -42} 34 -6)`}>
        <rect x="-42" y="-10" width="80" height="8" rx="4" fill="#5b5a58" stroke="#33322f" strokeWidth="1" />
        <circle cx="36" cy="-6" r="5" fill="#8a8886" />
      </g>
      <circle cx="-42" cy="-6" r="6" fill={closed ? '#c0392b' : '#8a8886'} />
      <text x="0" y="48" fill="#4b4742" fontSize="16" fontWeight="700" textAnchor="middle">{label}</text>
      <text x="0" y="-30" fill="#7d766c" fontSize="11" textAnchor="middle">{closed ? '刀片已合下' : '刀片已抬起'}</text>
    </g>
  )
}

/** 小灯泡：底座两侧金属夹与接线柱同高，玻璃泡朝上 */
function Bulb({ x, y, lit, label }: { x: number; y: number; lit: boolean; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {lit && <circle cx="0" cy="-64" r="44" fill="#ffd76b" opacity="0.26" />}
      <rect x="-70" y="-6" width="140" height="18" rx="4" fill={caseFill} stroke={caseStroke} strokeWidth="2" />
      <rect x="-58" y="-20" width="20" height="18" rx="2" fill={metal} stroke="#8a8378" strokeWidth="1.2" />
      <rect x="38" y="-20" width="20" height="18" rx="2" fill={metal} stroke="#8a8378" strokeWidth="1.2" />
      <rect x="-20" y="-42" width="40" height="26" rx="4" fill={metal} stroke="#8a8378" strokeWidth="1.5" />
      <path d="M -18 -42 L -18 -64 Q 0 -88 18 -64 L 18 -42 Z" fill={lit ? '#ffe9a8' : 'rgba(198,216,234,0.5)'} stroke={lit ? '#f0c86a' : '#9db0c4'} strokeWidth="2" />
      <path d="M -7 -46 Q 0 -72 7 -46" fill="none" stroke={lit ? '#c98b1c' : '#b3c3d4'} strokeWidth="2" />
      <text x="0" y="34" fill="#4b4742" fontSize="16" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
}

/** 电路图（原理图）视图：与实物接线一一对应 */
export function CircuitSchematic({ state, reading }: { state: AmmeterLabState; reading: number }) {
  const lit = state.switchClosed && reading > 0
  const position = state.mode === 'series' ? 'main' : state.position
  const isParallel = state.mode === 'parallel'

  const meterNode = position === 'main'
    ? { x: 720, y: 300, label: 'A₁', note: '干路' }
    : { x: 510, y: 240, label: 'A₁', note: '支路' }

  return (
    <g>
      <rect x="110" y="120" width="740" height="300" rx="10" fill="none" stroke="#c9c2b6" strokeDasharray="8 8" />
      <text x="130" y="152" fill="#7d766c" fontSize="14" fontWeight="700">
        电路图（原理图）· {isParallel ? '并联电路' : '串联电路'} · 电流表接在{position === 'main' ? '干路' : '支路'}
      </text>

      {/* 回路走线 */}
      {isParallel ? (
        <>
          <path d="M 250 380 L 250 420 L 860 420 L 860 200 L 250 200 L 250 240" fill="none" stroke="#2f2b26" strokeWidth="3" />
          <path d="M 470 200 L 470 330 L 620 330" fill="none" stroke="#2f2b26" strokeWidth="3" />
          <path d="M 470 330 L 470 420" fill="none" stroke="#2f2b26" strokeWidth="3" opacity="0" />
        </>
      ) : (
        <>
          <path d="M 250 340 L 250 390 L 860 390 L 860 200 L 250 200 L 250 240" fill="none" stroke="#2f2b26" strokeWidth="3" />
        </>
      )}

      {/* 电源 E */}
      <g>
        <line x1="238" y1="240" x2="262" y2="240" stroke="#2f2b26" strokeWidth="3" />
        <line x1="230" y1="256" x2="270" y2="256" stroke="#2f2b26" strokeWidth="3" />
        <line x1="238" y1="272" x2="262" y2="272" stroke="#2f2b26" strokeWidth="3" />
        <line x1="230" y1="288" x2="270" y2="288" stroke="#2f2b26" strokeWidth="3" />
        <line x1="250" y1="200" x2="250" y2="240" stroke="#2f2b26" strokeWidth="3" />
        <line x1="250" y1="288" x2="250" y2="340" stroke="#2f2b26" strokeWidth="3" />
        <text x="196" y="264" fill="#2f2b26" fontSize="17" fontWeight="700" textAnchor="middle">E₁</text>
        <text x="286" y="232" fill="#c0392b" fontSize="14" fontWeight="700">+</text>
        <text x="286" y="304" fill="#2f2b26" fontSize="14" fontWeight="700">－</text>
      </g>

      {/* 开关 S₁ */}
      <g>
        <line x1="330" y1="390" x2="356" y2="390" stroke="#2f2b26" strokeWidth="3" />
        <line x1="424" y1="390" x2="450" y2="390" stroke="#2f2b26" strokeWidth="3" />
        <line x1="356" y1="390" x2={state.switchClosed ? '424' : '416'} y2={state.switchClosed ? '390' : '354'} stroke="#2f2b26" strokeWidth="3" />
        <circle cx="356" cy="390" r="4.5" fill="#2f2b26" />
        <circle cx="424" cy="390" r="4.5" fill="#2f2b26" />
        <text x="390" y="430" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">S₁</text>
      </g>

      {/* 灯泡 L₁ / L₂ */}
      <g>
        <circle cx="510" cy="200" r="22" fill={lit && isParallel ? '#ffe9a8' : 'none'} stroke={lit && isParallel ? '#f0c86a' : '#2f2b26'} strokeWidth="3" />
        <line x1="497" y1="187" x2="523" y2="213" stroke="#2f2b26" strokeWidth="2.5" />
        <line x1="523" y1="187" x2="497" y2="213" stroke="#2f2b26" strokeWidth="2.5" />
        <text x="510" y="172" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">L₁</text>
      </g>
      {isParallel && (
        <g>
          <circle cx="620" cy="330" r="22" fill={lit ? '#ffe9a8' : 'none'} stroke={lit ? '#f0c86a' : '#2f2b26'} strokeWidth="3" />
          <line x1="607" y1="317" x2="633" y2="343" stroke="#2f2b26" strokeWidth="2.5" />
          <line x1="633" y1="317" x2="607" y2="343" stroke="#2f2b26" strokeWidth="2.5" />
          <text x="620" y="380" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">L₂</text>
        </g>
      )}
      {!isParallel && (
        <g>
          <circle cx="620" cy="200" r="22" fill={lit ? '#ffe9a8' : 'none'} stroke={lit ? '#f0c86a' : '#2f2b26'} strokeWidth="3" />
          <line x1="607" y1="187" x2="633" y2="213" stroke="#2f2b26" strokeWidth="2.5" />
          <line x1="633" y1="187" x2="607" y2="213" stroke="#2f2b26" strokeWidth="2.5" />
          <text x="620" y="172" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">L₂</text>
        </g>
      )}

      {/* 电流表 A₁ */}
      <g transform={`translate(${meterNode.x} ${meterNode.y})`}>
        <circle cx="0" cy="0" r="30" fill="#f6f4ef" stroke="#2f2b26" strokeWidth="3" />
        <text x="0" y="8" fill="#2f2b26" fontSize="20" fontWeight="700" textAnchor="middle">A</text>
        <text x="42" y="8" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">{meterNode.label}</text>
        <text x="-16" y="-38" fill="#c0392b" fontSize="14" fontWeight="700">+</text>
        <text x="-16" y="46" fill="#2f2b26" fontSize="14" fontWeight="700">－</text>
      </g>

      {/* 电流方向箭头 */}
      <g fill="#c0392b">
        <path d="M 300 390 l 14 6 l -14 6 z" />
        <path d="M 800 250 l 6 -12 l 6 12 z" />
        {isParallel && <path d="M 500 230 l 6 12 l -6 12 z" />}
      </g>
      <text x="292" y="370" fill="#c0392b" fontSize="13" fontWeight="700">电流 I</text>

      {/* 读数标签 */}
      <rect x="600" y="132" width="200" height="32" rx="6" fill="#fff8e6" stroke="#e6c979" />
      <text x="700" y="154" fill="#7a5b16" fontSize="14" fontWeight="700" textAnchor="middle">
        {state.activeRange === null ? '未接入电流表' : `${RANGE_SPEC[state.activeRange].label} · ${reading.toFixed(2)} A`}
      </text>
    </g>
  )
}

function rangeHint(state: AmmeterLabState): string {
  if (state.activeRange !== null) return `当前量程 ${RANGE_SPEC[state.activeRange].label}（分度值 ${RANGE_SPEC[state.activeRange].division} A）`
  if (state.mode === 'series') return '把电流表串联接入电路：电流从“+”接线柱流入'
  return state.position === 'main' ? '电流表接在干路：测量两灯电流之和' : '电流表接在支路：测量该支路电流'
}

export function AmmeterScene({ state, dispatch }: PhysicsLabSceneProps<AmmeterLabState>) {
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [preview, setPreview] = useState<{ from: AmmeterTerminalId; position: Position } | null>(null)
  const [showSchematic, setShowSchematic] = useState(false)

  const activeTrial = state.activeTrialId === null ? undefined : state.trials.find((trial) => trial.id === state.activeTrialId)
  const reading = activeTrial?.reading ?? 0
  const lit = state.switchClosed && reading > 0

  const pointerDrag = usePointerDrag({
    stageRef,
    positionFor: (event) => {
      const svg = svgRef.current
      if (!svg) return null
      return mapClientPointToSvgViewBox(event, { rect: svg.getBoundingClientRect(), viewBox: { x: 0, y: 0, width: workbenchWidth, height: workbenchHeight } })
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
        const target = isPosition(payload?.position) ? terminalAtPosition(payload.position) : null
        if (typeof from !== 'string' || target === null || target === from) {
          dispatch({ type: 'dragCancel', payload: { subject: from } }, 'cancel-wire')
          return
        }
        dispatch({ type: 'connect', payload: { from, to: target } }, 'connect-wire')
      }
    },
  })

  const pointerEvent = (event: PointerEvent<SVGElement>) => event as unknown as PointerEvent<HTMLElement>

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#eae7e1] text-[#2f2b26]">
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(#e3dfd8 1px, transparent 1px), linear-gradient(90deg, #e3dfd8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="练习使用电流表实验台">
          <rect width={workbenchWidth} height={workbenchHeight} fill="#f2efe9" />
          <g opacity="0.9">
            <rect x="30" y="20" width="900" height="60" rx="8" fill="#ffffff" stroke="#d8d2c8" />
            <text x="52" y="47" fill="#2f2b26" fontSize="19" fontWeight="700">练习使用电流表</text>
            <text x="52" y="69" fill="#7d766c" fontSize="12.5">拖动接线柱之间的导线完成接线 · 电流表必须串联 · 电流从“+”流入</text>
            <text x="910" y="52" fill={state.switchClosed ? '#b5651d' : '#7d766c'} fontSize="15" fontWeight="700" textAnchor="end">{state.switchClosed ? '电路已接通' : '开关断开'}</text>
            <text x="910" y="72" fill="#7d766c" fontSize="12" textAnchor="end">{rangeHint(state)}</text>
          </g>

          {/* 电池 */}
          <Battery x={96} y={385} label="E₁" />
          <KnifeSwitch x={222} y={470} closed={state.switchClosed} label="S₁" />
          <Bulb x={455} y={470} lit={lit && (state.mode === 'series' || state.position === 'branch')} label="L₂" />
          <Bulb x={455} y={200} lit={lit} label="L₁" />

          {/* 导线 */}
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            {state.edges.map((edge) => (
              <g key={`${edge.from}-${edge.to}`}>
                <path d={edgePath(edge)} stroke="#8c1f16" strokeWidth="9" opacity="0.35" />
                <path d={edgePath(edge)} stroke="#c0392b" strokeWidth="6" />
                <path d={edgePath(edge)} stroke="#e8756a" strokeWidth="2" opacity="0.7" />
              </g>
            ))}
            {preview && (
              <path
                d={`M ${CIRCUIT_TERMINALS[preview.from].x} ${CIRCUIT_TERMINALS[preview.from].y} L ${preview.position.x} ${preview.position.y}`}
                stroke="#1f6fb2"
                strokeWidth="5"
                strokeDasharray="10 8"
              />
            )}
          </g>

          {/* 电流表 */}
          <Ammeter x={748} y={350} reading={reading} range={state.activeRange} overRange={Boolean(state.overRangeWarning)} label="A₁" />

          {/* 接线柱 */}
          {(Object.keys(CIRCUIT_TERMINALS) as AmmeterTerminalId[]).map((id) => (
            <Terminal
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

        {showSchematic && (
          <div className="absolute inset-0 bg-[#f7f5f0]">
            <svg viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="size-full" role="img" aria-label="电流表实验电路图">
              <rect width={workbenchWidth} height={workbenchHeight} fill="#f7f5f0" />
              <CircuitSchematic state={state} reading={reading} />
            </svg>
          </div>
        )}

        {state.overRangeWarning !== null && (
          <div role="alert" className="absolute left-1/2 top-24 w-[min(560px,86%)] -translate-x-1/2 rounded-[8px] border border-[#c0392b] bg-[#fff3f1] px-4 py-3 text-sm text-[#8c2b20] shadow-lg">
            <span className="mr-2 inline-flex items-center gap-1 font-bold"><AlertTriangle className="size-4" aria-hidden="true" />量程过小</span>
            {state.overRangeWarning}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-t border-[#d8d2c8] bg-[#fbfaf7] px-4 py-3">
        <div className="flex flex-nowrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showSchematic}
            aria-label={showSchematic ? '回到实物接线图' : '转电路图'}
            title={showSchematic ? '回到实物接线图' : '转电路图'}
            onClick={() => setShowSchematic((current) => !current)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[6px] border px-3 text-sm font-bold ${showSchematic ? 'border-[#1f6fb2] bg-[#1f6fb2] text-white' : 'border-[#bdb6aa] text-[#4b4742]'}`}
          >
            <CircuitBoard className="size-4" aria-hidden="true" />
            {showSchematic ? '实物图' : '转电路图'}
          </button>
          <div role="group" aria-label="选择电路类型" className="inline-flex shrink-0 rounded-[6px] border border-[#bdb6aa] p-1">
            {(['series', 'parallel'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => dispatch({ type: 'setMode', payload: mode }, 'set-circuit-mode')} disabled={state.switchClosed} className={`h-8 whitespace-nowrap px-3 text-sm font-bold disabled:opacity-45 ${state.mode === mode ? 'bg-[#1f6fb2] text-white' : 'text-[#4b4742]'}`}>{mode === 'series' ? '串联' : '并联'}</button>
            ))}
          </div>
          {state.mode === 'parallel' && (
            <div role="group" aria-label="选择电流表位置" className="inline-flex shrink-0 rounded-[6px] border border-[#bdb6aa] p-1">
              {(['main', 'branch'] as const).map((position: AmmeterPosition) => (
                <button key={position} type="button" aria-pressed={state.position === position} onClick={() => dispatch({ type: 'setPosition', payload: position }, 'set-ammeter-position')} disabled={state.switchClosed} className={`h-8 whitespace-nowrap px-3 text-sm font-bold disabled:opacity-45 ${state.position === position ? 'bg-[#1f6fb2] text-white' : 'text-[#4b4742]'}`}>{position === 'main' ? '干路' : '支路'}</button>
              ))}
            </div>
          )}
          <div role="group" aria-label="选择量程" className="inline-flex shrink-0 rounded-[6px] border border-[#bdb6aa] p-1">
            {(['3A', '0.6A'] as const).map((range) => (
              <button key={range} type="button" aria-pressed={state.activeRange === range} onClick={() => dispatch({ type: 'setRange', payload: range }, 'set-ammeter-range')} disabled={state.switchClosed} className={`h-8 whitespace-nowrap px-3 text-sm font-bold disabled:opacity-45 ${state.activeRange === range ? 'bg-[#b5651d] text-white' : 'text-[#4b4742]'}`}>{range === '3A' ? '3A 大量程' : '0.6A 小量程'}</button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#4b4742]">
            <Gauge className="size-4" aria-hidden="true" />
            {activeTrial ? `读数 ${activeTrial.reading.toFixed(2)} A` : '读数 0.00 A'}
          </span>
          <button type="button" aria-label={state.switchClosed ? '断开开关' : '闭合开关'} title={state.switchClosed ? '断开开关' : '闭合开关'} onClick={() => dispatch({ type: 'setSwitch', payload: state.switchClosed ? 'open' : 'closed' }, 'toggle-switch')} className={`inline-flex h-9 items-center gap-2 rounded-[6px] px-3 text-sm font-bold text-white ${state.switchClosed ? 'bg-[#c0392b]' : 'bg-[#2e7d4f]'}`}><Power className="size-4" aria-hidden="true" />{state.switchClosed ? '断开开关' : '闭合开关'}</button>
          <button type="button" aria-label="重置当前接线" title="重置当前接线" onClick={() => dispatch({ type: 'resetTrial' }, 'reset-circuit')} disabled={state.switchClosed} className="grid size-9 place-items-center rounded-[6px] border border-[#bdb6aa] text-[#4b4742] disabled:opacity-45"><RotateCcw className="size-4" aria-hidden="true" /></button>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#4b4742]"><Lightbulb className={`size-4 ${lit ? 'text-[#e0a12a]' : 'text-[#a9a29a]'}`} aria-hidden="true" />{lit ? '灯泡发光' : '灯泡未亮'}</span>
        </div>
      </div>
    </div>
  )
}

export function AmmeterLab({ experiment }: { experiment: TextbookPhysicsExperiment }) {
  return <PhysicsLabShell experiment={experiment} controller={ammeterController} Scene={AmmeterScene} />
}
