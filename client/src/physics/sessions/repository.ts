import type {
  PhysicsEventRecord,
  PhysicsMeasurementRecord,
  PhysicsSession,
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

function cloneSession(session: PhysicsSession): PhysicsSession {
  return {
    ...session,
    events: session.events.map((event) => ({ ...event })),
    measurements: session.measurements.map((measurement) => ({ ...measurement })),
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

function isMeasurementRecord(value: unknown): value is PhysicsMeasurementRecord {
  return isRecord(value)
    && typeof value.trialId === 'string'
    && typeof value.key === 'string'
    && typeof value.label === 'string'
    && (typeof value.value === 'number' || typeof value.value === 'string')
    && typeof value.unit === 'string'
    && (value.kind === 'raw' || value.kind === 'derived' || value.kind === 'observation')
    && typeof value.at === 'string'
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

function browserStorage(): StorageLike {
  if (typeof window === 'undefined') return nonBrowserStorage

  try {
    return window.localStorage
  } catch {
    return nonBrowserStorage
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

  constructor(storage: StorageLike) {
    this.storage = storage
    this.sessions = this.load()
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
    return this.update(id, (session) => ({
      ...session,
      updatedAt: new Date().toISOString(),
      measurements: [...session.measurements, { ...measurement }],
    }))
  }

  complete(id: string): PhysicsSession | undefined {
    return this.update(id, (session) => ({
      ...session,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    }))
  }

  private load(): PhysicsSession[] {
    let raw: string | null

    try {
      raw = this.storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)
    } catch {
      return []
    }

    if (raw === null) return []

    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed) || !parsed.every(isPhysicsSession)) throw new Error('Invalid physics session storage')
      return parsed.map(cloneSession)
    } catch {
      this.quarantine(raw)
      return []
    }
  }

  private quarantine(raw: string): void {
    try {
      this.storage.setItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`, raw)
    } catch {
      // Storage may be unavailable or full; retaining a usable empty repository is still safer than throwing.
    }

    try {
      this.storage.removeItem(PHYSICS_SESSIONS_STORAGE_KEY)
    } catch {
      // The next repository instance will retry quarantine if the invalid payload remains.
    }
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
      // Keep the current session available in memory when browser storage cannot be written.
    }
  }
}

export const browserPhysicsSessionRepository = new PhysicsSessionRepository(browserStorage())
