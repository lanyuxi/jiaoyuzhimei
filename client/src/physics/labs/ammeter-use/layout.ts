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
import { projectPerspective, unprojectPerspective } from '../../runtime/immersive/canvas'
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
 * 器材可移动的世界范围 —— **只是防丢失的兜底，不是画布边界**。
 *
 * 这里曾经是一个 `{minX:-1440, minY:-900, maxX:2400, maxY:1440}` 的硬钳制，
 * 那正是"固定画布"的根因：
 *   · 相机在 `fitContent` 之后把 960×540 视图放大到约 1.4～1.6 倍，
 *     屏幕上能看到的世界范围只有约 1000×420；
 *   · 而钳制允许的可拖世界宽 3840、高 2340 —— 比可见范围大好几倍。
 *   结果是学生把器材往边上一拖，器材立刻跑到**屏幕外面**，
 *   看起来就是"拖动一下就没了 / 被遮挡了"。
 *
 * 现在改成以「初始构图」为基准、向外放宽 `UNREACHABLE_WORLD_MARGIN` 的大范围，
 * 语义是：**画布在屏幕范围内的任意位置都能放器材，这个范围只是防止
 * 学生手滑把器材拖到再也找不回来的地方**（配合"复位摆位"可一键恢复）。
 */
export const UNREACHABLE_WORLD_MARGIN = 6000

export const CANVAS_WORLD_BOUNDS = (() => {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const center of Object.values(DEFAULT_COMPONENT_CENTERS)) {
    minX = Math.min(minX, center.x)
    maxX = Math.max(maxX, center.x)
    minY = Math.min(minY, center.y)
    maxY = Math.max(maxY, center.y)
  }
  return {
    minX: minX - UNREACHABLE_WORLD_MARGIN,
    maxX: maxX + UNREACHABLE_WORLD_MARGIN,
    minY: minY - UNREACHABLE_WORLD_MARGIN,
    maxY: maxY + UNREACHABLE_WORLD_MARGIN,
  } as const
})()

export function clampComponentPosition(id: LabComponentId, position: Position): Position {
  const margin = COMPONENT_BODY_MARGIN[id]
  return {
    x: Math.min(CANVAS_WORLD_BOUNDS.maxX - margin.x, Math.max(CANVAS_WORLD_BOUNDS.minX + margin.x, position.x)),
    y: Math.min(CANVAS_WORLD_BOUNDS.maxY - margin.y, Math.max(CANVAS_WORLD_BOUNDS.minY + margin.y, position.y)),
  }
}

/**
 * 器材本体的可见边距（半宽 / 半高）—— **唯一权威口径**。
 *
 * 语义：`器材中心 ± 该边距` = 器材本体外接矩形。**一切"是否在屏幕上"的判定
 * 与"收回挪到哪里"都以它为准**，见 `isComponentOffCanvas` / `rescueBox`。
 *
 * 注意它是**几何事实**，不是"命中区大小"。历史上为了省事把它和拖动命中区绑在
 * 一起，结果两头都受伤：
 *   · 当初命中区比它大 32px → 按本体边距收回后**命中区**仍探出屏幕，
 *     画面看着像"器材被切掉一块"；
 *   · 后来把两者改成同一个值 → 命中区**没有一丝点击余量**，
 *     两件器材在同一条水平线上排开时，后画的完全盖住前画的，
 *     学生点不中藏在后面的那件（`componentAt` 的椭圆恰好贴边）。
 * 现在两者**解绑**：本体边距只描述几何、命中区另行外扩 `COMPONENT_HIT_PADDING`。
 */
export const COMPONENT_BODY_MARGIN: Readonly<Record<LabComponentId, { x: number; y: number }>> = {
  E1: { x: 124, y: 60 },
  S1: { x: 92, y: 60 },
  S2: { x: 92, y: 60 },
  L1: { x: 86, y: 78 },
  A1: { x: 86, y: 84 },
}

/**
 * 拖动命中区相对器材本体的外扩量（画布单位）。
 *
 * 存在的理由：**给最小的点击余量**。没有余量时，两件器材被拖到同一条水平线上，
 * 后画的那件会把先画的完全盖住，`componentAt` 的椭圆判据刚好贴着本体边界，
 * 于是藏在后面那件**永远点不中**（实测：1688×841、相机 fitContent 下
 * E1 与 S1 的合法 y 区间完全重合，都是 `y ∈ [22.36, 440.09]`）。
 *
 * 32px 与历史上"命中区比本体大 32px"的旧值一致，但**性质完全不同**：
 * 那时本体边距被当成命中区用，才会出现"收回后命中区露在屏幕外"；
 * 现在命中区只影响"按下去抓到谁"，**收回与判据一律读本体边距**，
 * 所以命中区再大也不会让画面出现被裁的一角。
 */
export const COMPONENT_HIT_PADDING = 32

/**
 * 命中区外扩量的**上限**（相对本体较短边的比例）。
 *
 * 外扩不是越大越好：两件器材并排时，外扩过大反而会让"点 A 却抓到 B"。
 * 取本体较大半轴的 45%，再夹在 `[22, 32]` 之间：
 * 小器材（S1/S2/L1/A1 的最大半轴只有 78～92）拿 ~30px，
 * 大器材 E1 拿满 32px —— 两者都是"有明确余量但不会喧宾夺主"。
 */
const COMPONENT_HIT_PADDING_MIN = 22

/** 移动一件器材：只改它自己的坐标，接线柱与导线端点自动跟随 */
export function moveComponent(layout: LabLayout, id: LabComponentId, position: Position): LabLayout {
  return { ...layout, components: { ...layout.components, [id]: clampComponentPosition(id, position) } }
}

/**
 * 拖动器材本体（而不是拖接线柱）时的命中半径 = **本体 + `COMPONENT_HIT_PADDING`**。
 *
 * 它是「描边」而不是「几何」：只参与 `componentAt` 的抓取判定，
 * **不参与** `isComponentOffCanvas` / `rescueComponent`（那两处只读本体边距）。
 * 这条解绑是必需的 —— 绑在一起的两个方向都踩过坑，见 `COMPONENT_HIT_PADDING` 注释。
 */
export function componentHitPadding(id: LabComponentId): number {
  const margin = COMPONENT_BODY_MARGIN[id]
  // 本体越小，外扩越收敛：以本体两条半轴中的**较大者**为基准按比例给余量
  const larger = Math.max(margin.x, margin.y)
  const scaled = larger * 0.45
  return Math.max(COMPONENT_HIT_PADDING_MIN, Math.min(COMPONENT_HIT_PADDING, scaled))
}

export const COMPONENT_HIT_RADIUS: Readonly<Record<LabComponentId, { rx: number; ry: number }>> = Object.fromEntries(
  (Object.keys(COMPONENT_BODY_MARGIN) as LabComponentId[]).map((id) => [
    id,
    {
      rx: COMPONENT_BODY_MARGIN[id].x + componentHitPadding(id),
      ry: COMPONENT_BODY_MARGIN[id].y + componentHitPadding(id),
    },
  ]),
) as Readonly<Record<LabComponentId, { rx: number; ry: number }>>

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

/**
 * 画布内容包围盒：把所有器材**本体外接矩形**与导线折点都算进去（用于相机自动聚焦）。
 *
 * 历史上这里是 `center ± (边距 − 64)` —— 也就是**故意把包围盒缩小 64px**，
 * 指望"聚焦时反正还有 120px 留白"来兜住。这个假设是错的，且后果很显眼：
 *
 *   聚焦用的是"能用的矩形"（屏幕高度 − 顶部 56px − 底部 60px），
 *   缩小的包围盒让相机把内容放大到几乎顶满整个可用矩形，
 *   而器材本体的上缘比缩小的包围盒还高出 55～58px
 *   → **一进页面 E1 / S1 / S2 的上缘就被顶部工具栏切掉**（实测 1688×841）。
 *
 * 这正是需求截图里"器材被遮挡"的初始状态。现在改为**按本体真实外接矩形**取包围盒，
 * 于是"相机算出来的构图"与"判据要求本体完整可见"用的是同一套几何，
 * 入屏即终态，不需要靠不变量事后补救。
 */
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
    const rect = componentBodyRect(id, layout.components[id])
    visit({ x: rect.left, y: rect.top })
    visit({ x: rect.right, y: rect.bottom })
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

/* ------------------------------------------------------------------ *
 * 初始构图 → 舞台坐标
 * ------------------------------------------------------------------ */

