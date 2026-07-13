import type {
  PhysicsExperimentalCondition,
  PhysicsEventRecord,
  PhysicsMeasurementRecord,
  PhysicsSession,
  PhysicsSessionRecoveryResult,
  PhysicsSessionReport,
  PhysicsSessionRecoveryStatus,
  PhysicsSessionSynchronization,
  JsonValue,
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

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cloneJsonValue)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry as JsonValue)]),
    )
  }
  return value
}

function cloneReport(report: PhysicsSessionReport): PhysicsSessionReport {
  return {
    purpose: [...report.purpose],
    apparatus: [...report.apparatus],
    calculationResults: [...report.calculationResults],
    conclusion: [...report.conclusion],
    errorAnalysis: [...report.errorAnalysis],
    supplement: [...report.supplement],
  }
}

function cloneSession(session: PhysicsSession): PhysicsSession {
  return {
    ...session,
    events: session.events.map((event) => ({ ...event })),
    measurements: session.measurements.map(cloneMeasurement),
    ...(session.runtimeSnapshot === undefined ? {} : { runtimeSnapshot: cloneJsonValue(session.runtimeSnapshot) }),
    ...(session.report === undefined ? {} : { report: cloneReport(session.report) }),
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

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJsonValue)
  if (!isRecord(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return (prototype === Object.prototype || prototype === null)
    && Object.values(value).every(isJsonValue)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isSessionReport(value: unknown): value is PhysicsSessionReport {
  return isRecord(value)
    && isStringArray(value.purpose)
    && isStringArray(value.apparatus)
    && isStringArray(value.calculationResults)
    && isStringArray(value.conclusion)
    && isStringArray(value.errorAnalysis)
    && isStringArray(value.supplement)
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

function hasUniqueMeasurements(measurements: readonly PhysicsMeasurementRecord[]): boolean {
  const keys = measurements.map((measurement) => `${measurement.trialId}\u0000${measurement.key}`)
  return new Set(keys).size === keys.length
}

function isSynchronization(value: unknown): value is PhysicsSessionSynchronization {
  return isRecord(value)
    && isJsonValue(value.runtimeSnapshot)
    && Array.isArray(value.measurements)
    && value.measurements.every(isMeasurementRecord)
    && hasUniqueMeasurements(value.measurements)
    && isSessionReport(value.report)
    && (value.event === undefined || isEventRecord(value.event))
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
    && (value.runtimeSnapshot === undefined || isJsonValue(value.runtimeSnapshot))
    && (value.report === undefined || isSessionReport(value.report))
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

  findLatestInProgress(experimentId: string): PhysicsSession | undefined {
    const latest = this.sessions
      .filter((session) => (
        session.experimentId === experimentId
        && session.status === 'IN_PROGRESS'
        && (session.runtimeSnapshot !== undefined || session.measurements.length === 0)
      ))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id))[0]

    return latest ? cloneSession(latest) : undefined
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

  synchronize(id: string, synchronization: PhysicsSessionSynchronization): PhysicsSession | undefined {
    if (!isSynchronization(synchronization)) {
      throw new TypeError('Session synchronization does not match the persistence schema')
    }

    return this.update(id, (session) => this.applySynchronization(session, synchronization))
  }

  complete(
    id: string,
    event?: PhysicsEventRecord,
    synchronization?: PhysicsSessionSynchronization,
  ): PhysicsSession | undefined {
    if (event && !isEventRecord(event)) {
      throw new TypeError('Event does not match the persistence schema')
    }
    if (synchronization && !isSynchronization(synchronization)) {
      throw new TypeError('Session synchronization does not match the persistence schema')
    }

    const index = this.sessions.findIndex((candidate) => candidate.id === id)
    const current = this.sessions[index]
    if (!current || current.status === 'COMPLETED') return undefined

    const synchronized = synchronization ? this.applySynchronization(current, synchronization) : current
    const completed: PhysicsSession = {
      ...synchronized,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
      events: event ? [...synchronized.events, { ...event }] : synchronized.events,
    }
    this.sessions = this.sessions.map((session, currentIndex) => currentIndex === index ? completed : session)
    this.persist()
    return cloneSession(completed)
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

  private applySynchronization(
    session: PhysicsSession,
    synchronization: PhysicsSessionSynchronization,
  ): PhysicsSession {
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      events: synchronization.event
        ? [...session.events, { ...synchronization.event }]
        : session.events,
      measurements: synchronization.measurements.map(cloneMeasurement),
      runtimeSnapshot: cloneJsonValue(synchronization.runtimeSnapshot),
      report: cloneReport(synchronization.report),
    }
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
