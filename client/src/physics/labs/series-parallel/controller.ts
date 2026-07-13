import type { PhysicsExperimentalCondition } from '../../sessions/types'
import type { DerivedMeasurement, LabController, LabFeedback, LabTransition } from '../../runtime/types'
import {
  CIRCUIT_TERMINALS,
  COMPONENT_INTERNAL_CONNECTIONS,
  type CircuitMode,
  type CircuitTerminalId,
} from './definition'

export type { CircuitMode }

export interface CircuitEdge {
  from: string
  to: string
}

export interface CircuitGraph {
  readonly edges: readonly CircuitEdge[]
}

export type CircuitValidation =
  | { valid: true; message: string }
  | { valid: false; code: 'invalid-terminal' | 'self-link' | 'duplicate-wire' | 'battery-short' | 'unexpected-topology'; message: string }

export interface CircuitTrial {
  readonly id: string
  readonly mode: CircuitMode
  readonly voltage: number
  readonly wireCount: number
  readonly lamp1Lit: boolean
  readonly lamp2Lit: boolean
  readonly edges: readonly CircuitEdge[]
}

export interface CircuitLabState {
  mode: CircuitMode
  edges: readonly CircuitEdge[]
  switchClosed: boolean
  activeTrialId: string | null
  trials: readonly CircuitTrial[]
}

const accepted = (message: string): LabFeedback => ({ outcome: 'accepted', message })
const rejected = (message: string): LabFeedback => ({ outcome: 'rejected', message })
const terminalIds = new Set(Object.keys(CIRCUIT_TERMINALS))
const seriesWireKeys = new Set([
  'battery+::switch-a',
  'lamp1-a::switch-b',
  'lamp1-b::lamp2-a',
  'battery-::lamp2-b',
])
const parallelWireKeys = new Set([
  'battery+::switch-a',
  'lamp1-a::switch-b',
  'lamp2-a::switch-b',
  'battery-::lamp1-b',
  'battery-::lamp2-b',
])

function freezeEdges(edges: readonly CircuitEdge[]): readonly CircuitEdge[] {
  return Object.freeze(edges.map((edge) => Object.freeze({ from: edge.from, to: edge.to })))
}

function isTerminalId(value: unknown): value is CircuitTerminalId {
  return typeof value === 'string' && terminalIds.has(value)
}

function transition(state: CircuitLabState, feedback: LabFeedback): LabTransition<CircuitLabState> {
  return { state, feedback }
}

function stateWith(state: CircuitLabState, patch: Partial<CircuitLabState>): CircuitLabState {
  return {
    ...state,
    ...patch,
    edges: patch.edges ? freezeEdges(patch.edges) : freezeEdges(state.edges),
    trials: patch.trials ? Object.freeze([...patch.trials]) : Object.freeze([...state.trials]),
  }
}

function sameKeys(actual: ReadonlySet<string>, expected: ReadonlySet<string>): boolean {
  return actual.size === expected.size && [...actual].every((key) => expected.has(key))
}

function validateExactTopology(graph: CircuitGraph, expected: ReadonlySet<string>, message: string): CircuitValidation {
  const safe = validateCircuitSafety(graph)
  if (!safe.valid) return safe
  const keys = new Set(graph.edges.map(normalizedEdgeKey))
  if (!sameKeys(keys, expected)) {
    return { valid: false, code: 'unexpected-topology', message: '导线连接与该电路图不一致，请检查每个元件端点' }
  }
  return { valid: true, message }
}

function activeTrial(state: CircuitLabState): CircuitTrial | undefined {
  return state.activeTrialId === null ? undefined : state.trials.find((trial) => trial.id === state.activeTrialId)
}

export function normalizedEdgeKey(edge: CircuitEdge): string {
  return [edge.from, edge.to].sort().join('::')
}

export function circuitFromEdges(edges: readonly CircuitEdge[]): CircuitGraph {
  return { edges: freezeEdges(edges) }
}

export function circuitWithInternalContinuity(graph: CircuitGraph): CircuitGraph {
  return circuitFromEdges([
    ...graph.edges,
    ...COMPONENT_INTERNAL_CONNECTIONS.map(([from, to]) => ({ from, to })),
  ])
}

export function validateCircuitSafety(graph: CircuitGraph): CircuitValidation {
  const seen = new Set<string>()
  for (const edge of graph.edges) {
    if (!isTerminalId(edge.from) || !isTerminalId(edge.to)) {
      return { valid: false, code: 'invalid-terminal', message: '导线只能连接到器材接线柱' }
    }
    if (edge.from === edge.to) return { valid: false, code: 'self-link', message: '同一接线柱不能连接到自身' }
    const key = normalizedEdgeKey(edge)
    if (seen.has(key)) return { valid: false, code: 'duplicate-wire', message: '两接线柱之间已有导线' }
    seen.add(key)
    if (key === 'battery+::battery-') return { valid: false, code: 'battery-short', message: '电源两极不能用导线直接相连' }
  }
  return { valid: true, message: '连接安全' }
}

export function validateSeriesCircuit(graph: CircuitGraph): CircuitValidation {
  return validateExactTopology(graph, seriesWireKeys, '串联电路连接正确')
}

export function validateParallelCircuit(graph: CircuitGraph): CircuitValidation {
  return validateExactTopology(graph, parallelWireKeys, '并联电路连接正确')
}

export function createSeriesParallelState(): CircuitLabState {
  return {
    mode: 'series',
    edges: freezeEdges([]),
    switchClosed: false,
    activeTrialId: null,
    trials: Object.freeze([]),
  }
}

