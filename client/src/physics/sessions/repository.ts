import type {
  PhysicsExperimentalCondition,
  PhysicsEventRecord,
  PhysicsMeasurementRecord,
  PhysicsSession,
  PhysicsSessionRecoveryResult,
  PhysicsSessionRecoveryStatus,
  StorageLike,
} from './types'

export const PHYSICS_SESSIONS_STORAGE_KEY = 'education-beauty-physics-sessions-v1'

let fallbackSessionId = 0

class InMemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const nonBrowserStorage = new InMemoryStorage()

class UnavailableBrowserStorage extends InMemoryStorage {
  getItem(): string | null {
    throw new Error('localStorage unavailable')
  }
}

const unavailableBrowserStorage = new UnavailableBrowserStorage()

interface LoadedSessions {
  sessions: PhysicsSession[]
  recovery: PhysicsSessionRecoveryResult
}

function cloneCondition(condition: PhysicsExperimentalCondition): PhysicsExperimentalCondition {
  return { ...condition }
}

function cloneMeasurement(measurement: PhysicsMeasurementRecord): PhysicsMeasurementRecord {
  return {
    ...measurement,
    conditions: measurement.conditions.map(cloneCondition),
  }
}

function cloneSession(session: PhysicsSession): PhysicsSession {
  return {
    ...session,
    events: session.events.map((event) => ({ ...event })),
    measurements: session.measurements.map(cloneMeasurement),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEventRecord(value: unknown): value is PhysicsEventRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.action === 'string'
    && typeof value.detail === 'string'
    && (value.outcome === 'accepted' || value.outcome === 'rejected')
    && typeof value.at === 'string'
}

function isFiniteNumberOrString(value: unknown): value is number | string {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
}

function isExperimentalCondition(value: unknown): value is PhysicsExperimentalCondition {
  return isRecord(value)
    && typeof value.label === 'string'
    && isFiniteNumberOrString(value.value)
}

function isMeasurementRecord(value: unknown): value is PhysicsMeasurementRecord {
  return isRecord(value)
    && typeof value.trialId === 'string'
    && typeof value.key === 'string'
    && typeof value.label === 'string'
    && isFiniteNumberOrString(value.value)
    && typeof value.unit === 'string'
    && (value.kind === 'raw' || value.kind === 'derived' || value.kind === 'observation')
    && typeof value.at === 'string'
    && Array.isArray(value.conditions)
    && value.conditions.length > 0
    && value.conditions.every(isExperimentalCondition)
}

function isPhysicsSession(value: unknown): value is PhysicsSession {
  return isRecord(value)
    && value.version === 1
    && typeof value.id === 'string'
    && typeof value.experimentId === 'string'
    && typeof value.experimentTitle === 'string'
    && (value.status === 'IN_PROGRESS' || value.status === 'COMPLETED')
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
    && Array.isArray(value.events)
    && value.events.every(isEventRecord)
    && Array.isArray(value.measurements)
    && value.measurements.every(isMeasurementRecord)
}

function isSessionCollection(value: unknown): value is PhysicsSession[] {
  if (!Array.isArray(value) || !value.every(isPhysicsSession)) return false

  return new Set(value.map((session) => session.id)).size === value.length
}

function hasStaleVersion(value: unknown): boolean {
  return Array.isArray(value)
    && value.some((session) => isRecord(session) && typeof session.version === 'number' && session.version !== 1)
}

function browserStorage(): StorageLike {
  if (typeof window === 'undefined') return nonBrowserStorage

  try {
    return window.localStorage
  } catch {
    return unavailableBrowserStorage
  }
}

function sessionId(): string {
  const randomId = globalThis.crypto?.randomUUID?.()
  if (randomId) return randomId

  fallbackSessionId += 1
  return `physics-session-${Date.now()}-${fallbackSessionId}`
}

export class PhysicsSessionRepository {
  private readonly storage: StorageLike
  private sessions: PhysicsSession[]
  private recoveryResult: PhysicsSessionRecoveryResult

  constructor(storage: StorageLike) {
    this.storage = storage
    const loaded = this.load()
    this.sessions = loaded.sessions
    this.recoveryResult = loaded.recovery
  }

  get recovery(): PhysicsSessionRecoveryResult {
    return { ...this.recoveryResult }
  }

  create(experimentId: string, experimentTitle: string): PhysicsSession {
    const now = new Date().toISOString()
    const session: PhysicsSession = {
      version: 1,
      id: sessionId(),
      experimentId,
      experimentTitle,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
      events: [],
      measurements: [],
    }

    this.sessions = [...this.sessions, session]
    this.persist()
    return cloneSession(session)
  }

  list(): PhysicsSession[] {
    return this.sessions.map(cloneSession)
  }

  get(id: string): PhysicsSession | undefined {
    const session = this.sessions.find((candidate) => candidate.id === id)
    return session ? cloneSession(session) : undefined
  }

  appendEvent(id: string, event: PhysicsEventRecord): PhysicsSession | undefined {
    return this.update(id, (session) => ({
      ...session,
      updatedAt: new Date().toISOString(),
      events: [...session.events, { ...event }],
    }))
  }

  appendMeasurement(id: string, measurement: PhysicsMeasurementRecord): PhysicsSession | undefined {
    if (!isMeasurementRecord(measurement)) {
      throw new TypeError('Measurement does not match the persistence schema')
    }

    return this.update(id, (session) => ({
      ...session,
      updatedAt: new Date().toISOString(),
      measurements: [...session.measurements, cloneMeasurement(measurement)],
    }))
  }

  complete(id: string): PhysicsSession | undefined {
    return this.update(id, (session) => ({
      ...session,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    }))
  }

  private load(): LoadedSessions {
    let raw: string | null

    try {
      raw = this.storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)
    } catch {
      return this.loaded([], 'unavailable')
    }

    if (raw === null) return this.loaded([], 'empty')

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return this.quarantine(raw, 'malformed')
    }

    if (!isSessionCollection(parsed)) {
      return this.quarantine(raw, hasStaleVersion(parsed) ? 'stale' : 'malformed')
    }

    return this.loaded(parsed.map(cloneSession), 'restored')
  }

  private loaded(
    sessions: PhysicsSession[],
    status: PhysicsSessionRecoveryStatus,
    backupCreated = false,
    liveKeyRetained = false,
  ): LoadedSessions {
    return {
      sessions,
      recovery: { status, backupCreated, liveKeyRetained },
    }
  }

  private quarantine(raw: string, status: 'malformed' | 'stale'): LoadedSessions {
    try {
      this.storage.setItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`, raw)
    } catch {
      return this.loaded([], 'backup-failed', false, true)
    }

    try {
      this.storage.removeItem(PHYSICS_SESSIONS_STORAGE_KEY)
    } catch {
      return this.loaded([], status, true, true)
    }

    return this.loaded([], status, true, false)
  }

  private update(
    id: string,
    change: (session: PhysicsSession) => PhysicsSession,
  ): PhysicsSession | undefined {
    const index = this.sessions.findIndex((candidate) => candidate.id === id)
    if (index === -1) return undefined

    const updated = change(this.sessions[index]!)
    this.sessions = this.sessions.map((session, currentIndex) => currentIndex === index ? updated : session)
    this.persist()
    return cloneSession(updated)
  }

  private persist(): void {
    try {
      this.storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, JSON.stringify(this.sessions))
    } catch {
      this.recoveryResult = {
        status: 'unavailable',
        backupCreated: false,
        liveKeyRetained: false,
      }
    }
  }
}

export const browserPhysicsSessionRepository = new PhysicsSessionRepository(browserStorage())