/**
 * 把「竞品原始构图」整体摆放进**当前视口**。
 *
 * 为什么必须做这一步：竞品数据是 960×540 的固定坐标系，而现在的画布
 * 就是整个视口。「原样搬到视口原点」会让构图缩在左上角一小块里；
 * 「原样居中不缩放」在窄屏上又会溢出去。所以按**等比缩放 + 居中**摆放，
 * 与相机聚焦（`fitContent`）用的是同一套目标区域 —— 入屏即终态，不会二次位移。
 *
 * 缩放上限 1：**只缩小、不放大**。竞品构图在 960×540 里是"排满"的，
 * 放大只会让器材糊掉；而窄屏缩小时必须缩，否则器材会跑到屏幕外。
 *
 * 只处理**平移 + 等比缩放**，因此：
 *   · 器材之间的相对构图（接线柱偏移、导线弧度）完全不变，
 *     电学拓扑与几何的自洽关系原样保留；
 *   · 接线柱坐标仍由 `terminalPosition` 推导，导线端点仍跟着器材走。
 */
export function fitLayoutToStage(
  layout: LabLayout,
  view: { minX: number; minY: number; maxX: number; maxY: number },
): LabLayout {
  const bounds = layoutBounds(layout)
  const sourceWidth = Math.max(1e-6, bounds.maxX - bounds.minX)
  const sourceHeight = Math.max(1e-6, bounds.maxY - bounds.minY)
  const targetWidth = Math.max(1e-6, view.maxX - view.minX)
  const targetHeight = Math.max(1e-6, view.maxY - view.minY)
  const scale = Math.min(1, targetWidth / sourceWidth, targetHeight / sourceHeight)
  const sourceCenter = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }
  const targetCenter = { x: (view.minX + view.maxX) / 2, y: (view.minY + view.maxY) / 2 }
  const project = (point: Position): Position => ({
    x: (point.x - sourceCenter.x) * scale + targetCenter.x,
    y: (point.y - sourceCenter.y) * scale + targetCenter.y,
  })

  const components: Partial<Record<LabComponentId, Position>> = {}
  for (const id of LAB_COMPONENT_IDS) components[id] = project(layout.components[id])

  /**
   * 导线弧度：折点是"相对端点连线的法向偏移"，整体等比缩放时
   * 偏移量也必须按同一比例缩放，否则缩放后导线弧度会与器材尺寸对不上。
   */
  const wires: Record<WireKey, WireShape> = {}
  for (const [key, shape] of Object.entries(layout.wires)) {
    wires[key] = { bend: shape.bend * scale, direction: { ...shape.direction } }
  }
  return { components: components as Record<LabComponentId, Position>, wires }
}

/* ------------------------------------------------------------------ *
 * 布局不变量：全屏可见性（对应需求「整个屏幕的无限画布 / 拖动不被遮挡」）
 * ------------------------------------------------------------------ */

/**
 * 画布可见范围（画布坐标）。
 *
 * 这是"整个屏幕的无限画布"的**可判定定义**：
 * 一块相机变换后的画布，在屏幕上任何位置都是可达的，
 * 因此真正需要保证的不是某个固定矩形，而是「器材不要被拖进一块再也够不着的地方」。
 *
 * 传入的值 = 布局坐标系里当前可见的那块矩形（由屏幕矩形经相机反算得到）。
 * `null` 表示"不限制"（例如相机尺寸还没测量出来）。
 */
export type CanvasVisibleRect = { minX: number; minY: number; maxX: number; maxY: number } | null

/** 触屏 / 悬浮控件会盖住画布边缘，留出安全内缩，避免器材被顶栏底栏压住 */
export const VISIBLE_SAFE_INSET = 72

/**
 * 顶部悬浮控件（返回 + 实验名 + 工具栏）与底部读数条占用的安全高度。
 *
 * 这两个值**同时**决定三件事，必须只有一个来源，否则又会退回"两套口径"：
 *   1. 可见范围（`visibleScreenArea`）；
 *   2. 松手收回的判定范围；
 *   3. 单元测试复刻的屏幕矩形。
 */
export const SAFE_TOP = 56
export const SAFE_BOTTOM = 60

/**
/**
 * 悬浮控件**实际压住的**那块区域 —— **真机实测的矩形清单**，不是估的边距。
 *
 * 为什么不能只用"四条边的净空"建模（上一版就是这么做的，然后全线失守）：
 * 浮层**不是**规规矩矩贴着四条边排的。实测 8 个视口量下来，至少有三类会被漏掉：
 *   1. **离边还有一段距离的控件**：右侧协作入口胶囊组是 `right-[68px]`，
 *      宽视口下它落在 `x = width-312 .. width-68`，既不算贴左边、也不算贴右边
 *      —— 按"贴边净空"建模必然漏（1375 宽下它占 `x1063..1307`，正盖在画面中右侧）。
 *   2. **随视口换行/堆叠的控件**：底部读数条在 1375 下是 688×96，
 *      到 390×780 变成 198×152 —— 高度翻倍，一个固定 `CONTROL_BOTTOM` 追不上。
 *   3. **只在一条边很窄的控件**：右上画布工具条只有 42px 宽、下缘到 166，
 *      但底部读数条只到 112 —— 一条"上边 166"会把整幅画布上沿切掉一大块，
 *      而真正的障碍物其实只在最右侧 42px。
 *
 * 所以这里按**实测矩形**建模：每条记录 = 真机上量到的一个浮层
 * （相对舞台左上角的 x/y/w/h，单位屏幕像素），
 * `controlAvoidArea` 只作为"聚焦摆哪块"的保守外接矩形，
 * 精确的"某件器材有没有被压住"一律走 `pushOutOfControls`（按真实矩形算）。
 *
 * 实测方法（可复现）：`vite preview` 起真页面，逐视口枚举所有
 * `z-index ≥ 20` 且 `position: absolute|fixed|sticky` 的浮层，
 * `getBoundingClientRect()` 后裁到舞台矩形内、去重。
 * `viewportConsistency.test.ts` 里有一份**独立量出来的**副本 `MEASURED_OVERLAYS`，
 * 与本清单互相校验：任一边漂移超过容差就直接红。
 */
export interface ControlObstacle {
  /** 相对舞台左上角 */
  x: number
  y: number
  width: number
  height: number
  /** 只在视口宽 ≥ 该值时出现（用于"窄屏下控件换行 / 位移"这类差异） */
  minStageWidth?: number
  /** 只在视口宽 ≤ 该值时出现 */
  maxStageWidth?: number
}

/** 判定"浮层已挤进画面中部"的舞台宽度阈值（真机换行实测：768 之下开始换行） */
export const CONTROL_NARROW_STAGE = 900

/** 左侧控件（工具条 + 操作提示）的横向边界 */
export const CONTROL_LEFT = 148
/** 右侧控件（协作入口胶囊组）的横向边界 */
export const CONTROL_RIGHT = 244
/** 上侧控件（顶部标题栏 70 / 右上工具条 166）的纵向边界 */
export const CONTROL_TOP = 166
/** 下侧控件（底部读数条 + 提示胶囊）的纵向边界 */
export const CONTROL_BOTTOM = 168

/**
 * 真机实测的浮层矩形（相对舞台左上角，屏幕像素）。
 *
 * 每条都注明对应的类名，改布局时必须同步更新 —— 这份清单存在的意义，
 * 就是把"画面上真的有那些控件"变成**可断言的事实**，而不是注释里的一句话。
 */
