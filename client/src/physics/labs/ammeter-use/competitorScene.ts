/**
 * 竞品（NB物理实验 / s.nobook.com?id=402785）场景数据。
 *
 * 这里的每个数字都来自竞品分享页的真实场景数据（experiment/v1/Play 返回的 phyData），
 * 不是凭截图目测：元件位置、接线柱偏移、导线折线点全部按原始世界坐标
 * 归一化后映射到本实验台的 960×540 视图，保证 1:1 复原。
 */

export interface CompetitorTerminalSpec {
  /** 接线柱在本实验台视图中的坐标 */
  x: number
  y: number
  label: string
  polarity: '+' | '-'
}

export interface CompetitorComponentSpec {
  label: string
  /** 元件参考点在视图中的坐标（竞品 positionX / positionY） */
  x: number
  y: number
  terminals: readonly CompetitorTerminalSpec[]
}

/** 视图坐标系：与竞品原始场景等比映射 */
export const COMPETITOR_VIEW_WIDTH = 960
export const COMPETITOR_VIEW_HEIGHT = 540

/**
 * 竞品原始世界坐标 → 本视图坐标的映射参数（由真实场景 bbox 反算）。
 * 竞品 bbox：x[-693.6, 211.5]，y[4030.9, 4824.6]（y 轴向上），宽 905.1、高 793.7。
 * 场景按 1.140 的宽高比居中放进 960×540（留出上下工具栏空间），再整体下移。
 */
const WORLD_MIN_X = -693.6
const WORLD_MAX_Y = 4824.6
const WORLD_WIDTH = 905.1
/** 场景在 540 高视图中的显示宽度（保持宽高比） */
const SCENE_RENDER_WIDTH = 480
const SCENE_SCALE = SCENE_RENDER_WIDTH / WORLD_WIDTH
const SCENE_OFFSET_X = (COMPETITOR_VIEW_WIDTH - SCENE_RENDER_WIDTH) / 2
const SCENE_OFFSET_Y = 68

/** 竞品世界坐标 → 本视图坐标 */
export function worldToView(x: number, y: number): { x: number; y: number } {
  return {
    x: SCENE_OFFSET_X + (x - WORLD_MIN_X) * SCENE_SCALE,
    y: SCENE_OFFSET_Y + (WORLD_MAX_Y - y) * SCENE_SCALE,
  }
}

/**
 * 竞品场景里的 5 个元件（A1 电流表、L1 小灯泡、S1/S2 开关、E1 电源）
 * 以及每只元件的接线柱绝对坐标（世界坐标，供世界坐标映射使用）。
 */
interface WorldTerminal {
  label: string
  polarity: '+' | '-'
  wx: number
  wy: number
}

interface WorldComponent {
  label: string
  kind: 'lamp' | 'switch' | 'battery' | 'ammeter'
  wx: number
  wy: number
  terminals: readonly WorldTerminal[]
}

export const COMPETITOR_WORLD_COMPONENTS: readonly WorldComponent[] = [
  {
    label: 'A1',
    kind: 'ammeter',
    wx: 121.6,
    wy: 4251.6,
    terminals: [
      { label: '电流表 － 接线柱', polarity: '-', wx: 39.0, wy: 4327.4 },
      { label: '电流表 0.6A 接线柱', polarity: '+', wx: 120.2, wy: 4321.3 },
      { label: '电流表 3A 接线柱', polarity: '+', wx: 198.6, wy: 4328.6 },
    ],
  },
  {
    label: 'L1',
    kind: 'lamp',
    wx: -404.6,
    wy: 4316.9,
    terminals: [
      { label: '灯泡 L1 左接线柱', polarity: '+', wx: -491.1, wy: 4319.0 },
      { label: '灯泡 L1 右接线柱', polarity: '-', wx: -319.1, wy: 4319.0 },
    ],
  },
  {
    label: 'S1',
    kind: 'switch',
    wx: 14.7,
    wy: 4806.0,
    terminals: [
      { label: '开关 S1 左接线柱', polarity: '+', wx: -88.4, wy: 4821.3 },
      { label: '开关 S1 右接线柱', polarity: '-', wx: 120.2, wy: 4821.3 },
    ],
  },
  {
    label: 'S2',
    kind: 'switch',
    wx: -402.3,
    wy: 4030.9,
    terminals: [
      { label: '开关 S2 左接线柱', polarity: '+', wx: -505.3, wy: 4046.2 },
      { label: '开关 S2 右接线柱', polarity: '-', wx: -296.7, wy: 4046.2 },
    ],
  },
  {
    label: 'E1',
    kind: 'battery',
    wx: -456.4,
    wy: 4801.8,
    terminals: [
      { label: '电源 E1 负极接线柱', polarity: '-', wx: -616.4, wy: 4821.8 },
      { label: '电源 E1 正极接线柱', polarity: '+', wx: -291.4, wy: 4821.8 },
    ],
  },
]

/** 接线柱 id → 世界坐标（元件级唯一） */
export type CompetitorTerminalId =
  | 'A1-neg'
  | 'A1-0.6'
  | 'A1-3'
  | 'L1-a'
  | 'L1-b'
  | 'S1-a'
  | 'S1-b'
  | 'S2-a'
  | 'S2-b'
  | 'E1-neg'
  | 'E1-pos'

