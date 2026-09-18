/**
 * 无限画布（infinite canvas）相机模型。
 *
 * 纯函数实现，不依赖 DOM，便于单元测试：
 *   · 相机由「缩放 scale + 平移 offset」描述；
 *   · **缩放**有上下限（必须收敛，否则会算出 NaN）；
 *   · **平移不设任何边界** —— 这是"无限画布"的字面含义，
 *     也是用户反复反馈的「拖到边沿就拖不动了」的根因，见 `CANVAS_PAN_IS_UNBOUNDED`；
 *   · 只留一层浮点精度护栏（`CAMERA_FLOAT_GUARD`），避免平移在数值上卡死。
 *   · 提供「聚焦到内容」能力：进入实验时自动把器材铺满整屏
 */

import type { Position } from '../types'

export interface CanvasSize {
  width: number
  height: number
}

export interface Camera {
  /** 缩放倍率：>1 放大 */
  scale: number
  /** 画布平移量（屏幕像素） */
  x: number
  y: number
}

export interface CameraLimits {
  minScale: number
  maxScale: number
}

export const CANVAS_MIN_SCALE = 0.18
export const CANVAS_MAX_SCALE = 14

/**
 * 平移是否存在「相机数值上限」。
 *
 * 结论：**没有**。这里刻意不再有 `maxOffsetX / maxOffsetY`。
 *
 * 历史：
 *   · 最早是 `{ minX: -1440, maxX: 2400, … }` 这种把**画布内容**硬框住的钳制，
 *     那正是用户说的「固定画布 / 中间那一块」；
 *   · 后来改成 `CANVAS_OFFSET_MARGIN = 1600`（另有一处按 `size * 6` 放宽），
 *     看似"很大"，但它仍然是**屏幕像素**上的硬上限 ——
 *     视口 1375 宽时上限 8250px，学生按住空格平移 6 屏就再也推不动了，
 *     手感就是"拖到边沿就拖不动了"。
 *
 * 无限画布的定义就是：屏幕上的任何位置都能被平移到任何一个画布坐标上，
 * 因此相机的平移量**不允许**被任何常数夹住。器材坐标另有一层
 * `UNREACHABLE_WORLD_MARGIN`（±6000 画布单位）作防丢失兜底，
 * 那是"内容不会丢"，而不是"相机不能动"，两者不可混为一谈。
 */
export const CANVAS_PAN_IS_UNBOUNDED = true

/**
 * IEEE754 双精度下"加法不再改变数值"的量级。
 *
 * 无限平移会让 `camera.x / camera.y` 越滚越大；一旦大到这个量级，
 * `camera.x + dx === camera.x` 恒成立，平移就会**在数值上卡死**
 * （表现为"再拖也不动"）。所以这里做一个远在任何人类操作范围之外、
 * 但仍在安全精度内的有限值兜底 —— 它不是画布边界，只是浮点护栏。
 * 1e9 px 相当于 4K 屏横着拖 48 万屏。
 */
export const CAMERA_FLOAT_GUARD = 1e9

export const IDENTITY_CAMERA: Camera = { scale: 1, x: 0, y: 0 }

