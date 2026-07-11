export type TextbookVolume = '八年级上册' | '八年级下册' | '九年级全一册'
export type ExperimentRequirement = 'required' | 'optional'
export type ExperimentActivityType = '基础技能' | '测量' | '探究' | '演示' | '模型'
export type ExperimentAvailability = 'available' | 'scheduled'

export interface MeasurementDefinition {
  key: string
  label: string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
  decimals?: number
}

export interface TextbookPhysicsExperiment {
  id: string
  sourceNumber: number
  title: string
  textbook: '人教版'
  volume: TextbookVolume
  chapter: string
  sourceType: string
  requirement: ExperimentRequirement
  activityType: ExperimentActivityType
  purpose: readonly string[]
  principle: readonly string[]
  apparatus: readonly string[]
  steps: readonly string[]
  conclusion: readonly string[]
  supplement: readonly string[]
  measurements: readonly MeasurementDefinition[]
  availability: ExperimentAvailability
  labId?: string
}

export interface CurriculumFilters {
  volume: TextbookVolume | 'ALL'
  chapter: string | 'ALL'
  requirement: ExperimentRequirement | 'ALL'
  query: string
}
