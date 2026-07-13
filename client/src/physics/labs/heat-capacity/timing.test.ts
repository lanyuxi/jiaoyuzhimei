import { describe, expect, it } from 'vitest'
import { elapsedSecondsBetween, startHeatCapacityTimer } from './timing'

describe('heat capacity timer', () => {
  it('uses monotonic timestamps for fractional delayed callback deltas and rejects invalid deltas', () => {
    expect(elapsedSecondsBetween(1_000, 3_750)).toBe(2.75)
    expect(elapsedSecondsBetween(3_750, 3_000)).toBe(0)
    expect(elapsedSecondsBetween(1_000, Number.POSITIVE_INFINITY)).toBe(0)
    expect(elapsedSecondsBetween(0, 60_000)).toBe(5)
  })

  it('cleans up its interval and ignores a stale callback after cleanup', () => {
    let now = 1_000
    let callback: (() => void) | undefined
    const cleared: number[] = []
    const elapsed: number[] = []
    const cleanup = startHeatCapacityTimer({
      now: () => now,
      setInterval: (next) => {
        callback = next
        return 17
      },
      clearInterval: (timerId) => cleared.push(timerId),
      onElapsed: (seconds) => elapsed.push(seconds),
    })

    now = 2_250
    callback?.()
    cleanup()
    now = 4_000
    callback?.()

    expect(elapsed).toEqual([1.25])
    expect(cleared).toEqual([17])
  })
})
