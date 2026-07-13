import { describe, expect, it, vi } from 'vitest'
import {
  browserPhysicsSessionRepository,
  PhysicsSessionRepository,
  PHYSICS_SESSIONS_STORAGE_KEY,
} from './repository'
import type { PhysicsEventRecord, PhysicsMeasurementRecord, StorageLike } from './types'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()

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

class CountingStorage extends MemoryStorage {
  writes = 0

  setItem(key: string, value: string): void {
    this.writes += 1
    super.setItem(key, value)
  }
}

class WriteFailingStorage extends MemoryStorage {
  setItem(): void {
    throw new Error('storage unavailable')
  }
}

class CorruptBackupFailingStorage extends MemoryStorage {
  setItem(key: string, value: string): void {
    if (key === `${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`) {
      throw new Error('storage unavailable')
    }

    super.setItem(key, value)
  }
}

class CorruptRemovalFailingStorage extends MemoryStorage {
  removeItem(key: string): void {
    if (key === PHYSICS_SESSIONS_STORAGE_KEY) {
      throw new Error('storage unavailable')
    }

    super.removeItem(key)
  }
}

class ReadFailingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('storage unavailable')
  }

  setItem(): void {}

  removeItem(): void {}
}

const measurement: PhysicsMeasurementRecord = {
  trialId: 'water-1',
  key: 'temperature',
  label: '水温',
  value: 32,
  unit: '℃',
  kind: 'raw',
  at: '2026-07-11T00:00:00.000Z',
  conditions: [
    { label: 'Water mass', value: 100 },
    { label: 'Initial temperature', value: '20℃' },
  ],
}

const event: PhysicsEventRecord = {
  id: 'event-1',
  action: 'start-heating',
  detail: '开始加热水',
  outcome: 'accepted',
  at: '2026-07-11T00:01:00.000Z',
}

const report = {
  purpose: ['Compare two substances.'],
  apparatus: ['Water', 'Oil', 'Heaters'],
  calculationResults: ['Oil temperature change is twice the water temperature change.'],
  conclusion: ['Water has the greater specific heat capacity.'],
  errorAnalysis: ['Heat loss lowers the measured temperature changes.'],
  supplement: ['Keep both samples at equal mass.'],
}

function synchronization() {
  return {
    runtimeSnapshot: {
      elapsedSeconds: 30,
      apparatus: { waterThermometerPlaced: true },
      trials: [{ id: 'water-1', readings: [32] }],
    },
    measurements: [{
      ...measurement,
      conditions: measurement.conditions.map((condition) => ({ ...condition })),
    }],
    report: {
      ...report,
      purpose: [...report.purpose],
      apparatus: [...report.apparatus],
      calculationResults: [...report.calculationResults],
      conclusion: [...report.conclusion],
      errorAnalysis: [...report.errorAnalysis],
      supplement: [...report.supplement],
    },
  }
}