export function cameraLimits(size: CanvasSize): CameraLimits {
  void size
  return { minScale: CANVAS_MIN_SCALE, maxScale: CANVAS_MAX_SCALE }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * 把相机夹到**合法但不受限**的范围。
 *
 * 只做两件事：
 *   1. `scale` 夹在 `[CANVAS_MIN_SCALE, CANVAS_MAX_SCALE]`（缩放必须收敛，否则会 NaN）；
 *   2. 平移量避开浮点精度护栏与非有限值 —— 不夹到任何"屏幕/世界边界"。
 *
 * ⚠️ 不夹平移这一条是**用户可见行为**的分界线：
 * 夹了就会出现"拖到边沿拖不动"，这正是本次要修的缺陷。
 */
export function clampCamera(camera: Camera, size: CanvasSize): Camera {
  const limits = cameraLimits(size)
  return {
    scale: clamp(camera.scale, limits.minScale, limits.maxScale),
    x: clampPanOffset(camera.x),
    y: clampPanOffset(camera.y),
  }
}

/** 平移量的浮点护栏：非有限值归零，超精度上限就停在护栏上（不是画布边界） */
export function clampPanOffset(value: number): number {
  if (!Number.isFinite(value)) return 0
  return clamp(value, -CAMERA_FLOAT_GUARD, CAMERA_FLOAT_GUARD)
}

export function isIdentityCamera(camera: Camera): boolean {
  return Math.abs(camera.scale - 1) < 1e-6 && Math.abs(camera.x) < 1e-6 && Math.abs(camera.y) < 1e-6
}

/** 以某个画布坐标点为中心缩放：该点在屏幕上的位置保持不动 */
export function zoomAt(camera: Camera, factor: number, anchor: Position, size: CanvasSize): Camera {
  const nextScale = clamp(camera.scale * factor, CANVAS_MIN_SCALE, CANVAS_MAX_SCALE)
  const ratio = nextScale / camera.scale
  return clampCamera(
    {
      scale: nextScale,
      x: anchor.x - (anchor.x - camera.x) * ratio,
      y: anchor.y - (anchor.y - camera.y) * ratio,
    },
    size,
  )
}

export function panBy(camera: Camera, dx: number, dy: number, size: CanvasSize): Camera {
  return clampCamera({ ...camera, x: camera.x + dx, y: camera.y + dy }, size)
}

/** 滚轮缩放：向上滚动放大 */
export function zoomFromWheel(camera: Camera, deltaY: number, anchor: Position, size: CanvasSize): Camera {
  const factor = Math.exp(-deltaY * 0.0016)
  return zoomAt(camera, factor, anchor, size)
}

export interface ContentBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * 计算「让内容铺满视口」的相机参数。
 * 这是沉浸式全屏的核心：进入实验时器材自动放大到占据整屏，
 * 而不是缩在屏幕中间一小块。
 */
/**
 * 聚焦时预留的边距。
 *
 * 支持**上下不对称**：舞台上下各压着一条悬浮控件（顶部工具栏 / 底部读数条），
 * 均匀留白会让可用区域整体上移，器材的上缘被工具栏切掉一截
 * （1688×841 实测 E1/S1/S2 都被切）。给出 `{ top, bottom }` 后，
 * "能用的矩形"与"可见范围"用的是同一组安全高度，聚焦一次到位。
 *
 * `top` / `bottom` / `left` / `right` 都**只在真正放得下时**才生效。
 * 放不下时（例如手机竖屏）会自动放弃对应方向的留白并退回贴边居中 ——
 * 否则"为了留白而缩小"会把器材挤成一团，反而不如贴边。
 */
export type FitPadding = number | { top: number; bottom: number; left?: number; right?: number }

export function resolveFitPadding(padding: FitPadding): { top: number; bottom: number; left: number; right: number } {
  if (typeof padding === 'number') return { top: padding, bottom: padding, left: padding, right: padding }
  const side = padding.top + padding.bottom
  return {
    top: padding.top,
    bottom: padding.bottom,
    left: padding.left ?? side,
    right: padding.right ?? side,
  }
}

/**
 * 在**屏幕空间**里对内容做一次投影，然后按"投影后的外接矩形"聚焦。
 *
 * 这是 `fitContent` 必须走屏幕空间的原因：
 *   舞台带 `rotateX(tilt)`，透视会把画布下方的内容放大、往下推。
 *   若直接按**画布**包围盒算相机，投影之后画布上边 y=17.86 会落到屏幕 y=53.89，
 *   而顶部安全区是 56 —— **差 2.1px 就被工具栏压住**（1688×841 实测 S1）。
 *   画布坐标"看起来居中"，屏幕上却是偏的。所以先在屏幕空间量一次真实外接矩形，
 *   再按这块屏幕矩形去解相机，才算真正"放得进安全区"。
 *
 * `project` 缺省为恒等（无倾斜的平铺场景既不需要、也不该被改变行为）。
 */
function screenSpaceBounds(
  bounds: ContentBounds,
  project: (point: Position) => Position,
  /** 真正的取样点（比包围盒的四条边更"凸"），缺省退回包围盒四边 */
  probes: readonly Position[],
): ContentBounds {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  const visit = (point: Position) => {
    const projected = project(point)
    minX = Math.min(minX, projected.x)
    maxX = Math.max(maxX, projected.x)
    minY = Math.min(minY, projected.y)
    maxY = Math.max(maxY, projected.y)
  }
  /**
   * **必须按真实取样点量**，不能只量包围盒的四条边。
   *
   * 这是一个实测踩到的坑：包围盒（`layoutBounds`）是各件器材外接矩形的**并集**，
   * 而透视是**非线性**的（画布下方被放大、往下推）。
   * 于是"包围盒的下边 y=548.92"投影到屏幕是 781（刚好压在底部读数条上），
   * 而**同一件器材 S2 的四个角**投影出来是 784.96 —— 白白多出 3.96px 越界。
   * 只看包围盒四边就会得出"已经放得下"的错误结论。
   */
  const steps = 24
  if (probes.length === 0) {
    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps
      const x = bounds.minX + (bounds.maxX - bounds.minX) * t
      const y = bounds.minY + (bounds.maxY - bounds.minY) * t
      visit({ x, y: bounds.minY })
      visit({ x, y: bounds.maxY })
      visit({ x: bounds.minX, y })
      visit({ x: bounds.maxX, y })
    }
  }
  for (const point of probes) visit(point)
  return { minX, maxX, minY, maxY }
}
export function fitContent(
  bounds: ContentBounds,
  size: CanvasSize,
  padding: FitPadding = 64,
  maxScale = 2.6,
  /**
   * 画布坐标 → 屏幕坐标的投影（含 3D 透视，**相机固定为 scale=1 / 平移 0**）。
   *
   * 传进来时，聚焦会在**屏幕空间**里量一次真实外接矩形，保证
   * "相机摆好 = 内容真的落在安全区内"。不传则退化为纯线性聚焦（无倾斜场景的旧行为）。
   */
  project?: (point: Position) => Position,
  /**
   * 参与测量的**真实几何点**（各件器材的本体外接矩形四角等）。
   *
   * 透视是非线性的，只看包围盒四边会低估投影范围（实测差 3.96px）；
   * 传了它就能按内容真实的凸包量，聚焦结果与"可见性判据"严格一致。
   */
  probes: readonly Position[] = [],
): Camera {
  const { top, bottom, left, right } = resolveFitPadding(padding)
  const usableWidth = Math.max(1, size.width - left - right)
  const usableHeight = Math.max(1, size.height - top - bottom)

  /**
   * 为什么要按**屏幕空间**量一次，而不是直接用画布包围盒：
   *
   *   舞台带 `rotateX(tilt)`，透视会把画布下方的内容放大、往下推。
   *   按画布包围盒算出来的相机，投影之后画布上边 y=17.86 落到屏幕 y=53.89，
   *   而顶部安全区是 56 —— **差 2.1px 就被工具栏压住**（1688×841 实测 S1）。
   *   画布坐标"看起来居中"，屏幕上其实是偏的。所以先投影、再按投影后的矩形解相机。
   *
   * 又因为投影对 `scale` 是**齐次**的、对 `x / y` 只是**平移**，可以：
   *   1. 固定 `scale = 1`、平移 0 预投影一次，得到内容的"屏幕形状"；
   *   2. 由形状解出 `scale`，再把它居中到可用区域。
   */
  const shapedAt = (candidateScale: number): ContentBounds => {
    if (project === undefined) {
      return {
        minX: bounds.minX * candidateScale,
        maxX: bounds.maxX * candidateScale,
        minY: bounds.minY * candidateScale,
        maxY: bounds.maxY * candidateScale,
      }
    }
    return screenSpaceBounds(
      bounds,
      (point) => project({ x: point.x * candidateScale, y: point.y * candidateScale }),
      probes.map((point) => ({ x: point.x * candidateScale, y: point.y * candidateScale })),
    )
  }

  const unit = shapedAt(1)
  const unitWidth = Math.max(1e-6, unit.maxX - unit.minX)
  const unitHeight = Math.max(1e-6, unit.maxY - unit.minY)
  /**
   * 先在**画布空间**估一个上界（保证任何情况下都不会比可用矩形更大），
   * 再用真实投影尺寸**二分收敛**到刚好放下。
   *
   * 为什么要二分而不是"估一次再乘个系数"：透视里带 `perspective-origin` 的仿射项，
   * 缩放不是严格齐次的，一步乘系数会留下几像素的残差 ——
   * 实测就是那几像素让 S2 的下缘刚好压在底部读数条下面。
   * 二分把"投影后的外接矩形 ≤ 可用矩形"当成单调判据，收敛到 1e-6 画布单位以内。
   */
  const canvasWidth = Math.max(1e-6, bounds.maxX - bounds.minX)
  const canvasHeight = Math.max(1e-6, bounds.maxY - bounds.minY)
  const upper = clamp(
    Math.min(usableWidth / Math.min(unitWidth, canvasWidth), usableHeight / Math.min(unitHeight, canvasHeight)),
    CANVAS_MIN_SCALE,
    maxScale,
  )
  const fits = (candidate: number) => {
    const measured = shapedAt(candidate)
    return (
      measured.maxX - measured.minX <= usableWidth + 1e-6 && measured.maxY - measured.minY <= usableHeight + 1e-6
    )
  }
  let lowerBound = CANVAS_MIN_SCALE
  let upperBound = upper
  if (fits(upperBound)) {
    lowerBound = upperBound
  } else {
    for (let step = 0; step < 60; step += 1) {
      const mid = (lowerBound + upperBound) / 2
      if (fits(mid)) lowerBound = mid
      else upperBound = mid
    }
  }
  const scale = lowerBound

  const measured = shapedAt(scale)
  const width = measured.maxX - measured.minX
  const height = measured.maxY - measured.minY
  /**
   * 放得下的方向才按可用矩形居中；放不下（例如手机竖屏把构图标尺缩到很小）就退回整屏居中。
   * 一味居中会把溢出**平摊到两侧**，本来上边还剩 56px 安全区的，反而被啃掉一半，
   * 器材照样被顶部控件压住 —— 逐个方向判、逐个方向退，安全区才在任何情况下都保得住。
   */
  const offsetLeft = width <= usableWidth + 1e-6 ? left : 0
  const offsetWidth = width <= usableWidth + 1e-6 ? usableWidth : size.width
  const offsetTop = height <= usableHeight + 1e-6 ? top : 0
  const offsetHeight = height <= usableHeight + 1e-6 ? usableHeight : size.height

  const targetX = offsetLeft + offsetWidth / 2
  const targetY = offsetTop + offsetHeight / 2
  return clampCamera(
    {
      scale,
      x: targetX - (measured.minX + measured.maxX) / 2,
      y: targetY - (measured.minY + measured.maxY) / 2,
    },
    size,
  )
}

