import { useEffect, useRef, type ChangeEvent } from 'react'
import { Flame, Play, RotateCcw, Square, Thermometer, Timer } from 'lucide-react'
import type { TextbookPhysicsExperiment } from '../../curriculum/types'
import PhysicsLabShell, { type PhysicsLabSceneProps } from '../../runtime/PhysicsLabShell'
import { usePointerDrag } from '../../runtime/usePointerDrag'
import { mapClientPointToSvgViewBox } from '../../runtime/svgCoordinates'
import type { LabAction, Position } from '../../runtime/types'
import { HEAT_CAPACITY_SNAP_ZONES, type HeatCapacityDragSubject, type HeatCapacitySubstance } from './definition'
import { heatCapacityController, type HeatCapacityState } from './controller'
import { startHeatCapacityTimer } from './timing'

const workbenchWidth = 960
const workbenchHeight = 540

interface BeakerProps {
  x: number
  label: string
  liquidLabel: string
  fill: string
  temperature: number
  thermometerPlaced: boolean
  heaterPlaced: boolean
  heating: boolean
}

function Beaker({ x, label, liquidLabel, fill, temperature, thermometerPlaced, heaterPlaced, heating }: BeakerProps) {
  const fillTop = 302 - Math.min(74, Math.max(44, (temperature - 20) * 5))
  return (
    <g>
      <text x={x + 94} y="92" fill="#e6edf7" fontSize="18" fontWeight="700" textAnchor="middle">{label}</text>
      <text x={x + 94} y="115" fill="#8fa0b7" fontSize="13" textAnchor="middle">{liquidLabel}</text>
      <path d={`M ${x + 24} 156 L ${x + 36} 350 Q ${x + 94} 372 ${x + 152} 350 L ${x + 164} 156`} fill="#172333" stroke="#8fa0b7" strokeWidth="4" />
      <path d={`M ${x + 33} ${fillTop} L ${x + 40} 346 Q ${x + 94} 362 ${x + 148} 346 L ${x + 155} ${fillTop} Z`} fill={fill} opacity="0.88" />
      <line x1={x + 30} y1={fillTop} x2={x + 158} y2={fillTop} stroke="#d7e8f8" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((index) => {
        const y = 322 - index * 38
        return <g key={index}><line x1={x + 174} y1={y} x2={x + 184} y2={y} stroke="#697b92" strokeWidth="2" /><text x={x + 190} y={y + 4} fill="#9fb0c5" fontSize="11">{20 + index * 5}</text></g>
      })}
      <text x={x + 94} y="324" fill="#f8fbff" fontSize="22" fontWeight="700" textAnchor="middle">{temperature.toFixed(1)}°C</text>
      {thermometerPlaced && <g><rect x={x + 86} y="132" width="16" height="174" rx="8" fill="#dfe9f4" /><rect x={x + 91} y={278 - Math.min(122, Math.max(16, (temperature - 20) * 6))} width="6" height={Math.min(122, Math.max(16, (temperature - 20) * 6)) + 18} rx="3" fill="#ef5a53" /><circle cx={x + 94} cy="304" r="12" fill="#ef5a53" /></g>}
      {heaterPlaced && <g><rect x={x + 46} y="376" width="96" height="28" rx="5" fill={heating ? '#d86b38' : '#3d5269'} /><path d={`M ${x + 72} 397 q 10 -18 20 0 q 10 -18 20 0`} fill="none" stroke={heating ? '#ffd465' : '#8fa0b7'} strokeWidth="3" /></g>}
    </g>
  )
}

function dragSubjectLabel(subject: HeatCapacityDragSubject): string {
  const labels: Record<HeatCapacityDragSubject, string> = {
    waterThermometer: '拖动水温度计到水的卡槽',
    oilThermometer: '拖动油温度计到食用油的卡槽',
    waterHeater: '拖动水加热器到水烧杯下方',
    oilHeater: '拖动油加热器到食用油烧杯下方',
  }
  return labels[subject]
}

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const position = value as Partial<Position>
  return Number.isFinite(position.x) && Number.isFinite(position.y)
}

