import { describe, expect, it } from 'vitest'
import { textbookPhysicsExperiments } from '../../curriculum/catalog'
import { labRegistry } from '../registry'
import {
  ammeterController,
  createAmmeterState,
  validateCircuitSafety,
  validateParallelCircuit,
  validateSeriesCircuit,
  circuitFromEdges,
  usedRange,
  type AmmeterLabState,
  type CircuitEdge,
} from './controller'
import { RANGE_SPEC, needleAngle, roundToDivision, terminalAtPosition } from './definition'

type Action = { type: string; payload?: unknown }

function run(actions: readonly Action[]): { state: AmmeterLabState; messages: string[] } {
  let state = ammeterController.createInitialState()
  const messages: string[] = []
  for (const action of actions) {
    const transition = ammeterController.reduce(state, action)
    state = transition.state
    messages.push(transition.feedback.message)
  }
  return { state, messages }
}

/** 串联电路：电源 → L1 → 电流表 → 开关 → 电源（电流从 “+” 流入） */
const seriesWiring: readonly Action[] = [
  { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
  { type: 'connect', payload: { from: 'lamp1-b', to: 'lamp2-a' } },
  { type: 'connect', payload: { from: 'lamp2-b', to: 'ammeter-0.6' } },
  { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-b' } },
  { type: 'connect', payload: { from: 'switch-a', to: 'battery-' } },
]

describe('练习使用电流表 实验台', () => {
  it('以断开开关的初始状态开始，尚未选择量程', () => {
    expect(createAmmeterState()).toEqual({
      mode: 'series',
      position: 'main',
      edges: [],
      activeRange: null,
      switchClosed: false,
      activeTrialId: null,
      trials: [],
      hasTestedWithLargeRange: false,
      overRangeWarning: null,
    })
  })

  it('闭合开关但没有接电流表时拒绝通电，并提示先完成接线', () => {
    const { state, messages } = run([{ type: 'setSwitch', payload: 'closed' }])
    expect(state.switchClosed).toBe(false)
    expect(messages.at(-1)).toContain('量程接线柱')
  })

  it('电流表直接接电源两极时判定为短路并拒绝接线', () => {
    const edges: CircuitEdge[] = [
      { from: 'battery+', to: 'ammeter-3' },
      { from: 'ammeter-neg', to: 'battery-' },
    ]
    const validation = validateCircuitSafety(circuitFromEdges(edges), false, '3A')
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('ammeter-short')
  })

  it('电源两极用导线直接相连时判定为电源短路', () => {
    const validation = validateCircuitSafety(circuitFromEdges([{ from: 'battery+', to: 'battery-' }]), false, null)
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('battery-short')
  })

  it('同时接入 0.6A 与 3A 接线柱时拒绝接线', () => {
    const edges: CircuitEdge[] = [
      { from: 'battery+', to: 'ammeter-0.6' },
      { from: 'ammeter-3', to: 'battery-' },
    ]
    const validation = validateCircuitSafety(circuitFromEdges(edges), false, null)
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('ammeter-both-ranges')
  })

  it('禁止在电流表两个接线柱之间直接连导线', () => {
    const validation = validateCircuitSafety(circuitFromEdges([{ from: 'ammeter-0.6', to: 'ammeter-3' }]), false, null)
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('wire-through-ammeter')
  })

  it('量程为 3A 时串联电路读数按 0.1A 分度值取整为 0.1A', () => {
    const { state, messages } = run([
      { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'lamp1-b', to: 'lamp2-a' } },
      { type: 'connect', payload: { from: 'lamp2-b', to: 'ammeter-3' } },
      { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-b' } },
      { type: 'connect', payload: { from: 'switch-a', to: 'battery-' } },
      { type: 'setSwitch', payload: 'closed' },
    ])
    expect(usedRange(circuitFromEdges(state.edges))).toBe('3A')
    expect(state.switchClosed).toBe(true)
    expect(state.trials.at(-1)?.reading).toBe(0.1)
    expect(state.trials.at(-1)?.position).toBe('main')
    expect(messages.at(-1)).toContain('0.10')
  })

  it('串联电路用 0.6A 量程精读，分度值更小读数更精细', () => {
    const { state } = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'closed' },
    ])
    const trial = state.trials.at(-1)!
    expect(trial.range).toBe('0.6A')
    expect(trial.reading).toBe(0.14)
    expect(RANGE_SPEC['0.6A'].division).toBe(0.02)
    expect(RANGE_SPEC['3A'].division).toBe(0.1)
  })

  it('串联电路缺少电流表时校验失败', () => {
    const edges: CircuitEdge[] = [
      { from: 'battery+', to: 'lamp1-a' },
      { from: 'lamp1-b', to: 'switch-b' },
      { from: 'switch-a', to: 'battery-' },
    ]
    expect(validateSeriesCircuit(circuitFromEdges(edges)).valid).toBe(false)
  })

  it('并联电路干路电流约为支路电流的两倍', () => {
    const mainWiring: readonly Action[] = [
      { type: 'connect', payload: { from: 'battery+', to: 'ammeter-0.6' } },
      { type: 'connect', payload: { from: 'ammeter-neg', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'ammeter-neg', to: 'lamp2-a' } },
      { type: 'connect', payload: { from: 'lamp1-b', to: 'switch-a' } },
      { type: 'connect', payload: { from: 'lamp2-b', to: 'switch-a' } },
      { type: 'connect', payload: { from: 'switch-b', to: 'battery-' } },
    ]
    const main = run([{ type: 'setMode', payload: 'parallel' }, ...mainWiring, { type: 'setSwitch', payload: 'closed' }])
    const mainTrial = main.state.trials.at(-1)!
    expect(mainTrial.reading).toBeCloseTo(roundToDivision(3 / 5.1, '0.6A'), 2)
    expect(mainTrial.position).toBe('main')
  })

  it('并联电路支路电流约为干路电流的一半', () => {
    const branchWiring: readonly Action[] = [
      { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'lamp1-b', to: 'ammeter-0.6' } },
      { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-a' } },
      { type: 'connect', payload: { from: 'lamp2-a', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'lamp2-b', to: 'switch-a' } },
      { type: 'connect', payload: { from: 'switch-b', to: 'battery-' } },
    ]
    const branch = run([{ type: 'setMode', payload: 'parallel' }, { type: 'setPosition', payload: 'branch' }, ...branchWiring, { type: 'setSwitch', payload: 'closed' }])
    const trial = branch.state.trials.at(-1)!
    expect(trial.reading).toBeCloseTo(roundToDivision(3 / 10.1, '0.6A'), 2)
    expect(trial.position).toBe('branch')
    expect(trial.reading).toBeGreaterThan(0)
  })

  it('并联电路校验通过，且能识别干路与支路位置', () => {
    const mainEdges: CircuitEdge[] = [
      { from: 'battery+', to: 'ammeter-0.6' },
      { from: 'ammeter-neg', to: 'lamp1-a' },
      { from: 'ammeter-neg', to: 'lamp2-a' },
      { from: 'lamp1-b', to: 'switch-a' },
      { from: 'lamp2-b', to: 'switch-a' },
      { from: 'switch-b', to: 'battery-' },
    ]
    expect(validateParallelCircuit(circuitFromEdges(mainEdges), 'main').valid).toBe(true)

    const branchEdges: CircuitEdge[] = [
      { from: 'battery+', to: 'lamp1-a' },
      { from: 'lamp1-b', to: 'ammeter-0.6' },
      { from: 'ammeter-neg', to: 'switch-a' },
      { from: 'lamp2-a', to: 'lamp1-a' },
      { from: 'lamp2-b', to: 'switch-a' },
      { from: 'switch-b', to: 'battery-' },
    ]
    expect(validateParallelCircuit(circuitFromEdges(branchEdges), 'branch').valid).toBe(true)
  })

  it('3A 量程下读数会因分度值粗而按分度值取整，且不报警', () => {
    const { state } = run([
      { type: 'setMode', payload: 'parallel' },
      { type: 'setPosition', payload: 'branch' },
      { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'lamp1-b', to: 'ammeter-3' } },
      { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-a' } },
      { type: 'connect', payload: { from: 'lamp2-a', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'lamp2-b', to: 'switch-a' } },
      { type: 'connect', payload: { from: 'switch-b', to: 'battery-' } },
      { type: 'setSwitch', payload: 'closed' },
    ])
    const trial = state.trials.at(-1)!
    expect(trial.range).toBe('3A')
    expect(trial.reading).toBe(roundToDivision(3 / 10.1, '3A'))
    expect(trial.overRange).toBe(false)
  })

  it('开关闭合时不能连线、切换电路类型或改变量程', () => {
    const { state, messages } = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'closed' },
      { type: 'dragStart', payload: { subject: 'battery-' } },
      { type: 'setMode', payload: 'parallel' },
      { type: 'setRange', payload: '0.6A' },
    ])
    expect(state.switchClosed).toBe(true)
    expect(messages.at(-1)).toContain('断开开关')
    expect(state.trials).toHaveLength(1)
  })

  it('撤销与重置后可继续下一组测量，历史数据保留', () => {
    const completed = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'closed' },
      { type: 'setSwitch', payload: 'open' },
      { type: 'resetTrial' },
    ])
    expect(completed.state.edges).toHaveLength(0)
    expect(completed.state.trials).toHaveLength(1)
    expect(ammeterController.measurementGroups(completed.state)).toHaveLength(1)
  })

  it('完成条件要求串联用 0.6A 精读、并联分别测干路与支路', () => {
    const onlySeries = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    expect(ammeterController.completion(onlySeries.state).complete).toBe(true)
  })

  it('快照可往返恢复', () => {
    const { state } = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    const restored = ammeterController.restore(ammeterController.snapshot(state))
    expect(restored).toEqual(state)
  })

  it('接线柱吸附半径内可命中，超出范围不命中', () => {
    const battery = { x: 96, y: 300 }
    expect(terminalAtPosition(battery)).toBe('battery+')
    expect(terminalAtPosition({ x: battery.x + 22, y: battery.y })).toBe('battery+')
    expect(terminalAtPosition({ x: battery.x + 48, y: battery.y })).toBeNull()
  })

  it('指针角度按量程比例映射并在满偏处截止', () => {
    expect(needleAngle(0.3, '0.6A')).toBe(30)
    expect(needleAngle(0.3, '3A')).toBeCloseTo(6, 9)
    expect(needleAngle(9, '3A')).toBe(60)
    expect(needleAngle(-9, '3A')).toBe(-60)
  })

  it('把实验注册进课程表并标记为可用', () => {
    const ammeter = textbookPhysicsExperiments.find((experiment) => experiment.id === 'ammeter-use')!
    expect(ammeter.title).toBe('练习使用电流表')
    expect(ammeter.availability).toBe('available')
    expect(ammeter.labId).toBe('ammeter-use')
    expect(labRegistry.get('ammeter-use')?.experimentId).toBe('ammeter-use')
    expect(ammeter.apparatus).toContain('电流表')
    expect(ammeter.measurements.map((measurement) => measurement.key)).toEqual(['current'])
  })
})
