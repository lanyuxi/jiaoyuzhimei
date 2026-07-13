import type { ComponentType } from 'react'
import type { TextbookPhysicsExperiment } from '../curriculum/types'
import { HeatCapacityLab } from './heat-capacity/HeatCapacityScene'
import { SeriesParallelLab } from './series-parallel/SeriesParallelScene'
import { ElectromagneticInductionLab } from './electromagnetic-induction/ElectromagneticInductionScene'

export interface RegisteredLab {
  experimentId: string
  Lab: ComponentType<{ experiment: TextbookPhysicsExperiment }>
}

export const labRegistry = new Map<string, RegisteredLab>([
  ['heat-capacity-comparison', { experimentId: 'heat-capacity-comparison', Lab: HeatCapacityLab }],
  ['series-parallel-circuit', { experimentId: 'series-parallel-circuit', Lab: SeriesParallelLab }],
  ['electromagnetic-induction', { experimentId: 'electromagnetic-induction', Lab: ElectromagneticInductionLab }],
])