function DragTool({
  subject,
  placed,
  pointerDrag,
}: {
  subject: HeatCapacityDragSubject
  placed: boolean
  pointerDrag: ReturnType<typeof usePointerDrag>
}) {
  if (placed) return null
  const thermometer = subject.endsWith('Thermometer')
  const oil = subject.startsWith('oil')
  return (
    <button
      type="button"
      aria-label={dragSubjectLabel(subject)}
      title={dragSubjectLabel(subject)}
      className={`grid h-11 w-full min-w-0 place-items-center rounded-[6px] border text-xs font-semibold ${thermometer ? 'border-[#8ec6ff] bg-[#193451] text-[#e7f4ff]' : 'border-[#e58c56] bg-[#442719] text-[#ffe3d2]'}`}
      onPointerDown={(event) => pointerDrag.onPointerDown(event, subject)}
      onPointerMove={pointerDrag.onPointerMove}
      onPointerUp={pointerDrag.onPointerUp}
      onPointerCancel={pointerDrag.onPointerCancel}
    >
      {thermometer ? <Thermometer className="size-4" aria-hidden="true" /> : <Flame className="size-4" aria-hidden="true" />}
      <span>{oil ? '食用油' : '水'}{thermometer ? '温度计' : '加热器'}</span>
    </button>
  )
}

