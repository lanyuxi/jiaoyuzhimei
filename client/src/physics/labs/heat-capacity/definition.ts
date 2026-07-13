import type { Position } from '../../runtime/types'

export const INITIAL_TEMPERATURE = 25
export const WATER_SPECIFIC_HEAT_CAPACITY = 4200
export const COOKING_OIL_SPECIFIC_HEAT_CAPACITY = 2100
export const DEFAULT_HEATER_POWER = 80
export const DEFAULT_SAMPLE_MASS = 0.2
export const EQUAL_MASS_TOLERANCE = 0.001
export const MINIMUM_RECORDING_SECONDS = 30

export type HeatCapacitySubstance = 'water' | 'oil'
export type HeatCapacityDragSubject = 'waterThermometer' | 'oilThermometer' | 'waterHeater' | 'oilHeater'

export interface HeatCapacitySnapZone {
  id: HeatCapacityDragSubject
  x: number
  y: number
  width: number
  height: number
}

export const HEAT_CAPACITY_SNAP_ZONES: Readonly<Record<HeatCapacityDragSubject, HeatCapacitySnapZone>> = {
  waterThermometer: { id: 'waterThermometer', x: 240, y: 136, width: 150, height: 230 },
  oilThermometer: { id: 'oilThermometer', x: 570, y: 136, width: 150, height: 230 },
  waterHeater: { id: 'waterHeater', x: 230, y: 334, width: 170, height: 140 },
  oilHeater: { id: 'oilHeater', x: 560, y: 334, width: 170, height: 140 },
}

export function isInsideSnapZone(position: Position, zone: HeatCapacitySnapZone): boolean {
  return position.x >= zone.x
    && position.x <= zone.x + zone.width
    && position.y >= zone.y
    && position.y <= zone.y + zone.height
}