export function controlObstacles(width: number, height: number): ControlObstacle[] {
  const stageWidth = Math.max(0, width)
  const stageHeight = Math.max(0, height)
  const raw: ControlObstacle[] = [
    // 顶部标题栏（全宽，高 70）
    { x: 0, y: 0, width: stageWidth, height: 70 },
    // 右上画布工具条：`right-4 top-4`，42 宽、高 150 → 下缘 166（纵向最深的上侧控件）
    { x: Math.max(0, stageWidth - 58), y: 16, width: 42, height: 150 },
    // 左：转电路图 `left-4 top-16 w-[78px]`
    { x: 16, y: 64, width: 78, height: 83 },
    // 左：复位摆位 `left-4 top-[164px] w-[78px]`
    { x: 16, y: 164, width: 78, height: 83 },
    // 左：操作提示 `left-4 top-[224px] w-[132px]` → 右缘 148
    { x: 16, y: 224, width: 132, height: 78 },
    /**
     * 右：协作入口胶囊组 `right-[68px]`（三个 `w-[76px]` + `gap-2` = 244 宽）。
     *
     * 它在**所有**视口下都是 `x = stageWidth - 312 .. stageWidth - 68` ——
     * 实测 1375/1280/1920/1024/768 全部逐像素吻合；
     * 390 宽下 `390-312 = 78`，与实测的 `x=78` 也吻合
     * （也就是说它是"被挤到左边"而不是"换了布局"，一个公式全包）。
     * 之前按"宽 / 窄两分支"建模是多余的，而且窄分支的阈值一旦和真实断点不一致就会漏。
     */
    { x: Math.max(0, stageWidth - 312), y: 64, width: 244, height: 75 },
  ]

  /**
   * 底部读数条：`bottom-4 left-1/2 max-w-[min(1080px,94vw)]` + `flex-wrap`。
   *
   * 它是**内容撑开**的（宽度 = 内容自然宽，上限 `min(1080px, 94vw)`），
   * 不是"占满 94vw" —— 实测 1375 宽下只有 688（= 50%），
   * 若按 94vw 建模会把整条下边都算成障碍物，反而让可用区凭空变窄。
   *
   * 内容自然宽实测：1375→688、1280→640、1024→512、768→384、1920→751。
   * 高度随 `flex-wrap` 换行增长：宽视口 96（1920 一行放得下 → 54），
   * 768 → 123，390 → 152。
   *
   * 建模用一个显式的**内容宽度表**（就近取实测值，中间线性插值），
   * 这样"换行 / 内部换行"这类真实行为都被覆盖，而不是靠猜一个比例。
   */
  const readoutTable: readonly { stage: number; width: number; height: number }[] = [
    { stage: 390, width: 198, height: 152 },
    { stage: 768, width: 384, height: 123 },
    { stage: 1024, width: 512, height: 96 },
    { stage: 1280, width: 640, height: 96 },
    { stage: 1375, width: 688, height: 96 },
    { stage: 1920, width: 751, height: 54 },
  ]
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const readoutAt = (() => {
    if (stageWidth <= readoutTable[0].stage) return readoutTable[0]
    const last = readoutTable[readoutTable.length - 1]
    if (stageWidth >= last.stage) return last
    for (let i = 0; i < readoutTable.length - 1; i += 1) {
      const lo = readoutTable[i]
      const hi = readoutTable[i + 1]
      if (stageWidth >= lo.stage && stageWidth <= hi.stage) {
        const t = (stageWidth - lo.stage) / (hi.stage - lo.stage)
        return { width: lerp(lo.width, hi.width, t), height: lerp(lo.height, hi.height, t) }
      }
    }
    return last
  })()
  /** 读数条永远不可能比舞台还宽（`max-w-[… 94vw]`），也不会比内容还宽 */
  const readoutWidth = Math.min(readoutAt.width, stageWidth * 0.94, 1080)
  raw.push({
    x: Math.max(0, (stageWidth - readoutWidth) / 2),
    y: Math.max(0, stageHeight - 16 - readoutAt.height),
    width: readoutWidth,
    height: readoutAt.height,
  })

  /**
   * 底部提示胶囊（"无限画布已开启…"，228×33）。
   * 宽视口 `bottom-4 right-4`；窄视口被挤到 `left-1/2` 居中
   * （实测 390×780 在 `x146..374`，即居中），此时它与读数条上下叠。
   */
  const hintWidth = 228
  const hintX = Math.max(0, stageWidth - 244)
  const hintY = Math.max(0, stageHeight - 109)
  raw.push({ x: hintX, y: hintY, width: hintWidth, height: 33 })
  /**
   * 窄视口下提示胶囊被 `left-1/2` 挤到画面中部（实测 390×780 在 `x146..374`），
   * 与读数条在纵向上叠在一起。它比"贴右边"的版本更靠中间，
   * 所以必须**额外**补一条中部矩形，否则 390 宽度下它会漏网。
   */
  if (stageWidth < CONTROL_NARROW_STAGE) {
    raw.push({ x: Math.max(0, (stageWidth - hintWidth) / 2), y: hintY, width: hintWidth, height: 33 })
  }

  return raw
    .map((box) => {
      const x = Math.min(Math.max(box.x, 0), stageWidth)
      const y = Math.min(Math.max(box.y, 0), stageHeight)
      return {
        ...box,
        x,
        y,
        width: Math.max(0, Math.min(box.width, stageWidth - x)),
        height: Math.max(0, Math.min(box.height, stageHeight - y)),
      }
    })
    .filter((box) => box.width > 0 && box.height > 0)
}

/**
 * 悬浮控件**实际压住的**那块区域（相对舞台左上角）——
 * 由 `controlObstacles` 的实测矩形推出。
 *
 * 与 `visibleScreenArea`（= 整块屏幕）是两个不同的东西：
 *   · `visibleScreenArea` 回答"画布铺到哪" —— 答案是"整块屏幕"；
 *   · 本函数回答"聚焦时把内容摆进哪块"。
 *
 * 注意这是**保守外接矩形**，只用于聚焦；精确的"器材有没有被压住"走
 * `pushOutOfControls`（按真实矩形算），两者不可互相替代。
 */
export function controlAvoidArea(width: number, height: number): { left: number; top: number; right: number; bottom: number } {
  const stageWidth = Math.max(0, width)
  const stageHeight = Math.max(0, height)
  let left = 0
  let top = 0
  let right = stageWidth
  let bottom = stageHeight
  for (const box of controlObstacles(stageWidth, stageHeight)) {
    /**
     * 只把"真的贴着某条边、且**没有横跨整条边**"的盒子计进那一条边。
     *
     * 两条都不能少：
     *   · 右上角那个 42px 宽的工具条会把**整幅画布的上沿**都算成不可用 ——
     *     所以必须"贴着"；
     *   · 全宽的顶部标题栏（0..W）与全宽的底部读数条会把左右净空顶到满格 ——
     *     所以必须排除"横跨整条边"的那种。它只该贡献上/下净空。
     */
    const TOL = 24
    /**
     * "横跨整条边"的判定不能只比宽度 —— 底部读数条是 `max-w-[min(1080px,94vw)]`，
     * 在 768 宽下是 `x23..745`（宽 94%），左边不贴边、右边勉强算贴边。
     * 它只该贡献**下净空**，不该把左右净空也顶满。
     * 用"覆盖率"判定：宽度超过舞台 85% 就算横跨。
     */
    const spansWidth = box.width >= stageWidth * 0.85
    const spansHeight = box.height >= stageHeight * 0.85
    if (!spansWidth && box.x <= TOL) left = Math.max(left, box.x + box.width)
    if (!spansHeight && box.y <= TOL) top = Math.max(top, box.y + box.height)
    if (!spansWidth && box.x + box.width >= stageWidth - TOL) right = Math.min(right, box.x)
    if (!spansHeight && box.y + box.height >= stageHeight - TOL) bottom = Math.min(bottom, box.y)
  }
  /**
   * 净空可能互相穿透（例如 390 宽时左工具条右缘 148、协作胶囊组左缘 78）。
   *
   * 注意这是**真实存在的物理冲突**：画面上左工具条与右侧胶囊组本来就叠在一起，
   * 屏幕上**没有**一块"完全没被控件压住"的横向区间。
   * 此时返回退化空矩形（`right < left`）会让判据失去意义，
   * 所以如实取"两者更靠中间的那条边界"作为分界，保证 `right = left`（零宽可用区），
   * 这样调用方一眼就能看出"这个视口没有横向可用区"，
   * 转而走"能挪多少算多少 + 精确浮层避让"（`pushOutOfControls`）。
   */
  if (right < left) {
    const boundary = Math.min(left, right + (left - right))
    left = Math.max(left, (left + right) / 2)
    right = Math.max(right, boundary > left ? left : left)
    right = left
  }
  top = Math.min(top, stageHeight)
  bottom = Math.max(top, Math.min(bottom, stageHeight))
  return { left, top, right, bottom }
}

/**
 * 把一件器材的矩形**推出所有浮层**（精确口径，按真实浮层矩形算）。
 *
 * 这是"器材不许被控件压住"的**唯一判定实现**：不再把浮层近似成四条边，
 * 而是逐个矩形求掩盖量，取**位移最小**的方向推出去。
 * 返回 `null` 表示"当前就在浮层之外"。
 */
