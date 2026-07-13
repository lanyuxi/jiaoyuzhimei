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
const terminalList = Object.keys(CIRCUIT_TERMINALS) as CircuitTerminalId[]
const terminalIds = new Set<string>(terminalList)
const switchContinuity = COMPONENT_INTERNAL_CONNECTIONS.find(([from]) => from.startsWith('switch'))!
const lampContinuities = COMPONENT_INTERNAL_CONNECTIONS.filter(([from]) => from.startsWith('lamp'))

interface IndexedCircuitEdge {
  readonly from: CircuitTerminalId
  readonly to: CircuitTerminalId
  readonly index: number
  readonly kind: 'wire' | 'switch' | 'lamp'
}

type CircuitAdjacency = ReadonlyMap<CircuitTerminalId, readonly IndexedCircuitEdge[]>

function freezeEdges(edges: readonly CircuitEdge[]): readonly CircuitEdge[] {
  return Object.freeze(edges.map((edge) => Object.freeze({ from: edge.from, to: edge.to })))
}

function isTerminalId(value: unknown): value is CircuitTerminalId {
  return typeof value === 'string' && terminalIds.has(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCircuitMode(value: unknown): value is CircuitMode {
  return value === 'series' || value === 'parallel'
}

function isCircuitEdge(value: unknown): value is CircuitEdge {
  return isRecord(value) && isTerminalId(value.from) && isTerminalId(value.to) && value.from !== value.to
}

function isCircuitTrial(value: unknown): value is CircuitTrial {
  return isRecord(value)
    && typeof value.id === 'string'
    && isCircuitMode(value.mode)
    && typeof value.voltage === 'number'
    && Number.isFinite(value.voltage)
    && value.voltage > 0
    && typeof value.wireCount === 'number'
    && Number.isInteger(value.wireCount)
    && value.wireCount >= 0
    && typeof value.lamp1Lit === 'boolean'
    && typeof value.lamp2Lit === 'boolean'
    && Array.isArray(value.edges)
    && value.edges.every(isCircuitEdge)
    && value.edges.length === value.wireCount
}

function isCircuitSnapshot(value: unknown): value is CircuitLabState {
  if (!isRecord(value)
    || !isCircuitMode(value.mode)
    || !Array.isArray(value.edges)
    || !value.edges.every(isCircuitEdge)
    || typeof value.switchClosed !== 'boolean'
    || (value.activeTrialId !== null && typeof value.activeTrialId !== 'string')
    || !Array.isArray(value.trials)
    || !value.trials.every(isCircuitTrial)) return false

  const trialIds = value.trials.map((trial) => trial.id)
  const currentGraph = circuitFromEdges(value.edges)
  const currentTopology = value.mode === 'series'
    ? validateSeriesCircuit(currentGraph)
    : validateParallelCircuit(currentGraph)
  const trialsValid = value.trials.every((trial) => {
    const graph = circuitFromEdges(trial.edges)
    return trial.mode === 'series' ? validateSeriesCircuit(graph).valid : validateParallelCircuit(graph).valid
  })
  return new Set(trialIds).size === trialIds.length
    && (value.activeTrialId === null || trialIds.includes(value.activeTrialId))
    && validateCircuitSafety(currentGraph, false).valid
    && (!value.switchClosed || (value.activeTrialId !== null && currentTopology.valid))
    && trialsValid
}

function snapshot(state: CircuitLabState) {
  return {
    mode: state.mode,
    edges: state.edges.map((edge) => ({ ...edge })),
    switchClosed: state.switchClosed,
    activeTrialId: state.activeTrialId,
    trials: state.trials.map((trial) => ({
      ...trial,
      edges: trial.edges.map((edge) => ({ ...edge })),
    })),
  }
}

function restore(snapshotValue: unknown): CircuitLabState {
  if (!isCircuitSnapshot(snapshotValue)) return createSeriesParallelState()
  return {
    mode: snapshotValue.mode,
    edges: freezeEdges(snapshotValue.edges),
    switchClosed: snapshotValue.switchClosed,
    activeTrialId: snapshotValue.activeTrialId,
    trials: Object.freeze(snapshotValue.trials.map((trial) => Object.freeze({
      ...trial,
      edges: freezeEdges(trial.edges),
    }))),
  }
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

function topologyError(): CircuitValidation {
  return { valid: false, code: 'unexpected-topology', message: '导线连接与该电路图不一致，请检查每个元件端点' }
}

function componentEdges(includeSwitch: boolean): readonly CircuitEdge[] {
  return [
    ...lampContinuities.map(([from, to]) => ({ from, to })),
    ...(includeSwitch ? [{ from: switchContinuity[0], to: switchContinuity[1] }] : []),
  ]
}

function indexedEdges(graph: CircuitGraph, includeSwitch: boolean): readonly IndexedCircuitEdge[] {
  const wires = graph.edges.map((edge) => ({ ...edge, kind: 'wire' as const }))
  const lamps = lampContinuities.map(([from, to]) => ({ from, to, kind: 'lamp' as const }))
  const switchEdge = includeSwitch ? [{ from: switchContinuity[0], to: switchContinuity[1], kind: 'switch' as const }] : []
  return [...wires, ...lamps, ...switchEdge].map((edge, index) => ({
    ...edge,
    from: edge.from as CircuitTerminalId,
    to: edge.to as CircuitTerminalId,
    index,
  }))
}

function buildAdjacency(edges: readonly IndexedCircuitEdge[]): CircuitAdjacency {
  const adjacency = new Map<CircuitTerminalId, IndexedCircuitEdge[]>(terminalList.map((id) => [id, []]))
  for (const edge of edges) {
    adjacency.get(edge.from)!.push(edge)
    adjacency.get(edge.to)!.push(edge)
  }
  return adjacency
}

function opposite(edge: IndexedCircuitEdge, terminal: CircuitTerminalId): CircuitTerminalId {
  return edge.from === terminal ? edge.to : edge.from
}

function reachable(adjacency: CircuitAdjacency, start: CircuitTerminalId, skippedEdge?: number): ReadonlySet<CircuitTerminalId> {
  const visited = new Set<CircuitTerminalId>([start])
  const pending = [start]
  while (pending.length > 0) {
    const terminal = pending.pop()!
    for (const edge of adjacency.get(terminal)!) {
      if (edge.index === skippedEdge) continue
      const next = opposite(edge, terminal)
      if (!visited.has(next)) {
        visited.add(next)
        pending.push(next)
      }
    }
  }
  return visited
}

function bridgeIndexes(adjacency: CircuitAdjacency): ReadonlySet<number> {
  const discovery = new Map<CircuitTerminalId, number>()
  const low = new Map<CircuitTerminalId, number>()
  const bridges = new Set<number>()
  let time = 0

  const visit = (terminal: CircuitTerminalId, parent?: number) => {
    time += 1
    discovery.set(terminal, time)
    low.set(terminal, time)
    for (const edge of adjacency.get(terminal)!) {
      if (edge.index === parent) continue
      const next = opposite(edge, terminal)
      if (!discovery.has(next)) {
        visit(next, edge.index)
        low.set(terminal, Math.min(low.get(terminal)!, low.get(next)!))
        if (low.get(next)! > discovery.get(terminal)!) bridges.add(edge.index)
      } else {
        low.set(terminal, Math.min(low.get(terminal)!, discovery.get(next)!))
      }
    }
  }

  for (const terminal of terminalList) {
    if (!discovery.has(terminal)) visit(terminal)
  }
  return bridges
}

function simplePaths(adjacency: CircuitAdjacency, start: CircuitTerminalId, end: CircuitTerminalId, allowed: ReadonlySet<CircuitTerminalId>): readonly (readonly IndexedCircuitEdge[])[] {
  const paths: IndexedCircuitEdge[][] = []
  const visit = (terminal: CircuitTerminalId, visited: ReadonlySet<CircuitTerminalId>, path: readonly IndexedCircuitEdge[]) => {
    if (paths.length > 2) return
    if (terminal === end) {
      paths.push([...path])
      return
    }
    for (const edge of adjacency.get(terminal)!.slice().sort((left, right) => left.index - right.index)) {
      const next = opposite(edge, terminal)
      if (allowed.has(next) && !visited.has(next)) {
        visit(next, new Set([...visited, next]), [...path, edge])
      }
    }
  }
  visit(start, new Set([start]), [])
  return paths
}

function terminalsOnPath(start: CircuitTerminalId, path: readonly IndexedCircuitEdge[]): ReadonlySet<CircuitTerminalId> {
  const terminals = new Set<CircuitTerminalId>([start])
  let current = start
  for (const edge of path) {
    current = opposite(edge, current)
    terminals.add(current)
  }
  return terminals
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

export function circuitWithInternalContinuity(graph: CircuitGraph, switchClosed = true): CircuitGraph {
  return circuitFromEdges([
    ...graph.edges,
    ...componentEdges(switchClosed),
  ])
}

export function validateCircuitSafety(graph: CircuitGraph, switchClosed = true): CircuitValidation {
  const seen = new Set<string>()
  for (const edge of graph.edges) {
    if (!isTerminalId(edge.from) || !isTerminalId(edge.to)) {
      return { valid: false, code: 'invalid-terminal', message: '导线只能连接到器材接线柱' }
    }
    if (edge.from === edge.to) return { valid: false, code: 'self-link', message: '同一接线柱不能连接到自身' }
    const key = normalizedEdgeKey(edge)
    if (seen.has(key)) return { valid: false, code: 'duplicate-wire', message: '两接线柱之间已有导线' }
    seen.add(key)
  }
  const conductiveEdges = indexedEdges(graph, switchClosed).filter((edge) => edge.kind !== 'lamp')
  if (reachable(buildAdjacency(conductiveEdges), 'battery+').has('battery-')) {
    return { valid: false, code: 'battery-short', message: '电源两极不能用导线直接相连' }
  }
  return { valid: true, message: '连接安全' }
}

export function validateSeriesCircuit(graph: CircuitGraph): CircuitValidation {
  const safe = validateCircuitSafety(graph)
  if (!safe.valid) return safe
  const edges = indexedEdges(graph, true)
  const adjacency = buildAdjacency(edges)
  if (reachable(adjacency, 'battery+').size !== terminalList.length) return topologyError()
  if (adjacency.get('battery+')!.length !== 1 || adjacency.get('battery-')!.length !== 1) return topologyError()
  if (terminalList.filter((terminal) => !terminal.startsWith('battery')).some((terminal) => adjacency.get(terminal)!.length !== 2)) return topologyError()
  return { valid: true, message: '串联电路连接正确' }
}

export function validateParallelCircuit(graph: CircuitGraph): CircuitValidation {
  const safe = validateCircuitSafety(graph)
  if (!safe.valid) return safe
  const edges = indexedEdges(graph, true)
  const adjacency = buildAdjacency(edges)
  if (edges.length !== terminalList.length || reachable(adjacency, 'battery+').size !== terminalList.length) return topologyError()

  const switchEdge = edges.find((edge) => edge.kind === 'switch')!
  if (!bridgeIndexes(adjacency).has(switchEdge.index)) return topologyError()

  const firstComponent = reachable(adjacency, switchEdge.from, switchEdge.index)
  const secondComponent = reachable(adjacency, switchEdge.to, switchEdge.index)
  const lampTerminals = new Set<CircuitTerminalId>(lampContinuities.flat())
  const components = [firstComponent, secondComponent]
  const isolated = components.find((component) => {
    const batteryCount = ['battery+', 'battery-'].filter((terminal) => component.has(terminal as CircuitTerminalId)).length
    return batteryCount === 1 && ![...lampTerminals].some((terminal) => component.has(terminal))
  })
  const network = components.find((component) => component !== isolated)
  if (!isolated || !network || ![...lampTerminals].every((terminal) => network.has(terminal))) return topologyError()

  const networkSwitchTerminal = network.has(switchEdge.from) ? switchEdge.from : switchEdge.to
  const networkBatteryTerminal = network.has('battery+') ? 'battery+' : network.has('battery-') ? 'battery-' : null
  if (!networkBatteryTerminal) return topologyError()

  const paths = simplePaths(adjacency, networkSwitchTerminal, networkBatteryTerminal, network)
  if (paths.length !== 2) return topologyError()
  const pathEdges = new Set(paths.flat().map((edge) => edge.index))
  const networkEdges = edges.filter((edge) => edge.index !== switchEdge.index && network.has(edge.from) && network.has(edge.to))
  if (networkEdges.some((edge) => !pathEdges.has(edge.index))) return topologyError()
  if (paths.some((path) => path.filter((edge) => edge.kind === 'lamp').length !== 1)) return topologyError()

  const sharedTerminals = new Set<CircuitTerminalId>()
  const firstPathTerminals = terminalsOnPath(networkSwitchTerminal, paths[0]!)
  const secondPathTerminals = terminalsOnPath(networkSwitchTerminal, paths[1]!)
  for (const terminal of firstPathTerminals) if (secondPathTerminals.has(terminal)) sharedTerminals.add(terminal)
  if (sharedTerminals.size !== 2 || !sharedTerminals.has(networkSwitchTerminal) || !sharedTerminals.has(networkBatteryTerminal)) return topologyError()

  return { valid: true, message: '并联电路连接正确' }
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
  const safety = validateCircuitSafety(circuitFromEdges(nextEdges), false)
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
    { trialId: trial.id, key: 'lamp1State', label: '灯泡 1', value: state.switchClosed ? '发光' : '熄灭', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'lamp2State', label: '灯泡 2', value: state.switchClosed ? '发光' : '熄灭', unit: '', kind: 'observation' },
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

function measurementsForTrial(trial: CircuitTrial): readonly DerivedMeasurement[] {
  return [
    { trialId: trial.id, key: 'circuitMode', label: '电路类型', value: trial.mode === 'series' ? '串联' : '并联', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'switchState', label: '开关状态', value: '闭合', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'lamp1State', label: '灯泡 1', value: trial.lamp1Lit ? '发光' : '熄灭', unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'lamp2State', label: '灯泡 2', value: trial.lamp2Lit ? '发光' : '熄灭', unit: '', kind: 'observation' },
  ]
}

function conditionsForTrial(trial: CircuitTrial): readonly PhysicsExperimentalCondition[] {
  return [
    { label: '电路类型', value: trial.mode === 'series' ? '串联' : '并联' },
    { label: '电源电压', value: trial.voltage },
    { label: '开关状态', value: '闭合' },
    { label: '导线数量', value: trial.wireCount },
  ]
}

function measurementGroups(state: CircuitLabState) {
  return state.trials.map((trial) => ({
    conditions: conditionsForTrial(trial),
    measurements: measurementsForTrial(trial),
  }))
}

function report(state: CircuitLabState) {
  return {
    calculationResults: state.trials.map((trial, index) => (
      `试次 ${index + 1}：${trial.mode === 'series' ? '串联' : '并联'}拓扑校验通过，${trial.wireCount} 条导线连接后闭合开关，两只灯泡均发光。`
    )),
    conclusion: state.trials.length === 0
      ? []
      : ['串联电路只有一条电流路径，并联电路具有相互独立的支路；正确连接时两只灯泡都能发光。'],
    errorAnalysis: [
      '接线柱接触不良或导线松动会形成断路，使灯泡不能正常发光。',
      '闭合开关时改接导线可能造成短路，因此必须先断开电源。',
      '灯泡规格差异会改变亮度，不能仅凭亮度判断串联或并联拓扑。',
    ],
  }
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
      case 'dragStart': return state.switchClosed
        ? transition(state, rejected('开关闭合时不能开始连接导线，请先断开开关'))
        : transition(state, accepted('请将导线另一端拖到接线柱'))
      case 'dragCancel': return transition(state, accepted('已取消本次导线连接'))
      default: return transition(state, rejected('不支持的电路操作'))
    }
  },
  deriveMeasurements,
  snapshot,
  restore,
  measurementGroups,
  report,
  conditions,
  completion: (state) => {
    const modes = new Set(state.trials.map((trial) => trial.mode))
    return modes.has('series') && modes.has('parallel')
      ? { complete: true, message: '已完成串联和并联电路的正确连接与通电试验' }
      : { complete: false, message: '请分别正确连接并闭合串联和并联电路的开关' }
  },
}
