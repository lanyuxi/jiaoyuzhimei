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
import { unprojectPerspective } from '../../runtime/immersive/canvas'
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

/** 器材移动时应保持的最小可见边距（拖到边界也不让器材跑出世界） */
/**
 * 器材本体的可见边距（半宽 / 半高）。
 *
 * 语义是「器材中心 ± 该边距 = 器材本体外接矩形」，收回逻辑与命中区都以它为准。
 * 历史上它比 `COMPONENT_HIT_RADIUS` 小 32px —— 那 32px 就是拖动命中区相对本体
 * 多出来的"外扩量"，导致按边距收回时命中区仍会探出屏幕（器材看着被切掉一块）。
 * 现在两者取同一个值：收回后器材本体与命中区都完整落在可见范围内。
 */
export const COMPONENT_BODY_MARGIN: Readonly<Record<LabComponentId, { x: number; y: number }>> = {
  E1: { x: 124, y: 60 },
  S1: { x: 92, y: 60 },
  S2: { x: 92, y: 60 },
  L1: { x: 86, y: 78 },
  A1: { x: 86, y: 84 },
}

/** 移动一件器材：只改它自己的坐标，接线柱与导线端点自动跟随 */
export function moveComponent(layout: LabLayout, id: LabComponentId, position: Position): LabLayout {
  return { ...layout, components: { ...layout.components, [id]: clampComponentPosition(id, position) } }
}

/**
 * 拖动器材本体（而不是拖接线柱）时的命中半径。
 *
 * 必须与 `COMPONENT_BODY_MARGIN` 同宽同高：命中区一旦比本体大，
 * 按本体边距收回之后命中区仍会探出可见范围，看起来就是"器材被切掉一块"。
 */
export const COMPONENT_HIT_RADIUS: Readonly<Record<LabComponentId, { rx: number; ry: number }>> = Object.fromEntries(
  (Object.keys(COMPONENT_BODY_MARGIN) as LabComponentId[]).map((id) => [
    id,
    { rx: COMPONENT_BODY_MARGIN[id].x, ry: COMPONENT_BODY_MARGIN[id].y },
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
/**
 * 判据：器材中心是否仍落在可见范围之内。
 *
 * 语义刻意**不做任何放宽**。曾经试过"允许中心越出半个身位"，
 * 代价是器材上缘会直接越出屏幕 `1.5 × 半高`（A1 实测越界 92px），
 * 画面上就是"器材被切掉一块"。
 *
 * 取"中心必须在可见范围内"之后，这条判据同时满足两个要求：
 *   · 语义干净：中心在视野里 → 本体至少一半在屏幕里，与学生"还看得见"的直观一致；
 *   · 与收回逻辑自洽：收回目标（本体尽量完整可见）比判据更严格，
 *     所以"收回之后必定不再被判为跑出屏幕"恒成立，不会互相打架。
 */
export function isComponentOffCanvas(
  layout: LabLayout,
  id: LabComponentId,
  visible: CanvasVisibleRect,
): boolean {
  if (visible === null) return false
  const center = layout.components[id]
  return (
    center.x < visible.minX || center.x > visible.maxX || center.y < visible.minY || center.y > visible.maxY
  )
}

/**
 * 收回目标盒：让器材本体尽量完整可见。
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
 */
export function rescueComponent(layout: LabLayout, id: LabComponentId, visible: CanvasVisibleRect): LabLayout {
  if (visible === null) return layout
  /**
   * 已经"在屏幕上"的器材一律不碰。
   *
   * 这条不只是为了省事，而是消除一个真实的自相矛盾：
   * 窄视野下（可见条带仅 512px 高时）E1 的初始位置离上边界只有约 56px，
   * 而"本体完整可见"要求至少 60px —— 物理上放不下。
   * 若不做这层门禁，收回会把 E1 往下推 3.6px，
   * 表现为**一进页面什么都没动，器材自己动了一下**。
   * 门禁的语义是："判据说还在屏幕上 → 就别动它"。
   */
  if (!isComponentOffCanvas(layout, id, visible)) return layout
  const center = layout.components[id]
  const box = rescueBox(id, visible)
  const clamped = {
    x: Math.min(box.maxX, Math.max(box.minX, center.x)),
    y: Math.min(box.maxY, Math.max(box.minY, center.y)),
  }
  if (samePositionPair(center, clamped)) return layout
  return { ...layout, components: { ...layout.components, [id]: clampComponentPosition(id, clamped) } }
}

/** 把所有拖出可见范围的器材一次收回（「全部收回」按钮用） */
export function rescueAllComponents(layout: LabLayout, visible: CanvasVisibleRect): LabLayout {
  if (visible === null) return layout
  let next = layout
  for (const id of LAB_COMPONENT_IDS) next = rescueComponent(next, id, visible)
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
  perspective?: { tilt: number; perspective: number; originX: number; originY: number } | null,
): CanvasVisibleRect {
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
    const stage = {
      camera,
      tilt: perspective.tilt,
      perspective: perspective.perspective,
      originX: perspective.originX,
      originY: perspective.originY,
      stage: { width: screen.right, height: screen.bottom },
    }
    // 四角反投影后取包围盒：3D 投影是单调的，四角即可覆盖整块可见区域
    const corners = [
      unprojectPerspective({ x: screen.left, y: screen.top }, stage),
      unprojectPerspective({ x: screen.right, y: screen.top }, stage),
      unprojectPerspective({ x: screen.left, y: screen.bottom }, stage),
      unprojectPerspective({ x: screen.right, y: screen.bottom }, stage),
    ]
    const xs = corners.map((point) => point.x)
    const ys = corners.map((point) => point.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }

  return {
    minX: (screen.left - camera.x) / camera.scale,
    minY: (screen.top - camera.y) / camera.scale,
    maxX: (screen.right - camera.x) / camera.scale,
    maxY: (screen.bottom - camera.y) / camera.scale,
  }
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