export function pushOutOfControls(
  rect: { left: number; top: number; right: number; bottom: number },
  width: number,
  height: number,
): { dx: number; dy: number } | null {
  const obstacles = controlObstacles(width, height)
  let dx = 0
  let dy = 0
  /**
   * 两轮：第一轮按初始位置推，第二轮复验（推出去之后可能落进**另一个**浮层）。
   * 实测 390×780 下先躲胶囊组、再躲读数条，需要两轮才稳定。
   */
  for (let pass = 0; pass < 4; pass += 1) {
    let moved = false
    for (const box of obstacles) {
      const cur = { left: rect.left + dx, top: rect.top + dy, right: rect.right + dx, bottom: rect.bottom + dy }
      const overlapX = Math.min(cur.right, box.x + box.width) - Math.max(cur.left, box.x)
      const overlapY = Math.min(cur.bottom, box.y + box.height) - Math.max(cur.top, box.y)
      if (overlapX <= 1e-6 || overlapY <= 1e-6) continue
      const candidates = [
        { axis: 'x' as const, delta: box.x - cur.right },
        { axis: 'x' as const, delta: box.x + box.width - cur.left },
        { axis: 'y' as const, delta: box.y - cur.bottom },
        { axis: 'y' as const, delta: box.y + box.height - cur.top },
      ]
      candidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
      const pick = candidates[0]
      if (pick.axis === 'x') dx += pick.delta
      else dy += pick.delta
      moved = true
    }
    if (!moved) break
  }
  return dx === 0 && dy === 0 ? null : { dx, dy }
}
/**
 * 舞台尺寸 → **真正能放器材的屏幕矩形**（相对舞台左上角）。
 *
 * 这是"可见范围"的唯一入口：以前 `CompetitorScene` 自己拼这个矩形、
 * 测试又各拼一遍，三处一旦有一处改了就互相不一致。现在统一到这里。
 *
 * **两个安全区必须内外一致**：外面（相机聚焦）用 `SAFE_TOP`/`SAFE_BOTTOM` 留边，
 * 里面（判据）也必须用同一对常量，否则会出现"相机算出来放得下、判据说放不下"的死循环 ——
 * 实测症状是**一进页面器材自己往上跳一下**（先把内容居中，再被不变量拉回来）。
 */
export function visibleScreenArea(width: number, height: number): { left: number; top: number; right: number; bottom: number } {
  /**
   * 可见范围 = **整个舞台**，四周都不再留安全边。
   *
   * 这是本轮的核心修正。历史上这里收进 `SAFE_TOP` / `SAFE_BOTTOM`，
   * 把"看得见的画布"从整块屏幕缩成中间一条横带；而**画布又真的是按这个矩形
   * 渲染并裁剪的**（SVG 只有 960×540 那么大），于是学生把器材往上一拖，
   * 器材就被那条看不见的边界**切掉**——正是「中间有一个隐形的画布」。
   *
   * 现在：可见范围就是屏幕本身。悬浮控件不再"吃掉"画布，只是浮在它上面，
   * 由 `controlAvoidArea` 负责让器材别钻到控件底下。
   */
  return {
    left: 0,
    top: 0,
    right: Math.max(width, 0),
    bottom: Math.max(1, height),
  }
}

/**
 * 相机聚焦时给内容预留的边距 —— 与 `controlAvoidArea` **真正同源**。
 *
 * 它就是"能用的那块矩形"，不多留一丝：先取 `controlAvoidArea`（聚焦时还可见的
 * 那块），再加上一点画布语义留白。于是"相机把内容摆好"与"判据说内容都在视野里"
 * 在数学上同时成立，入屏不会出现二次位移，也不会出现被控件压住的器材。
 *
 * 上一版这里是"照抄常量"而不是真的同源：`padding = CONTROL_* + FIT_SIDE_INSET`，
 * 而 `controlAvoidArea = CONTROL_*` —— 差一个 `FIT_SIDE_INSET`，注释却写着"严格同源"，
 * 测试只比了 `padding ≥ control` 所以测不出来。现在两者都由同一份浮层清单推导。
 */
export const FIT_SIDE_INSET = 28

/**
 * 入屏留白的兜底上限：两侧留白合计不得超过舞台宽度的这个比例。
 *
 * 为什么需要：`controlAvoidArea` 在窄屏下会把可用区压得很窄
 * （实测 390×780 只有 `x148..332`），若再各加 28px，可用区会缩到 156px ——
 * 相机会被迫把五件器材挤成一团。窄屏下"留白"要让位于"看得见"。
 */
const FIT_MAX_SIDE_RATIO = 0.22

export function fitPaddingWithinSafeArea(width = 0, height = 0): { top: number; bottom: number; left: number; right: number } {
  /**
   * 入屏留白 = **真正浮着控件的那几条边** + 一点画布语义留白。
   *
   * `FIT_SIDE_INSET` 不是审美，而是**画布语义**：
   * 内容一开始就贴着屏幕边，学生第一眼看到的就是"东西卡在边上"，
   * 与"整个屏幕是无限画布"的预期相反。留一点之后四周都还有可拖的空间。
   *
   * 未传尺寸时（历史调用方 / 单测）退化为"按常量取净空"，与旧行为一致。
   */
  if (!(width > 0) || !(height > 0)) {
    return {
      top: CONTROL_TOP + FIT_SIDE_INSET,
      bottom: CONTROL_BOTTOM + FIT_SIDE_INSET,
      left: CONTROL_LEFT + FIT_SIDE_INSET,
      right: CONTROL_RIGHT + FIT_SIDE_INSET,
    }
  }
  const control = controlAvoidArea(width, height)
  const cap = Math.max(0, width * FIT_MAX_SIDE_RATIO - (control.right - control.left) / 2)
  const sideInset = Math.min(FIT_SIDE_INSET, cap)
  return {
    top: control.top + FIT_SIDE_INSET,
    bottom: height - control.bottom + FIT_SIDE_INSET,
    left: control.left + sideInset,
    right: width - control.right + sideInset,
  }
}

/**
 * 两套边界，一套用于「判有没有跑丢」，一套用于「收回到哪」。
 *
 * 这里必须分两套，不能只写一个阈值 —— 实测数据说明为什么：
 * 1688×841 的屏幕上，扣掉顶部 56px 标题条与底部 60px 读数条后，
 * 可见条带只剩约 512px 高，而初始构图里 E1 的纵向中心离可见顶边只有约 56px。
 * 也就是说**初始构图本身就贴边**，"本体一丝不差地全在视野内"这个条件，
 * 与"一进页面不要无谓地挪动器材"在物理上无法同时满足。
 *
 * 于是语义这样定义（两者天然不矛盾）：
 *
 *   · **判据（gate）**：器材中心落在「可见范围向外放宽 AUDIBLE_MARGIN」之内，
 *     就算"还在屏幕上"。放宽量取器材自身的半宽/半高 ——
 *     也就是**器材至少有一半在视野里**才叫跑丢。这对应学生真实的感受：
 *     还能看见、还能抓住，就不该被系统挪走。
 *   · **收回目标（rescue）**：把中心尽量挪到"本体完整可见"的位置；
 *     若视野太窄放不下整件器材，就退化为"尽量贴边不越界"。
 *
 * 因为 gate 的可用范围（可见范围 + 半宽）**严格大于** rescue 的目标范围
 * （可见范围 − 内缩 − 半宽），所以"收回之后必定不再被判出屏幕"是恒成立的，
 * 不存在自相矛盾的死循环。
 */
/** 器材本体的外接矩形（画布坐标），判据与收回的唯一几何依据 */
export function componentBodyRect(id: LabComponentId, center: Position) {
  const margin = COMPONENT_BODY_MARGIN[id]
  return {
    left: center.x - margin.x,
    right: center.x + margin.x,
    top: center.y - margin.y,
    bottom: center.y + margin.y,
  }
}

/**
 * 器材本体**投影到屏幕之后**越出安全区的像素量（0 = 屏幕上完整可见）。
 *
 * 这是唯一"说了算"的口径 —— 用户看到的是屏幕，不是画布坐标。
 *
 * 为什么必须补这一层：可见区域是**梯形**（透视把画布下方横向拉宽），
 * 用"画布空间的一个矩形"去近似它一定会在某些角落失真。
 * 实测 1920×1080 下：判据（画布矩形）说"完全合法"，
 * 而 E1 本体右下角投影到屏幕后**越出 22.4px**。
 * 提供这个函数后，判据可以直接比屏幕像素，与用户所见严格一致。
 */
