import { useRef, useState, type PointerEvent } from 'react'
import { Lightbulb, Power, RotateCcw } from 'lucide-react'
import type { TextbookPhysicsExperiment } from '../../curriculum/types'
import PhysicsLabShell, { type PhysicsLabSceneProps } from '../../runtime/PhysicsLabShell'
import { mapClientPointToSvgViewBox } from '../../runtime/svgCoordinates'
import { usePointerDrag } from '../../runtime/usePointerDrag'
import type { LabAction, Position } from '../../runtime/types'
import { CIRCUIT_TERMINALS, terminalAtPosition, type CircuitTerminalId } from './definition'
import { seriesParallelController, type CircuitEdge, type CircuitLabState } from './controller'

const workbenchWidth = 960
const workbenchHeight = 540

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Partial<Position>
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function edgePath(edge: CircuitEdge): string {
  const from = CIRCUIT_TERMINALS[edge.from as CircuitTerminalId]
  const to = CIRCUIT_TERMINALS[edge.to as CircuitTerminalId]
  if (!from || !to) return ''
  const midpoint = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${midpoint} ${from.y}, ${midpoint} ${to.y}, ${to.x} ${to.y}`
}

function terminalHasWire(state: CircuitLabState, id: CircuitTerminalId): boolean {
  return state.edges.some((edge) => edge.from === id || edge.to === id)
}

function Lamp({ x, lit, label }: { x: number; lit: boolean; label: string }) {
  return (
    <g>
      {lit && <circle cx={x} cy="265" r="69" fill="#f6bd4e" opacity="0.18" />}
      <circle cx={x} cy="265" r="47" fill={lit ? '#ffd76b' : '#33445c'} stroke={lit ? '#fff0ad' : '#92a7be'} strokeWidth="4" />
      <path d={`M ${x - 18} 265 Q ${x} 232 ${x + 18} 265 Q ${x} 298 ${x - 18} 265`} fill="none" stroke={lit ? '#80531e' : '#b8c7d7'} strokeWidth="4" />
      <line x1={x - 34} y1="265" x2={x + 34} y2="265" stroke={lit ? '#80531e' : '#b8c7d7'} strokeWidth="3" />
      <text x={x} y="350" fill="#dce8f6" fontSize="15" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
}

export function SeriesParallelScene({ state, dispatch }: PhysicsLabSceneProps<CircuitLabState>) {
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [preview, setPreview] = useState<{ from: CircuitTerminalId; position: Position } | null>(null)
  const lit = state.switchClosed
  const validation = state.mode === 'series'
    ? '串联: 电流依次通过两只灯泡'
    : '并联: 两只灯泡分别接入支路'

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
        setPreview({ from: from as CircuitTerminalId, position: payload.position })
        dispatch({ type: 'dragStart', payload: { subject: from } }, 'start-wire')
        return
      }
      if (action.type === 'dragMove' && isPosition(payload?.position)) {
        const position = payload.position
        setPreview((current) => current ? { ...current, position } : current)
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
        if (typeof from !== 'string' || !target) {
          dispatch({ type: 'dragCancel', payload: { subject: from } }, 'cancel-wire')
          return
        }
        dispatch({ type: 'connect', payload: { from, to: target } }, 'connect-wire')
      }
    },
  })

  const pointerEvent = (event: PointerEvent<SVGCircleElement>) => event as unknown as PointerEvent<HTMLElement>

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b1420] text-[#e8f2ff]">
      <div ref={stageRef} className="relative min-h-0 flex-1 touch-none overflow-hidden">
        <svg ref={svgRef} viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="连接串联电路和并联电路的实验台">
          <rect width={workbenchWidth} height={workbenchHeight} fill="#0b1420" />
          <rect x="25" y="22" width="910" height="65" rx="6" fill="#132238" stroke="#38516b" />
          <text x="52" y="53" fill="#f4f8ff" fontSize="21" fontWeight="700">电路连接实验台</text>
          <text x="52" y="74" fill="#9db4cc" fontSize="13">从接线柱拖出导线，松开时在接线柱半径内吸附</text>
          <text x="908" y="57" fill={state.switchClosed ? '#ffd76b' : '#9db4cc'} fontSize="17" fontWeight="700" textAnchor="end">{state.switchClosed ? '已通电' : '已断电'}</text>
          <rect x="35" y="112" width="890" height="346" rx="6" fill="#0f1c2d" stroke="#263f58" />
          <path d="M 48 435 H 912" stroke="#29455d" strokeWidth="8" strokeLinecap="round" />

          {state.edges.map((edge) => <path key={`${edge.from}-${edge.to}`} d={edgePath(edge)} fill="none" stroke="#df5b55" strokeWidth="7" strokeLinecap="round" />)}
          {preview && <path d={`M ${CIRCUIT_TERMINALS[preview.from].x} ${CIRCUIT_TERMINALS[preview.from].y} L ${preview.position.x} ${preview.position.y}`} fill="none" stroke="#70c3ff" strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />}

          <g>
            <rect x="60" y="222" width="118" height="214" rx="8" fill="#253b54" stroke="#9fb8cf" strokeWidth="3" />
            <rect x="82" y="245" width="74" height="52" rx="5" fill="#15273b" stroke="#647f99" />
            <line x1="109" y1="260" x2="109" y2="282" stroke="#ff7670" strokeWidth="5" />
            <line x1="124" y1="252" x2="124" y2="290" stroke="#76bfff" strokeWidth="5" />
            <text x="119" y="360" fill="#e2edf8" fontSize="16" fontWeight="700" textAnchor="middle">3 V 电源</text>
            <text x="119" y="386" fill="#9db4cc" fontSize="13" textAnchor="middle">正极 / 负极</text>
          </g>
          <g>
            <rect x="285" y="232" width="150" height="76" rx="8" fill="#24374b" stroke="#9fb8cf" strokeWidth="3" />
            <line x1="320" y1="270" x2={state.switchClosed ? '400' : '380'} y2={state.switchClosed ? '270' : '244'} stroke={state.switchClosed ? '#8fe2a4' : '#dce8f6'} strokeWidth="6" strokeLinecap="round" />
            <text x="360" y="338" fill="#dce8f6" fontSize="15" fontWeight="700" textAnchor="middle">开关</text>
          </g>
          <Lamp x={555} lit={lit} label="小灯泡 1" />
          <Lamp x={755} lit={lit} label="小灯泡 2" />

          {(Object.values(CIRCUIT_TERMINALS) as Array<(typeof CIRCUIT_TERMINALS)[CircuitTerminalId]>).map((terminal) => {
            const connected = terminalHasWire(state, terminal.id)
            return <g key={terminal.id}>
              <circle cx={terminal.x} cy={terminal.y} r="17" fill={connected ? '#d94f4a' : '#172d45'} stroke={connected ? '#ffb3a9' : '#8fb3d4'} strokeWidth="3" />
              <circle
                cx={terminal.x}
                cy={terminal.y}
                r="11"
                fill="#f2f7ff"
                className="cursor-crosshair"
                aria-label={terminal.label}
                role="button"
                tabIndex={0}
                onPointerDown={(event) => pointerDrag.onPointerDown(pointerEvent(event), terminal.id)}
                onPointerMove={(event) => pointerDrag.onPointerMove(pointerEvent(event))}
                onPointerUp={(event) => pointerDrag.onPointerUp(pointerEvent(event))}
                onPointerCancel={(event) => pointerDrag.onPointerCancel(pointerEvent(event))}
              />
              <text x={terminal.x} y={terminal.y - 25} fill="#a9bfd4" fontSize="11" textAnchor="middle">{terminal.id}</text>
            </g>
          })}
          <g transform="translate(45 478)">
            <rect width="870" height="38" rx="5" fill="#132238" stroke="#2c4964" />
            <text x="18" y="24" fill="#d9e8f7" fontSize="14">{validation}</text>
            <text x="850" y="24" fill="#9db4cc" fontSize="13" textAnchor="end">已连接 {state.edges.length} 条导线</text>
          </g>
        </svg>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#2c4964] bg-[#101d2e] px-4 py-3">
        <div role="group" aria-label="选择电路类型" className="inline-flex rounded-[6px] border border-[#496782] p-1">
          {(['series', 'parallel'] as const).map((mode) => <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => dispatch({ type: 'setMode', payload: mode }, 'set-circuit-mode')} disabled={state.switchClosed} className={`h-8 px-3 text-sm font-bold ${state.mode === mode ? 'bg-[#2d83b9] text-white' : 'text-[#bdd2e5]'} disabled:opacity-45`}>{mode === 'series' ? '串联' : '并联'}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={state.switchClosed ? '断开开关' : '闭合开关'} title={state.switchClosed ? '断开开关' : '闭合开关'} onClick={() => dispatch({ type: 'setSwitch', payload: state.switchClosed ? 'open' : 'closed' }, 'toggle-switch')} className={`inline-flex h-9 items-center gap-2 rounded-[6px] px-3 text-sm font-bold ${state.switchClosed ? 'bg-[#d55b53] text-white' : 'bg-[#267e58] text-white'}`}><Power className="size-4" aria-hidden="true" />{state.switchClosed ? '断开' : '闭合'}</button>
          <button type="button" aria-label="重置当前接线" title="重置当前接线" onClick={() => dispatch({ type: 'resetTrial' }, 'reset-circuit')} disabled={state.switchClosed} className="grid size-9 place-items-center rounded-[6px] border border-[#61809c] text-[#d7e7f5] disabled:opacity-45"><RotateCcw className="size-4" aria-hidden="true" /></button>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#dbeafb]"><Lightbulb className={`size-4 ${lit ? 'text-[#ffd76b]' : 'text-[#7892aa]'}`} aria-hidden="true" />{lit ? '两灯发光' : '等待闭合'}</span>
        </div>
      </div>
    </div>
  )
}

export function SeriesParallelLab({ experiment }: { experiment: TextbookPhysicsExperiment }) {
  return <PhysicsLabShell experiment={experiment} controller={seriesParallelController} Scene={SeriesParallelScene} conditions={seriesParallelController.conditions} />
}
