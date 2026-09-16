/**
 * 「练习使用电流表」实验台的**可变布局模型**（无限画布的核心）。
 *
 * 竞品场景数据（competitorScene.ts / competitorGeometry.ts）是**初始坐标**：
 * 元件参考点、接线柱偏移、导线折线都来自竞品原始 JSON，保证一进页面 1:1 复原。
 *
 * 本模块在此之上叠加一层「可拖动」能力，并且保持三条不变量：
 *   1. 电学拓扑（edges）与几何坐标**完全解耦**——元件/导线怎么拖，电路是否成立
 *      只由 controller 的拓扑分析决定，拖动能改变画面但改不了电路对错；
 *   2. 接线柱坐标 = 所属元件坐标 + 固定偏移，因此拖动元件时它的接线柱、
 *      以及接在接线柱上的导线端点会**一起跟随**，导线不会与器材脱开；
 *   3. 导线端点永远由接线柱决定，手动拖动只调整**中间折点的垂足**，
 *      所以怎么拉都不会出现「线接在空气上」。
 *
 * 全部为纯函数 + 不可变数据，便于单测（layout.test.ts）。
 */
import type { Position } from '../../runtime/types'
import {
  COMPETITOR_TERMINAL_WORLD,
  COMPETITOR_WIRES,
  COMPETITOR_WORLD_COMPONENTS,
  worldToView,
} from './competitorScene'
import type { AmmeterTerminalId } from './definition'

/** 实验台上的 5 件器材 */
export type LabComponentId = 'E1' | 'S1' | 'S2' | 'L1' | 'A1'

export const LAB_COMPONENT_IDS: readonly LabComponentId[] = ['E1', 'S1', 'S2', 'L1', 'A1']

export const COMPONENT_LABELS: Readonly<Record<LabComponentId, string>> = {
  E1: '电源 E1',
  S1: '开关 S₁',
  S2: '开关 S₂',
  L1: '灯泡 L₁',
  A1: '电流表 A1',
}

/** 每件器材的模型中心（视图坐标，由竞品世界坐标换算） */
const DEFAULT_COMPONENT_CENTERS: Readonly<Record<LabComponentId, Position>> = (() => {
  const centers: Partial<Record<LabComponentId, Position>> = {}
  for (const component of COMPETITOR_WORLD_COMPONENTS) {
    centers[component.label as LabComponentId] = worldToView(component.wx, component.wy)
  }
  return centers as Readonly<Record<LabComponentId, Position>>
})()

/** 竞品接线柱 id → 本实验台接线柱 id 的归属器材 */
const TERMINAL_OWNER_COMPETITOR: Readonly<Record<string, LabComponentId>> = {
  'A1-neg': 'A1',
  'A1-0.6': 'A1',
  'A1-3': 'A1',
  'L1-a': 'L1',
  'L1-b': 'L1',
  'S1-a': 'S1',
  'S1-b': 'S1',
  'S2-a': 'S2',
  'S2-b': 'S2',
  'E1-neg': 'E1',
  'E1-pos': 'E1',
}

