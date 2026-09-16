/**
 * 无限画布（infinite canvas）相机模型。
 *
 * 纯函数实现，不依赖 DOM，便于单元测试：
 *   · 画布坐标使用与实验台一致的视图坐标系（960×540 基准视口）
 *   · 相机由「缩放 scale + 平移 offset」描述，缩放范围与位移范围都被钳制，
 *     因此无限平移/缩放不会丢失器材（不会把学生"飘"到空白宇宙里）
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
  maxOffsetX: number
  maxOffsetY: number
}

export const CANVAS_MIN_SCALE = 0.18
export const CANVAS_MAX_SCALE = 14
/** 平移可达范围：允许一定越界，但不允许把内容完全拖出屏幕 */
export const CANVAS_OFFSET_MARGIN = 1600

export const IDENTITY_CAMERA: Camera = { scale: 1, x: 0, y: 0 }

export function cameraLimits(size: CanvasSize): CameraLimits {
  return {
    minScale: CANVAS_MIN_SCALE,
    maxScale: CANVAS_MAX_SCALE,
    maxOffsetX: Math.max(CANVAS_OFFSET_MARGIN, size.width * 6),
    maxOffsetY: Math.max(CANVAS_OFFSET_MARGIN, size.height * 6),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampCamera(camera: Camera, size: CanvasSize): Camera {
  const limits = cameraLimits(size)
  return {
    scale: clamp(camera.scale, limits.minScale, limits.maxScale),
    x: clamp(camera.x, -limits.maxOffsetX, limits.maxOffsetX),
    y: clamp(camera.y, -limits.maxOffsetY, limits.maxOffsetY),
  }
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
export function fitContent(
  bounds: ContentBounds,
  size: CanvasSize,
  padding = 64,
  maxScale = 2.6,
): Camera {
  const contentWidth = Math.max(1, bounds.maxX - bounds.minX)
  const contentHeight = Math.max(1, bounds.maxY - bounds.minY)
  const usableWidth = Math.max(1, size.width - padding * 2)
  const usableHeight = Math.max(1, size.height - padding * 2)
  const scale = clamp(Math.min(usableWidth / contentWidth, usableHeight / contentHeight), CANVAS_MIN_SCALE, maxScale)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return clampCamera(
    {
      scale,
      x: size.width / 2 - centerX * scale,
      y: size.height / 2 - centerY * scale,
    },
    size,
  )
}

/** 屏幕坐标 → 画布坐标 */
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
