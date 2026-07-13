import { describe, expect, it } from 'vitest'
import { textbookPhysicsExperiments } from '../../curriculum/catalog'
import { labRegistry } from '../registry'
import {
  circuitFromEdges,
  createSeriesParallelState,
  normalizedEdgeKey,
  seriesParallelController,
  validateCircuitSafety,
  validateParallelCircuit,
  validateSeriesCircuit,
  type CircuitEdge,
} from './controller'
import { CIRCUIT_TERMINALS, TERMINAL_SNAP_RADIUS, terminalAtPosition } from './definition'

const seriesEdges: CircuitEdge[] = [
  { from: 'battery+', to: 'switch-a' },
  { from: 'switch-b', to: 'lamp1-a' },
  { from: 'lamp1-b', to: 'lamp2-a' },
  { from: 'lamp2-b', to: 'battery-' },
]

const parallelEdges: CircuitEdge[] = [
  { from: 'battery+', to: 'switch-a' },
  { from: 'switch-b', to: 'lamp1-a' },
  { from: 'switch-b', to: 'lamp2-a' },
  { from: 'lamp1-b', to: 'battery-' },
  { from: 'lamp2-b', to: 'battery-' },
]

function reduce(actions: Array<{ type: string; payload?: unknown }>) {
  return actions.reduce(
    (state, action) => seriesParallelController.reduce(state, action).state,
    seriesParallelController.createInitialState(),
  )
}

function wired(mode: 'series' | 'parallel') {
  const edges = mode === 'series' ? seriesEdges : parallelEdges
  return reduce([
    ...(mode === 'parallel' ? [{ type: 'setMode', payload: mode }] : []),
    ...edges.map((edge) => ({ type: 'connect', payload: edge })),
  ])
}

