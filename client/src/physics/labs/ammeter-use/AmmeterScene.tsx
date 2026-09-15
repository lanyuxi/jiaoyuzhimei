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
  TERMINAL_SNAP_RADIUS,
  needleAngle,
  terminalAtPosition,
  terminalHitSegment,
  TERMINAL_HIT_STROKE,
  type AmmeterRangeId,
  type AmmeterTerminalId,
} from './definition'
import { ammeterController, type AmmeterLabState, type CircuitEdge } from './controller'

const workbenchWidth = 960
const workbenchHeight = 540

const caseFill = '#d9d4cb'
const caseStroke = '#8d867c'
const metal = '#b9b3a8'

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Partial<Position>
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

/** 导线走线：贴近实物图的正交折线，转角带圆角 */
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

/** 接线柱：红色旋钮 + 铜柱，与实物一致 */
function Terminal({ id, state }: { id: AmmeterTerminalId; state: AmmeterLabState }) {
  const terminal = CIRCUIT_TERMINALS[id]
  const connected = terminalHasWire(state, id)
  const segment = terminalHitSegment(id)
  return (
    <g>
      <rect x={terminal.x - 8} y={terminal.y - 6} width="16" height="12" rx="2" fill={metal} stroke="#7d766c" strokeWidth="1" />
      <circle cx={terminal.x} cy={terminal.y - 9} r="11" fill={connected ? '#c0392b' : '#a33a30'} stroke="#7b2a22" strokeWidth="1.5" />
      <circle cx={terminal.x} cy={terminal.y - 9} r="5" fill="#e9e4dc" />
      <path
        data-hit-target="ammeter-terminal"
        d={`M ${segment.x1} ${segment.y1} L ${segment.x2} ${segment.y2}`}
        fill="none"
        stroke="transparent"
        strokeWidth={TERMINAL_HIT_STROKE}
        pointerEvents="stroke"
        className="cursor-crosshair"
        aria-label={terminal.label}
        role="button"
        tabIndex={0}
      />
    </g>
  )
}

interface AmmeterProps {
  x: number
  y: number
  reading: number
  range: AmmeterRangeId | null
  reverse: boolean
  overRange: boolean
  label: string
}

/** 电流表表盘：0～0.6A / 0～3A 双量程刻度，指针实时偏转 */
function Ammeter({ x, y, reading, range, reverse, overRange, label }: AmmeterProps) {
  const radius = 92
  const activeRange = range ?? '0.6A'
  const spec = RANGE_SPEC[activeRange]
  const angle = needleAngle(reverse ? -Math.abs(reading) : reading, activeRange)
  const ticks: Array<{ angle: number; major: boolean; label?: string }> = []
  const majorSteps = activeRange === '0.6A' ? 6 : 6
  for (let index = 0; index <= majorSteps * 5; index += 1) {
    const ratio = index / (majorSteps * 5)
    const tickAngle = -NEEDLE_LIMIT_ANGLE + ratio * NEEDLE_LIMIT_ANGLE * 2
    const major = index % 5 === 0
    ticks.push({ angle: tickAngle, major, label: major ? (ratio * spec.max).toFixed(activeRange === '0.6A' ? 1 : 0) : undefined })
  }

  const polar = (angleDeg: number, distance: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: Math.sin(rad) * distance, y: -Math.cos(rad) * distance }
  }

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-135" y="-105" width="270" height="200" rx="10" fill={caseFill} stroke={caseStroke} strokeWidth="3" />
      <rect x="-135" y="-105" width="270" height="200" rx="10" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
      <rect x="-112" y="-82" width="224" height="132" rx="8" fill="#f6f4ef" stroke="#8d867c" strokeWidth="2" />
      <text x="0" y="-66" fill="#2f2b26" fontSize="15" fontWeight="700" textAnchor="middle">A</text>
      <g transform="translate(0 22)">
        {ticks.map((tick, index) => {
          const outer = polar(tick.angle, tick.major ? radius - 6 : radius - 13)
          const inner = polar(tick.angle, radius - 22)
          const textPoint = polar(tick.angle, radius - 34)
          return (
            <g key={index}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#2f2b26" strokeWidth={tick.major ? 2.6 : 1.3} strokeLinecap="round" />
              {tick.label && <text x={textPoint.x} y={textPoint.y + 4} fill="#2f2b26" fontSize={activeRange === '0.6A' ? 11 : 11} fontWeight={tick.major ? 700 : 400} textAnchor="middle">{tick.label}</text>}
            </g>
          )
        })}
        {/* 内圈：另一量程刻度 */}
        <g opacity="0.42">
          {ticks.filter((tick) => tick.major).map((tick, index) => {
            const inner = polar(tick.angle, radius - 52)
            const outer = polar(tick.angle, radius - 62)
            return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#2f2b26" strokeWidth="1.6" />
          })}
        </g>
        <path d="M -3 0 L 3 0 L 1.5 -14 L -1.5 -14 Z" fill="#2f2b26" />
        <g transform={`rotate(${angle})`}>
          <rect x="-1.6" y={-(radius - 26)} width="3.2" height={radius - 26} rx="1.6" fill={overRange ? '#c0392b' : '#1b1b1b'} />
        </g>
        <circle cx="0" cy="0" r="7" fill="#4a463f" />
        <circle cx="0" cy="0" r="3" fill="#d9d4cb" />
      </g>
      <text x="0" y="-118" fill="#3d3831" fontSize="17" fontWeight="700" textAnchor="middle">{label}</text>
      {/* 下方接线柱标注：与 definition.ts 中的接线柱坐标对应 */}
      <g>
        <text x="-118" y="100" fill="#5c554c" fontSize="13" fontWeight="700" textAnchor="middle">－</text>
        <text x="18" y="100" fill="#5c554c" fontSize="13" fontWeight="700" textAnchor="middle">0.6A</text>
        <text x="122" y="100" fill="#5c554c" fontSize="13" fontWeight="700" textAnchor="middle">3A</text>
      </g>
      <rect x="-108" y="72" width="216" height="6" rx="3" fill="#8d867c" />
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
      <text x="36" y="-6" fill="#fff5e6" fontSize="16" fontWeight="700" textAnchor="middle">+</text>
      <text x="0" y="56" fill="#4b4742" fontSize="16" fontWeight="700" textAnchor="middle">{label}</text>
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