describe('physics session repository', () => {
  it('reports empty storage distinctly from recovery failures', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())

    expect(repository.recovery).toEqual({
      status: 'empty',
      backupCreated: false,
      liveKeyRetained: false,
    })
  })

  it('persists and restores a measurement', () => {
    const storage = new MemoryStorage()
    const repository = new PhysicsSessionRepository(storage)
    const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')

    repository.appendMeasurement(session.id, measurement)

    const restored = new PhysicsSessionRepository(storage)

    expect(restored.get(session.id)?.measurements[0]?.conditions).toEqual(measurement.conditions)
  })

  it('quarantines malformed storage without throwing', () => {
    const storage = new MemoryStorage()
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, '{bad json')

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe('{bad json')
    expect(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)).toBeNull()
    expect(repository.recovery).toEqual({
      status: 'malformed',
      backupCreated: true,
      liveKeyRetained: false,
    })
  })

  it('quarantines valid JSON with an invalid session shape', () => {
    const storage = new MemoryStorage()
    const invalidShape = JSON.stringify({ sessions: [] })
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, invalidShape)

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe(invalidShape)
    expect(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)).toBeNull()
    expect(repository.recovery.status).toBe('malformed')
  })

  it('quarantines persisted measurements without structured conditions', () => {
    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    const session = first.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    first.appendMeasurement(session.id, measurement)
    const stored = JSON.parse(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)!) as Array<Record<string, unknown>>
    const measurements = stored[0]!.measurements as Array<Record<string, unknown>>
    delete measurements[0]!.conditions
    const invalidRaw = JSON.stringify(stored)
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, invalidRaw)

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe(invalidRaw)
    expect(repository.recovery.status).toBe('malformed')
  })

  it('does not retain mutations to a measurement caller conditions', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    const suppliedMeasurement = {
      ...measurement,
      conditions: measurement.conditions.map((condition) => ({ ...condition })),
    }

    repository.appendMeasurement(session.id, suppliedMeasurement)
    suppliedMeasurement.conditions[0]!.value = 200

    expect(repository.get(session.id)?.measurements[0]?.conditions[0]?.value).toBe(100)
  })

  it('returns cloned sessions so callers cannot mutate repository state', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    repository.appendMeasurement(session.id, measurement)
    repository.appendEvent(session.id, event)

    const returned = repository.get(session.id)
    returned?.measurements.push({ ...measurement, trialId: 'mutated' })
    if (returned?.events[0]) returned.events[0].detail = 'mutated'
    const listed = repository.list()
    listed[0]!.measurements[0]!.value = 100

    expect(repository.get(session.id)?.measurements).toEqual([measurement])
    expect(repository.get(session.id)?.events).toEqual([event])
  })

  it('quarantines duplicate persisted session IDs', () => {
    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    const session = first.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    first.appendMeasurement(session.id, measurement)
    const stored = JSON.parse(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)!) as Array<Record<string, unknown>>
    const duplicateRaw = JSON.stringify([...stored, { ...stored[0] }])
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, duplicateRaw)

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe(duplicateRaw)
    expect(repository.recovery.status).toBe('malformed')
  })

  it('reports stale persisted versions', () => {
    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    const session = first.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    first.appendMeasurement(session.id, measurement)
    const stored = JSON.parse(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)!) as Array<Record<string, unknown>>
    stored[0]!.version = 2
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, JSON.stringify(stored))

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(repository.recovery.status).toBe('stale')
  })

  it('reports malformed nonnumeric persisted versions', () => {
    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    const session = first.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    first.appendMeasurement(session.id, measurement)
    const stored = JSON.parse(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)!) as Array<Record<string, unknown>>
    stored[0]!.version = '2'
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, JSON.stringify(stored))

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(repository.recovery.status).toBe('malformed')
  })

  it('reports unavailable storage reads', () => {
    const repository = new PhysicsSessionRepository(new ReadFailingStorage())

    expect(repository.list()).toEqual([])
    expect(repository.recovery).toEqual({
      status: 'unavailable',
      backupCreated: false,
      liveKeyRetained: false,
    })
  })

  it('preserves corrupt storage when its backup cannot be written', () => {
    const storage = new CorruptBackupFailingStorage()
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, '{bad json')

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)).toBe('{bad json')
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBeNull()
    expect(repository.recovery).toEqual({
      status: 'backup-failed',
      backupCreated: false,
      liveKeyRetained: true,
    })
  })

  it('preserves corrupt storage when its live key cannot be removed after backup', () => {
    const storage = new CorruptRemovalFailingStorage()
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, '{bad json')

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe('{bad json')
    expect(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)).toBe('{bad json')
    expect(repository.recovery).toEqual({
      status: 'malformed',
      backupCreated: true,
      liveKeyRetained: true,
    })
  })

  it('appends events and marks a session completed', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')

    expect(repository.appendEvent(session.id, event)?.events).toEqual([event])
    expect(repository.complete(session.id)?.status).toBe('COMPLETED')
  })

  it('completes a session once and persists its completion event only once', () => {
    const storage = new CountingStorage()
    const repository = new PhysicsSessionRepository(storage)
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')
    const completionEvent: PhysicsEventRecord = {
      ...event,
      id: 'complete-event',
      action: 'complete-lab',
      detail: 'Completed',
    }

    const completed = repository.complete(session.id, completionEvent)
    const writesAfterFirstCompletion = storage.writes
    const repeated = repository.complete(session.id, completionEvent)

    expect(completed).toMatchObject({ status: 'COMPLETED', events: [completionEvent] })
    expect(repeated).toBeUndefined()
    expect(storage.writes).toBe(writesAfterFirstCompletion)
    expect(repository.get(session.id)).toMatchObject({
      status: 'COMPLETED',
      updatedAt: completed?.updatedAt,
      events: [completionEvent],
    })
  })

  it('returns undefined for unknown session IDs', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())

    expect(repository.get('missing')).toBeUndefined()
    expect(repository.appendEvent('missing', event)).toBeUndefined()
    expect(repository.appendMeasurement('missing', measurement)).toBeUndefined()
    expect(repository.complete('missing')).toBeUndefined()
  })

  it('restores sessions across repository instances using the same storage', () => {
    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    const session = first.create('heat-capacity-comparison', '比较不同物质的吸热能力')
    first.appendMeasurement(session.id, measurement)

    const restored = new PhysicsSessionRepository(storage)

    expect(restored.get(session.id)?.measurements).toEqual([measurement])
  })

  it('round-trips synchronized snapshots and reports without exposing repository-owned values', () => {
    const storage = new MemoryStorage()
    const repository = new PhysicsSessionRepository(storage)
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')
    const supplied = synchronization()

    const synchronized = repository.synchronize(session.id, supplied)
    supplied.runtimeSnapshot.apparatus.waterThermometerPlaced = false
    supplied.runtimeSnapshot.trials[0]!.readings[0] = 99
    supplied.measurements[0]!.conditions[0]!.value = 999
    supplied.report.calculationResults[0] = 'mutated'
    const returnedSnapshot = synchronized?.runtimeSnapshot as typeof supplied.runtimeSnapshot
    returnedSnapshot.apparatus.waterThermometerPlaced = false
    synchronized?.report?.errorAnalysis.push('mutated')

    const restored = new PhysicsSessionRepository(storage).get(session.id)
    expect(restored?.runtimeSnapshot).toEqual({
      elapsedSeconds: 30,
      apparatus: { waterThermometerPlaced: true },
      trials: [{ id: 'water-1', readings: [32] }],
    })
    expect(restored?.measurements).toEqual([measurement])
    expect(restored?.report).toEqual(report)
  })

  it('keeps version-1 sessions without optional snapshots and reports backward compatible', () => {
    const storage = new MemoryStorage()
    const repository = new PhysicsSessionRepository(storage)
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')

    const restored = new PhysicsSessionRepository(storage).get(session.id)

    expect(restored?.runtimeSnapshot).toBeUndefined()
    expect(restored?.report).toBeUndefined()
    expect(restored?.status).toBe('IN_PROGRESS')
  })

  it('restores legacy sessions with repeatedly appended measurement rows', () => {
    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    const session = first.create('heat-capacity-comparison', 'Heat capacity comparison')
    first.appendMeasurement(session.id, measurement)
    first.appendMeasurement(session.id, measurement)

    const restored = new PhysicsSessionRepository(storage)

    expect(restored.recovery.status).toBe('restored')
    expect(restored.get(session.id)?.measurements).toEqual([measurement, measurement])
  })

  it('replaces a complete synchronized measurement set in one write without duplicate rows', () => {
    const storage = new CountingStorage()
    const repository = new PhysicsSessionRepository(storage)
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')
    const first = synchronization()
    const writesBeforeFirstSync = storage.writes

    repository.synchronize(session.id, first)
    expect(storage.writes).toBe(writesBeforeFirstSync + 1)

    const second = synchronization()
    const writesBeforeSecondSync = storage.writes
    const synchronized = repository.synchronize(session.id, second)

    expect(storage.writes).toBe(writesBeforeSecondSync + 1)
    expect(synchronized?.measurements).toEqual([measurement])

    const reset = repository.synchronize(session.id, {
      ...synchronization(),
      runtimeSnapshot: { initial: true },
      measurements: [],
    })
    expect(reset?.measurements).toEqual([])
  })

  it('completes with the same atomic synchronization so measurements cannot be empty', () => {
    const storage = new CountingStorage()
    const repository = new PhysicsSessionRepository(storage)
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')
    const writesBeforeCompletion = storage.writes

    const completed = repository.complete(session.id, event, synchronization())

    expect(storage.writes).toBe(writesBeforeCompletion + 1)
    expect(completed).toMatchObject({
      status: 'COMPLETED',
      measurements: [measurement],
      report,
    })
    expect(completed?.runtimeSnapshot).toEqual(synchronization().runtimeSnapshot)
  })

  it('rejects non-JSON snapshots and quarantines malformed structured reports', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')
    expect(() => repository.synchronize(session.id, {
      ...synchronization(),
      runtimeSnapshot: { elapsedSeconds: Number.NaN },
    })).toThrow('Session synchronization does not match the persistence schema')

    const storage = new MemoryStorage()
    const first = new PhysicsSessionRepository(storage)
    first.create('heat-capacity-comparison', 'Heat capacity comparison')
    const stored = JSON.parse(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)!) as Array<Record<string, unknown>>
    stored[0]!.report = { ...report, calculationResults: [42] }
    const invalidRaw = JSON.stringify(stored)
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, invalidRaw)

    const restored = new PhysicsSessionRepository(storage)
    expect(restored.list()).toEqual([])
    expect(restored.recovery.status).toBe('malformed')
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe(invalidRaw)
  })

  it('selects the latest in-progress session for an experiment without writing another record', () => {
    const storage = new CountingStorage()
    const initial = new PhysicsSessionRepository(storage)
    const older = initial.create('heat-capacity-comparison', 'Heat capacity comparison')
    const latest = initial.create('heat-capacity-comparison', 'Heat capacity comparison')
    const completed = initial.create('heat-capacity-comparison', 'Heat capacity comparison')
    const differentExperiment = initial.create('series-parallel-circuit', 'Series and parallel circuit')
    initial.appendMeasurement(latest.id, measurement)
    initial.complete(completed.id)

    const stored = JSON.parse(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)!) as Array<Record<string, unknown>>
    for (const session of stored) {
      if (session.id === older.id) Object.assign(session, { id: 'session-a', updatedAt: '2026-07-13T00:00:00.000Z' })
      if (session.id === latest.id) Object.assign(session, { id: 'session-z', updatedAt: '2026-07-13T00:00:00.000Z' })
      if (session.id === completed.id) Object.assign(session, { id: 'completed-session', updatedAt: '2026-07-13T00:01:00.000Z' })
      if (session.id === differentExperiment.id) Object.assign(session, { id: 'different-experiment-session', updatedAt: '2026-07-13T00:02:00.000Z' })
    }
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, JSON.stringify(stored))
    const writesBeforeSelection = storage.writes
    const restored = new PhysicsSessionRepository(storage)

    expect(restored.findLatestInProgress('heat-capacity-comparison')).toMatchObject({ id: 'session-z', measurements: [measurement] })
    expect(restored.findLatestInProgress('series-parallel-circuit')).toMatchObject({ id: 'different-experiment-session' })
    expect(restored.findLatestInProgress('missing-experiment')).toBeUndefined()
    expect(storage.writes).toBe(writesBeforeSelection)
  })

  it('keeps in-memory changes available when storage writes fail', () => {
    const repository = new PhysicsSessionRepository(new WriteFailingStorage())

    expect(() => repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')).not.toThrow()

    expect(repository.list()).toHaveLength(1)
    expect(repository.recovery).toEqual({
      status: 'unavailable',
      backupCreated: false,
      liveKeyRetained: false,
    })
  })

  it('rejects measurements that cannot be restored from persistence', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', 'Heat capacity comparison')
    const invalidMeasurements: PhysicsMeasurementRecord[] = [
      { ...measurement, conditions: [] },
      { ...measurement, value: Number.POSITIVE_INFINITY },
      {
        ...measurement,
        conditions: [{ ...measurement.conditions[0]!, value: Number.NaN }],
      },
    ]

    for (const invalidMeasurement of invalidMeasurements) {
      expect(() => repository.appendMeasurement(session.id, invalidMeasurement))
        .toThrow('Measurement does not match the persistence schema')
    }

    expect(repository.get(session.id)?.measurements).toEqual([])
  })

  it('is safe to import in non-browser environments', () => {
    expect(() => browserPhysicsSessionRepository.list()).not.toThrow()
  })

  it('reports unavailable recovery when browser localStorage acquisition throws', async () => {
    vi.resetModules()
    vi.stubGlobal('window', {
      get localStorage(): never {
        throw new Error('storage unavailable')
      },
    })

    try {
      const { browserPhysicsSessionRepository: browserRepository } = await import('./repository')

      expect(browserRepository.recovery).toEqual({
        status: 'unavailable',
        backupCreated: false,
        liveKeyRetained: false,
      })
    } finally {
      vi.unstubAllGlobals()
      vi.resetModules()
    }
  })
})
