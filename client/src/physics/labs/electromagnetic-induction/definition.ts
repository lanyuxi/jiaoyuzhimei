export type MagneticFieldDirection = 'down' | 'up'

export const BENCH = {
  width: 960,
  height: 540,
} as const

export const RAIL = {
  y: 294,
  left: 136,
  right: 824,
  initialX: 480,
  hitHeight: 58,
  pixelsPerMeter: 100,
} as const

export const MAGNET_GAP = {
  left: 365,
  right: 595,
  top: 142,
  bottom: 360,
} as const

export const MAGNETIC_FIELD_TESLA = 0.5
export const CONDUCTOR_LENGTH_METERS = 0.1
export const CIRCUIT_RESISTANCE_OHMS = 2
export const GALVANOMETER_MAX_CURRENT_AMPS = 1

export function isInsideMagnetGap(x: number): boolean {
  return Number.isFinite(x) && x >= MAGNET_GAP.left && x <= MAGNET_GAP.right
}

export function signedFieldTesla(direction: MagneticFieldDirection): number {
  return direction === 'down' ? MAGNETIC_FIELD_TESLA : -MAGNETIC_FIELD_TESLA
}
