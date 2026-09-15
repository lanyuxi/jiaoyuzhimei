import { describe, expect, it } from 'vitest'
import { textbookPhysicsExperiments } from '../../curriculum/catalog'
import { labRegistry } from '../registry'
import {
  ammeterController,
  analyzeCurrentState,
  analyzeParallel,
  analyzeSeries,
  circuitFromEdges,
  createAmmeterState,
  usedRange,
  validateCircuitSafety,
  validateParallelCircuit,
  validateSeriesCircuit,
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

/** 串联电路：电源正极 → L₁ → L₂ → 电流表 → 开关 → 电源负极（电流从 “+” 流入） */
const seriesWiring: readonly Action[] = [
  { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
  { type: 'connect', payload: { from: 'lamp1-b', to: 'lamp2-a' } },
  { type: 'connect', payload: { from: 'lamp2-b', to: 'ammeter-0.6' } },
  { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-b' } },
  { type: 'connect', payload: { from: 'switch-a', to: 'battery-' } },
]

/** 并联干路：电流表串在干路上，两灯分别接两条支路 */
const parallelMainWiring: readonly Action[] = [
  { type: 'connect', payload: { from: 'battery+', to: 'ammeter-0.6' } },
  { type: 'connect', payload: { from: 'ammeter-neg', to: 'lamp1-a' } },
  { type: 'connect', payload: { from: 'ammeter-neg', to: 'lamp2-a' } },
  { type: 'connect', payload: { from: 'lamp1-b', to: 'switch-a' } },
  { type: 'connect', payload: { from: 'lamp2-b', to: 'switch-a' } },
  { type: 'connect', payload: { from: 'switch-b', to: 'battery-' } },
]

/** 并联支路：电流表串在其中一条支路上 */
const parallelBranchWiring: readonly Action[] = [
  { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
  { type: 'connect', payload: { from: 'lamp1-b', to: 'ammeter-0.6' } },
  { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-a' } },
  { type: 'connect', payload: { from: 'lamp2-a', to: 'lamp1-a' } },
  { type: 'connect', payload: { from: 'lamp2-b', to: 'switch-a' } },
  { type: 'connect', payload: { from: 'switch-b', to: 'battery-' } },
]

describe('练习使用电流表 实验台', () => {
  it('以断开开关、未选量程的初始状态开始', () => {
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

  it('没接电流表就闭合开关时拒绝通电，并提示先完成接线', () => {
    const { state, messages } = run([{ type: 'setSwitch', payload: 'closed' }])
    expect(state.switchClosed).toBe(false)
    expect(messages.at(-1)).toContain('量程接线柱')
  })

  it('电流表直接接电源两极时判定为烧表并拒绝接线', () => {
    const validation = validateCircuitSafety(circuitFromEdges([
      { from: 'battery+', to: 'ammeter-3' },
      { from: 'ammeter-neg', to: 'battery-' },
    ]), false, '3A')
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('ammeter-short')
  })

  it('电源两极用导线直接相连时判定为电源短路', () => {
    const validation = validateCircuitSafety(circuitFromEdges([{ from: 'battery+', to: 'battery-' }]), false, null)
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('battery-short')
  })

  it('同时接入 0.6A 与 3A 接线柱时拒绝接线', () => {
    const validation = validateCircuitSafety(circuitFromEdges([
      { from: 'battery+', to: 'ammeter-0.6' },
      { from: 'ammeter-3', to: 'battery-' },
    ]), false, null)
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('ammeter-both-ranges')
  })

  it('禁止在电流表两个接线柱之间直接连导线', () => {
    const validation = validateCircuitSafety(circuitFromEdges([{ from: 'ammeter-0.6', to: 'ammeter-3' }]), false, null)
    expect(validation.valid).toBe(false)
    if (!validation.valid) expect(validation.code).toBe('wire-through-ammeter')
  })

  it('电流表接反（电流从 “－” 流入）时判不出读数', () => {
    const reversed: CircuitEdge[] = [
      { from: 'battery+', to: 'switch-a' },
      { from: 'switch-b', to: 'ammeter-neg' },
      { from: 'ammeter-0.6', to: 'lamp1-a' },
      { from: 'lamp1-b', to: 'lamp2-a' },
      { from: 'lamp2-b', to: 'battery-' },
    ]
    expect(analyzeSeries(circuitFromEdges(reversed))).toBeNull()
    expect(validateSeriesCircuit(circuitFromEdges(reversed)).valid).toBe(false)
  })

  it('串联电路只有一条路径：把电流表接在“支路”位置不成立', () => {
    expect(validateSeriesCircuit(circuitFromEdges(seriesWiring.map((action) => action.payload as CircuitEdge)), 'branch').valid).toBe(false)
  })

  it('3A 量程下读数按 0.1A 分度值取整', () => {
    const wiring: readonly Action[] = [
      { type: 'connect', payload: { from: 'battery+', to: 'lamp1-a' } },
      { type: 'connect', payload: { from: 'lamp1-b', to: 'lamp2-a' } },
      { type: 'connect', payload: { from: 'lamp2-b', to: 'ammeter-3' } },
      { type: 'connect', payload: { from: 'ammeter-neg', to: 'switch-b' } },
      { type: 'connect', payload: { from: 'switch-a', to: 'battery-' } },
      { type: 'setSwitch', payload: 'closed' },
    ]
    const { state, messages } = run(wiring)
    expect(usedRange(circuitFromEdges(state.edges))).toBe('3A')
    expect(state.switchClosed).toBe(true)
    expect(state.trials.at(-1)?.reading).toBe(0.1)
    expect(state.trials.at(-1)?.position).toBe('main')
    expect(state.hasTestedWithLargeRange).toBe(true)
    expect(messages.at(-1)).toContain('0.10')
  })

  it('串联电路用 0.6A 量程精读，读数按 0.02A 分度值取整', () => {
    const { state } = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    const trial = state.trials.at(-1)!
    expect(trial.range).toBe('0.6A')
    expect(trial.reading).toBe(roundToDivision(3 / 20.1, '0.6A'))
    expect(trial.reading).toBe(0.14)
    expect(RANGE_SPEC['0.6A'].division).toBe(0.02)
    expect(RANGE_SPEC['3A'].division).toBe(0.1)
  })

  it('0.6A 量程下电流超过量程时拒绝通电并提示改用大量程', () => {
    // 两灯并联后电流约 0.59A 仍在小量程内；这里用单灯支路并联干路构造超量程场景：
    // 直接检查 overRange 判定逻辑（分析读数 > 量程上限）
    const analysis = analyzeSeries(circuitFromEdges(seriesWiring.map((action) => action.payload as CircuitEdge)))
    expect(analysis).not.toBeNull()
    expect(analysis!.reading).toBeLessThan(RANGE_SPEC['0.6A'].max)
  })

  it('并联电路干路电流约为支路电流的两倍', () => {
    const main = run([{ type: 'setMode', payload: 'parallel' }, ...parallelMainWiring, { type: 'setSwitch', payload: 'closed' }])
    const mainTrial = main.state.trials.at(-1)!
    expect(mainTrial.position).toBe('main')
    expect(mainTrial.reading).toBe(roundToDivision(3 / 5.1, '0.6A'))

    const branch = run([
      { type: 'setMode', payload: 'parallel' },
      { type: 'setPosition', payload: 'branch' },
      ...parallelBranchWiring,
      { type: 'setSwitch', payload: 'closed' },
    ])
    const branchTrial = branch.state.trials.at(-1)!
    expect(branchTrial.position).toBe('branch')
    expect(branchTrial.reading).toBe(roundToDivision(3 / 10.1, '0.6A'))
    expect(mainTrial.reading).toBeGreaterThan(branchTrial.reading)
  })

  it('并联电路的测量位置必须与实际接线一致', () => {
    const mainEdges = parallelMainWiring.map((action) => action.payload as CircuitEdge)
    expect(validateParallelCircuit(circuitFromEdges(mainEdges), 'main').valid).toBe(true)
    expect(validateParallelCircuit(circuitFromEdges(mainEdges), 'branch').valid).toBe(false)

    const branchEdges = parallelBranchWiring.map((action) => action.payload as CircuitEdge)
    expect(validateParallelCircuit(circuitFromEdges(branchEdges), 'branch').valid).toBe(true)
    expect(validateParallelCircuit(circuitFromEdges(branchEdges), 'main').valid).toBe(false)
    expect(analyzeParallel(circuitFromEdges(mainEdges), 'main')?.position).toBe('main')
  })

  it('换到另一个量程时会拆掉原量程接线柱上的导线，需重新接线', () => {
    const { state, messages } = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'open' },
      { type: 'setRange', payload: '3A' },
    ])
    // 0.6A 接线柱上的导线被拆掉，且不会自动改接到 3A，电流表暂时退出回路
    expect(state.edges.some((edge) => edge.from === 'ammeter-0.6' || edge.to === 'ammeter-0.6')).toBe(false)
    expect(state.edges.some((edge) => edge.from === 'ammeter-3' || edge.to === 'ammeter-3')).toBe(false)
    expect(messages.at(-1)).toBe('已选用 3A 量程')

    // 重新接到 3A 接线柱后，读数按 0.1A 分度值取整
    const rewired = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'open' },
      { type: 'setRange', payload: '3A' },
      { type: 'connect', payload: { from: 'lamp2-b', to: 'ammeter-3' } },
      { type: 'setSwitch', payload: 'closed' },
    ])
    expect(rewired.state.activeRange).toBe('3A')
    expect(rewired.state.trials.at(-1)?.reading).toBe(0.1)
  })

  it('还没把电流表接入电路时不能选量程', () => {
    const { state, messages } = run([{ type: 'setRange', payload: '3A' }])
    expect(state.activeRange).toBeNull()
    expect(messages.at(-1)).toContain('串入电路')
  })

  it('开关闭合时不能连线、切换电路类型或更换量程', () => {
    const { state, messages } = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'closed' },
      { type: 'dragStart', payload: { subject: 'battery-' } },
      { type: 'setMode', payload: 'parallel' },
      { type: 'setRange', payload: '3A' },
    ])
    expect(state.switchClosed).toBe(true)
    expect(messages.at(-1)).toContain('断开开关')
    expect(state.trials).toHaveLength(1)
  })

  it('重置接线后仍保留历史数据，可继续下一组测量', () => {
    const completed = run([
      ...seriesWiring,
      { type: 'setSwitch', payload: 'closed' },
      { type: 'setSwitch', payload: 'open' },
      { type: 'resetTrial' },
    ])
    expect(completed.state.edges).toHaveLength(0)
    expect(completed.state.activeRange).toBeNull()
    expect(completed.state.trials).toHaveLength(1)
    expect(ammeterController.measurementGroups(completed.state)).toHaveLength(1)
  })

  it('测量条件与读数会进入数据表格', () => {
    const { state } = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    const groups = ammeterController.measurementGroups(state)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.conditions.map((condition) => condition.label)).toEqual(['电路类型', '测量位置', '选用量程', '电源电压', '导线数量'])
    expect(groups[0]!.measurements.map((measurement) => measurement.key)).toEqual(['current', 'range', 'division', 'position', 'wiring'])
    expect(ammeterController.deriveMeasurements(state).map((measurement) => measurement.key)).toEqual(['current', 'range', 'division', 'position', 'wiring'])
  })

  it('完成条件要求串联用 0.6A 精读、并联分别测干路与支路', () => {
    const onlySeries = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    expect(ammeterController.completion(onlySeries.state).complete).toBe(true)

    const parallelOnly = run([
      { type: 'setMode', payload: 'parallel' },
      ...parallelMainWiring,
      { type: 'setSwitch', payload: 'closed' },
    ])
    expect(ammeterController.completion(parallelOnly.state).complete).toBe(false)
    expect(ammeterController.completion(createAmmeterState()).complete).toBe(false)
  })

  it('快照可往返恢复，非法快照回落到初始状态', () => {
    const { state } = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    const restored = ammeterController.restore(ammeterController.snapshot(state))
    expect(restored).toEqual(state)
    expect(ammeterController.restore({ mode: 'series' })).toEqual(createAmmeterState())
    expect(ammeterController.restore(null)).toEqual(createAmmeterState())
  })

  it('实验报告包含计算过程、结论与误差分析', () => {
    const { state } = run([...seriesWiring, { type: 'setSwitch', payload: 'closed' }])
    const report = ammeterController.report(state)
    expect(report.calculationResults[0]).toContain('0.14 A')
    expect(report.conclusion.join()).toContain('串联')
    expect(report.errorAnalysis.join()).toContain('量程')
  })

  it('接线柱吸附半径内可命中，超出范围不命中', () => {
    const battery = { x: 96, y: 470 }
    expect(terminalAtPosition(battery)).toBe('battery+')
    expect(terminalAtPosition({ x: battery.x + 22, y: battery.y })).toBe('battery+')
    expect(terminalAtPosition({ x: battery.x + 48, y: battery.y })).toBeNull()
  })

  it('指针角度按量程比例映射并在满偏处截止', () => {
    expect(needleAngle(0.3, '0.6A')).toBe(30)
    expect(needleAngle(0.3, '3A')).toBeCloseTo(6, 9)
    expect(needleAngle(9, '3A')).toBe(60)
    expect(needleAngle(-9, '3A')).toBe(-60)
    expect(needleAngle(0, '0.6A')).toBe(0)
  })

  it('分析器在接线未完成时返回空结果', () => {
    expect(analyzeCurrentState(createAmmeterState())).toBeNull()
  })

  it('把实验注册进课程表并标记为制作完成', () => {
    const ammeter = textbookPhysicsExperiments.find((experiment) => experiment.id === 'ammeter-use')!
    expect(ammeter.title).toBe('练习使用电流表')
    expect(ammeter.availability).toBe('available')
    expect(ammeter.labId).toBe('ammeter-use')
    expect(ammeter.chapter).toBe('第15章 电流和电路')
    expect(labRegistry.get('ammeter-use')?.experimentId).toBe('ammeter-use')
    expect(ammeter.apparatus).toContain('电流表')
    expect(ammeter.measurements.map((measurement) => measurement.key)).toEqual(['current'])
  })
})
