/**
 * 竞品场景几何：把 competitorScene.ts 里的世界坐标换算成本实验台视图坐标，
 * 输出器材参考点、接线柱坐标与导线折线，供场景组件直接使用。
 *
 * 所有数字都来自竞品真实场景，不是目测：接线柱坐标与导线折线由
 * competitorScene.ts 中的世界坐标经 worldToView 等比映射得到。
 */
import {
  COMPETITOR_WIRES,
  COMPETITOR_TERMINAL_WORLD,
  COMPETITOR_WORLD_COMPONENTS,
  worldToView,
  type CompetitorTerminalId,
} from './competitorScene'
import type { AmmeterTerminalId } from './definition'
import type { Position } from '../../runtime/types'

/** 竞品接线柱 id → 本实验台接线柱 id */
export const COMPETITOR_TO_LAB_TERMINAL: Readonly<Record<CompetitorTerminalId, AmmeterTerminalId>> = {
  'A1-neg': 'ammeter-neg',
  'A1-0.6': 'ammeter-0.6',
  'A1-3': 'ammeter-3',
  'L1-a': 'lamp1-a',
  'L1-b': 'lamp1-b',
  'S1-a': 'switch-a',
  'S1-b': 'switch-b',
  'S2-a': 'lamp2-a',
  'S2-b': 'lamp2-b',
  'E1-neg': 'battery-',
  'E1-pos': 'battery+',
}

/** 接线柱绘制顺序：与竞品场景中器件出现顺序保持一致 */
export const TERMINAL_DRAW_ORDER: readonly AmmeterTerminalId[] = [
  'battery-',
  'battery+',
  'switch-a',
  'switch-b',
  'lamp2-a',
  'lamp2-b',
  'lamp1-a',
  'lamp1-b',
  'ammeter-neg',
  'ammeter-0.6',
  'ammeter-3',
]

function toView(x: number, y: number): Position {
  return worldToView(x, y)
}

const componentCenters = Object.fromEntries(
  COMPETITOR_WORLD_COMPONENTS.map((component) => [component.label, toView(component.wx, component.wy)]),
) as Record<'A1' | 'L1' | 'S1' | 'S2' | 'E1', Position>

const terminalPoints: Partial<Record<AmmeterTerminalId, Position>> = {}
for (const [competitorId, terminal] of Object.entries(COMPETITOR_TERMINAL_WORLD)) {
  terminalPoints[COMPETITOR_TO_LAB_TERMINAL[competitorId as CompetitorTerminalId]] = toView(terminal.x, terminal.y)
}

/** 每根竞品导线的折线（视图坐标），顺序与竞品场景一致 */
const wirePolylines: readonly (readonly Position[])[] = COMPETITOR_WIRES.map((wire) =>
  wire.polyline.map((point) => toView(point.x, point.y)),
)

export const competitorTerminalPoints = {
  terminals: terminalPoints,
  order: TERMINAL_DRAW_ORDER,
} as const

export const competitorComponentPoints = {
  componentCenters,
} as const

export const competitorWirePolylines = wirePolylines

/**
 * 场景包围盒（含器材本体占位）：用于回归测试，保证画面不会被 overflow-hidden 裁掉。
 * 器材本体在接线柱上下各约 55px 范围内，因此按接线柱向外扩 55px 估算。
 */
export const COMPONENT_BODY_MARGIN = 55

export function competitorSceneBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  const visit = (point: Position, margin = 0) => {
    minX = Math.min(minX, point.x - margin)
    maxX = Math.max(maxX, point.x + margin)
    minY = Math.min(minY, point.y - margin)
    maxY = Math.max(maxY, point.y + margin)
  }
  for (const point of Object.values(competitorTerminalPoints.terminals)) visit(point!, COMPONENT_BODY_MARGIN)
  for (const polyline of competitorWirePolylines) for (const point of polyline) visit(point)
  return { minX, maxX, minY, maxY }
}
