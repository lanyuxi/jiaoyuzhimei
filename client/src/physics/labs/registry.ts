import type { ComponentType } from 'react'
import type { TextbookPhysicsExperiment } from '../curriculum/types'
import { HeatCapacityLab } from './heat-capacity/HeatCapacityScene'

export interface RegisteredLab {
  experimentId: string
  Lab: ComponentType<{ experiment: TextbookPhysicsExperiment }>
}

export const labRegistry = new Map<string, RegisteredLab>([
  ['heat-capacity-comparison', { experimentId: 'heat-capacity-comparison', Lab: HeatCapacityLab }],
])
