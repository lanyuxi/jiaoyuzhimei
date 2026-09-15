import type { Position } from '../../runtime/types'

/** 电路类型：串联测量 / 并联测量 */
export type AmmeterMode = 'series' | 'parallel'

/** 电流表量程：0.6A 小量程（精读）/ 3A 大量程（试触） */
export type AmmeterRangeId = '0.6A' | '3A'

/** 测量位置：并联电路的干路 / 支路；串联电路只有一条路径，固定为 main */
export type AmmeterPosition = 'main' | 'branch'

export type AmmeterTerminalId =
  | 'battery+'
  | 'battery-'
  | 'switch-a'
  | 'switch-b'
  | 'lamp1-a'
  | 'lamp1-b'
  | 'lamp2-a'
  | 'lamp2-b'
  | 'ammeter-neg'
  | 'ammeter-0.6'
  | 'ammeter-3'

export type CircuitTerminalId = AmmeterTerminalId

export interface CircuitTerminal extends Position {
  id: AmmeterTerminalId
  label: string
  polarity: '+' | '-'
}

/** 接线柱吸附半径（SVG 坐标），与「串联和并联」实验台保持一致的手感 */
export const TERMINAL_SNAP_RADIUS = 24

export const CIRCUIT_TERMINALS: Readonly<Record<AmmeterTerminalId, CircuitTerminal>> = {
  'battery+': { id: 'battery+', label: '电源正极', polarity: '+', x: 96, y: 470 },
  'battery-': { id: 'battery-', label: '电源负极', polarity: '-', x: 96, y: 300 },
  'switch-a': { id: 'switch-a', label: '开关 S₁ 左接线柱', polarity: '+', x: 176, y: 470 },
  'switch-b': { id: 'switch-b', label: '开关 S₁ 右接线柱', polarity: '+', x: 268, y: 470 },
  'lamp1-a': { id: 'lamp1-a', label: '灯泡 L₁ 左接线柱', polarity: '+', x: 390, y: 200 },
  'lamp1-b': { id: 'lamp1-b', label: '灯泡 L₁ 右接线柱', polarity: '-', x: 520, y: 200 },
  'lamp2-a': { id: 'lamp2-a', label: '灯泡 L₂ 左接线柱', polarity: '+', x: 390, y: 470 },
  'lamp2-b': { id: 'lamp2-b', label: '灯泡 L₂ 右接线柱', polarity: '-', x: 520, y: 470 },
  'ammeter-neg': { id: 'ammeter-neg', label: '电流表负接线柱（－）', polarity: '-', x: 640, y: 470 },
  'ammeter-0.6': { id: 'ammeter-0.6', label: '电流表 0.6A 接线柱', polarity: '+', x: 770, y: 470 },
  'ammeter-3': { id: 'ammeter-3', label: '电流表 3A 接线柱', polarity: '+', x: 856, y: 470 },
}

export const TERMINAL_IDS = Object.keys(CIRCUIT_TERMINALS) as AmmeterTerminalId[]

/** 元件内部导通关系：导线以外的固有连接 */
export const COMPONENT_INTERNAL_CONNECTIONS = [
  ['switch-a', 'switch-b'],
  ['lamp1-a', 'lamp1-b'],
  ['lamp2-a', 'lamp2-b'],
] as const

/** 电流表内部电气连接：负接线柱分别通过对应量程与两只正接线柱导通 */
export const AMMETER_INTERNAL_CONNECTIONS: Readonly<Record<AmmeterRangeId, readonly [AmmeterTerminalId, AmmeterTerminalId]>> = {
  '0.6A': ['ammeter-neg', 'ammeter-0.6'],
  '3A': ['ammeter-neg', 'ammeter-3'],
}

export const AMMETER_POSITIVE_TERMINALS: readonly AmmeterTerminalId[] = ['ammeter-0.6', 'ammeter-3']

export const AMMETER_TERMINALS: readonly AmmeterTerminalId[] = ['ammeter-neg', 'ammeter-0.6', 'ammeter-3']

export function isAmmeterTerminal(id: string): id is AmmeterTerminalId {
  return id === 'ammeter-neg' || id === 'ammeter-0.6' || id === 'ammeter-3'
}

export function ammeterTerminalForRange(range: AmmeterRangeId): AmmeterTerminalId {
  return range === '0.6A' ? 'ammeter-0.6' : 'ammeter-3'
}

