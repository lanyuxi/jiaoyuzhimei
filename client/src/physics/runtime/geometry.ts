import type { Position, Size, SnapTarget } from './types'

export function clampPosition(position: Position, objectSize: Size, stageSize: Size): Position {
  const maximumX = Math.max(0, stageSize.width - objectSize.width)
  const maximumY = Math.max(0, stageSize.height - objectSize.height)

  return {
    x: Math.min(Math.max(position.x, 0), maximumX),
    y: Math.min(Math.max(position.y, 0), maximumY),
  }
}

export function snapPoint(position: Position, targets: readonly SnapTarget[], radius: number): SnapTarget | null {
  if (radius < 0) return null

  const maximumDistanceSquared = radius * radius
  let nearest: SnapTarget | null = null
  let nearestDistanceSquared = Number.POSITIVE_INFINITY

  for (const target of targets) {
    const distanceX = position.x - target.x
    const distanceY = position.y - target.y
    const distanceSquared = distanceX * distanceX + distanceY * distanceY

    if (distanceSquared <= maximumDistanceSquared && distanceSquared < nearestDistanceSquared) {
      nearest = target
      nearestDistanceSquared = distanceSquared
    }
  }

  return nearest
}
