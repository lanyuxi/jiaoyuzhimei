import { describe, expect, it } from 'vitest'
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

class WriteFailingStorage extends MemoryStorage {
  setItem(): void {
    throw new Error('storage unavailable')
  }
}

const measurement: PhysicsMeasurementRecord = {
  trialId: 'water-1',
  key: 'temperature',
  label: '水温',
  value: 32,
  unit: '℃',
  kind: 'raw',
  at: '2026-07-11T00:00:00.000Z',
}

const event: PhysicsEventRecord = {
  id: 'event-1',
  action: 'start-heating',
  detail: '开始加热水',
  outcome: 'accepted',
  at: '2026-07-11T00:01:00.000Z',
}

describe('physics session repository', () => {
  it('persists and restores a measurement', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')

    repository.appendMeasurement(session.id, measurement)

    expect(repository.get(session.id)?.measurements[0]?.value).toBe(32)
  })

  it('quarantines malformed storage without throwing', () => {
    const storage = new MemoryStorage()
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, '{bad json')

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe('{bad json')
    expect(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)).toBeNull()
  })

  it('quarantines valid JSON with an invalid session shape', () => {
    const storage = new MemoryStorage()
    const invalidShape = JSON.stringify({ sessions: [] })
    storage.setItem(PHYSICS_SESSIONS_STORAGE_KEY, invalidShape)

    const repository = new PhysicsSessionRepository(storage)

    expect(repository.list()).toEqual([])
    expect(storage.getItem(`${PHYSICS_SESSIONS_STORAGE_KEY}-corrupt`)).toBe(invalidShape)
    expect(storage.getItem(PHYSICS_SESSIONS_STORAGE_KEY)).toBeNull()
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

  it('appends events and marks a session completed', () => {
    const repository = new PhysicsSessionRepository(new MemoryStorage())
    const session = repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')

    expect(repository.appendEvent(session.id, event)?.events).toEqual([event])
    expect(repository.complete(session.id)?.status).toBe('COMPLETED')
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

  it('keeps in-memory changes available when storage writes fail', () => {
    const repository = new PhysicsSessionRepository(new WriteFailingStorage())

    expect(() => repository.create('heat-capacity-comparison', '比较不同物质的吸热能力')).not.toThrow()

    expect(repository.list()).toHaveLength(1)
  })

  it('is safe to import in non-browser environments', () => {
    expect(() => browserPhysicsSessionRepository.list()).not.toThrow()
  })
})
