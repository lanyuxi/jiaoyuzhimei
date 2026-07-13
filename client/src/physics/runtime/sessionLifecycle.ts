import type { DerivedMeasurement, LabFeedback } from './types'
import type { PhysicsSessionRepository } from '../sessions/repository'
import type {
  PhysicsEventRecord,
  PhysicsExperimentalCondition,
  PhysicsMeasurementRecord,
  PhysicsSession,
  PhysicsSessionRecoveryResult,
} from '../sessions/types'

type SessionWriter = Pick<
  PhysicsSessionRepository,
  'appendEvent' | 'appendMeasurement' | 'complete' | 'create' | 'findLatestInProgress'
>

let fallbackRecordId = 0

function recordId(prefix: string): string {
  const randomId = globalThis.crypto?.randomUUID?.()
  if (randomId) return `${prefix}-${randomId}`

  fallbackRecordId += 1
  return `${prefix}-${Date.now()}-${fallbackRecordId}`
}

function nowOr(value?: string): string {
  return value ?? new Date().toISOString()
}

export interface LabSessionCoordinator {
  ensureSession(): PhysicsSession
  createNewSession(): PhysicsSession
}

export function createLabSessionCoordinator(
  repository: Pick<SessionWriter, 'create' | 'findLatestInProgress'>,
  experimentId: string,
  experimentTitle: string,
): LabSessionCoordinator {
  let session: PhysicsSession | undefined

  function create(): PhysicsSession {
    session = repository.create(experimentId, experimentTitle)
    return session
  }

  return {
    ensureSession: () => {
      session ??= repository.findLatestInProgress(experimentId) ?? create()
      return session
    },
    createNewSession: create,
  }
}

export function recordLabFeedback(
  repository: Pick<SessionWriter, 'appendEvent'>,
  sessionId: string,
  action: string,
  feedback: LabFeedback,
  at?: string,
): PhysicsEventRecord {
  const event = labFeedbackEvent(action, feedback, at)
  repository.appendEvent(sessionId, event)
  return event
}

function labFeedbackEvent(
  action: string,
  feedback: LabFeedback,
  at?: string,
): PhysicsEventRecord {
  return {
    id: recordId('physics-event'),
    action,
    detail: feedback.message,
    outcome: feedback.outcome,
    at: nowOr(at),
  }
}

export function recordDerivedMeasurements(
  repository: Pick<SessionWriter, 'appendMeasurement'>,
  sessionId: string,
  measurements: readonly DerivedMeasurement[],
  conditions: readonly PhysicsExperimentalCondition[],
  at?: string,
): PhysicsMeasurementRecord[] {
  const recordedAt = nowOr(at)
  const copiedConditions = conditions.map((condition) => ({ ...condition }))

  return measurements.map((measurement) => {
    const record: PhysicsMeasurementRecord = {
      ...measurement,
      at: recordedAt,
      conditions: copiedConditions.map((condition) => ({ ...condition })),
    }
    repository.appendMeasurement(sessionId, record)
    return record
  })
}

export function completeLabSession(
  repository: Pick<SessionWriter, 'complete'>,
  sessionId: string,
  feedback?: LabFeedback,
  at?: string,
): PhysicsSession | undefined {
  return repository.complete(sessionId, feedback ? labFeedbackEvent('complete-lab', feedback, at) : undefined)
}

export interface RecoveryPrompt {
  title: string
  actionLabel: string
}

export function recoveryPrompt(recovery: PhysicsSessionRecoveryResult): RecoveryPrompt | undefined {
  if (recovery.status === 'empty' || recovery.status === 'restored') return undefined

  return {
    title: recovery.status === 'unavailable' ? '本地实验记录暂时不可保存' : '本地实验记录无法恢复',
    actionLabel: '创建新会话',
  }
}
