export type PhysicsSessionStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface PhysicsEventRecord {
  id: string
  action: string
  detail: string
  outcome: 'accepted' | 'rejected'
  at: string
}

export interface PhysicsExperimentalCondition {
  label: string
  value: number | string
}

export interface PhysicsMeasurementRecord {
  trialId: string
  key: string
  label: string
  value: number | string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
  at: string
  conditions: PhysicsExperimentalCondition[]
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface PhysicsSessionReport {
  purpose: string[]
  apparatus: string[]
  calculationResults: string[]
  conclusion: string[]
  errorAnalysis: string[]
  supplement: string[]
}

export interface PhysicsSessionSynchronization {
  runtimeSnapshot: JsonValue
  measurements: PhysicsMeasurementRecord[]
  report: PhysicsSessionReport
  event?: PhysicsEventRecord
}

export type PhysicsSessionRecoveryStatus =
  | 'empty'
  | 'restored'
  | 'malformed'
  | 'stale'
  | 'unavailable'
  | 'backup-failed'

export interface PhysicsSessionRecoveryResult {
  status: PhysicsSessionRecoveryStatus
  backupCreated: boolean
  liveKeyRetained: boolean
}

export interface PhysicsSession {
  version: 1
  id: string
  experimentId: string
  experimentTitle: string
  status: PhysicsSessionStatus
  createdAt: string
  updatedAt: string
  events: PhysicsEventRecord[]
  measurements: PhysicsMeasurementRecord[]
  runtimeSnapshot?: JsonValue
  report?: PhysicsSessionReport
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