describe('series parallel circuit controller', () => {
  it('normalizes undirected edges and rejects duplicate, reversed duplicate, and self-link wires', () => {
    expect(normalizedEdgeKey({ from: 'lamp1-a', to: 'battery+' })).toBe(normalizedEdgeKey({ from: 'battery+', to: 'lamp1-a' }))
    expect(validateCircuitSafety(circuitFromEdges([
      { from: 'battery+', to: 'switch-a' },
      { from: 'switch-a', to: 'battery+' },
    ]))).toMatchObject({ valid: false, code: 'duplicate-wire' })
    expect(validateCircuitSafety(circuitFromEdges([{ from: 'lamp1-a', to: 'lamp1-a' }]))).toMatchObject({ valid: false, code: 'self-link' })
  })

  it('rejects direct battery shorts and edits while the switch is closed', () => {
    expect(validateCircuitSafety(circuitFromEdges([{ from: 'battery+', to: 'battery-' }]))).toEqual({
      valid: false,
      code: 'battery-short',
      message: '电源两极不能用导线直接相连',
    })

    const closed = seriesParallelController.reduce(wired('series'), { type: 'setSwitch', payload: 'closed' }).state
    const edit = seriesParallelController.reduce(closed, { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } })
    expect(edit.state).toBe(closed)
    expect(edit.feedback.outcome).toBe('rejected')
  })

  it('accepts only the exact closed series loop and rejects malformed loops, bypasses, and a bypassed switch', () => {
    expect(validateSeriesCircuit(circuitFromEdges(seriesEdges))).toEqual({ valid: true, message: '串联电路连接正确' })
    expect(validateSeriesCircuit(circuitFromEdges([...seriesEdges, { from: 'battery+', to: 'lamp1-a' }]))).toMatchObject({ valid: false, code: 'unexpected-topology' })
    expect(validateSeriesCircuit(circuitFromEdges(seriesEdges.map((edge) => edge.from === 'lamp1-b'
      ? { from: 'lamp1-b', to: 'battery-' }
      : edge)))).toMatchObject({ valid: false, code: 'unexpected-topology' })
    expect(validateSeriesCircuit(circuitFromEdges([
      { from: 'battery+', to: 'lamp1-a' },
      { from: 'lamp1-b', to: 'lamp2-a' },
      { from: 'lamp2-b', to: 'battery-' },
    ]))).toMatchObject({ valid: false, code: 'unexpected-topology' })
  })

  it('accepts only two independent parallel lamp branches and rejects missing, crossed, and shared-branch defects', () => {
    expect(validateParallelCircuit(circuitFromEdges(parallelEdges))).toEqual({ valid: true, message: '并联电路连接正确' })
    expect(validateParallelCircuit(circuitFromEdges(parallelEdges.slice(0, -1)))).toMatchObject({ valid: false, code: 'unexpected-topology' })
    expect(validateParallelCircuit(circuitFromEdges(parallelEdges.map((edge) => edge.from === 'lamp1-b'
      ? { from: 'lamp1-b', to: 'lamp2-b' }
      : edge)))).toMatchObject({ valid: false, code: 'unexpected-topology' })
    expect(validateParallelCircuit(circuitFromEdges([
      { from: 'battery+', to: 'switch-a' },
      { from: 'switch-b', to: 'lamp1-a' },
      { from: 'lamp1-b', to: 'lamp2-a' },
      { from: 'lamp2-b', to: 'battery-' },
    ]))).toMatchObject({ valid: false, code: 'unexpected-topology' })
  })

  it('cannot close an invalid or unsafe graph', () => {
    const incomplete = seriesParallelController.reduce(createSeriesParallelState(), { type: 'setSwitch', payload: 'closed' })
    const unsafe = seriesParallelController.reduce(
      reduce([{ type: 'connect', payload: { from: 'battery+', to: 'battery-' } }]),
      { type: 'setSwitch', payload: 'closed' },
    )
    expect(incomplete.state.switchClosed).toBe(false)
    expect(incomplete.feedback.outcome).toBe('rejected')
    expect(unsafe.state.switchClosed).toBe(false)
    expect(unsafe.feedback.outcome).toBe('rejected')
  })

  it('isolates modes and trials, completing only after valid energized series and parallel trials', () => {
    const seriesClosed = seriesParallelController.reduce(wired('series'), { type: 'setSwitch', payload: 'closed' }).state
    const modeChangeWhileClosed = seriesParallelController.reduce(seriesClosed, { type: 'setMode', payload: 'parallel' })
    const opened = seriesParallelController.reduce(seriesClosed, { type: 'setSwitch', payload: 'open' }).state
    const parallelState = seriesParallelController.reduce(opened, { type: 'setMode', payload: 'parallel' }).state
    const parallelClosed = seriesParallelController.reduce(
      parallelEdges.reduce((state, edge) => seriesParallelController.reduce(state, { type: 'connect', payload: edge }).state, parallelState),
      { type: 'setSwitch', payload: 'closed' },
    ).state

    expect(seriesParallelController.completion(seriesClosed).complete).toBe(false)
    expect(modeChangeWhileClosed.state).toBe(seriesClosed)
    expect(parallelState.edges).toEqual([])
    expect(parallelState.trials).toHaveLength(1)
    expect(parallelState.trials[0]?.mode).toBe('series')
    expect(seriesParallelController.completion(parallelClosed)).toEqual({ complete: true, message: '已完成串联和并联电路的正确连接与通电试验' })
  })

  it('keeps edges and trials immutable, resets only the active circuit, and exposes structured measurements and conditions', () => {
    const closed = seriesParallelController.reduce(wired('series'), { type: 'setSwitch', payload: 'closed' }).state
    const opened = seriesParallelController.reduce(closed, { type: 'setSwitch', payload: 'open' }).state
    const reset = seriesParallelController.reduce(opened, { type: 'resetTrial' }).state

    expect(Object.isFrozen(closed.edges)).toBe(true)
    expect(Object.isFrozen(closed.trials[0]!)).toBe(true)
    expect(reset.edges).toEqual([])
    expect(reset.trials).toEqual(closed.trials)
    expect(reset.trials).not.toBe(closed.trials)
    expect(seriesParallelController.deriveMeasurements(closed).map((measurement) => measurement.key)).toEqual(['circuitMode', 'switchState', 'lamp1State', 'lamp2State'])
    expect(seriesParallelController.conditions(closed)).toEqual([
      { label: '电路类型', value: '串联' },
      { label: '电源电压', value: 3 },
      { label: '开关状态', value: '闭合' },
      { label: '导线数量', value: 4 },
    ])
  })

  it('snaps a terminal drop only inside the explicit radius and safely clears drag previews on cancellation', () => {
    const terminal = CIRCUIT_TERMINALS['battery+']
    expect(terminalAtPosition({ x: terminal.x + TERMINAL_SNAP_RADIUS, y: terminal.y })).toBe('battery+')
    expect(terminalAtPosition({ x: terminal.x + TERMINAL_SNAP_RADIUS + 0.1, y: terminal.y })).toBeNull()

    const started = seriesParallelController.reduce(createSeriesParallelState(), { type: 'dragStart', payload: { subject: 'battery+' } }).state
    const cancelled = seriesParallelController.reduce(started, { type: 'dragCancel', payload: { subject: 'battery+' } })
    expect(cancelled.state).toBe(started)
    expect(cancelled.feedback.outcome).toBe('accepted')
  })

  it('registers exactly the heat-capacity and series-parallel available labs', () => {
    const available = textbookPhysicsExperiments.filter((experiment) => experiment.availability === 'available')
    expect(available.map((experiment) => experiment.id)).toEqual(['heat-capacity-comparison', 'series-parallel-circuit'])
    expect(available.map((experiment) => experiment.labId)).toEqual(['heat-capacity-comparison', 'series-parallel-circuit'])
    expect([...labRegistry.keys()]).toEqual(['heat-capacity-comparison', 'series-parallel-circuit'])
  })
})
