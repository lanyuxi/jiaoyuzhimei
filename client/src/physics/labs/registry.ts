import type { ComponentType } from 'react'
import type { TextbookPhysicsExperiment } from '../curriculum/types'

export interface RegisteredLab {
  experimentId: string
  Lab: ComponentType<{ experiment: TextbookPhysicsExperiment }>
}

export const labRegistry = new Map<string, RegisteredLab>()