export function componentOverflowScreen(
  id: LabComponentId,
  center: Position,
  viewport: CanvasViewport,
  safe: { left: number; top: number; right: number; bottom: number },
): number {
  const rect = componentBodyRect(id, center)
  const stage = perspectiveStageWithin(viewport.camera, viewport.perspective ?? {
    tilt: 0,
    perspective: 0,
    originX: 0,
    originY: 0,
    stage: { width: safe.right, height: safe.bottom },
  })
  let worst = 0
  for (const [x, y] of [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.left, rect.bottom],
    [rect.right, rect.bottom],
  ] as const) {
    const point = projectPerspective({ x, y }, stage)
    worst = Math.max(worst, safe.top - point.y, point.y - safe.bottom, safe.left - point.x, point.x - safe.right)
  }
  return worst
}

/** 器材本体矩形超出可见范围的量（0 表示完整可见） */
export function componentOverflow(
  id: LabComponentId,
  center: Position,
  visible: NonNullable<CanvasVisibleRect>,
): { left: number; right: number; top: number; bottom: number } {
  const rect = componentBodyRect(id, center)
  return {
    left: Math.max(0, visible.minX - rect.left),
    right: Math.max(0, rect.right - visible.maxX),
    top: Math.max(0, visible.minY - rect.top),
    bottom: Math.max(0, rect.bottom - visible.maxY),
  }
}

/**
 * 判据：器材**本体是否完整落在可见范围之内**。
 *
 * 升级过一次语义，原因是实测抓到的真实缺口：
 *
 *   旧语义「中心在可见范围内」，代价是本体上/下缘会直接越出 `半个身位`
 *   （A1 实测越界 92px）。更糟的是它在**矮视口**下会漏判：
 *   1920×420 时把 S1 拖到可见下界，它的中心仍在范围内 → 判"没出屏" → 不收回，
 *   于是 S1 的上缘被 E1 的实体盖住一截 —— 正是需求原话里
 *   「器材拖动一下就遮挡了」的那张图。
 *
 *   新语义「本体包围盒完整可见」把这类"中心在、边角出"的情况一并抓出来。
 *   它与收回逻辑依然自洽：`rescueBox` 用的是同一组 `COMPONENT_BODY_MARGIN`，
 *   所以"收回之后必定不再被判出屏"是恒成立的（视野放不下整件器材时，
 *   收回退化为居中，判据也在同一组数学下做钳制，不会互相打架）。
 */
export function isComponentOffCanvas(
  layout: LabLayout,
  id: LabComponentId,
  visible: CanvasVisibleRect,
): boolean {
  if (visible === null) return false
  const overflow = componentOverflow(id, layout.components[id], visible)
  return overflow.left > COMPONENT_BODY_EPSILON || overflow.right > COMPONENT_BODY_EPSILON
    || overflow.top > COMPONENT_BODY_EPSILON || overflow.bottom > COMPONENT_BODY_EPSILON
}

/**
 * 浮点容差（画布单位）。
 *
 * 收回逻辑算出来的夹取边界本身就带浮点误差，判据若不设容差，
 * 会出现"刚收回完又被判成出屏"的抖动。
 *
 * 但容差**也不能只有 1e-6** —— 判据与收回用的是两条不同的链路：
 * 判据读的是"坐标 ↔ 可见矩形"的**比较**，而可见矩形是**透视反投影二分**出来的，
 * 其误差量级在 1e-3 画布单位；1e-6 的容差会让"刚好贴边"被误判成越界，
 * 触发一次**无谓的收回**（实测 S2 被平白挪走 72px）。
 * 取 1e-2：比二分误差大一个量级，又比一个像素对应的画布单位（约 0.7）小 70 倍，
 * 既不会抖动、也不会放过真实越界。
 */
export const COMPONENT_BODY_EPSILON = 1e-2

/**
 * 收回目标盒：让器材本体**完整**可见。
 *
 * 内缩量 = 器材半宽半高 + 舒适内缩，并夹在「视野放得下整件器材」的上限内。
 *
 * 这里**刻意不把"初始构图"纳入约束**。曾经为了让"初始构图一动不动"，
 * 把内缩量按初始位置再收一次 —— 结果是收回盒被压到很窄的一段
 * （实测 A1 的盒纵向只剩 180..379），器材被拖到下方后收回只能挪回 379，
 * 画面上**照样被切掉 97px**。现在"别动没跑丢的器材"由判据那层门禁保证
 * （判据通过就绝不调用收回），两个关注点分开，盒就不会被无谓压小。
 */
function rescueBox(id: LabComponentId, visible: NonNullable<CanvasVisibleRect>) {
  const margin = COMPONENT_BODY_MARGIN[id]
  const width = visible.maxX - visible.minX
  const height = visible.maxY - visible.minY
  const roomX = (width - margin.x * 2) / 2
  const roomY = (height - margin.y * 2) / 2
  const insetX = margin.x + Math.max(0, Math.min(VISIBLE_SAFE_INSET, roomX))
  const insetY = margin.y + Math.max(0, Math.min(VISIBLE_SAFE_INSET, roomY))
  const loX = visible.minX + insetX
  const hiX = Math.max(loX, visible.maxX - insetX)
  const loY = visible.minY + insetY
  const hiY = Math.max(loY, visible.maxY - insetY)
  return { minX: loX, maxX: hiX, minY: loY, maxY: hiY }
}

/**
 * 视野放不下整件器材时的**居中兜底**。
 *
 * 窄视口下（实测 1920×420 的可见条带只有约 209 画布单位高，而 A1 本体高 168）
 * `rescueBox` 的可用区间会退化成一个点甚至反向。此时把器材摆到视野中心是
 * 唯一"两边对称、都不至于只露一个小角"的位置；判据也按同一组数学生效，
 * 因此不会出现"收回之后还被判出屏"的死循环。
 */
function rescueCenter(id: LabComponentId, visible: NonNullable<CanvasVisibleRect>) {
  const box = rescueBox(id, visible)
  const margin = COMPONENT_BODY_MARGIN[id]
  const fitsX = visible.maxX - visible.minX >= margin.x * 2
  const fitsY = visible.maxY - visible.minY >= margin.y * 2
  if (fitsX && fitsY) return { box }
  return {
    box: {
      minX: fitsX ? box.minX : (visible.minX + visible.maxX) / 2,
      maxX: fitsX ? box.maxX : (visible.minX + visible.maxX) / 2,
      minY: fitsY ? box.minY : (visible.minY + visible.maxY) / 2,
      maxY: fitsY ? box.maxY : (visible.minY + visible.maxY) / 2,
    },
  }
}

/**
 * 拖动**过程中**的实时钳制：让器材在指针越出舞台时"贴边停住"。
 *
 * 存在的理由（真机实测出来的必修项）：
 * `useLabLayoutDrag.onPointerMove` 原先只调 `clampComponentPosition`
 * （世界边界 ±6000），**松手前没有任何收回**。按住 E1 往左上拖，
 * 本体左上角一路走到 `-170,-102` —— 在"体左 94 / 体上 2"时就已经完全离开可视区，
 * 再往后是 168px 全黑，**松手才回弹 262px**。
 * 现有 e2e 只在 `pointerup` **之后**采样落点，所以 100 组全绿：
 * 判据漏了"拖动中"这一段，而这正是用户主诉里「拖到外面去了」的可见场景。
 *
 * 语义上它与松手时走的是**同一套门禁**（`rescueComponent` + 同一个 `visible`），
 * 只是把"松手收敛一次"变成"每帧收敛一次"：
 *   · 没跑出可见范围 → 原样返回（绝不无谓挪动，`rescueComponent` 自带这层门禁）；
 *   · 跑出了 → 收到最近合法位置，表现为"器材贴着边停下"。
 *
 * 返回值语义与 `clampComponentPosition` 一致：直接把结果当作器材中心用。
 */
export function clampComponentWithinView(
  id: LabComponentId,
  position: Position,
  visible: CanvasVisibleRect,
  screenCheck?: (id: LabComponentId, center: Position) => number,
  /** 屏幕空间"推回最近合法位置"的收敛器（由场景注入，因为只有它知道投影） */
  pushIntoView?: (id: LabComponentId, center: Position) => Position | null,
): Position {
  const clamped = clampComponentPosition(id, position)
  if (visible === null) return clamped
  /**
   * 快速路径：还完全合法就原样返回，**绝不无谓挪动**。
   *
   * 必须先做这一步，不能直接进收敛循环 —— 否则器材会在合法区域内
   * 每帧被"收敛"推一下，表现为粘手 / 抖动。
   */
  if (valueAcc0(id, clamped, visible, screenCheck)) return clamped
  if (pushIntoView !== undefined) {
    const pushed = pushIntoView(id, clamped)
    if (pushed !== null) return clampComponentPosition(id, pushed)
  }
  /**
   * 兜底：用一个**只含这一件器材**的临时布局跑 `rescueComponent`，
   * 复用"判据 + 收回 + 屏幕像素收敛"这套已有回归测试保护的逻辑。
   */
  const probe: LabLayout = { components: { ...createDefaultLayout().components, [id]: clamped }, wires: {} }
  const rescued = rescueComponent(probe, id, visible, screenCheck)
  return rescued.components[id]
}

