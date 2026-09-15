import type { ComponentType } from 'react'
import type { TextbookPhysicsExperiment } from '../curriculum/types'
import { HeatCapacityLab } from './heat-capacity/HeatCapacityScene'
import { SeriesParallelLab } from './series-parallel/SeriesParallelScene'
import { ElectromagneticInductionLab } from './electromagnetic-induction/ElectromagneticInductionScene'
import { AmmeterLab } from './ammeter-use/CompetitorScene'

export interface RegisteredLab {
  experimentId: string
  Lab: ComponentType<{ experiment: TextbookPhysicsExperiment }>
}

/**
 * 顺序与课程表中可用实验的出现顺序保持一致
 * （heat-capacity-comparison → series-parallel-circuit → ammeter-use → electromagnetic-induction），
 * 便于测试与目录卡片一一对应。
 */
export const labRegistry = new Map<string, RegisteredLab>([
  ['heat-capacity-comparison', { experimentId: 'heat-capacity-comparison', Lab: HeatCapacityLab }],
  ['series-parallel-circuit', { experimentId: 'series-parallel-circuit', Lab: SeriesParallelLab }],
  ['ammeter-use', { experimentId: 'ammeter-use', Lab: AmmeterLab }],
  ['electromagnetic-induction', { experimentId: 'electromagnetic-induction', Lab: ElectromagneticInductionLab }],
])
