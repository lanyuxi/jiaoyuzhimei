import type { PhysicsExperimentalCondition } from '../../sessions/types'
import type { DerivedMeasurement, LabController, LabFeedback, LabTransition } from '../../runtime/types'
import {
  AMMETER_INTERNAL_CONNECTIONS,
  AMMETER_POSITIVE_TERMINALS,
  AMMETER_RESISTANCE,
  CIRCUIT_TERMINALS,
  COMPONENT_INTERNAL_CONNECTIONS,
  LAMP_RESISTANCE,
  RANGE_SPEC,
  SUPPLY_VOLTAGE,
  TERMINAL_IDS,
  ammeterRangeForTerminal,
  ammeterTerminalForRange,
  isAmmeterTerminal,
  roundToDivision,
  type AmmeterMode,
  type AmmeterPosition,
  type AmmeterRangeId,
  type AmmeterTerminalId,
} from './definition'

export type { AmmeterMode, AmmeterRangeId, AmmeterPosition }

export interface CircuitEdge {
  from: AmmeterTerminalId
  to: AmmeterTerminalId
}

export interface CircuitGraph {
  readonly edges: readonly CircuitEdge[]
}

export type CircuitValidation =
  | { valid: true; message: string }
  | {
    valid: false
    code:
      | 'invalid-terminal'
      | 'self-link'
      | 'duplicate-wire'
      | 'wire-through-ammeter'
      | 'ammeter-both-ranges'
      | 'battery-short'
      | 'ammeter-short'
      | 'ammeter-not-series'
      | 'ammeter-not-in-main'
      | 'unexpected-topology'
    message: string
  }

export interface AmmeterTrial {
  readonly id: string
  readonly mode: AmmeterMode
  readonly position: AmmeterPosition
  readonly range: AmmeterRangeId
  readonly reading: number
  readonly overRange: boolean
  readonly supplyVoltage: number
  readonly lampResistance: number
  readonly wireCount: number
  readonly edges: readonly CircuitEdge[]
}

export interface AmmeterLabState {
  mode: AmmeterMode
  position: AmmeterPosition
  edges: readonly CircuitEdge[]
  activeRange: AmmeterRangeId | null
  switchClosed: boolean
  activeTrialId: string | null
  trials: readonly AmmeterTrial[]
  /** 是否已经用 3A 大量程试触过（教材要求先试触再精读） */
  hasTestedWithLargeRange: boolean
  /** 过载提示：指针打到最右端时保留提示文本 */
  overRangeWarning: string | null
}

interface CircuitAnalysis {
  readonly range: AmmeterRangeId
  readonly position: AmmeterPosition
  readonly reading: number
  readonly overRange: boolean
}

interface IndexedCircuitEdge {
  readonly from: AmmeterTerminalId
  readonly to: AmmeterTerminalId
  readonly index: number
  readonly kind: 'wire' | 'switch' | 'lamp' | 'ammeter'
}

type CircuitAdjacency = ReadonlyMap<AmmeterTerminalId, readonly IndexedCircuitEdge[]>

const accepted = (message: string): LabFeedback => ({ outcome: 'accepted', message })
const rejected = (message: string): LabFeedback => ({ outcome: 'rejected', message })

const terminalList = [...TERMINAL_IDS]
const terminalIds = new Set<string>(terminalList)
const switchContinuity = COMPONENT_INTERNAL_CONNECTIONS.find(([from]) => from.startsWith('switch'))!
const lampContinuities = COMPONENT_INTERNAL_CONNECTIONS.filter(([from]) => from.startsWith('lamp'))