/**
 * 在**屏幕空间**把一件器材"推回"最近的可视位置（二分求根，保证收敛）。
 *
 * 为什么不能只靠"朝视野中心退一步"的迭代：那种步进式回退在大步长指针移动下
 * 会**震荡**，而且最后一次步长可能正好把结果留在边界外 ——
 * 真机实测按住 A1 快速拖向左上角，有连续 2 帧本体越出 18～39px
 * （肉眼可见的"甩出去再弹回"）。
 *
 * 这里改成**单调二分**：`project` 把画布坐标投影到屏幕，把"本体四角是否全部
 * 落在安全区"表达成一个单调谓词，然后在"当前点 ↔ 可行点"之间二分。
 * 单调问题二分一定收敛，且与"学生看到的是屏幕"严格同口径。
 */
export function pushComponentIntoView(
  id: LabComponentId,
  center: Position,
  project: (point: Position) => Position,
  bounds: { width: number; height: number },
  /**
   * 求"一定能看见"的锚点：视野中心在画布空间的坐标。
   * 器材被拖到屏幕外时，往这里退一定越来越可见（单调）。
   */
  anchor: Position,
): Position {
  /**
   * 「离屏幕边还有多少像素」的正数含义 = 还差多少像素才贴边；
   * 负 = 还剩这么多余量。
   *
   * 要求**余量 ≥ `SCREEN_SAFE_MARGIN`**（而不是 ≥ 0）：
   * 模型与浏览器 CSS 的投影不完全等价（见 `SCREEN_SAFE_MARGIN` 注释），
   * 只按"模型说没越界"判定，会把模型误差直接吃进画面。
   */
  const overflowAt = (probe: Position): number => {
    const rect = componentBodyRect(id, probe)
    const corners: Position[] = [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom },
    ]
    let worst = 0
    for (const corner of corners) {
      const p = project(corner)
      worst = Math.max(worst, SCREEN_SAFE_MARGIN - p.x, p.x - (bounds.width - SCREEN_SAFE_MARGIN), SCREEN_SAFE_MARGIN - p.y, p.y - (bounds.height - SCREEN_SAFE_MARGIN))
    }
    return worst
  }
  if (overflowAt(center) <= 0) return center
  // 锚点是"绝对安全"的一端；若因视野太窄连锚点也放不下，就退化为锚点（居中）
  const anchorSafe = overflowAt(anchor) <= 0
  if (!anchorSafe) return anchor
  let lo = 0 // t=0 → 当前点（越界）
  let hi = 1 // t=1 → 锚点（安全）
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2
    const probe = { x: center.x + (anchor.x - center.x) * mid, y: center.y + (anchor.y - center.y) * mid }
    if (overflowAt(probe) <= 0) hi = mid
    else lo = mid
  }
  const t = hi
  return { x: center.x + (anchor.x - center.x) * t, y: center.y + (anchor.y - center.y) * t }
}

/**
 * 屏幕空间判定时的**安全余量**（屏幕像素）。
 *
 * 为什么需要它（真机量出来的事实，不是"保守起见"）：
 * 我们用来算"本体投影到屏幕上在哪"的 `projectPerspective` 与浏览器 CSS 的
 * 3D 变换**不完全等价** —— CSS 在 `perspective-origin` 处做透视，
 * 而模型的透视原点与深度项是另一套写法。真机对照同一个点：
 *
 * ```
 *   canvas (0, 100) → 浏览器 y=148.06 / 模型 y=144.30  （差 3.76）
 *   canvas (0, 600) → 浏览器 y=569.39 / 模型 y=578.50  （差 9.11，且符号相反）
 * ```
 *
 * 误差随深度增长，在画布底部可达约 **40～60px**。
 * 也就是说"模型说还在屏幕内"**不足以证明**浏览器里真的在屏幕内。
 *
 * 这条余量把判定收紧到"模型认为还有 `SCREEN_MARGIN` 像素余量才算合法"，
 * 于是模型误差不会被吃进画面。取值 64 覆盖实测最差 58px。
 *
 * 注意它只影响**屏幕空间**那一层判据（`screenCheck`）；画布空间的
 * `componentOverflow` 不受影响（那套是自洽的）。
 */
export const SCREEN_SAFE_MARGIN = 64

/** `clampComponentWithinView` 的合法性快速判定（内容溢出 + 屏幕溢出 + 安全余量） */
function valueAcc0(
  id: LabComponentId,
  center: Position,
  visible: NonNullable<CanvasVisibleRect>,
  screenCheck?: (id: LabComponentId, center: Position) => number,
): boolean {
  const overflow = componentOverflow(id, center, visible)
  if (overflow.left + overflow.right + overflow.top + overflow.bottom > COMPONENT_BODY_EPSILON) return false
  return (screenCheck === undefined ? 0 : screenCheck(id, center)) <= -SCREEN_SAFE_MARGIN
}

/**
 * 「能摆器材的那块」= 整块舞台扣掉悬浮控件（聚焦 / 初始构图的目标矩形）。
 *
 * 初始构图必须摆进这块里，否则**一进页面器材就已经被控件压住** ——
 * 实测 390×780 下 `A1` 本体 `x205..376` 被右侧胶囊组 `x78..322` 完全盖住，
 * 768×600 下 `E1`/`S1` 被顶栏压、`S2` 被底栏压。
 * 这不是"拖出去才会发生"的问题，而是**加载即发生**。
 *
 * 窄屏下 `controlAvoidArea` 会退化成零宽（左工具条与右侧胶囊组物理重叠），
 * 此时不能把可用区当成空 —— 退化为"整块舞台"，
 * 由 `pushOutOfControls` 的精确避让在逐件器材层面兜底。
 */
export function usableStageRect(width: number, height: number): { minX: number; minY: number; maxX: number; maxY: number } {
  const control = controlAvoidArea(width, height)
  if (control.right - control.left > 64 && control.bottom - control.top > 64) {
    return { minX: control.left, minY: control.top, maxX: control.right, maxY: control.bottom }
  }
  return { minX: 0, minY: 0, maxX: Math.max(0, width), maxY: Math.max(1, height) }
}

/**
 * 把**整份布局**推到所有浮层之外（逐件器材，**在屏幕空间**算）。
 *
 * ⚠️ 必须在屏幕空间做，不能在画布空间做：
 * 浮层矩形是**屏幕像素**，而 `componentBodyRect` 是**画布单位** ——
 * 两者差一个相机变换（含 3D 透视）。上一版直接在画布坐标里比较，
 * 结果 S2 的"画布 rect"刚好贴住读数条（重叠 0.0），
 * 但它**投影到屏幕后**仍然压在读数条下面 80px。
 *
 * 做法：把器材本体的四个角投影到屏幕，求屏幕外接矩形，
 * 用 `pushOutOfControls` 算出屏幕空间的位移，再把该位移**换算回画布**。
 * 换算用相机 scale 做一次近似（透视下局部近似足够），随后由 `screenCheck` 闭环复验。
 */
export function layoutOutOfControls(
  layout: LabLayout,
  width: number,
  height: number,
  project: (rect: { left: number; top: number; right: number; bottom: number }) => {
    left: number
    top: number
    right: number
    bottom: number
  },
  unprojectDelta?: (delta: { dx: number; dy: number }) => { dx: number; dy: number },
): LabLayout {
  const components = { ...layout.components }
  let changed = false
  for (const id of LAB_COMPONENT_IDS) {
    let center = components[id]
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const screenRect = project(componentBodyRect(id, center))
      const push = pushOutOfControls(screenRect, width, height)
      if (push === null) break
      const canvasDelta = unprojectDelta === undefined ? push : unprojectDelta(push)
      center = clampComponentPosition(id, { x: center.x + canvasDelta.dx, y: center.y + canvasDelta.dy })
      changed = true
    }
    components[id] = center
  }
  return changed ? { ...layout, components } : layout
}

/** 当前跑出屏幕的器材（用于「全部收回」提示） */
export function offCanvasComponents(layout: LabLayout, visible: CanvasVisibleRect): LabComponentId[] {
  if (visible === null) return []
  return LAB_COMPONENT_IDS.filter((id) => isComponentOffCanvas(layout, id, visible))
}