/** 竞品接线柱 id → 本实验台接线柱 id（与 competitorGeometry 保持一致） */
const COMPETITOR_TO_LAB: Readonly<Record<string, AmmeterTerminalId>> = {
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

function competitorIdToLabTerminal(id: string): AmmeterTerminalId {
  const mapped = COMPETITOR_TO_LAB[id]
  if (mapped === undefined) throw new Error(`未知的竞品接线柱：${id}`)
  return mapped
}

/**
 * 接线柱相对所属器材中心的偏移（视图坐标）。
 * 由竞品原始数据算出：偏移 = 接线柱视图坐标 − 器材中心视图坐标，
 * 拖动器材时直接平移该偏移即可，等价于器材本体在移动。
 */
export const TERMINAL_OFFSETS: Readonly<Record<AmmeterTerminalId, Position>> = (() => {
  const byWorld = new Map<string, LabComponentId>()
  for (const component of COMPETITOR_WORLD_COMPONENTS) {
    for (const terminal of component.terminals) {
      byWorld.set(`${terminal.wx}:${terminal.wy}`, component.label as LabComponentId)
    }
  }
  const offsets: Partial<Record<AmmeterTerminalId, Position>> = {}
  for (const [competitorId, terminal] of Object.entries(COMPETITOR_TERMINAL_WORLD)) {
    const owner = byWorld.get(`${terminal.x}:${terminal.y}`) ?? TERMINAL_OWNER_COMPETITOR[competitorId]
    const center = DEFAULT_COMPONENT_CENTERS[owner]
    const point = worldToView(terminal.x, terminal.y)
    offsets[competitorIdToLabTerminal(competitorId)] = { x: point.x - center.x, y: point.y - center.y }
  }
  return offsets as Readonly<Record<AmmeterTerminalId, Position>>
})()

/** 接线柱 → 所属器材（导出给场景与测试使用） */
export const TERMINAL_OWNER: Readonly<Record<AmmeterTerminalId, LabComponentId>> = Object.fromEntries(
  Object.keys(COMPETITOR_TO_LAB).map((competitorId) => [
    COMPETITOR_TO_LAB[competitorId],
    TERMINAL_OWNER_COMPETITOR[competitorId],
  ]),
) as Readonly<Record<AmmeterTerminalId, LabComponentId>>

/** 导线的中立键：无向，两个接线柱排序后拼接 */
export type WireKey = string

export function wireKey(from: AmmeterTerminalId, to: AmmeterTerminalId): WireKey {
  return [from, to].sort().join('::')
}

/** 一根导线的手工折点（相对两个端点的偏移量，绝对值由端点决定） */
export interface WireShape {
  /** 折点相对「端点连线」的法向偏移（正负表示左右） */
  bend: number
  /** 端点连线的方向（拖线时记录，元件被移动后按新方向重新投影） */
  direction: Position
}

export interface LabLayout {
  components: Readonly<Record<LabComponentId, Position>>
  wires: Readonly<Record<WireKey, WireShape>>
}

/** 初始布局：器材停在竞品原始坐标上，导线保持竞品原始手绘弧度 */
export function createDefaultLayout(): LabLayout {
  const components: Partial<Record<LabComponentId, Position>> = {}
  for (const id of LAB_COMPONENT_IDS) components[id] = { ...DEFAULT_COMPONENT_CENTERS[id] }

  const wires: Record<WireKey, WireShape> = {}
  for (const wire of COMPETITOR_WIRES) {
    const from = competitorIdToLabTerminal(wire.from)
    const to = competitorIdToLabTerminal(wire.to)
    wires[wireKey(from, to)] = competitorPolylineShape(wire.polyline, from, to)
  }
  return { components: components as Record<LabComponentId, Position>, wires }
}

/** 竞品原始折线 → 折点偏移（取中间点的平均法向距离，保留手绘弧度的大小） */
function competitorPolylineShape(
  polyline: readonly { x: number; y: number }[],
  from: AmmeterTerminalId,
  to: AmmeterTerminalId,
): WireShape {
  const start = terminalBasePosition(from)
  const end = terminalBasePosition(to)
  const direction = normalize({ x: end.x - start.x, y: end.y - start.y })
  const normal = { x: -direction.y, y: direction.x }
  const mids = polyline.slice(1, -1).map((point) => worldToView(point.x, point.y))
  if (mids.length === 0) return { bend: 0, direction }
  const total = mids.reduce((sum, point) => sum + ((point.x - start.x) * normal.x + (point.y - start.y) * normal.y), 0)
  return { bend: total / mids.length, direction }
}

/** 接线柱的初始坐标（拖动的基准） */
function terminalBasePosition(id: AmmeterTerminalId): Position {
  for (const [competitorId, terminal] of Object.entries(COMPETITOR_TERMINAL_WORLD)) {
    if (competitorIdToLabTerminal(competitorId) === id) return worldToView(terminal.x, terminal.y)
  }
  throw new Error(`未知接线柱：${id}`)
}

function normalize(vector: Position): Position {
  const length = Math.hypot(vector.x, vector.y)
  if (length < 1e-6) return { x: 1, y: 0 }
  return { x: vector.x / length, y: vector.y / length }
}

/**
 * 接线柱在画布上的坐标。
 * 这是「拖动器材后导线跟着走」的关键：接线柱坐标完全由所属器材位置推导。
 */
export function terminalPosition(layout: LabLayout, id: AmmeterTerminalId): Position {
  const owner = TERMINAL_OWNER[id]
  const center = layout.components[owner]
  const offset = TERMINAL_OFFSETS[id]
  return { x: center.x + offset.x, y: center.y + offset.y }
}

export function terminalPositions(layout: LabLayout): Record<AmmeterTerminalId, Position> {
  const result: Partial<Record<AmmeterTerminalId, Position>> = {}
  for (const id of Object.keys(TERMINAL_OFFSETS) as AmmeterTerminalId[]) result[id] = terminalPosition(layout, id)
  return result as Record<AmmeterTerminalId, Position>
}

/**
 * 器材可移动的世界范围。
 * 「无限画布」不等于无限乱飘：给一个足够大的工作世界（约 ±8 屏），
 * 学生可以把器材摆到任意位置构图，但不会因为拖太远而彻底丢失。
 */
export const CANVAS_WORLD_BOUNDS = { minX: -1440, minY: -900, maxX: 2400, maxY: 1440 } as const

export function clampComponentPosition(id: LabComponentId, position: Position): Position {
  const margin = COMPONENT_BODY_MARGIN[id]
  return {
    x: Math.min(CANVAS_WORLD_BOUNDS.maxX - margin.x, Math.max(CANVAS_WORLD_BOUNDS.minX + margin.x, position.x)),
    y: Math.min(CANVAS_WORLD_BOUNDS.maxY - margin.y, Math.max(CANVAS_WORLD_BOUNDS.minY + margin.y, position.y)),
  }
}

/** 器材移动时应保持的最小可见边距（拖到边界也不让器材跑出世界） */
export const COMPONENT_BODY_MARGIN: Readonly<Record<LabComponentId, { x: number; y: number }>> = {
  E1: { x: 128, y: 60 },
  S1: { x: 96, y: 60 },
  S2: { x: 96, y: 60 },
  L1: { x: 90, y: 78 },
  A1: { x: 92, y: 84 },
}

/** 移动一件器材：只改它自己的坐标，接线柱与导线端点自动跟随 */
export function moveComponent(layout: LabLayout, id: LabComponentId, position: Position): LabLayout {
  return { ...layout, components: { ...layout.components, [id]: clampComponentPosition(id, position) } }
}

/** 拖动器材本体（而不是拖接线柱）时的命中半径 */
export const COMPONENT_HIT_RADIUS: Readonly<Record<LabComponentId, { rx: number; ry: number }>> = {
  E1: { rx: 124, ry: 46 },
  S1: { rx: 92, ry: 46 },
  S2: { rx: 92, ry: 46 },
  L1: { rx: 86, ry: 66 },
  A1: { rx: 86, ry: 64 },
}

/** 命中测试：画布坐标落在哪件器材上（后画的优先，与绘制顺序一致） */
export function componentAt(layout: LabLayout, position: Position): LabComponentId | null {
  for (const id of [...LAB_COMPONENT_IDS].reverse()) {
    const center = layout.components[id]
    const radius = COMPONENT_HIT_RADIUS[id]
    const dx = (position.x - center.x) / radius.rx
    const dy = (position.y - center.y) / radius.ry
    if (dx * dx + dy * dy <= 1) return id
  }
  return null
}

/**
 * 导线的实际绘制折点。
 * 端点永远取自接线柱（所以元件一动导线端点就跟着动），
 * 中间折点按「端点连线 + 法向偏移」计算（所以元件移动后弧度也跟着重新投影，
 * 不会出现折点留在原地、导线被拉成一条诡异的曲线）。
 */
export function wirePathPoints(layout: LabLayout, from: AmmeterTerminalId, to: AmmeterTerminalId): Position[] {
  const start = terminalPosition(layout, from)
  const end = terminalPosition(layout, to)
  const direction = normalize({ x: end.x - start.x, y: end.y - start.y })
  const normal = { x: -direction.y, y: direction.x }
  const shape = layout.wires[wireKey(from, to)]
  const bend = shape?.bend ?? 0
  if (Math.abs(bend) < 0.5) return [start, end]
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const control = { x: middle.x + normal.x * bend, y: middle.y + normal.y * bend }
  return [start, control, end]
}

/** 折线 → SVG 路径（二次贝塞尔平滑，贴近实物导线的自然弧度） */
export function wirePathD(layout: LabLayout, from: AmmeterTerminalId, to: AmmeterTerminalId): string {
  const points = wirePathPoints(layout, from, to)
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`
  }
  const [start, control, end] = points
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
}

/** 拖动折点时允许的最大弧度（世界坐标），避免把导线拉成夸张的圆环 */
export const MAX_WIRE_BEND = 260

/** 折点手柄的位置（拖动手柄画在这里，与导线的控制点一致） */
export function wireHandlePosition(layout: LabLayout, from: AmmeterTerminalId, to: AmmeterTerminalId): Position {
  const points = wirePathPoints(layout, from, to)
  return points.length === 3 ? points[1] : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
}

/** 拖拽折点手柄时的命中半径 */
export const WIRE_HANDLE_RADIUS = 26

/**
 * 命中测试：画布坐标是否落在某根导线的折点手柄上。
 * 只对「当前接线柱上真实存在的导线」生效，返回该导线的两个端点。
 */
export function wireHandleAt(
  layout: LabLayout,
  edges: readonly { from: AmmeterTerminalId; to: AmmeterTerminalId }[],
  position: Position,
  radius = WIRE_HANDLE_RADIUS,
): { from: AmmeterTerminalId; to: AmmeterTerminalId } | null {
  let best: { edge: { from: AmmeterTerminalId; to: AmmeterTerminalId }; distance: number } | null = null
  for (const edge of edges) {
    const handle = wireHandlePosition(layout, edge.from, edge.to)
    const distance = Math.hypot(position.x - handle.x, position.y - handle.y)
    if (distance <= radius && (best === null || distance < best.distance)) best = { edge, distance }
  }
  return best?.edge ?? null
}

/**
 * 把指针位置投影成导线的弧度。
 * 投影到「端点连线的法向」上，因此拖动折点只改变弯曲程度与方向，
 * 端点始终牢牢接在接线柱上 —— 这就是「像真导线一样可以任意弯折」的手感。
 */
export function bendFromPosition(layout: LabLayout, from: AmmeterTerminalId, to: AmmeterTerminalId, position: Position): number {
  const start = terminalPosition(layout, from)
  const end = terminalPosition(layout, to)
  const direction = normalize({ x: end.x - start.x, y: end.y - start.y })
  const normal = { x: -direction.y, y: direction.x }
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const bend = (position.x - middle.x) * normal.x + (position.y - middle.y) * normal.y
  return Math.max(-MAX_WIRE_BEND, Math.min(MAX_WIRE_BEND, bend))
}

/** 设置某根导线的弧度（拖动折点手柄时调用） */
export function setWireBend(
  layout: LabLayout,
  from: AmmeterTerminalId,
  to: AmmeterTerminalId,
  bend: number,
): LabLayout {
  const start = terminalPosition(layout, from)
  const end = terminalPosition(layout, to)
  const direction = normalize({ x: end.x - start.x, y: end.y - start.y })
  const key = wireKey(from, to)
  const clamped = Math.max(-MAX_WIRE_BEND, Math.min(MAX_WIRE_BEND, bend))
  return { ...layout, wires: { ...layout.wires, [key]: { bend: clamped, direction } } }
}

/** 画布内容包围盒：把所有器材本体与导线折点都算进去（用于相机自动聚焦） */
export function layoutBounds(layout: LabLayout): { minX: number; minY: number; maxX: number; maxY: number } {
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
  for (const id of LAB_COMPONENT_IDS) {
    const margin = COMPONENT_BODY_MARGIN[id]
    visit({ x: layout.components[id].x - margin.x + 64, y: layout.components[id].y - margin.y + 64 })
    visit({ x: layout.components[id].x + margin.x - 64, y: layout.components[id].y + margin.y - 64 })
  }
  for (const [key, shape] of Object.entries(layout.wires)) {
    const [from, to] = key.split('::') as [AmmeterTerminalId, AmmeterTerminalId]
    for (const point of wirePathPoints(layout, from, to)) visit(point, Math.abs(shape.bend) > 0.5 ? 0 : 8)
  }
  return { minX, maxX, minY, maxY }
}

/** 重置布局：回到竞品原始构图 */
export function resetLayout(): LabLayout {
  return createDefaultLayout()
}