export function ammeterRangeForTerminal(id: AmmeterTerminalId): AmmeterRangeId | null {
  if (id === 'ammeter-0.6') return '0.6A'
  if (id === 'ammeter-3') return '3A'
  return null
}

/** 电源电压固定为 3V（两节干电池串联） */
export const SUPPLY_VOLTAGE = 3

/** 小灯泡电阻 */
export const LAMP_RESISTANCE = 10
/** 电流表内阻，参与回路总电阻计算 */
export const AMMETER_RESISTANCE = 0.1

/**
 * 电表读数规格：真实的分度值与量程。
 * 0.6A 量程：分度值 0.02A，可估读到 0.01A；3A 量程：分度值 0.1A。
 */
export const RANGE_SPEC: Readonly<Record<AmmeterRangeId, { max: number; division: number; label: string }>> = {
  '0.6A': { max: 0.6, division: 0.02, label: '0～0.6 A' },
  '3A': { max: 3, division: 0.1, label: '0～3 A' },
}

/** 指针满偏角度（度），与标准表盘一致：左侧 -60°，右侧满偏 +60° */
export const NEEDLE_LIMIT_ANGLE = 60

/** 接线柱拖拽命中区域（不可见加粗线段），便于触屏操作 */
export const TERMINAL_HIT_LENGTH = 118
export const TERMINAL_HIT_STROKE = 38

/** 工作台视图尺寸：命中线段必须画在这个范围内，否则会出现「看不见但能点」的死区 */
export const WORKBENCH_VIEW_WIDTH = 960
export const WORKBENCH_VIEW_HEIGHT = 540

function clampToWorkbench(value: number, max: number): number {
  return Math.min(max, Math.max(0, value))
}

/**
 * 接线柱命中线段：从接线柱指向元件内部。
 * 元件靠近工作台边缘时按视图范围截断，避免命中区溢出到工作台外面
 * （工作台外层是 overflow-hidden 的容器，溢出的接线段会被裁掉而表现为「拖不出导线」）。
 */
export function terminalHitSegment(id: AmmeterTerminalId): { x1: number; y1: number; x2: number; y2: number } {
  const terminal = CIRCUIT_TERMINALS[id]
  if (id === 'battery+' || id === 'battery-' || id === 'switch-a' || id === 'switch-b') {
    return {
      x1: terminal.x,
      y1: terminal.y,
      x2: terminal.x,
      y2: clampToWorkbench(terminal.y - TERMINAL_HIT_LENGTH, WORKBENCH_VIEW_HEIGHT),
    }
  }
  if (id === 'lamp1-a' || id === 'lamp1-b' || id === 'lamp2-a' || id === 'lamp2-b') {
    return {
      x1: terminal.x,
      y1: terminal.y,
      x2: clampToWorkbench(terminal.x + TERMINAL_HIT_LENGTH, WORKBENCH_VIEW_WIDTH),
      y2: terminal.y,
    }
  }
  return {
    x1: terminal.x,
    y1: terminal.y,
    x2: terminal.x,
    y2: clampToWorkbench(terminal.y + TERMINAL_HIT_LENGTH, WORKBENCH_VIEW_HEIGHT),
  }
}

/**
 * 接线柱是否可以开始拉线：开关闭合时按实验规范禁止改接导线，此时命中区不响应指针。
 * 其余情况下每一个接线柱都必须可拖，否则学生无法把电流表串联进电路。
 */
export function isTerminalDraggable(_id: AmmeterTerminalId, state: { switchClosed: boolean }): boolean {
  return !state.switchClosed
}

export function terminalAtPosition(position: Position): AmmeterTerminalId | null {
  for (const terminal of Object.values(CIRCUIT_TERMINALS)) {
    if (Math.hypot(position.x - terminal.x, position.y - terminal.y) <= TERMINAL_SNAP_RADIUS) return terminal.id
  }
  return null
}

/** 指针角度：按当前量程满偏比例映射 */
export function needleAngle(reading: number, range: AmmeterRangeId): number {
  const { max } = RANGE_SPEC[range]
  const ratio = Math.max(-1, Math.min(1, reading / max))
  return ratio * NEEDLE_LIMIT_ANGLE
}

/** 读数精度：按分度值取整（0.6A 量程分度值 0.02A，3A 量程分度值 0.1A） */
export function roundToDivision(reading: number, range: AmmeterRangeId): number {
  const { division } = RANGE_SPEC[range]
  const steps = Math.round(reading / division)
  return Number((steps * division).toFixed(3))
}
