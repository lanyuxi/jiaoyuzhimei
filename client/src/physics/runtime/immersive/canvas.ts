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