/**
 * 把聚焦结果**按真实相机闭环校正**一遍，直到内容真的落进目标矩形。
 *
 * 为什么必须在相机层面再校一次：`fitContent` 内部用"画布坐标 × scale + 单位投影"
 * 近似量尺寸，忽略了 `perspective-origin` 是**舞台像素**这一点带来的仿射项，
 * 量出的外接矩形比真实投影略小（1688×841 实测差 3.96px）——
 * 结果就是"算出来放得下、画面上仍有一件器材压在顶部工具栏上"。
 *
 * 迭代方式很朴素：**量 → 不够就等比收 → 再居中**。投影对平移是线性的，
 * 所以居中的残差只由"缩放改变了非线性项"产生，两三次迭代即到 1e-3 像素以内。
 */
export function settleFit(
  camera: Camera,
  target: { left: number; top: number; width: number; height: number },
  measure: (camera: Camera) => ContentBounds | null,
): Camera {
  const roomWidth = Math.max(1, target.width)
  const roomHeight = Math.max(1, target.height)
  const centerX = target.left + roomWidth / 2
  const centerY = target.top + roomHeight / 2

  const centerOn = (candidate: Camera): Camera | null => {
    const before = measure(candidate)
    if (before === null) return null
    const recentered = {
      ...candidate,
      x: candidate.x + centerX - (before.minX + before.maxX) / 2,
      y: candidate.y + centerY - (before.minY + before.maxY) / 2,
    }
    return recentered
  }

  const fits = (measured: ContentBounds) =>
    measured.maxX - measured.minX <= roomWidth + 1e-3 && measured.maxY - measured.minY <= roomHeight + 1e-3

  let current: Camera = { ...camera }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const measured = measure(current)
    if (measured === null) return current
    if (fits(measured)) {
      const centered = centerOn(current)
      if (centered === null) return current
      const after = measure(centered)
      const stable =
        Math.abs(centered.x - current.x) < 1e-3 &&
        Math.abs(centered.y - current.y) < 1e-3 &&
        Math.abs(centered.scale - current.scale) < 1e-9
      if (stable || (after !== null && fits(after))) return centered
      current = centered
      continue
    }
    const shrink = Math.min(
      roomWidth / Math.max(measured.maxX - measured.minX, 1e-6),
      roomHeight / Math.max(measured.maxY - measured.minY, 1e-6),
    )
    const scaled: Camera = { ...current, scale: clamp(current.scale * shrink, CANVAS_MIN_SCALE, CANVAS_MAX_SCALE) }
    const centered = centerOn(scaled)
    if (centered === null) return scaled
    if (Math.abs(centered.scale - current.scale) < 1e-9 && Math.abs(centered.x - current.x) < 1e-6 && Math.abs(centered.y - current.y) < 1e-6) {
      return centered
    }
    current = centered
  }
  return current
}