/**
 * 把一件器材收回可见范围（保留它相对视野的相对位置，只做最小位移）。
 *
 * 这条是「拖动遮挡」的直接解药：一旦器材被拖到看不见的地方，
 * 立刻把它挪回可视范围内最近的合法位置，而不是让它在屏幕外丢失。
 *
 * **必须在屏幕空间迭代收**，不能只在画布空间夹一次：
 * 可见矩形是透视反投影出来的（画布下方 1 单位 ≈ 屏幕上更多像素），
 * 而 `rescueBox` 给的是画布空间的等距内缩 —— 两者在视野下缘天然错配。
 * 实测 1920×1080 下"往右下角拖"收完仍越界 22.4px。
 * 这里按可见矩形的**画布 y 中位线**做左右内缩、按 x 中位线做上下内缩，
 * 并用 `componentOverflow` 迭代收敛：每轮只把"仍然越界的那条边"再推进去，
 * 收敛后一定满足判据（判据与这里读的是同一个 `componentOverflow`）。
 */
export function rescueComponent(
  layout: LabLayout,
  id: LabComponentId,
  visible: CanvasVisibleRect,
  /**
   * 可选的**屏幕空间精确校验**。
   *
   * 传了它就按"本体投影到屏幕后是否越出安全区"来收敛，而不是只看画布矩形。
   * 这是唯一与用户所见严格一致的口径：可见区域是梯形，
   * 画布矩形在某些角落会失真（实测 1920×1080 下差 22.4px）。
   */
  screenCheck?: (id: LabComponentId, center: Position) => number,
): LabLayout {
  if (visible === null) return layout
  /**
   * 已经"在屏幕上"的器材一律不碰。
   *
   * 这条不只是为了省事，而是消除一个真实的自相矛盾：
   * 窄视野下 E1 的初始位置离上边界只有约 56px，
   * 而"本体完整可见"要求至少 60px —— 物理上放不下。
   * 若不做这层门禁，收回会把 E1 往下推几像素，
   * 表现为**一进页面什么都没动，器材自己动了一下**。
   * 门禁的语义是："判据说还在屏幕上 → 就别动它"。
   */
  /**
   * 门禁：判据说"还在屏幕上"就**别动它**（见函数头注释）。
   *
   * ⚠️ 但"判据"必须包含**屏幕像素**那一层：只比画布矩形会漏 ——
   * 实测 1375×782 拖向右下角时画布判据完全合法（overflow 全 0），
   * 本体投影到屏幕上却仍越出 1.7px，于是收回被门禁挡掉、那 1.7px 一直留着。
   */
  const screenOverflow = screenCheck === undefined ? 0 : screenCheck(id, layout.components[id])
  if (!isComponentOffCanvas(layout, id, visible) && screenOverflow <= 0.5) return layout
  const center = layout.components[id]
  const { box } = rescueCenter(id, visible)
  let candidate = {
    x: Math.min(box.maxX, Math.max(box.minX, center.x)),
    y: Math.min(box.maxY, Math.max(box.minY, center.y)),
  }
  const margin = COMPONENT_BODY_MARGIN[id]
  /**
   * 两级收敛：
   *   1. 先在**画布空间**把本体夹进可见矩形（快，处理绝大多数情况）；
   *   2. 若传了屏幕空间校验、而屏幕上仍有像素越界，就沿着"从视野中心指向当前位置"
   *      的方向做**方向性回退**：越界越深就退得越多，退到屏幕上不再越界为止。
   *
   * 为什么不直接在画布空间算：可见区域是**梯形**（透视把画布下方横向拉宽），
   * 用一个矩形去近似它，必然有角落失真 —— 实测 1920×1080 下 E1 右下角
   * "判据完全合法"却越出屏幕 22.4px。只有按屏幕像素收敛才能与用户所见一致。
   */
  const centerOfView = { x: (visible.minX + visible.maxX) / 2, y: (visible.minY + visible.maxY) / 2 }
  const acceptable = (probe: Position) => {
    const overflow = componentOverflow(id, probe, visible)
    const pixel = screenCheck === undefined ? 0 : screenCheck(id, probe)
    return overflow.left + overflow.right + overflow.top + overflow.bottom <= COMPONENT_BODY_EPSILON && pixel <= 0.5
  }
  for (let attempt = 0; attempt < 40 && !acceptable(candidate); attempt += 1) {
    const overflow = componentOverflow(id, candidate, visible)
    const next = { ...candidate }
    const width = visible.maxX - visible.minX
    const height = visible.maxY - visible.minY
    const step = Math.max(2, Math.min(width, height) * 0.12)
    if (overflow.right > 0) next.x -= step
    if (overflow.left > 0) next.x += step
    if (overflow.bottom > 0) next.y -= step
    if (overflow.top > 0) next.y += step
    if (samePositionPair(next, candidate)) {
      // 画布判据已经完全满足，但屏幕上仍越界 → 朝视野中心回退
      const dx = centerOfView.x - candidate.x
      const dy = centerOfView.y - candidate.y
      const length = Math.hypot(dx, dy)
      if (length < 1e-6) break
      const retreat = Math.max(1, length * 0.12)
      next.x = candidate.x + (dx / length) * retreat
      next.y = candidate.y + (dy / length) * retreat
      if (samePositionPair(next, candidate)) break
    }
    // 回退不能越过可见矩形本身，否则会退到视野外
    next.x = Math.min(visible.maxX - margin.x, Math.max(visible.minX + margin.x, next.x))
    next.y = Math.min(visible.maxY - margin.y, Math.max(visible.minY + margin.y, next.y))
    candidate = next
  }
  /**
   * 最后再用收回盒夹一次（保留"最小位移"语义）。
   *
   * ⚠️ 但**只在夹完仍然合法时才采用** —— 这一条是实测抓到的真缺口：
   * 收回盒是**画布空间**的等距内缩，而收敛是在**屏幕空间**做的；
   * 两者在透视下不等价，直接夹会把上面辛苦收敛出来的结果又推回去，
   * 表现为"拖到角落松手后仍被裁 1.7px"（`1375×782` 拖向右下角实测）。
   */
  const boxed = {
    x: Math.min(box.maxX, Math.max(box.minX, candidate.x)),
    y: Math.min(box.maxY, Math.max(box.minY, candidate.y)),
  }
  if (acceptable(boxed)) candidate = boxed
  if (samePositionPair(center, candidate)) return layout
  return { ...layout, components: { ...layout.components, [id]: clampComponentPosition(id, candidate) } }
}

/** 把所有拖出可见范围的器材一次收回（「全部收回」按钮用） */
export function rescueAllComponents(
  layout: LabLayout,
  visible: CanvasVisibleRect,
  screenCheck?: (id: LabComponentId, center: Position) => number,
): LabLayout {
  if (visible === null) return layout
  let next = layout
  for (const id of LAB_COMPONENT_IDS) next = rescueComponent(next, id, visible, screenCheck)
  return next
}

function samePositionPair(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6
}

/**
 * 布局坐标系里的可见矩形。
 *
 * 入参是屏幕坐标系里的可视区域（顶部悬浮标题条之下、底部读数条之上），
 * 由相机的 scale/offset 反算。`buildVisibleRect` 是相机参数的纯函数入口，
 * 因此可以脱离 DOM 单测：这条判据本身就是"全屏无限画布"的核心断言。
 */
export function buildVisibleRect(
  screen: { left: number; top: number; right: number; bottom: number },
  camera: { scale: number; x: number; y: number },
  perspective?: PerspectiveWithin | null,
): CanvasVisibleRect {
  return resolveViewport(screen, camera, perspective)?.visible ?? null
}

/**
 * 舞台透视参数（**必须带真实舞台尺寸**）。
 *
 * `originX / originY` 是相对**整个舞台**的像素坐标，而 `screen` 往往是扣掉
 * 安全区之后的那块矩形；两者混用会让原点偏几十像素（见 `perspectiveStageWithin`）。
 */
export interface PerspectiveWithin {
  tilt: number
  perspective: number
  originX: number
  originY: number
  stage?: { width: number; height: number }
}

