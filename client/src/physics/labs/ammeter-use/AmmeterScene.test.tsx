import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AmmeterScene } from './CompetitorScene'
import { AmmeterSchematic } from './SchematicView'
import { ammeterController, createAmmeterState, type AmmeterTrial } from './controller'
import { CIRCUIT_TERMINALS, RANGE_SPEC, isTerminalDraggable, needleAngle, terminalHitSegment } from './definition'
import {
  COMPETITOR_TERMINAL_WORLD,
  COMPETITOR_WIRES,
  COMPETITOR_WORLD_COMPONENTS,
  COMPETITOR_TEXT_PANEL,
  COMPETITOR_BACKGROUND,
} from './competitorScene'
import { competitorTerminalPoints, competitorComponentPoints, competitorWirePolylines, competitorSceneBounds, TERMINAL_DRAW_ORDER } from './competitorGeometry'

const noop = () => {}

/** React SSR 会转义引号等字符，断言文案前先还原实体 */
function decodeEntities(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

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

describe('竞品复原实验页面', () => {
  it('渲染竞品同款深色画布与标题', () => {
    const html = render()
    expect(html).toContain(COMPETITOR_BACKGROUND)
    expect(html).toContain('练习使用电流表')
  })

  it('顶部工具条包含竞品全部功能入口', () => {
    const html = render()
    for (const label of ['保存', '清空', '重置', '撤销', '恢复', '设置', '电路图', '表格']) {
      expect(html).toContain(label)
    }
    for (const label of ['复制链接到PPT', '授课演示', '布置探究作业', '分享实验']) {
      expect(html).toContain(label)
    }
  })

  it('画布浮层包含转电路图与协作入口', () => {
    const html = render()
    expect(html).toContain('转电路图')
    expect(html).toContain('边做边看')
    expect(html).toContain('实验报告')
    expect(html).toContain('交互热点')
    expect(html).toContain('电与磁')
    expect(html).toContain('108%')
  })

  it('器材标签与竞品一致（E1 / S1 / S2 / L1 / A1）', () => {
    const html = render()
    for (const label of ['E1', 'S1', 'S2', 'L1', 'A1']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('0.6A')
    expect(html).toContain('3A')
  })

  it('每个接线柱都有无障碍标签与可点击命中区', () => {
    const html = render()
    for (const terminal of Object.values(CIRCUIT_TERMINALS)) {
      expect(html).toContain(terminal.label)
    }
    expect(html).toContain('data-hit-target="ammeter-terminal-knob"')
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
    expect(decodeEntities(html)).toMatch(/0\.14\s*A/)
    expect(html).toContain('灯泡发光')
  })

  it('量程过小时给出明显告警', () => {
    const html = render({ ...createAmmeterState(), overRangeWarning: '指针已打到最右端' })
    expect(html).toContain('量程过小')
    expect(html).toContain('指针已打到最右端')
  })

  it('实验报告文案与竞品原文逐条一致', () => {
    const titles = COMPETITOR_TEXT_PANEL.map((section) => section.title)
    expect(titles).toEqual(['目的', '原理', '器材', '步骤', '结论', '补充'])
    const flatten = COMPETITOR_TEXT_PANEL.flatMap((section) => section.paragraphs)
    expect(flatten).toContain('电流表串联在待测电路中。')
    expect(flatten).toContain('小灯泡、开关、电源、电流表')
    expect(flatten).toContain('1.观察电流表的量程和分度值；')
    expect(flatten.some((line) => line.includes('0-3A 量程') || line.includes('0-3A量程'))).toBe(true)
    expect(flatten).toContain('4.不允许把电流表直接连到电源的两极。')
    expect(flatten).toContain('在不确定电流大小的情况下，为避免电流过大损坏电流表，可以先进行试触。')
  })

  it('实验报告抽屉可通过「实验报告」按钮展开', () => {
    const html = render()
    expect(html).toContain('aria-label="实验报告"')
  })

  it('表盘与量程规格符合双量程设定', () => {
    expect(needleAngle(RANGE_SPEC['0.6A'].max, '0.6A')).toBe(60)
    expect(needleAngle(RANGE_SPEC['3A'].max, '3A')).toBeCloseTo(60, 9)
    expect(RANGE_SPEC['0.6A'].division).toBe(0.02)
    expect(RANGE_SPEC['3A'].division).toBe(0.1)
  })
})

describe('竞品场景几何复原', () => {
  it('竞品场景包含 5 个元件与 6 根导线', () => {
    expect(COMPETITOR_WORLD_COMPONENTS).toHaveLength(5)
    expect(COMPETITOR_WIRES).toHaveLength(6)
    expect(Object.keys(COMPETITOR_TERMINAL_WORLD)).toHaveLength(11)
  })

  it('元件种类与竞品一致：电流表 / 灯泡 / 两只开关 / 电源', () => {
    const kinds = COMPETITOR_WORLD_COMPONENTS.map((component) => component.kind)
    expect(kinds).toEqual(['ammeter', 'lamp', 'switch', 'switch', 'battery'])
  })

  it('导线连接关系与竞品 netlist 一致', () => {
    const edges = COMPETITOR_WIRES.map((wire) => `${wire.from}->${wire.to}`)
    expect(edges).toEqual([
      'E1-pos->S1-a',
      'S2-b->L1-b',
      'A1-3->S1-b',
      'A1-neg->L1-b',
      'S2-a->L1-a',
      'L1-a->E1-neg',
    ])
  })

  it('竞品手绘折线被完整保留（每根导线至少 2 个点）', () => {
    for (const wire of COMPETITOR_WIRES) {
      expect(wire.polyline.length).toBeGreaterThanOrEqual(2)
    }
    const longest = Math.max(...COMPETITOR_WIRES.map((wire) => wire.polyline.length))
    expect(longest).toBe(12)
  })

  it('每个元件参考点与接线柱都映射进 960×540 视图', () => {
    expect(competitorTerminalPoints.order).toHaveLength(11)
    expect(TERMINAL_DRAW_ORDER).toHaveLength(11)
    for (const [label, point] of Object.entries(competitorComponentPoints.componentCenters)) {
      expect(label).toMatch(/^(A1|L1|S1|S2|E1)$/)
      expect(point.x).toBeGreaterThan(0)
      expect(point.x).toBeLessThan(960)
      expect(point.y).toBeGreaterThan(0)
      expect(point.y).toBeLessThan(540)
    }
    for (const point of Object.values(competitorTerminalPoints.terminals)) {
      expect(point!.x).toBeGreaterThan(0)
      expect(point!.x).toBeLessThan(960)
      expect(point!.y).toBeGreaterThan(0)
      expect(point!.y).toBeLessThan(540)
    }
  })

  it('整个场景（含器材本体）完整落在 960×540 视图内，不会被裁切', () => {
    const bounds = competitorSceneBounds()
    expect(bounds.minX).toBeGreaterThanOrEqual(0)
    expect(bounds.maxX).toBeLessThanOrEqual(960)
    expect(bounds.minY).toBeGreaterThanOrEqual(0)
    expect(bounds.maxY).toBeLessThanOrEqual(540)
  })

  it('导线折线落在视图范围内（避免被 overflow-hidden 裁掉）', () => {
    expect(competitorWirePolylines).toHaveLength(6)
    for (const polyline of competitorWirePolylines) {
      for (const point of polyline) {
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(960)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeLessThanOrEqual(540)
      }
    }
  })
})

describe('电流表实验台接线交互', () => {
  it('每个接线柱的拖拽命中区都能完整落在 960×540 工作台内', () => {
    for (const id of Object.keys(CIRCUIT_TERMINALS) as Array<keyof typeof CIRCUIT_TERMINALS>) {
      const terminal = CIRCUIT_TERMINALS[id]
      const segment = terminalHitSegment(id)
      for (const point of [segment, { x1: segment.x2, y1: segment.y2, x2: terminal.x, y2: terminal.y }]) {
        expect(point.x1).toBeGreaterThanOrEqual(0)
        expect(point.y1).toBeGreaterThanOrEqual(0)
        expect(point.x2).toBeLessThanOrEqual(960)
        expect(point.y2).toBeLessThanOrEqual(540)
      }
    }
  })

  it('可从任意接线柱按下指针开始拉线', () => {
    for (const id of Object.keys(CIRCUIT_TERMINALS) as Array<keyof typeof CIRCUIT_TERMINALS>) {
      expect(isTerminalDraggable(id, createAmmeterState())).toBe(true)
    }
  })

  it('开关闭合时禁止从接线柱拉线', () => {
    const closed = { ...createAmmeterState(), switchClosed: true }
    for (const id of Object.keys(CIRCUIT_TERMINALS) as Array<keyof typeof CIRCUIT_TERMINALS>) {
      expect(isTerminalDraggable(id, closed)).toBe(false)
    }
  })
})

describe('电路图视图', () => {
  it('包含标准器材符号与电流方向标注', () => {
    const html = renderToString(<AmmeterSchematic state={createAmmeterState()} reading={0} />)
    expect(html).toContain('电路图')
    expect(html).toContain('E1')
    expect(html).toContain('L1')
    expect(html).toContain('S1')
    expect(html).toContain('A1')
    expect(html).toContain('电流 I')
    expect(html).toContain('未接入电流表')
  })

  it('接入量程后电路图标注读数值', () => {
    const html = renderToString(<AmmeterSchematic state={{ ...createAmmeterState(), activeRange: '3A' }} reading={0.14} />)
    const text = decodeEntities(html).replace(/<!--[^>]*-->/g, ' ').replace(/\s+/g, ' ')
    expect(text).toContain('0～3 A')
    expect(text).toContain('0.14 A')
  })
})

describe('控制器初始状态', () => {
  it('界面状态与控制器初始状态保持一致', () => {
    const html = render(ammeterController.createInitialState())
    expect(html).toContain('开关断开')
    expect(html).not.toContain('量程过小')
  })
})