export function screenToCanvas(point: Position, camera: Camera): Position {
  return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale }
}

/** 画布坐标 → 屏幕坐标 */
export function canvasToScreen(point: Position, camera: Camera): Position {
  return { x: point.x * camera.scale + camera.x, y: point.y * camera.scale + camera.y }
}


/* ------------------------------------------------------------------ *
 * 3D 透视舞台的屏幕 ↔ 画布换算
 * ------------------------------------------------------------------ */

/**
 * 3D 透视舞台的相机参数。
 *
 * 舞台的 transform 链是（从外到内）：
 *   `translate3d(x, y, 0) scale(scale) rotateX(tilt)`
 * 也就是说画布点先被 `rotateX` 倾斜、再缩放、再平移，最后经 `perspective`
 * 投影到屏幕。**只要 tilt ≠ 0，屏幕↔画布就不再是线性的 scale+translate 关系。**
 */
export interface PerspectiveStage {
  camera: Camera
  /** 倾斜角（度），对应 CSS `rotateX` */
  tilt: number
  /** CSS `perspective` 值（px） */
  perspective: number
  /** `perspective-origin` 在舞台内的像素坐标 */
  originX: number
  originY: number
  /** 舞台尺寸 */
  stage: CanvasSize
}

/** 画布坐标 → 屏幕坐标（含 3D 透视投影） */
export function projectPerspective(point: Position, stage: PerspectiveStage): Position {
  const radians = (stage.tilt * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const p = point.x * stage.camera.scale + stage.camera.x
  const q = point.y * cos * stage.camera.scale + stage.camera.y
  const depth = point.y * sin * stage.camera.scale
  // perspective 投影：以 perspective-origin 为中心按深度缩放
  const factor = 1 - depth / stage.perspective
  // 深度 >= perspective 的点会退化到无穷远（CSS 里会被裁掉），退回不做透视
  if (!Number.isFinite(factor) || Math.abs(factor) < 1e-6) return { x: p, y: q }
  const k = 1 / factor
  return {
    x: stage.originX + (p - stage.originX) * k,
    y: stage.originY + (q - stage.originY) * k,
  }
}

/**
 * 屏幕坐标 → 画布坐标（含 3D 透视投影）。
 *
 * 投影后 x 与 y 都被深度耦合：深度只由画布 y 决定，
 * 因此先用二分法从屏幕 y 解出画布 y，再用它解出画布 x。
 * 二分而不用解析解，是因为解析解在这里既难读又容易出现退化分支。
 */
export function unprojectPerspective(point: Position, stage: PerspectiveStage): Position {
  /**
   * 搜索区间必须**严格避开透视奇点**。
   *
   * 深度 `depth = y * sin(tilt) * scale`，当 `depth → perspective` 时
   * 投影因子趋近 0，屏幕坐标发散到无穷。越过奇点之后投影不再单调，
   * 二分法会直接跑飞（实测：区间取 ±1e6 时解出 y = -1000000，
   * 器材被扔到屏幕外 8156px）。
   *
   * 因此把区间限制在奇点之内的 `PERSPECTIVE_SEARCH_LIMIT`，
   * 这已远超任何合理的画布范围（约 ±5000 个画布单位）。
   */
  const limit = perspectiveSearchLimit(stage)
  const canvasY = bisect((value) => projectPerspective({ x: 0, y: value }, stage).y, point.y, -limit, limit)
  const canvasX = bisect((value) => projectPerspective({ x: value, y: canvasY }, stage).x, point.x, -limit, limit)
  return { x: canvasX, y: canvasY }
}

/**
 * 反投影的搜索半径：从透视参数**推导**，而不是拍一个常数。
 *
 * 奇点在 `y = perspective / (sin(tilt) * scale)`（此处投影因子为 0，屏幕坐标发散）。
 * 取奇点的 90% 作为上界：既远离发散区、保持严格单调，
 * 又远超任何实际会用到的画布范围。
 * 注意 `tilt = 0` 时没有奇点，退化为一个足够大的常数。
 */
export function perspectiveSearchLimit(stage: PerspectiveStage): number {
  const radians = (stage.tilt * Math.PI) / 180
  const sin = Math.abs(Math.sin(radians))
  const denominator = sin * Math.abs(stage.camera.scale)
  if (denominator < 1e-9) return 1e7
  return (Math.abs(stage.perspective) / denominator) * 0.9
}

const BISECT_STEPS = 100

/** 在 [low, high] 上二分求 `f(value) ≈ target`（要求 f 在该区间内单调） */
function bisect(f: (value: number) => number, target: number, low: number, high: number): number {
  let lo = low
  let hi = high
  const ascending = f(high) >= f(low)
  for (let step = 0; step < BISECT_STEPS; step += 1) {
    const mid = (lo + hi) / 2
    const value = f(mid)
    if (ascending ? value < target : value > target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