function reduceConnect(state: CircuitLabState, payload: unknown): LabTransition<CircuitLabState> {
  if (state.switchClosed) return transition(state, rejected('开关闭合时不能改接导线，请先断开开关'))
  if (typeof payload !== 'object' || payload === null) return transition(state, rejected('导线连接无效'))
  const edge = payload as Partial<CircuitEdge>
  if (!isTerminalId(edge.from) || !isTerminalId(edge.to)) return transition(state, rejected('导线只能连接到器材接线柱'))
  const nextEdges = [...state.edges, { from: edge.from, to: edge.to }]
  const safety = validateCircuitSafety(circuitFromEdges(nextEdges))
  if (!safety.valid) return transition(state, rejected(safety.message))
  return transition(stateWith(state, { edges: nextEdges, activeTrialId: null }), accepted('导线已连接'))
}

function reduceSetMode(state: CircuitLabState, payload: unknown): LabTransition<CircuitLabState> {
  if (payload !== 'series' && payload !== 'parallel') return transition(state, rejected('请选择串联或并联电路'))
  if (state.switchClosed) return transition(state, rejected('开关闭合时不能切换电路类型'))
  if (payload === state.mode && state.edges.length === 0) return transition(state, accepted('当前已是该电路类型'))
  return transition(stateWith(state, { mode: payload, edges: [], activeTrialId: null }), accepted(`已切换到${payload === 'series' ? '串联' : '并联'}电路，当前接线已清空`))
}

function reduceSetSwitch(state: CircuitLabState, payload: unknown): LabTransition<CircuitLabState> {
  if (payload !== 'open' && payload !== 'closed') return transition(state, rejected('开关状态无效'))
  if (payload === 'open') {
    if (!state.switchClosed) return transition(state, rejected('开关已经断开'))
    return transition(stateWith(state, { switchClosed: false }), accepted('开关已断开，可以调整导线'))
  }
  if (state.switchClosed) return transition(state, rejected('开关已经闭合'))
  const graph = circuitFromEdges(state.edges)
  const safety = validateCircuitSafety(graph)
  if (!safety.valid) return transition(state, rejected(safety.message))
  const topology = state.mode === 'series' ? validateSeriesCircuit(graph) : validateParallelCircuit(graph)
  if (!topology.valid) return transition(state, rejected(topology.message))
  const trial: CircuitTrial = Object.freeze({
    id: `series-parallel-trial-${state.trials.length + 1}`,
    mode: state.mode,
    voltage: 3,
    wireCount: state.edges.length,
    lamp1Lit: true,
    lamp2Lit: true,
    edges: freezeEdges(state.edges),
  })
  return transition(
    stateWith(state, { switchClosed: true, activeTrialId: trial.id, trials: [...state.trials, trial] }),
    accepted(`${topology.message}，两只灯泡已点亮`),
  )
}

function reduceResetTrial(state: CircuitLabState): LabTransition<CircuitLabState> {
  if (state.switchClosed) return transition(state, rejected('请先断开开关再重置接线'))
  return transition(stateWith(state, { edges: [], activeTrialId: null }), accepted('当前接线已重置，历史试验仍保留'))
}

function deriveMeasurements(state: CircuitLabState): readonly DerivedMeasurement[] {
  const trial = activeTrial(state)
  if (!trial) return []
  return [
    { trialId: trial.id, key: 'circuitMode', label: '电路类型', value: trial.mode === 'series' ? '串联' : '并联', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'switchState', label: '开关状态', value: state.switchClosed ? '闭合' : '断开', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'lamp1State', label: '灯泡 1', value: trial.lamp1Lit ? '发光' : '熄灭', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'lamp2State', label: '灯泡 2', value: trial.lamp2Lit ? '发光' : '熄灭', unit: '', kind: 'observation' },
  ]
}

function conditions(state: CircuitLabState): readonly PhysicsExperimentalCondition[] {
  const trial = activeTrial(state)
  return [
    { label: '电路类型', value: (trial?.mode ?? state.mode) === 'series' ? '串联' : '并联' },
    { label: '电源电压', value: trial?.voltage ?? 3 },
    { label: '开关状态', value: state.switchClosed ? '闭合' : '断开' },
    { label: '导线数量', value: trial?.wireCount ?? state.edges.length },
  ]
}

export const seriesParallelController: LabController<CircuitLabState> & {
  conditions(state: CircuitLabState): readonly PhysicsExperimentalCondition[]
} = {
  createInitialState: createSeriesParallelState,
  reduce: (state, action) => {
    switch (action.type) {
      case 'connect': return reduceConnect(state, action.payload)
      case 'setMode': return reduceSetMode(state, action.payload)
      case 'setSwitch': return reduceSetSwitch(state, action.payload)
      case 'resetTrial': return reduceResetTrial(state)
      case 'dragStart': return transition(state, accepted('请将导线另一端拖到接线柱'))
      case 'dragCancel': return transition(state, accepted('已取消本次导线连接'))
      default: return transition(state, rejected('不支持的电路操作'))
    }
  },
  deriveMeasurements,
  conditions,
  completion: (state) => {
    const modes = new Set(state.trials.map((trial) => trial.mode))
    return modes.has('series') && modes.has('parallel')
      ? { complete: true, message: '已完成串联和并联电路的正确连接与通电试验' }
      : { complete: false, message: '请分别正确连接并闭合串联和并联电路的开关' }
  },
}
