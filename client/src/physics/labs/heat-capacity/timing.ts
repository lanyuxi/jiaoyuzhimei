export const MAXIMUM_TIMER_DELTA_SECONDS = 5

export function elapsedSecondsBetween(previousTimestamp: number, currentTimestamp: number): number {
  if (!Number.isFinite(previousTimestamp) || !Number.isFinite(currentTimestamp) || currentTimestamp < previousTimestamp) {
    return 0
  }

  return Math.min((currentTimestamp - previousTimestamp) / 1_000, MAXIMUM_TIMER_DELTA_SECONDS)
}

export interface HeatCapacityTimerOptions {
  now(): number
  setInterval(callback: () => void): number
  clearInterval(timerId: number): void
  onElapsed(seconds: number): void
}

export function startHeatCapacityTimer(options: HeatCapacityTimerOptions): () => void {
  let active = true
  let previousTimestamp = options.now()
  const timerId = options.setInterval(() => {
    if (!active) return

    const currentTimestamp = options.now()
    const elapsedSeconds = elapsedSecondsBetween(previousTimestamp, currentTimestamp)
    if (Number.isFinite(currentTimestamp) && currentTimestamp >= previousTimestamp) {
      previousTimestamp = currentTimestamp
    }
    if (elapsedSeconds > 0) options.onElapsed(elapsedSeconds)
  })

  return () => {
    active = false
    options.clearInterval(timerId)
  }
}
