import { RotateCcw, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { TextbookPhysicsExperiment } from '../../curriculum/types'
import PhysicsLabShell, { type PhysicsLabSceneProps } from '../../runtime/PhysicsLabShell'
import { usePointerDrag } from '../../runtime/usePointerDrag'
import { mapClientPointToSvgViewBox } from '../../runtime/svgCoordinates'
import type { LabAction } from '../../runtime/types'
import {
  BENCH,
  MAGNET_GAP,
  RAIL,
} from './definition'
import { electromagneticInductionController, liveCurrentFor, type InductionLabState } from './controller'

function Galvanometer({ current }: { current: number }) {
  const needleAngle = current * 58
  return (
    <g transform="translate(748 130)">
      <rect x="-112" y="-32" width="224" height="174" rx="6" fill="#101b29" stroke="#49627f" strokeWidth="2" />
      <text x="0" y="-8" fill="#d9e7f5" fontSize="15" fontWeight="700" textAnchor="middle">中心零位电流计</text>
      <path d="M -76 84 A 76 76 0 0 1 76 84" fill="none" stroke="#d7e2ef" strokeWidth="2" />
      {[-1, -0.5, 0, 0.5, 1].map((mark) => {
        const angle = mark * 58
        const radians = (angle - 90) * Math.PI / 180
        const x1 = Math.cos(radians) * 69
        const y1 = 84 + Math.sin(radians) * 69
        const x2 = Math.cos(radians) * 77
        const y2 = 84 + Math.sin(radians) * 77
        return <g key={mark}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d7e2ef" strokeWidth={mark === 0 ? 3 : 2} /><text x={Math.cos(radians) * 92} y={84 + Math.sin(radians) * 92 + 4} fill="#91a5bb" fontSize="12" textAnchor="middle">{mark === 0 ? '0' : mark > 0 ? '+' : '-'}</text></g>
      })}
      <line x1="0" y1="84" x2="0" y2="22" stroke="#ffcc66" strokeWidth="4" strokeLinecap="round" transform={`rotate(${needleAngle} 0 84)`} />
      <circle cx="0" cy="84" r="7" fill="#e6edf7" stroke="#ffcc66" strokeWidth="3" />
      <text x="0" y="128" fill="#c5d6e8" fontSize="16" textAnchor="middle">I = {current.toFixed(2)} A</text>
    </g>
  )
}

function Magnet({ direction }: { direction: 'down' | 'up' }) {
  const arrowAt = direction === 'down' ? 196 : 322
  const arrowEnd = direction === 'down' ? 304 : 214
  return (
    <g>
      <rect x="306" y="116" width="76" height="256" rx="10" fill="#ca5155" stroke="#f19493" strokeWidth="3" />
      <rect x="578" y="116" width="76" height="256" rx="10" fill="#3a83ba" stroke="#8bc4ed" strokeWidth="3" />
      <path d="M 344 118 V 78 Q 344 54 368 54 H 592 Q 616 54 616 78 V 118" fill="none" stroke="#8c9db1" strokeWidth="34" strokeLinecap="round" />
      <text x="344" y="242" fill="#fff2f0" fontSize="25" fontWeight="700" textAnchor="middle">N</text>
      <text x="616" y="242" fill="#ebf7ff" fontSize="25" fontWeight="700" textAnchor="middle">S</text>
      <rect x={MAGNET_GAP.left} y={MAGNET_GAP.top} width={MAGNET_GAP.right - MAGNET_GAP.left} height={MAGNET_GAP.bottom - MAGNET_GAP.top} fill="#1a6070" opacity="0.24" stroke="#66d2dc" strokeWidth="2" strokeDasharray="7 6" />
      {[405, 450, 495, 540, 580].map((x) => <g key={x}><line x1={x} y1="156" x2={x} y2="344" stroke="#6ed1d8" strokeWidth="2" opacity="0.82" markerEnd="url(#field-arrow)" /></g>)}
      <line x1="472" y1={arrowAt} x2="472" y2={arrowEnd} stroke="#d8fbff" strokeWidth="4" markerEnd="url(#field-arrow-bright)" />
      <text x="480" y="394" fill="#aee9ee" fontSize="14" fontWeight="700" textAnchor="middle">磁场方向：{direction === 'down' ? '向下 ↓' : '向上 ↑'}</text>
    </g>
  )
}

export function ElectromagneticInductionScene({ state, dispatch }: PhysicsLabSceneProps<InductionLabState>) {
  const stageRef = useRef<HTMLDivElement>(null)
  const current = liveCurrentFor(state)
  const pointerDrag = usePointerDrag({
    stageRef,
    positionFor: (event) => {
      const svg = stageRef.current?.querySelector<SVGSVGElement>('svg') ?? null
      return svg === null ? null : mapClientPointToSvgViewBox(event, {
        rect: svg.getBoundingClientRect(),
        viewBox: { x: 0, y: 0, width: BENCH.width, height: BENCH.height },
      })
    },
    dispatch: (action: LabAction) => {
      if (action.type === 'dragCancel') {
        dispatch(action, 'conductor-drag-cancel')
        return
      }
      if ((action.type !== 'dragStart' && action.type !== 'dragMove' && action.type !== 'dragEnd') || typeof action.payload !== 'object' || action.payload === null) return
      const payload = action.payload as { position?: unknown }
      dispatch({ type: action.type, payload: { position: payload.position, at: window.performance.now() } }, `conductor-${action.type}`)
    },
  })

  function beginDrag(event: ReactPointerEvent<SVGRectElement>) {
    pointerDrag.onPointerDown(event as unknown as ReactPointerEvent<HTMLElement>, 'conductor')
  }

  function moveDrag(event: ReactPointerEvent<SVGRectElement>) {
    pointerDrag.onPointerMove(event as unknown as ReactPointerEvent<HTMLElement>)
  }

  function endDrag(event: ReactPointerEvent<SVGRectElement>) {
    pointerDrag.onPointerUp(event as unknown as ReactPointerEvent<HTMLElement>)
  }

  function cancelDrag(event: ReactPointerEvent<SVGRectElement>) {
    pointerDrag.onPointerCancel(event as unknown as ReactPointerEvent<HTMLElement>)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#07111e] text-[#e8f2fb]">
      <div ref={stageRef} className="relative min-h-0 flex-1 touch-none overflow-hidden">
        <svg viewBox={`0 0 ${BENCH.width} ${BENCH.height}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="电磁感应实验台，可拖动导体棒穿过磁场">
          <defs>
            <marker id="field-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6ed1d8" /></marker>
            <marker id="field-arrow-bright" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d8fbff" /></marker>
            <marker id="motion-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ffcc66" /></marker>
          </defs>
          <rect width={BENCH.width} height={BENCH.height} fill="#07111e" />
          <rect x="22" y="18" width="916" height="52" fill="#0e2032" stroke="#294a68" />
          <text x="48" y="50" fill="#eef7ff" fontSize="20" fontWeight="700">探究什么情况下磁可以生电</text>
          <text x="914" y="50" fill={state.circuitClosed ? '#7be0b8' : '#f0a19a'} fontSize="16" fontWeight="700" textAnchor="end">电路：{state.circuitClosed ? '闭合' : '断开'}</text>
          <Magnet direction={state.fieldDirection} />
          <path d={`M 112 ${RAIL.y} H 846`} stroke="#8da3bb" strokeWidth="12" strokeLinecap="round" />
          <path d={`M 112 ${RAIL.y} H 846`} stroke="#dce9f5" strokeWidth="3" strokeLinecap="round" />
          <text x="112" y="448" fill="#92a7bc" fontSize="14">水平导轨</text>
          <path d={`M ${state.conductorX} 148 V 364`} stroke="#f4c462" strokeWidth="13" strokeLinecap="round" />
          <rect x={state.conductorX - 24} y="130" width="48" height="250" rx="8" fill="transparent" stroke="transparent" className="cursor-grab active:cursor-grabbing" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} aria-label="拖动导体棒" />
          <text x={state.conductorX} y="122" fill="#ffe7a4" fontSize="14" fontWeight="700" textAnchor="middle">导体棒</text>
          {state.motion !== null && <g><line x1={state.conductorX} y1="420" x2={state.conductorX + (state.motion.direction === 'right' ? 78 : -78)} y2="420" stroke="#ffcc66" strokeWidth="4" markerEnd="url(#motion-arrow)" /><text x={state.conductorX} y="445" fill="#ffdc85" fontSize="14" fontWeight="700" textAnchor="middle">运动方向：{state.motion.direction === 'right' ? '向右 →' : '向左 ←'}</text></g>}
          <path d={`M ${state.conductorX} 148 H 670 V 130`} fill="none" stroke={state.circuitClosed ? '#76cda4' : '#65778a'} strokeWidth="5" strokeDasharray={state.circuitClosed ? undefined : '10 7'} />
          <path d={`M ${state.conductorX} 364 H 670 V 250`} fill="none" stroke={state.circuitClosed ? '#76cda4' : '#65778a'} strokeWidth="5" strokeDasharray={state.circuitClosed ? undefined : '10 7'} />
          <Galvanometer current={current} />
          <g transform="translate(62 122)"><rect width="186" height="130" rx="6" fill="#0e2032" stroke="#294a68" /><text x="16" y="28" fill="#9fb8cf" fontSize="13">感应条件</text><text x="16" y="58" fill="#e7f3ff" fontSize="16">I = BLv / R</text><text x="16" y="84" fill="#b4c8db" fontSize="13">B = 0.50 T</text><text x="16" y="106" fill="#b4c8db" fontSize="13">L = 0.10 m  R = 2.0 Ω</text></g>
          <text x="480" y="490" fill="#a7bdd1" fontSize="13" textAnchor="middle">在磁场间隙内静止记录零电流；向右和向左拖动后分别记录。</text>
        </svg>
      </div>
      <div className="grid shrink-0 gap-3 border-t border-[#294a68] bg-[#0b1725] px-4 py-3 lg:grid-cols-[1fr_1fr_auto]">
        <div role="group" aria-label="电路状态" className="flex items-center gap-2"><span className="text-sm font-semibold text-[#c7d8e8]">电路</span><button type="button" aria-pressed={!state.circuitClosed} onClick={() => dispatch({ type: 'setCircuit', payload: 'open' }, 'circuit-open')} className={`h-9 border px-3 text-sm font-bold ${!state.circuitClosed ? 'border-[#f0a19a] bg-[#472127] text-[#ffe0dc]' : 'border-[#36536e] text-[#a9bfd3]'}`}>断开</button><button type="button" aria-pressed={state.circuitClosed} onClick={() => dispatch({ type: 'setCircuit', payload: 'closed' }, 'circuit-closed')} className={`inline-flex h-9 items-center gap-2 border px-3 text-sm font-bold ${state.circuitClosed ? 'border-[#7be0b8] bg-[#123d36] text-[#d6fff0]' : 'border-[#36536e] text-[#a9bfd3]'}`}>{state.circuitClosed ? <ToggleRight className="size-4" aria-hidden="true" /> : <ToggleLeft className="size-4" aria-hidden="true" />}闭合</button></div>
        <div role="group" aria-label="磁场方向" className="flex items-center gap-2"><span className="text-sm font-semibold text-[#c7d8e8]">磁场</span><button type="button" aria-pressed={state.fieldDirection === 'down'} onClick={() => dispatch({ type: 'setFieldDirection', payload: 'down' }, 'field-down')} className={`h-9 border px-3 text-sm font-bold ${state.fieldDirection === 'down' ? 'border-[#8de5eb] bg-[#164150] text-[#ddffff]' : 'border-[#36536e] text-[#a9bfd3]'}`}>向下 ↓</button><button type="button" aria-pressed={state.fieldDirection === 'up'} onClick={() => dispatch({ type: 'setFieldDirection', payload: 'up' }, 'field-up')} className={`h-9 border px-3 text-sm font-bold ${state.fieldDirection === 'up' ? 'border-[#8de5eb] bg-[#164150] text-[#ddffff]' : 'border-[#36536e] text-[#a9bfd3]'}`}>向上 ↑</button></div>
        <div className="flex items-center justify-end gap-2"><button type="button" onClick={() => dispatch({ type: 'record' }, 'record-observation')} className="inline-flex h-9 items-center gap-2 border border-[#ffcc66] bg-[#4c3914] px-3 text-sm font-bold text-[#fff0bf]"><Save className="size-4" aria-hidden="true" />记录观察</button><button type="button" aria-label="重置当前操作" title="重置当前操作" onClick={() => dispatch({ type: 'resetTrial' }, 'reset-trial')} className="grid size-9 place-items-center border border-[#59728c] text-[#d8e7f5]"><RotateCcw className="size-4" aria-hidden="true" /></button></div>
      </div>
    </div>
  )
}

export function ElectromagneticInductionLab({ experiment }: { experiment: TextbookPhysicsExperiment }) {
  return <PhysicsLabShell experiment={experiment} controller={electromagneticInductionController} Scene={ElectromagneticInductionScene} conditions={electromagneticInductionController.conditions} />
}
