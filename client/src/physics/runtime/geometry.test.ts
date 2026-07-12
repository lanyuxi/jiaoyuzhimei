import { describe, expect, it } from 'vitest'
import { clampPosition, snapPoint } from './geometry'

describe('clampPosition', () => {
  it('keeps an object fully inside the stage', () => {
    expect(clampPosition(
      { x: -10, y: 500 },
      { width: 100, height: 80 },
      { width: 400, height: 300 },
    )).toEqual({ x: 0, y: 220 })
  })

  it('allows positions exactly on the stage boundaries', () => {
    expect(clampPosition(
      { x: 300, y: 220 },
      { width: 100, height: 80 },
      { width: 400, height: 300 },
    )).toEqual({ x: 300, y: 220 })
  })

  it('pins an oversized object to the stage origin', () => {
    expect(clampPosition(
      { x: 20, y: 20 },
      { width: 500, height: 400 },
      { width: 400, height: 300 },
    )).toEqual({ x: 0, y: 0 })
  })
})

describe('snapPoint', () => {
  it('returns a target at the inclusive snap radius', () => {
    expect(snapPoint(
      { x: 108, y: 100 },
      [{ id: 'hook', x: 100, y: 100 }],
      8,
    )?.id).toBe('hook')
  })

  it('returns the nearest target within the snap radius', () => {
    expect(snapPoint(
      { x: 98, y: 101 },
      [
        { id: 'near', x: 100, y: 100 },
        { id: 'far', x: 95, y: 95 },
      ],
      8,
    )?.id).toBe('near')
  })

  it('keeps the first target when candidates are tied', () => {
    expect(snapPoint(
      { x: 100, y: 100 },
      [
        { id: 'first', x: 96, y: 100 },
        { id: 'second', x: 104, y: 100 },
      ],
      8,
    )?.id).toBe('first')
  })

  it('returns null when no target is within the radius', () => {
    expect(snapPoint(
      { x: 120, y: 120 },
      [{ id: 'hook', x: 100, y: 100 }],
      8,
    )).toBeNull()
  })
})
