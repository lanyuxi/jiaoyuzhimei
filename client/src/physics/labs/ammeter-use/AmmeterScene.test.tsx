import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AmmeterScene, CircuitSchematic } from './AmmeterScene'
import { ammeterController, createAmmeterState, type AmmeterTrial } from './controller'
import { CIRCUIT_TERMINALS, RANGE_SPEC, needleAngle, terminalHitSegment } from './definition'

const noop = () => {}

function render(state = createAmmeterState()) {
  return renderToString(<AmmeterScene state={state} dispatch={noop} />)
}

function trial(overrides: Partial<AmmeterTrial> = {}): AmmeterTrial {
  return {
    id: 'ammeter-trial-1',
    mode: 'series',
    position: 'main',
    range: '0.6A',
    reading: 0.14,
    overRange: false,
    supplyVoltage: 3,
    lampResistance: 10,
    wireCount: 5,
    edges: [],
    ...overrides,
  }
}

describe('电流表实验台界面', () => {
  it('渲染标题、双量程按钮与全部器材标签', () => {
    const html = render()
    expect(html).toContain('练习使用电流表')
    expect(html).toContain('3A 大量程')
    expect(html).toContain('0.6A 小量程')
    expect(html).toContain('E₁')
    expect(html).toContain('S₁')
    expect(html).toContain('L₁')
    expect(html).toContain('L₂')
    expect(html).toContain('A₁')
    expect(html).toContain('读数 0.00 A')
  })

  it('每个接线柱都有可点击的命中区域与无障碍标签', () => {
    const html = render()
    for (const terminal of Object.values(CIRCUIT_TERMINALS)) {
      expect(html).toContain(terminal.label)
    }
    expect(html).toContain('data-hit-target="ammeter-terminal"')
  })

  it('串联模式下不显示干路/支路切换，并联模式下显示', () => {
    expect(render()).not.toContain('干路')
    const html = render({ ...createAmmeterState(), mode: 'parallel' })
    expect(html).toContain('干路')
    expect(html).toContain('支路')
  })

  it('所选量程按钮为按下状态并显示分度值提示', () => {
    const html = render({ ...createAmmeterState(), activeRange: '0.6A' })
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('当前量程 0～0.6 A')
    expect(html).toContain('0.02')
  })

  it('闭合开关并读数后显示读数与发光提示', () => {
    const html = render({
      ...createAmmeterState(),
      switchClosed: true,
      activeRange: '0.6A',
      activeTrialId: 'ammeter-trial-1',
      trials: [trial()],
    })
    expect(html).toContain('0.14 A')
    expect(html).toContain('电路已接通')
    expect(html).toContain('灯泡发光')
  })

  it('量程过小时给出明显告警', () => {
    const html = render({ ...createAmmeterState(), overRangeWarning: '指针已打到最右端' })
    expect(html).toContain('量程过小')
    expect(html).toContain('指针已打到最右端')
  })

  it('表盘与量程规格符合双量程设定', () => {
    expect(needleAngle(RANGE_SPEC['0.6A'].max, '0.6A')).toBe(60)
    expect(needleAngle(RANGE_SPEC['3A'].max, '3A')).toBeCloseTo(60, 9)
    expect(RANGE_SPEC['0.6A'].division).toBe(0.02)
    expect(RANGE_SPEC['3A'].division).toBe(0.1)
  })

  it('接线柱命中线段朝元件内部方向延伸', () => {
    const battery = terminalHitSegment('battery+')
    expect(battery.x2).toBe(CIRCUIT_TERMINALS['battery+'].x)
    expect(battery.y2).toBeLessThan(CIRCUIT_TERMINALS['battery+'].y)
    const meter = terminalHitSegment('ammeter-3')
    expect(meter.y2).toBeGreaterThan(CIRCUIT_TERMINALS['ammeter-3'].y)
  })

  it('提供“转电路图”按钮，可切到原理图视图', () => {
    const html = render()
    expect(html).toContain('转电路图')
    expect(html).toContain('aria-pressed="false"')
  })

  it('电路图视图包含标准器材符号与电流方向标注', () => {
    const html = renderToString(<CircuitSchematic state={createAmmeterState()} reading={0} />)
    expect(html).toContain('电路图（原理图）')
    expect(html).toContain('串联电路')
    expect(html).toContain('E₁')
    expect(html).toContain('L₁')
    expect(html).toContain('L₂')
    expect(html).toContain('S₁')
    expect(html).toContain('A₁')
    expect(html).toContain('电流 I')
    expect(html).toContain('未接入电流表')
  })

  it('并联支路测量时电路图标注支路位置', () => {
    const html = renderToString(<CircuitSchematic state={{ ...createAmmeterState(), mode: 'parallel', position: 'branch' }} reading={0.29} />)
    expect(html).toContain('并联电路')
    expect(html).toContain('支路')
  })

  it('界面状态与控制器初始状态保持一致', () => {
    const html = render(ammeterController.createInitialState())
    expect(html).toContain('开关断开')
    expect(html).not.toContain('量程过小')
  })
})