/** `buildVisibleRect` 的内部结果：可见矩形 + 与它**同口径**的屏幕矩形 / 透视参数 */
export interface CanvasViewport {
  /**
   * 可见范围（**画布空间的保守外接矩形**，是所有判定的对外口径）。
   *
   * 为什么用"保守外接矩形"而不是精确多边形：屏幕矩形经透视反投影后是一个**梯形**，
   * 不是矩形。若直接把它当矩形用，就会出现"画布坐标看着合法、屏幕上却越界"——
   * 实测把画布矩形的 4 个角投影回去，左下角落在屏幕 x=-145.5（本该是 0），
   * 也就是**越出屏幕 145px**，而判据完全看不见。
   *
   * 因此这里取的是"投影后能盖住整块可见区域的**最小画布矩形**"：
   * 它比精确区域**大**，是保守的（宁可放行也不误判）。
   * 而"精确判定"由 `screenToCanvasWithinViewport` 承担 ——
   * 指针/本体投影到屏幕空间后再比，见 `componentOverflowScreen`。
   */
  visible: NonNullable<CanvasVisibleRect>
  /** 参与反算的屏幕矩形（相对舞台左上角） */
  screen: { left: number; top: number; right: number; bottom: number }
  camera: { scale: number; x: number; y: number }
  /** 与 CSS 一致的透视参数（含透视原点像素坐标）；无倾斜时为 null */
  perspective: {
    tilt: number
    perspective: number
    originX: number
    originY: number
    stage: { width: number; height: number }
  } | null
}

/**
 * 可见范围的**唯一权威实现**：把「屏幕矩形 + 相机 + 透视」解析成三件互相自洽的东西。
 *
 * `buildVisibleRect` 只是它的一层薄封装，`screenToCanvasWithinViewport` 也读它，
 * 于是"哪里算可见"与"指针指向哪个画布坐标"**共用同一组参数**，
 * 不可能再出现两套口径。
 */
export function resolveViewport(
  screen: { left: number; top: number; right: number; bottom: number },
  camera: { scale: number; x: number; y: number },
  perspective?: PerspectiveWithin | null,
): CanvasViewport | null {
  if (!(camera.scale > 0)) return null
  if (![screen.left, screen.top, screen.right, screen.bottom].every((value) => Number.isFinite(value))) return null
  if (screen.right <= screen.left || screen.bottom <= screen.top) return null

  /**
   * 有 3D 倾斜时必须用**透视反投影**，不能只做 scale+translate 的线性反算。
   *
   * 这是一个真实踩到过的坑：舞台带 `rotateX(13deg)`，
   * 画布下方的内容投影到屏幕时会被放大、往下推。
   * 线性反算得出的"合法画布区间"因此偏大 —— 器材按它夹取后，
   * 画布坐标看着合法，**屏幕上却仍然探出屏幕 92px**（实测数据）。
   * 这里对四条边分别做透视反投影，得到真正对应的画布矩形。
   */
  if (perspective !== undefined && perspective !== null) {
    const stage = perspectiveStageWithin(camera, {
      ...perspective,
      stage: perspective.stage ?? { width: screen.right, height: screen.bottom },
    })
    /**
     * 四角反投影后取包围盒：3D 投影在 y 上单调，四角足以覆盖整块可见区域。
     *
     * 关键细节：**y 的两个极值必须由"反投影后再正投影回来"闭环校准**。
     * 反投影是二分求出来的，`projectPerspective(unprojectPerspective(p)) ≈ p` 有
     * 约 2.6 个画布单位的残差（实测 1688×841 下 S2 下缘正好卡在这条缝里，
     * 判据误判成"越界"、把 S2 平白挪走 72px）。
     * 这里用一次牛顿式的修正把残差消掉，使可见矩形与投影严格互逆。
     */
    const corners = [
      unprojectPerspective({ x: screen.left, y: screen.top }, stage),
      unprojectPerspective({ x: screen.right, y: screen.top }, stage),
      unprojectPerspective({ x: screen.left, y: screen.bottom }, stage),
      unprojectPerspective({ x: screen.right, y: screen.bottom }, stage),
    ]
    const refine = (point: Position, target: Position): Position => {
      const actual = projectPerspective(point, stage)
      return { x: point.x + (target.x - actual.x), y: point.y + (target.y - actual.y) }
    }
    const refined = corners.map((point, index) =>
      refine(point, {
        x: index % 2 === 0 ? screen.left : screen.right,
        y: index < 2 ? screen.top : screen.bottom,
      }),
    )
    const xs = refined.map((point) => point.x)
    const ys = refined.map((point) => point.y)
    return {
      visible: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
      screen,
      camera,
      perspective: { ...perspective, stage: perspective.stage ?? { width: screen.right, height: screen.bottom } },
    }
  }

  return {
    visible: {
      minX: (screen.left - camera.x) / camera.scale,
      minY: (screen.top - camera.y) / camera.scale,
      maxX: (screen.right - camera.x) / camera.scale,
      maxY: (screen.bottom - camera.y) / camera.scale,
    },
    screen,
    camera,
    perspective: null,
  }
}

/**
 * 「屏幕矩形 + 相机 + 透视参数」→ 可直接交给 `projectPerspective` /
 * `unprojectPerspective` 的舞台参数。
 *
 * 抽出来是为了让**投影**与**反投影**用同一个 stage 对象：
 * 两者只要有一个字段不一致（例如 `stage.width` 用了别处的尺寸），
 * 屏幕↔画布就不再是互逆映射，"拖到底探出 7px"那类事故就会复现。
 */
export function perspectiveStageWithin(
  camera: { scale: number; x: number; y: number },
  perspective: {
    tilt: number
    perspective: number
    originX: number
    originY: number
    /**
     * **舞台的真实屏幕尺寸**（整个视口）。
     *
     * 必须显式传，不能拿 `screen` 的右边/下边代替：`screen` 是**扣掉安全区之后**
     * 的那块矩形（顶 56 / 底 60），而 `perspective-origin` 是相对**整个舞台**的百分比。
     * 混用会让 `originY` 偏 56×0.58 ≈ 32px，可见范围整体算歪
     * （实测 maxY 偏差 42.65 画布单位，于是"拖动映射"与"可见范围"永远对不上）。
     */
    stage: { width: number; height: number }
  },
) {
  return {
    camera,
    tilt: perspective.tilt,
    perspective: perspective.perspective,
    originX: perspective.originX,
    originY: perspective.originY,
    stage: perspective.stage,
  }
}

/**
 * **指针屏幕坐标 → 画布坐标**，与可见范围**同口径**（修 1 的核心）。
 *
 * 语义上它就是 `screenToCanvas` 的透视版本，但关键在于**必须传同一个 viewport**：
 *   · 拖动时用 `screenToCanvasWithinViewport(..., viewport())`；
 *   · 判可见用 `viewport().visible`。
 * 两者读同一份 `screen/camera/perspective`，因此不可能再出现
 * "拖动映射是线性、可见范围是透视"的错配。
 *
 * 传入的 `point` 是**相对舞台左上角**的屏幕坐标。
 */
export function screenToCanvasWithinViewport(
  point: Position,
  viewport: CanvasViewport | null,
  camera: { scale: number; x: number; y: number },
): Position | null {
  /**
   * `point` 是**相对舞台左上角**的屏幕坐标（与 `projectPerspective` 的值域一致）。
   *
   * 注意：**不要**再叠加 `viewport.screen.left / top`。`viewport.screen` 只是
   * "把哪块矩形当作可见区"的记录（它扣掉了安全区），而反投影的输入是绝对屏幕坐标。
   * 曾经在这里多加了一次 `screen.top`（= 56），于是屏幕 y=781 反算成 canvas 628.62、
   * 再投影回去变成 837 —— 凭空多出 56px，正是"拖到底始终差 42 画布单位"的来源。
   */
  if (viewport === null) {
    return camera.scale > 0 ? { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale } : null
  }
  if (viewport.perspective === null) {
    return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale }
  }
  return unprojectPerspective(point, perspectiveStageWithin(camera, viewport.perspective))
}

/**
 * 画布能被拖动到的世界范围必须**远大于**可见范围，否则就不是无限画布。
 *
 * 这条把历史上那个真实 BUG 固化成断言：
 * 曾经的 `CANVAS_WORLD_BOUNDS` 宽 3840，而 fitContent 之后可见世界只有约 1000 宽，
 * 于是"画布边界"缩在屏幕里，往边上一拖器材就出屏幕。
 */
export const MIN_WORLD_TO_VIEW_RATIO = 4

export function worldSpan(): { width: number; height: number } {
  return {
    width: CANVAS_WORLD_BOUNDS.maxX - CANVAS_WORLD_BOUNDS.minX,
    height: CANVAS_WORLD_BOUNDS.maxY - CANVAS_WORLD_BOUNDS.minY,
  }
}