export function HeatCapacityScene({ state, dispatch }: PhysicsLabSceneProps<HeatCapacityState>) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pointerDrag = usePointerDrag({
    stageRef,
    positionFor: (event) => {
      const svg = stageRef.current?.querySelector<SVGSVGElement>('svg') ?? null
      if (svg === null) return null

      return mapClientPointToSvgViewBox(event, {
        rect: svg.getBoundingClientRect(),
        viewBox: { x: 0, y: 0, width: workbenchWidth, height: workbenchHeight },
      })
    },
    dispatch: (action: LabAction) => {
      if (action.type === 'dragCancel') return
      if (action.type !== 'dragEnd' || typeof action.payload !== 'object' || action.payload === null) return
      const drag = action.payload as { subject?: unknown; position?: unknown }
      if (!isPosition(drag.position)) return
      dispatch({
        type: 'dragEnd',
        payload: {
          subject: drag.subject,
          position: drag.position,
        },
      }, 'place-apparatus')
    },
  })

  useEffect(() => {
    if (!state.heating) return undefined
    return startHeatCapacityTimer({
      now: () => window.performance.now(),
      setInterval: (callback) => window.setInterval(callback, 250),
      clearInterval: (timerId) => window.clearInterval(timerId),
      onElapsed: (seconds) => dispatch({ type: 'tick', payload: seconds }, 'heat-tick'),
    })
  }, [dispatch, state.heating])

  function updateMass(substance: HeatCapacitySubstance, event: ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'setMass', payload: { substance, mass: event.currentTarget.valueAsNumber } }, 'set-mass')
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#101722] text-[#e6edf7]">
      <div ref={stageRef} className="relative min-h-0 flex-1 touch-none overflow-hidden">
        <svg viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label="水和食用油吸热能力比较实验台">
          <rect width={workbenchWidth} height={workbenchHeight} fill="#101722" />
          <rect x="26" y="24" width="908" height="56" fill="#172333" stroke="#30435a" />
          <text x="52" y="58" fill="#f7fbff" fontSize="20" fontWeight="700">吸热能力比较台</text>
          <text x="908" y="57" fill={state.heating ? '#ffd465' : '#9fb0c5'} fontSize="18" fontWeight="700" textAnchor="end">{state.heating ? '正在加热' : '已停止'}</text>
          <line x1="480" y1="112" x2="480" y2="414" stroke="#30435a" strokeWidth="2" strokeDasharray="8 8" />
          <rect x="60" y="420" width="840" height="20" rx="3" fill="#26384d" />
          <Beaker x={220} label="烧杯 A" liquidLabel="水" fill="#3486b9" temperature={state.waterTemperature} thermometerPlaced={state.waterThermometerPlaced} heaterPlaced={state.waterHeaterPlaced} heating={state.heating} />
          <Beaker x={550} label="烧杯 B" liquidLabel="食用油" fill="#d69b3a" temperature={state.oilTemperature} thermometerPlaced={state.oilThermometerPlaced} heaterPlaced={state.oilHeaterPlaced} heating={state.heating} />
          {(Object.entries(HEAT_CAPACITY_SNAP_ZONES) as Array<[HeatCapacityDragSubject, typeof HEAT_CAPACITY_SNAP_ZONES[HeatCapacityDragSubject]]>).map(([subject, zone]) => <rect key={subject} x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx="8" fill="none" stroke="#52718f" strokeWidth="2" strokeDasharray="6 5" />)}
          <g transform="translate(760 120)"><rect width="144" height="104" rx="6" fill="#172333" stroke="#52718f" /><text x="72" y="27" fill="#9fb0c5" fontSize="13" textAnchor="middle">秒表</text><text x="72" y="70" fill="#f8fbff" fontSize="30" fontWeight="700" textAnchor="middle">{state.elapsedSeconds.toFixed(1)} s</text></g>
          <g transform="translate(56 120)"><rect width="132" height="104" rx="6" fill="#172333" stroke="#52718f" /><text x="66" y="27" fill="#9fb0c5" fontSize="13" textAnchor="middle">控制条件</text><text x="66" y="55" fill="#f8fbff" fontSize="15" textAnchor="middle">P = {state.heaterPower} W</text><text x="66" y="79" fill="#f8fbff" fontSize="15" textAnchor="middle">T₀ = 25°C</text></g>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 grid min-h-[136px] grid-cols-2 gap-2 border-t border-[#30435a] bg-[#142031] px-3 pb-3 pt-7 md:min-h-[76px] md:grid-cols-4 md:items-end md:px-4 md:pb-2 md:pt-6">
          <p className="absolute right-4 top-2 text-xs font-semibold text-[#8fa0b7]">器材托盘</p>
          <DragTool subject="waterThermometer" placed={state.waterThermometerPlaced} pointerDrag={pointerDrag} />
          <DragTool subject="oilThermometer" placed={state.oilThermometerPlaced} pointerDrag={pointerDrag} />
          <DragTool subject="waterHeater" placed={state.waterHeaterPlaced} pointerDrag={pointerDrag} />
          <DragTool subject="oilHeater" placed={state.oilHeaterPlaced} pointerDrag={pointerDrag} />
        </div>
      </div>

      <div className="grid shrink-0 gap-3 border-t border-[#30435a] px-4 py-3 lg:grid-cols-[1fr_1fr_auto]">
        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-[#c7d4e5]">水的质量（kg）<input aria-label="水的质量（kg）" type="number" min="0.01" step="0.01" value={state.waterMass} onChange={(event) => updateMass('water', event)} disabled={state.massLocked} className="w-24 rounded-[4px] border border-[#52718f] bg-[#101722] px-2 py-1 text-right text-sm text-white" /></label>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-[#c7d4e5]">食用油质量（kg）<input aria-label="食用油质量（kg）" type="number" min="0.01" step="0.01" value={state.oilMass} onChange={(event) => updateMass('oil', event)} disabled={state.massLocked} className="w-24 rounded-[4px] border border-[#52718f] bg-[#101722] px-2 py-1 text-right text-sm text-white" /></label>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" aria-label="开始同时加热" title="开始同时加热" onClick={() => dispatch({ type: 'start' }, 'start-heating')} disabled={state.heating} className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#1f8f62] px-3 text-sm font-bold text-white disabled:opacity-45"><Play className="size-4" aria-hidden="true" />开始</button>
          <button type="button" aria-label="停止加热" title="停止加热" onClick={() => dispatch({ type: 'stop' }, 'stop-heating')} disabled={!state.heating} className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#da7a66] px-3 text-sm font-bold text-[#ffd4ca] disabled:opacity-45"><Square className="size-4" aria-hidden="true" />停止</button>
          <button type="button" aria-label="记录本次比较" title="记录本次比较" onClick={() => dispatch({ type: 'record' }, 'record-trial')} className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#8ec6ff] px-3 text-sm font-bold text-[#dff0ff]"><Timer className="size-4" aria-hidden="true" />记录</button>
          <button type="button" aria-label="重置当前试次" title="重置当前试次" onClick={() => dispatch({ type: 'resetTrial' }, 'reset-trial')} disabled={state.heating} className="grid size-9 place-items-center rounded-[6px] border border-[#52718f] text-[#d4e1f0] disabled:opacity-45"><RotateCcw className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
}

export function HeatCapacityLab({ experiment }: { experiment: TextbookPhysicsExperiment }) {
  return <PhysicsLabShell experiment={experiment} controller={heatCapacityController} Scene={HeatCapacityScene} conditions={heatCapacityController.conditions} />
}