/**
 * 小灯泡：底座上的两个金属夹与接线柱同高，玻璃泡朝上，
 * 这样导线沿底座水平走线时不会遮住灯泡本体。
 */
function Bulb({ x, y, lit, label }: { x: number; y: number; lit: boolean; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {lit && <circle cx="0" cy="-74" r="46" fill="#ffd76b" opacity="0.26" />}
      {/* 底座 */}
      <rect x="-74" y="-6" width="148" height="18" rx="4" fill={caseFill} stroke={caseStroke} strokeWidth="2" />
      {/* 两侧金属夹 */}
      <rect x="-62" y="-20" width="20" height="18" rx="2" fill={metal} stroke="#8a8378" strokeWidth="1.2" />
      <rect x="42" y="-20" width="20" height="18" rx="2" fill={metal} stroke="#8a8378" strokeWidth="1.2" />
      {/* 灯头 */}
      <rect x="-24" y="-46" width="48" height="28" rx="4" fill={metal} stroke="#8a8378" strokeWidth="1.5" />
      <line x1="-24" y1="-38" x2="24" y2="-38" stroke="#7c756a" strokeWidth="1.2" />
      <line x1="-24" y1="-30" x2="24" y2="-30" stroke="#7c756a" strokeWidth="1.2" />
      {/* 玻璃泡 */}
      <path d="M -22 -46 L -22 -72 Q 0 -100 22 -72 L 22 -46 Z" fill={lit ? '#ffe9a8' : 'rgba(198,216,234,0.5)'} stroke={lit ? '#f0c86a' : '#9db0c4'} strokeWidth="2" />
      <path d="M -8 -50 Q 0 -80 8 -50" fill="none" stroke={lit ? '#c98b1c' : '#b3c3d4'} strokeWidth="2" />
      <text x="0" y="34" fill="#4b4742" fontSize="16" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
}

/** 电路图（原理图）视图：与实物图一一对应，标注器材符号与电流方向 */
export function CircuitSchematic({ state, reading }: { state: AmmeterLabState; reading: number }) {
  const lit = state.switchClosed && reading > 0
  return (
    <g>
      <rect x="110" y="150" width="740" height="250" rx="10" fill="none" stroke="#c9c2b6" strokeDasharray="8 8" />
      <text x="130" y="182" fill="#7d766c" fontSize="14" fontWeight="700">电路图（原理图）</text>

      {/* 回路：电源 - 开关 - 灯泡 - 电流表 */}
      <path d="M 250 340 L 250 380 L 720 380 L 720 340" fill="none" stroke="#2f2b26" strokeWidth="3" />
      <path d="M 250 200 L 250 160 L 460 160" fill="none" stroke="#2f2b26" strokeWidth="3" />
      <path d="M 560 160 L 720 160 L 720 200" fill="none" stroke="#2f2b26" strokeWidth="3" />

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
        <text x="286" y="300" fill="#2f2b26" fontSize="14" fontWeight="700">－</text>
      </g>

      {/* 灯泡 L1 */}
      <g>
        <circle cx="510" cy="160" r="22" fill={lit ? '#ffe9a8' : 'none'} stroke={lit ? '#f0c86a' : '#2f2b26'} strokeWidth="3" />
        <line x1="497" y1="147" x2="523" y2="173" stroke="#2f2b26" strokeWidth="2.5" />
        <line x1="523" y1="147" x2="497" y2="173" stroke="#2f2b26" strokeWidth="2.5" />
        <text x="510" y="212" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">L₁</text>
      </g>

      {/* 开关 S1 */}
      <g>
        <line x1="330" y1="380" x2="356" y2="380" stroke="#2f2b26" strokeWidth="3" />
        <line x1="424" y1="380" x2="450" y2="380" stroke="#2f2b26" strokeWidth="3" />
        <line x1="356" y1="380" x2={state.switchClosed ? '424' : '416'} y2={state.switchClosed ? '380' : '344'} stroke="#2f2b26" strokeWidth="3" />
        <circle cx="356" cy="380" r="4.5" fill="#2f2b26" />
        <circle cx="424" cy="380" r="4.5" fill="#2f2b26" />
        <text x="390" y="420" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">S₁</text>
      </g>

      {/* 电流表 A1 */}
      <g>
        <circle cx="720" cy="270" r="30" fill="#f6f4ef" stroke="#2f2b26" strokeWidth="3" />
        <text x="720" y="278" fill="#2f2b26" fontSize="20" fontWeight="700" textAnchor="middle">A</text>
        <line x1="690" y1="270" x2="750" y2="270" stroke="#2f2b26" strokeWidth="0" />
        <line x1="720" y1="200" x2="720" y2="240" stroke="#2f2b26" strokeWidth="3" />
        <line x1="720" y1="300" x2="720" y2="340" stroke="#2f2b26" strokeWidth="3" />
        <text x="758" y="278" fill="#2f2b26" fontSize="16" fontWeight="700" textAnchor="middle">A₁</text>
        <text x="662" y="232" fill="#c0392b" fontSize="14" fontWeight="700">+</text>
        <text x="662" y="312" fill="#2f2b26" fontSize="14" fontWeight="700">－</text>
      </g>

      {/* 电流方向箭头 */}
      <g fill="#c0392b">
        <path d="M 300 380 l 14 6 l -14 6 z" />
        <path d="M 620 380 l 14 6 l -14 6 z" />
        <path d="M 720 220 l 6 -12 l 6 12 z" />
      </g>
      <text x="600" y="356" fill="#c0392b" fontSize="13" fontWeight="700">电流 I</text>

      {/* 读数标签 */}
      <rect x="596" y="146" width="132" height="30" rx="6" fill="#fff8e6" stroke="#e6c979" />
      <text x="662" y="167" fill="#7a5b16" fontSize="14" fontWeight="700" textAnchor="middle">
        {state.activeRange ? `${RANGE_SPEC[state.activeRange].label} · ${reading.toFixed(2)} A` : '未接入电流表'}
      </text>
    </g>
  )
}

function rangeHint(state: AmmeterLabState): string {
  if (state.activeRange) return `当前量程 ${RANGE_SPEC[state.activeRange].label}（分度值 ${RANGE_SPEC[state.activeRange].division} A）`
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
  const reverse = activeTrial?.range === state.activeRange && reading < 0

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
        if (typeof from !== 'string' || !target || target === from) {
          dispatch({ type: 'dragCancel', payload: { subject: from } }, 'cancel-wire')
          return
        }
        dispatch({ type: 'connect', payload: { from, to: target } }, 'connect-wire')
      }
    },
  })

  const pointerEvent = (event: PointerEvent<SVGElement>) => event as unknown as PointerEvent<HTMLElement>

  const meterTerminals: AmmeterTerminalId[] = ['ammeter-neg', 'ammeter-0.6', 'ammeter-3']
  const orderedTerminals = (Object.keys(CIRCUIT_TERMINALS) as AmmeterTerminalId[]).filter((id) => !meterTerminals.includes(id))

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#eae7e1] text-[#2f2b26]">
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(#e3dfd8 1px, transparent 1px), linear-gradient(90deg, #e3dfd8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="练习使用电流表实验台">
          <rect width={workbenchWidth} height={workbenchHeight} fill="#f2efe9" />
          <g opacity="0.85">
            <rect x="30" y="20" width="900" height="60" rx="8" fill="#ffffff" stroke="#d8d2c8" />
            <text x="52" y="47" fill="#2f2b26" fontSize="19" fontWeight="700">练习使用电流表</text>
            <text x="52" y="69" fill="#7d766c" fontSize="12.5">拖动接线柱之间的导线完成接线 · 电流表必须串联 · 电流从“+”流入</text>
            <text x="910" y="52" fill={state.switchClosed ? '#b5651d' : '#7d766c'} fontSize="15" fontWeight="700" textAnchor="end">{state.switchClosed ? '电路已接通' : '开关断开'}</text>
            <text x="910" y="72" fill="#7d766c" fontSize="12" textAnchor="end">{rangeHint(state)}</text>
          </g>

          {/* 电池 */}
          <Battery x={96} y={385} label="E₁" />
          <KnifeSwitch x={219} y={470} closed={state.switchClosed} label="S₁" />
          <Bulb x={494} y={336} lit={lit && state.mode === 'parallel'} label="L₂" />
          <Bulb x={425} y={470} lit={lit} label="L₁" />
          <KnifeSwitch x={560} y={222} closed={state.mode === 'series'} label="S₂" />

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
          <Ammeter x={758} y={236} reading={reading} range={state.activeRange} reverse={reverse} overRange={Boolean(state.overRangeWarning)} label="A₁" />

          {/* 接线柱 */}
          {orderedTerminals.map((id) => <Terminal key={id} id={id} state={state} />)}
          {meterTerminals.map((id) => (
            <g key={id}>
              <Terminal id={id} state={state} />
              <circle
                cx={CIRCUIT_TERMINALS[id].x}
                cy={CIRCUIT_TERMINALS[id].y - 9}
                r={TERMINAL_SNAP_RADIUS - 8}
                fill="transparent"
                className="cursor-crosshair"
                onPointerDown={(event) => { if (!state.switchClosed) pointerDrag.onPointerDown(pointerEvent(event), id) }}
                onPointerMove={(event) => pointerDrag.onPointerMove(pointerEvent(event))}
                onPointerUp={(event) => pointerDrag.onPointerUp(pointerEvent(event))}
                onPointerCancel={(event) => pointerDrag.onPointerCancel(pointerEvent(event))}
                aria-label={CIRCUIT_TERMINALS[id].label}
              />
            </g>
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

        {state.overRangeWarning && (
          <div role="alert" className="absolute left-1/2 top-24 w-[min(560px,86%)] -translate-x-1/2 rounded-[8px] border border-[#c0392b] bg-[#fff3f1] px-4 py-3 text-sm text-[#8c2b20] shadow-lg">
            <span className="mr-2 inline-flex items-center gap-1 font-bold"><AlertTriangle className="size-4" aria-hidden="true" />量程过小</span>
            {state.overRangeWarning}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#d8d2c8] bg-[#fbfaf7] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showSchematic}
            aria-label={showSchematic ? '回到实物接线图' : '转电路图'}
            title={showSchematic ? '回到实物接线图' : '转电路图'}
            onClick={() => setShowSchematic((current) => !current)}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3 text-sm font-bold ${showSchematic ? 'border-[#1f6fb2] bg-[#1f6fb2] text-white' : 'border-[#bdb6aa] text-[#4b4742]'}`}
          >
            <CircuitBoard className="size-4" aria-hidden="true" />
            {showSchematic ? '实物图' : '转电路图'}
          </button>
          <div role="group" aria-label="选择电路类型" className="inline-flex rounded-[6px] border border-[#bdb6aa] p-1">
            {(['series', 'parallel'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => dispatch({ type: 'setMode', payload: mode }, 'set-circuit-mode')} disabled={state.switchClosed} className={`h-8 px-3 text-sm font-bold disabled:opacity-45 ${state.mode === mode ? 'bg-[#1f6fb2] text-white' : 'text-[#4b4742]'}`}>{mode === 'series' ? '串联' : '并联'}</button>
            ))}
          </div>
          {state.mode === 'parallel' && (
            <div role="group" aria-label="选择电流表位置" className="inline-flex rounded-[6px] border border-[#bdb6aa] p-1">
              {(['main', 'branch'] as const).map((position) => (
                <button key={position} type="button" aria-pressed={state.position === position} onClick={() => dispatch({ type: 'setPosition', payload: position }, 'set-ammeter-position')} disabled={state.switchClosed} className={`h-8 px-3 text-sm font-bold disabled:opacity-45 ${state.position === position ? 'bg-[#1f6fb2] text-white' : 'text-[#4b4742]'}`}>{position === 'main' ? '干路' : '支路'}</button>
              ))}
            </div>
          )}
          <div role="group" aria-label="选择量程" className="inline-flex rounded-[6px] border border-[#bdb6aa] p-1">
            {(['3A', '0.6A'] as const).map((range) => (
              <button key={range} type="button" aria-pressed={state.activeRange === range} onClick={() => dispatch({ type: 'setRange', payload: range }, 'set-ammeter-range')} disabled={state.switchClosed} className={`h-8 px-3 text-sm font-bold disabled:opacity-45 ${state.activeRange === range ? 'bg-[#b5651d] text-white' : 'text-[#4b4742]'}`}>{range === '3A' ? '3A 大量程' : '0.6A 小量程'}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
