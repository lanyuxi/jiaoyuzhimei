import type { JsonValue, PhysicsExperimentalCondition } from '../sessions/types'

export interface LabAction {
  type: string
  payload?: unknown
}

export interface LabFeedback {
  outcome: 'accepted' | 'rejected'
  message: string
}

export interface LabTransition<TState> {
  state: TState
  feedback: LabFeedback
}

export interface DerivedMeasurement {
  trialId: string
  key: string
  label: string
  value: number | string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
}

export interface DerivedMeasurementGroup {
  conditions: readonly PhysicsExperimentalCondition[]
  measurements: readonly DerivedMeasurement[]
}

export interface LabReportSummary {
  calculationResults: readonly string[]
  conclusion: readonly string[]
  errorAnalysis: readonly string[]
}

export interface LabController<TState> {
  createInitialState(): TState
  reduce(state: TState, action: LabAction): LabTransition<TState>
  deriveMeasurements(state: TState): readonly DerivedMeasurement[]
  snapshot(state: TState): JsonValue
  restore(snapshot: unknown): TState
  measurementGroups(state: TState): readonly DerivedMeasurementGroup[]
  report(state: TState): LabReportSummary
  completion(state: TState): { complete: boolean; message: string }
}

export interface LabRuntime<TState> {
  present: TState
  past: TState[]
  future: TState[]
  feedback: LabFeedback | null
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface SnapTarget extends Position {
  id: string
}