/** 竞品原始 netlist：每一根实物导线的两个端点 + 原始手绘折线 */
export interface CompetitorWireSpec {
  from: CompetitorTerminalId
  to: CompetitorTerminalId
  /** 原始折线点（世界坐标），用于复原导线的真实走线弧度 */
  polyline: readonly { x: number; y: number }[]
}

/**
 * 竞品场景里的 6 根导线（顺序与竞品一致）。
 * 连接关系：E1#1–S1#0、S2#1–L1#1、A1(3A)–S1#1、A1(－)–L1#1、S2#0–L1#0、L1#0–E1#0
 */
export const COMPETITOR_WIRES: readonly CompetitorWireSpec[] = [
  { from: 'E1-pos', to: 'S1-a', polyline: [ { x: -291.4, y: 4821.8 }, { x: -141.1, y: 4822.8 }, { x: -88.4, y: 4821.3 } ] },
  { from: 'S2-b', to: 'L1-b', polyline: [ { x: -296.7, y: 4046.2 }, { x: -280.6, y: 4100.6 }, { x: -272.2, y: 4171.0 }, { x: -273.0, y: 4223.6 }, { x: -278.2, y: 4266.1 }, { x: -298.3, y: 4290.1 }, { x: -312.3, y: 4310.1 }, { x: -319.1, y: 4319.0 } ] },
  { from: 'A1-3', to: 'S1-b', polyline: [ { x: 198.6, y: 4328.6 }, { x: 211.5, y: 4495.6 }, { x: 210.9, y: 4686.5 }, { x: 197.6, y: 4767.4 }, { x: 182.2, y: 4801.0 }, { x: 151.4, y: 4824.6 }, { x: 120.2, y: 4821.3 } ] },
  { from: 'A1-neg', to: 'L1-b', polyline: [ { x: 39.0, y: 4327.4 }, { x: -107.1, y: 4352.1 }, { x: -191.6, y: 4352.0 }, { x: -230.9, y: 4344.3 }, { x: -289.6, y: 4334.1 }, { x: -319.1, y: 4319.0 } ] },
  { from: 'S2-a', to: 'L1-a', polyline: [ { x: -505.3, y: 4046.2 }, { x: -525.2, y: 4110.0 }, { x: -548.3, y: 4166.4 }, { x: -526.8, y: 4237.1 }, { x: -514.4, y: 4264.2 }, { x: -505.7, y: 4300.3 }, { x: -491.1, y: 4319.0 } ] },
  { from: 'L1-a', to: 'E1-neg', polyline: [ { x: -491.1, y: 4319.0 }, { x: -580.2, y: 4311.3 }, { x: -647.5, y: 4320.0 }, { x: -670.4, y: 4343.5 }, { x: -688.7, y: 4421.7 }, { x: -693.6, y: 4542.4 }, { x: -674.1, y: 4645.6 }, { x: -658.6, y: 4691.3 }, { x: -644.2, y: 4716.9 }, { x: -628.1, y: 4760.0 }, { x: -620.3, y: 4801.2 }, { x: -616.4, y: 4821.8 } ] },
]

/** 竞品接线柱 id → 世界坐标 */
export const COMPETITOR_TERMINAL_WORLD: Readonly<Record<CompetitorTerminalId, { x: number; y: number; label: string; polarity: '+' | '-' }>> = (() => {
  const table: Record<string, { x: number; y: number; label: string; polarity: '+' | '-' }> = {}
  const ids: Record<string, readonly CompetitorTerminalId[]> = {
    A1: ['A1-neg', 'A1-0.6', 'A1-3'],
    L1: ['L1-a', 'L1-b'],
    S1: ['S1-a', 'S1-b'],
    S2: ['S2-a', 'S2-b'],
    E1: ['E1-neg', 'E1-pos'],
  }
  for (const component of COMPETITOR_WORLD_COMPONENTS) {
    ids[component.label].forEach((id, index) => {
      const terminal = component.terminals[index]
      table[id] = { x: terminal.wx, y: terminal.wy, label: terminal.label, polarity: terminal.polarity }
    })
  }
  return table as Readonly<Record<CompetitorTerminalId, { x: number; y: number; label: string; polarity: '+' | '-' }>>
})()

/** 竞品面板文案（原样取自竞品 textPanel） */
export const COMPETITOR_TEXT_PANEL: readonly { title: string; paragraphs: readonly string[] }[] = [
  {
    title: '目的',
    paragraphs: ['学会选择适当的电流表量程并学会连接电流表；学会正确的对电流表进行读数。'],
  },
  {
    title: '原理',
    paragraphs: ['电流表串联在待测电路中。'],
  },
  {
    title: '器材',
    paragraphs: ['小灯泡、开关、电源、电流表'],
  },
  {
    title: '步骤',
    paragraphs: [
      '1.观察电流表的量程和分度值；',
      '2.按照电路图连接好电路（电流表选择0-3A量程），闭合开关，观察电流表的示数；',
      '3.断开开关，将电流表量程改到0-0.6A，闭合开关，观察电流表的示数。',
    ],
  },
  {
    title: '结论',
    paragraphs: [
      '1.必须将电流表和被测的用电器串联；',
      '2.必须让电流从正接线柱流进；',
      '3.必须选择正确的量程；',
      '4.不允许把电流表直接连到电源的两极。',
    ],
  },
  {
    title: '补充',
    paragraphs: ['在不确定电流大小的情况下，为避免电流过大损坏电流表，可以先进行试触。'],
  },
]

/** 竞品画布背景色（backgroundColorImg.colors.arr） */
export const COMPETITOR_BACKGROUND = '#343941'
