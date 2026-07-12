export type PhysicsSessionStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface PhysicsEventRecord {
  id: string
  action: string
  detail: string
  outcome: 'accepted' | 'rejected'
  at: string
}

export interface PhysicsMeasurementRecord {
  trialId: string
  key: string
  label: string
  value: number | string
  unit: string
  kind: 'raw' | 'derived' | 'observation'
  at: string
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
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
