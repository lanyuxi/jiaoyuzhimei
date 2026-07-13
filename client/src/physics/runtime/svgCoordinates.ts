import type { Position } from './types'

export interface SvgViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SvgCoordinateMappingOptions {
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
  viewBox: SvgViewBox
}

export interface SvgClientPoint {
  clientX: number
  clientY: number
}

export function mapClientPointToSvgViewBox(
  point: SvgClientPoint,
  { rect, viewBox }: SvgCoordinateMappingOptions,
): Position | null {
  if (rect.width <= 0 || rect.height <= 0 || viewBox.width <= 0 || viewBox.height <= 0) return null

  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height)
  const contentWidth = viewBox.width * scale
  const contentHeight = viewBox.height * scale
  const offsetX = (rect.width - contentWidth) / 2
  const offsetY = (rect.height - contentHeight) / 2

  return {
    x: (point.clientX - rect.left - offsetX) / scale + viewBox.x,
    y: (point.clientY - rect.top - offsetY) / scale + viewBox.y,
  }
}