function freezeEdges(edges: readonly CircuitEdge[]): readonly CircuitEdge[] {
  return Object.freeze(edges.map((edge) => Object.freeze({ from: edge.from, to: edge.to })))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTerminalId(value: unknown): value is AmmeterTerminalId {
  return typeof value === 'string' && terminalIds.has(value)
}

function isAmmeterMode(value: unknown): value is AmmeterMode {
  return value === 'series' || value === 'parallel'
}

function isAmmeterPosition(value: unknown): value is AmmeterPosition {
  return value === 'main' || value === 'branch'
}

function isRangeId(value: unknown): value is AmmeterRangeId {
  return value === '0.6A' || value === '3A'
}

function isCircuitEdge(value: unknown): value is CircuitEdge {
  return isRecord(value) && isTerminalId(value.from) && isTerminalId(value.to) && value.from !== value.to
}

function isAmmeterTrial(value: unknown): value is AmmeterTrial {
  return isRecord(value)
    && typeof value.id === 'string'
    && isAmmeterMode(value.mode)
    && isAmmeterPosition(value.position)
    && isRangeId(value.range)
    && typeof value.reading === 'number'
    && Number.isFinite(value.reading)
    && typeof value.overRange === 'boolean'
    && typeof value.supplyVoltage === 'number'
    && typeof value.lampResistance === 'number'
    && typeof value.wireCount === 'number'
    && Number.isInteger(value.wireCount)
    && value.wireCount >= 0
    && Array.isArray(value.edges)
    && value.edges.every(isCircuitEdge)
    && value.edges.length === value.wireCount
}

function isAmmeterSnapshot(value: unknown): value is AmmeterLabState {
  if (!isRecord(value)
    || !isAmmeterMode(value.mode)
    || !isAmmeterPosition(value.position)
    || !Array.isArray(value.edges)
    || !value.edges.every(isCircuitEdge)
    || (value.activeRange !== null && !isRangeId(value.activeRange))
    || typeof value.switchClosed !== 'boolean'
    || (value.activeTrialId !== null && typeof value.activeTrialId !== 'string')
    || !Array.isArray(value.trials)
    || !value.trials.every(isAmmeterTrial)
    || typeof value.hasTestedWithLargeRange !== 'boolean'
    || (value.overRangeWarning !== null && typeof value.overRangeWarning !== 'string')) return false

  const trialIds = value.trials.map((trial) => trial.id)
  const currentGraph = circuitFromEdges(value.edges)
  const trialsValid = value.trials.every((trial) => (
    trial.mode === 'series'
      ? validateSeriesCircuit(circuitFromEdges(trial.edges), trial.position).valid
      : validateParallelCircuit(circuitFromEdges(trial.edges), trial.position).valid
  ))
  return new Set(trialIds).size === trialIds.length
    && (value.activeTrialId === null || trialIds.includes(value.activeTrialId))
    && validateCircuitSafety(currentGraph, false, value.activeRange).valid
    && (!value.switchClosed || analyzeCurrentState({
      ...createAmmeterState(),
      mode: value.mode,
      position: value.position,
      edges: freezeEdges(value.edges),
      activeRange: value.activeRange,
    }) !== null)
    && trialsValid
}

function snapshot(state: AmmeterLabState) {
  return {
    mode: state.mode,
    position: state.position,
    edges: state.edges.map((edge) => ({ ...edge })),
    activeRange: state.activeRange,
    switchClosed: state.switchClosed,
    activeTrialId: state.activeTrialId,
    trials: state.trials.map((trial) => ({ ...trial, edges: trial.edges.map((edge) => ({ ...edge })) })),
    hasTestedWithLargeRange: state.hasTestedWithLargeRange,
    overRangeWarning: state.overRangeWarning,
  }
}

function restore(snapshotValue: unknown): AmmeterLabState {
  if (!isAmmeterSnapshot(snapshotValue)) return createAmmeterState()
  return {
    mode: snapshotValue.mode,
    position: snapshotValue.position,
    edges: freezeEdges(snapshotValue.edges),
    activeRange: snapshotValue.activeRange,
    switchClosed: snapshotValue.switchClosed,
    activeTrialId: snapshotValue.activeTrialId,
    trials: Object.freeze(snapshotValue.trials.map((trial) => Object.freeze({ ...trial, edges: freezeEdges(trial.edges) }))),
    hasTestedWithLargeRange: snapshotValue.hasTestedWithLargeRange,
    overRangeWarning: snapshotValue.overRangeWarning,
  }
}

function transition(state: AmmeterLabState, feedback: LabFeedback): LabTransition<AmmeterLabState> {
  return { state, feedback }
}

function stateWith(state: AmmeterLabState, patch: Partial<AmmeterLabState>): AmmeterLabState {
  return {
    ...state,
    ...patch,
    edges: freezeEdges(patch.edges ?? state.edges),
    trials: patch.trials ? Object.freeze([...patch.trials]) : Object.freeze([...state.trials]),
  }
}

function topologyError(): CircuitValidation {
  return { valid: false, code: 'unexpected-topology', message: '导线连接与该电路的接线方式不一致，请检查每个元件的接线柱' }
}

export function normalizedEdgeKey(edge: CircuitEdge): string {
  return [edge.from, edge.to].sort().join('::')
}

export function circuitFromEdges(edges: readonly CircuitEdge[]): CircuitGraph {
  return { edges: freezeEdges(edges) }
}

function indexedEdges(graph: CircuitGraph, includeSwitch: boolean, activeRange: AmmeterRangeId | null): readonly IndexedCircuitEdge[] {
  const wires = graph.edges.map((edge) => ({ ...edge, kind: 'wire' as const }))
  const lamps = lampContinuities.map(([from, to]) => ({ from, to, kind: 'lamp' as const }))
  const switchEdge = includeSwitch ? [{ from: switchContinuity[0], to: switchContinuity[1], kind: 'switch' as const }] : []
  const meterEdges = activeRange === null
    ? []
    : [{ from: AMMETER_INTERNAL_CONNECTIONS[activeRange][0], to: AMMETER_INTERNAL_CONNECTIONS[activeRange][1], kind: 'ammeter' as const }]
  return [...wires, ...lamps, ...switchEdge, ...meterEdges].map((edge, index) => ({
    ...edge,
    from: edge.from as AmmeterTerminalId,
    to: edge.to as AmmeterTerminalId,
    index,
  }))
}

function buildAdjacency(edges: readonly IndexedCircuitEdge[]): CircuitAdjacency {
  const adjacency = new Map<AmmeterTerminalId, IndexedCircuitEdge[]>(terminalList.map((id) => [id, []]))
  for (const edge of edges) {
    adjacency.get(edge.from)!.push(edge)
    adjacency.get(edge.to)!.push(edge)
  }
  return adjacency
}

function opposite(edge: IndexedCircuitEdge, terminal: AmmeterTerminalId): AmmeterTerminalId {
  return edge.from === terminal ? edge.to : edge.from
}

function reachable(adjacency: CircuitAdjacency, start: AmmeterTerminalId, skippedEdge?: number): ReadonlySet<AmmeterTerminalId> {
  const visited = new Set<AmmeterTerminalId>([start])
  const pending: AmmeterTerminalId[] = [start]
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

function simplePaths(
  adjacency: CircuitAdjacency,
  start: AmmeterTerminalId,
  end: AmmeterTerminalId,
  allowed: ReadonlySet<AmmeterTerminalId>,
): readonly (readonly IndexedCircuitEdge[])[] {
  const paths: IndexedCircuitEdge[][] = []
  const visit = (terminal: AmmeterTerminalId, visited: ReadonlySet<AmmeterTerminalId>, path: readonly IndexedCircuitEdge[]) => {
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

/** 当前接入的电流表正接线柱（未接入量程时为 null；同时接入两个量程时也为 null） */
export function usedRangeTerminal(graph: CircuitGraph): AmmeterTerminalId | null {
  const used = AMMETER_POSITIVE_TERMINALS.filter((terminal) => graph.edges.some((edge) => edge.from === terminal || edge.to === terminal))
  return used.length === 1 ? used[0]! : null
}

export function usedRange(graph: CircuitGraph): AmmeterRangeId | null {
  const terminal = usedRangeTerminal(graph)
  return terminal === null ? null : ammeterRangeForTerminal(terminal)
}

function ammeterPositiveTerminalsUsed(graph: CircuitGraph): readonly AmmeterTerminalId[] {
  return AMMETER_POSITIVE_TERMINALS.filter((terminal) => graph.edges.some((edge) => edge.from === terminal || edge.to === terminal))
}

/**
 * 安全校验：与教材要求一致 —— 电流表必须串联接入、只能接一个量程接线柱、
 * 两个接线柱之间不得用导线直接相连、不得直接跨接在电源两极上、电源两极不得直接短接。
 */
export function validateCircuitSafety(
  graph: CircuitGraph,
  switchClosed = true,
  activeRange: AmmeterRangeId | null = usedRange(graph),
): CircuitValidation {
  const seen = new Set<string>()
  for (const edge of graph.edges) {
    if (!isTerminalId(edge.from) || !isTerminalId(edge.to)) {
      return { valid: false, code: 'invalid-terminal', message: '导线只能连接到器材接线柱' }
    }
    if (edge.from === edge.to) return { valid: false, code: 'self-link', message: '同一接线柱不能连接到自身' }
    const key = normalizedEdgeKey(edge)
    if (seen.has(key)) return { valid: false, code: 'duplicate-wire', message: '两接线柱之间已有一根导线' }
    seen.add(key)
    if (isAmmeterTerminal(edge.from) && isAmmeterTerminal(edge.to)) {
      return { valid: false, code: 'wire-through-ammeter', message: '电流表的两个接线柱之间不能用导线直接连接' }
    }
  }

  if (ammeterPositiveTerminalsUsed(graph).length > 1) {
    return { valid: false, code: 'ammeter-both-ranges', message: '电流表只能接入一个量程接线柱（0.6A 或 3A）' }
  }

  const hasMeterWire = graph.edges.some((edge) => isAmmeterTerminal(edge.from) || isAmmeterTerminal(edge.to))

  // 电流表（含其内部量程通路）直接跨接在电源两极上，回路中没有灯泡等负载
  if (hasMeterWire && activeRange !== null) {
    const meterOnlyEdges: IndexedCircuitEdge[] = [
      ...graph.edges
        .filter((edge) => isAmmeterTerminal(edge.from) || isAmmeterTerminal(edge.to))
        .map((edge, index) => ({ ...edge, index, kind: 'wire' as const })),
      { from: AMMETER_INTERNAL_CONNECTIONS[activeRange][0], to: AMMETER_INTERNAL_CONNECTIONS[activeRange][1], index: 10_000, kind: 'ammeter' as const },
    ]
    if (reachable(buildAdjacency(meterOnlyEdges), 'battery+').has('battery-')) {
      return { valid: false, code: 'ammeter-short', message: '电流表不能直接接在电源两极上，会烧坏电流表' }
    }
  }

  // 电源短路：把灯泡视为负载，纯导线/开关把两极接通即为短路
  const conductiveEdges = indexedEdges(graph, switchClosed, activeRange).filter((edge) => edge.kind !== 'lamp')
  if (reachable(buildAdjacency(conductiveEdges), 'battery+').has('battery-')) {
    return { valid: false, code: 'battery-short', message: '电源两极不能用导线直接相连，会烧坏电源' }
  }

  if (hasMeterWire && activeRange === null && switchClosed) {
    return { valid: false, code: 'ammeter-not-series', message: '电流表尚未接入量程接线柱，无法形成测量回路' }
  }

  return { valid: true, message: '连接安全' }
}

function currentFromSupply(equivalentResistance: number): number {
  return SUPPLY_VOLTAGE / (equivalentResistance + AMMETER_RESISTANCE)
}

/**
 * 电流方向判定：电流必须从电流表的 “+” 接线柱流入。
 * 把电流表内部视为开路，看 “+” 接线柱接到的是电源正极还是负极。
 */
function currentFlowsIntoPositiveTerminal(graph: CircuitGraph, range: AmmeterRangeId): boolean {
  const terminal = ammeterTerminalForRange(range)
  const positiveWires = graph.edges.filter((edge) => edge.from === terminal || edge.to === terminal)
  if (positiveWires.length === 0) return false

  const railTerminal = positiveWires[0]!.from === terminal ? positiveWires[0]!.to : positiveWires[0]!.from
  const passiveEdges: IndexedCircuitEdge[] = [
    ...graph.edges.map((edge, index) => ({ ...edge, index, kind: 'wire' as const })),
    ...lampContinuities.map(([from, to], offset) => ({ from, to, index: 1000 + offset, kind: 'lamp' as const })),
  ]
  const adjacency = buildAdjacency(passiveEdges)
  return reachable(adjacency, 'battery+').has(railTerminal) && !reachable(adjacency, 'battery-').has(railTerminal)
}

function analysisFromCurrent(reading: number, range: AmmeterRangeId, position: AmmeterPosition): CircuitAnalysis {
  return { range, position, reading, overRange: reading > RANGE_SPEC[range].max }
}

/** 串联电路：两灯与电流表串成一条路径 */
export function analyzeSeries(graph: CircuitGraph): CircuitAnalysis | null {
  const range = usedRange(graph)
  if (range === null) return null
  if (!currentFlowsIntoPositiveTerminal(graph, range)) return null
  const adjacency = buildAdjacency(indexedEdges(graph, true, range))
  if (!reachable(adjacency, 'battery+').has('battery-')) return null

  const paths = simplePaths(adjacency, 'battery+', 'battery-', new Set(terminalList))
  if (paths.length !== 1) return null
  const path = paths[0]!
  if (path.filter((edge) => edge.kind === 'lamp').length !== 2) return null
  if (path.filter((edge) => edge.kind === 'ammeter').length !== 1) return null
  if (path.filter((edge) => edge.kind === 'switch').length !== 1) return null

  return analysisFromCurrent(currentFromSupply(LAMP_RESISTANCE * 2), range, 'main')
}

function ammeterEdgeOnPath(path: readonly IndexedCircuitEdge[]): boolean {
  return path.some((edge) => edge.kind === 'ammeter')
}

/** 并联电路：两灯并联，电流表接在干路（测总电流）或支路（测支路电流） */
export function analyzeParallel(graph: CircuitGraph, requested: AmmeterPosition = 'main'): CircuitAnalysis | null {
  const range = usedRange(graph)
  if (range === null) return null
  if (!currentFlowsIntoPositiveTerminal(graph, range)) return null

  const edges = indexedEdges(graph, true, range)
  const adjacency = buildAdjacency(edges)
  if (!reachable(adjacency, 'battery+').has('battery-')) return null

  const switchEdge = edges.find((edge) => edge.kind === 'switch')
  if (!switchEdge) return null

  const firstComponent = reachable(adjacency, switchEdge.from, switchEdge.index)
  const secondComponent = reachable(adjacency, switchEdge.to, switchEdge.index)
  const lampTerminals = new Set<AmmeterTerminalId>(lampContinuities.flat())
  const isolated = [firstComponent, secondComponent].find((component) => {
    const batteryCount = (['battery+', 'battery-'] as AmmeterTerminalId[]).filter((entry) => component.has(entry)).length
    return batteryCount === 1 && ![...lampTerminals].some((entry) => component.has(entry))
  })
  const network = isolated === firstComponent ? secondComponent : firstComponent
  if (!isolated || !network) return null
  if (![...lampTerminals].every((terminal) => network.has(terminal))) return null

  const networkSwitchTerminal = network.has(switchEdge.from) ? switchEdge.from : switchEdge.to
  const networkBatteryTerminal: AmmeterTerminalId | null = network.has('battery+') ? 'battery+' : network.has('battery-') ? 'battery-' : null
  if (!networkBatteryTerminal) return null

  const paths = simplePaths(adjacency, networkSwitchTerminal, networkBatteryTerminal, network)
  if (paths.length !== 2) return null
  if (paths.some((path) => path.filter((edge) => edge.kind === 'lamp').length !== 1)) return null

  // 接线位置以实际拓扑为准（导线接在哪里就测哪里），并校验与用户选择的测量位置一致
  const onMainPath = paths.filter((path) => ammeterEdgeOnPath(path)).length
  if (onMainPath !== 1 && onMainPath !== 2) return null
  const position: AmmeterPosition = onMainPath === 2 ? 'main' : 'branch'
  if (position !== requested) return null

  // 两灯并联：干路电流为两支路电流之和；支路电流为单支路电流
  const reading = position === 'main'
    ? currentFromSupply(LAMP_RESISTANCE / 2)
    : currentFromSupply(LAMP_RESISTANCE)
  return analysisFromCurrent(reading, range, position)
}

/** 按当前状态选择串联/并联分析器 */
export function analyzeCurrentState(state: AmmeterLabState): CircuitAnalysis | null {
  const graph = circuitFromEdges(state.edges)
  if (usedRange(graph) === null) return null
  return state.mode === 'series' ? analyzeSeries(graph) : analyzeParallel(graph, state.position)
}

export function validateSeriesCircuit(graph: CircuitGraph, position: AmmeterPosition = 'main'): CircuitValidation {
  const safe = validateCircuitSafety(graph, true, usedRange(graph))
  if (!safe.valid) return safe
  if (position === 'branch') {
    return { valid: false, code: 'ammeter-not-in-main', message: '串联电路只有一条路径，电流表接在哪里测的都是同一个电流' }
  }
  if (analyzeSeries(graph) === null) return topologyError()
  return { valid: true, message: '串联电路连接正确' }
}

export function validateParallelCircuit(graph: CircuitGraph, position: AmmeterPosition = 'main'): CircuitValidation {
  const safe = validateCircuitSafety(graph, true, usedRange(graph))
  if (!safe.valid) return safe
  if (analyzeParallel(graph, position) === null) return topologyError()
  return { valid: true, message: '并联电路连接正确' }
}

export function createAmmeterState(): AmmeterLabState {
  return {
    mode: 'series',
    position: 'main',
    edges: freezeEdges([]),
    activeRange: null,
    switchClosed: false,
    activeTrialId: null,
    trials: Object.freeze([]),
    hasTestedWithLargeRange: false,
    overRangeWarning: null,
  }
}

function reduceConnect(state: AmmeterLabState, payload: unknown): LabTransition<AmmeterLabState> {
  if (state.switchClosed) return transition(state, rejected('开关闭合时不能改接导线，请先断开开关'))
  if (!isRecord(payload)) return transition(state, rejected('导线连接无效'))
  const edge = payload as Partial<CircuitEdge>
  if (!isTerminalId(edge.from) || !isTerminalId(edge.to)) return transition(state, rejected('导线只能连接到器材接线柱'))
  const nextEdges = [...state.edges, { from: edge.from, to: edge.to }]
  const nextGraph = circuitFromEdges(nextEdges)
  const safety = validateCircuitSafety(nextGraph, false, usedRange(nextGraph))
  if (!safety.valid) return transition(state, rejected(safety.message))
  return transition(
    stateWith(state, { edges: nextEdges, activeRange: usedRange(nextGraph), activeTrialId: null, overRangeWarning: null }),
    accepted(`已从${CIRCUIT_TERMINALS[edge.from].label}接出一条导线`),
  )
}

function reduceSetMode(state: AmmeterLabState, payload: unknown): LabTransition<AmmeterLabState> {
  if (!isAmmeterMode(payload)) return transition(state, rejected('请选择串联或并联电路'))
  if (state.switchClosed) return transition(state, rejected('开关闭合时不能切换电路类型'))
  if (payload === state.mode && state.edges.length === 0 && state.position === 'main') {
    return transition(state, accepted('当前已是该电路类型'))
  }
  return transition(
    stateWith(state, { mode: payload, position: 'main', edges: [], activeRange: null, activeTrialId: null, overRangeWarning: null }),
    accepted(`已切换到${payload === 'series' ? '串联' : '并联'}电路，当前接线已清空`),
  )
}

function reduceSetPosition(state: AmmeterLabState, payload: unknown): LabTransition<AmmeterLabState> {
  if (!isAmmeterPosition(payload)) return transition(state, rejected('测量位置无效'))
  if (state.mode === 'series') return transition(state, rejected('串联电路只有一条路径，无需选择测量位置'))
  if (state.switchClosed) return transition(state, rejected('请先断开开关再改变电流表的测量位置'))
  return transition(
    stateWith(state, { position: payload, edges: [], activeRange: null, activeTrialId: null, overRangeWarning: null }),
    accepted(payload === 'main' ? '电流表将接在干路，测量总电流' : '电流表将接在支路，测量支路电流'),
  )
}

function reduceSetRange(state: AmmeterLabState, payload: unknown): LabTransition<AmmeterLabState> {
  if (!isRangeId(payload)) return transition(state, rejected('量程无效，请选择 0.6A 或 3A'))
  if (state.switchClosed) return transition(state, rejected('请先断开开关再更换量程'))
  const hasMeterWire = state.edges.some((edge) => isAmmeterTerminal(edge.from) || isAmmeterTerminal(edge.to))
  if (!hasMeterWire) return transition(state, rejected('请先把电流表串入电路，再选择量程'))

  const other = payload === '0.6A' ? 'ammeter-3' : 'ammeter-0.6'
  const withoutOther = state.edges.filter((edge) => edge.from !== other && edge.to !== other)
  const terminal = ammeterTerminalForRange(payload)
  const needsRewire = withoutOther.length === state.edges.length
    && !state.edges.some((edge) => edge.from === terminal || edge.to === terminal)
  return transition(
    stateWith(state, {
      edges: needsRewire ? state.edges : withoutOther,
      activeRange: needsRewire ? state.activeRange : payload,
    }),
    accepted(needsRewire
      ? `已选用 ${payload} 量程，请把导线接到${CIRCUIT_TERMINALS[terminal].label}`
      : `已选用 ${payload} 量程`),
  )
}

function reduceSetSwitch(state: AmmeterLabState, payload: unknown): LabTransition<AmmeterLabState> {
  if (payload !== 'open' && payload !== 'closed') return transition(state, rejected('开关状态无效'))
  if (payload === 'open') {
    if (!state.switchClosed) return transition(state, rejected('开关已经断开'))
    return transition(stateWith(state, { switchClosed: false, overRangeWarning: null }), accepted('开关已断开，可以调整导线的接法'))
  }
  if (state.switchClosed) return transition(state, rejected('开关已经闭合'))

  const graph = circuitFromEdges(state.edges)
  const range = usedRange(graph)
  if (range === null) return transition(state, rejected('电流表还没有接到量程接线柱上，请先完成接线'))
  const safety = validateCircuitSafety(graph, true, range)
  if (!safety.valid) return transition(state, rejected(safety.message))

  const analysis = state.mode === 'series' ? analyzeSeries(graph) : analyzeParallel(graph, state.position)
  if (analysis === null) return transition(state, rejected(topologyError().message))

  const spec = RANGE_SPEC[range]
  if (analysis.overRange) {
    return transition(
      stateWith(state, {
        switchClosed: false,
        overRangeWarning: `被测电流约 ${analysis.reading.toFixed(3)} A，超过 ${spec.label} 量程（满载 ${spec.max} A），指针已打到最右端。请断开开关，改用 3A 量程试触。`,
      }),
      rejected(`电流超过 ${spec.label} 量程，指针打到最右端！请断开开关并改用大量程`),
    )
  }

  const reading = roundToDivision(analysis.reading, range)
  const position: AmmeterPosition = state.mode === 'series' ? 'main' : analysis.position
  const trial: AmmeterTrial = Object.freeze({
    id: `ammeter-trial-${state.trials.length + 1}`,
    mode: state.mode,
    position,
    range,
    reading,
    overRange: false,
    supplyVoltage: SUPPLY_VOLTAGE,
    lampResistance: LAMP_RESISTANCE,
    wireCount: state.edges.length,
    edges: freezeEdges(state.edges),
  })
  const positionLabel = positionLabelOf(trial)
  return transition(
    stateWith(state, {
      switchClosed: true,
      activeRange: range,
      activeTrialId: trial.id,
      trials: [...state.trials, trial],
      hasTestedWithLargeRange: state.hasTestedWithLargeRange || range === '3A',
      overRangeWarning: null,
    }),
    accepted(`${positionLabel}电流表读数为 ${reading.toFixed(2)} A，指针平稳偏转`),
  )
}

function reduceResetTrial(state: AmmeterLabState): LabTransition<AmmeterLabState> {
  if (state.switchClosed) return transition(state, rejected('请先断开开关再重置接线'))
  return transition(
    stateWith(state, { edges: [], activeRange: null, activeTrialId: null, overRangeWarning: null }),
    accepted('当前接线已重置，历史数据仍保留'),
  )
}

function activeTrial(state: AmmeterLabState): AmmeterTrial | undefined {
  return state.activeTrialId === null ? undefined : state.trials.find((trial) => trial.id === state.activeTrialId)
}

function positionLabelOf(trial: AmmeterTrial): string {
  if (trial.mode === 'series') return '串联电路中'
  return trial.position === 'main' ? '并联电路干路上' : '并联电路支路上'
}

function measurementsForTrial(trial: AmmeterTrial): readonly DerivedMeasurement[] {
  return [
    { trialId: trial.id, key: 'current', label: '电流', value: trial.reading, unit: 'A', kind: 'raw' },
    { trialId: trial.id, key: 'range', label: '选用量程', value: RANGE_SPEC[trial.range].label, unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'division', label: '分度值', value: RANGE_SPEC[trial.range].division, unit: 'A', kind: 'observation' },
    { trialId: trial.id, key: 'position', label: '测量位置', value: positionLabelOf(trial), unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'wiring', label: '接线方式', value: '串联接入，电流从“+”接线柱流入', unit: '', kind: 'observation' },
  ]
}

function conditionsForTrial(trial: AmmeterTrial): readonly PhysicsExperimentalCondition[] {
  return [
    { label: '电路类型', value: trial.mode === 'series' ? '串联' : '并联' },
    { label: '测量位置', value: positionLabelOf(trial) },
    { label: '选用量程', value: RANGE_SPEC[trial.range].label },
    { label: '电源电压', value: `${trial.supplyVoltage} V` },
    { label: '导线数量', value: trial.wireCount },
  ]
}

function deriveMeasurements(state: AmmeterLabState): readonly DerivedMeasurement[] {
  const trial = activeTrial(state)
  return trial === undefined ? [] : measurementsForTrial(trial)
}

function conditions(state: AmmeterLabState): readonly PhysicsExperimentalCondition[] {
  const trial = activeTrial(state)
  if (trial) return conditionsForTrial(trial)
  return [
    { label: '电路类型', value: state.mode === 'series' ? '串联' : '并联' },
    { label: '选用量程', value: state.activeRange === null ? '未选择' : RANGE_SPEC[state.activeRange].label },
    { label: '电源电压', value: `${SUPPLY_VOLTAGE} V` },
    { label: '导线数量', value: state.edges.length },
  ]
}

function measurementGroups(state: AmmeterLabState) {
  return state.trials.map((trial) => ({
    conditions: conditionsForTrial(trial),
    measurements: measurementsForTrial(trial),
  }))
}

function report(state: AmmeterLabState) {
  const issues: string[] = []
  if (state.trials.length > 0 && !state.hasTestedWithLargeRange) {
    issues.push('没有先用大量程试触就直接精读，一旦超过量程指针会被打弯，应先试触再换小量程。')
  }
  return {
    calculationResults: state.trials.map((trial, index) => (
      `第 ${index + 1} 次：${positionLabelOf(trial)}，选用 ${RANGE_SPEC[trial.range].label} 量程（分度值 ${RANGE_SPEC[trial.range].division} A），电流表读数 I = ${trial.reading.toFixed(2)} A。`
    )),
    conclusion: state.trials.length === 0
      ? []
      : ['电流表必须串联在被测电路中，电流从“+”接线柱流入、从“－”接线柱流出；读数前先看清量程与分度值。'],
    errorAnalysis: [
      '量程选得过大时指针偏转很小，读数相对误差大；选得过小则指针打到最右端，可能损坏电流表。',
      '读数时视线要与刻度盘垂直，否则因视差使读数偏大或偏小。',
      '接头接触不良会形成断路，指针不偏转；若指针反偏说明电流从“－”接线柱流入了。',
      ...issues,
    ],
  }
}

export const ammeterController: LabController<AmmeterLabState> & {
  conditions(state: AmmeterLabState): readonly PhysicsExperimentalCondition[]
} = {
  createInitialState: createAmmeterState,
  reduce: (state, action) => {
    switch (action.type) {
      case 'connect': return reduceConnect(state, action.payload)
      case 'setMode': return reduceSetMode(state, action.payload)
      case 'setPosition': return reduceSetPosition(state, action.payload)
      case 'setRange': return reduceSetRange(state, action.payload)
      case 'setSwitch': return reduceSetSwitch(state, action.payload)
      case 'resetTrial': return reduceResetTrial(state)
      case 'dragStart': return state.switchClosed
        ? transition(state, rejected('开关闭合时不能开始连接导线，请先断开开关'))
        : transition(state, accepted('请把导线另一端拖到另一个接线柱'))
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
    if (state.trials.length === 0) return { complete: false, message: '请先正确连接电路，闭合开关并读出电流表的示数' }
    const modes = new Set(state.trials.map((trial) => trial.mode))
    const smallRange = state.trials.some((trial) => trial.range === '0.6A')
    if (state.mode === 'parallel' || modes.has('parallel')) {
      const positions = new Set(state.trials.filter((trial) => trial.mode === 'parallel').map((trial) => trial.position))
      if (modes.has('series') && positions.has('main') && positions.has('branch') && smallRange) {
        return { complete: true, message: '已完成串联电路电流测量，并测出并联电路干路与支路电流，且正确使用了小量程精读' }
      }
      return { complete: false, message: '请分别测出并联电路干路电流与支路电流，并在串联实验中用 0.6A 量程精读' }
    }
    if (smallRange) {
      return { complete: true, message: '已完成串联电路电流测量，并用 0.6A 量程精读' }
    }
    return { complete: false, message: '读数偏小时应换用 0.6A 量程精读，请继续' }
  },
}
