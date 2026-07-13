import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  LAB_MAIN_HORIZONTAL_PADDING,
  LAB_MAIN_MAX_WIDTH,
} from './components/Layout/Layout'
import { textbookExperimentById } from './physics/curriculum/catalog'
import type { TextbookPhysicsExperiment } from './physics/curriculum/types'
import { resolveLabRegistration } from './physics/PhysicsLabHost'
import { groupMeasurementsByTrial } from './physics/runtime/MeasurementTable'
import { LAB_DESKTOP_LAYOUT } from './physics/runtime/PhysicsLabShell'
import {
  createLabSessionCoordinator,
  completeLabSession,
  recordDerivedMeasurements,
  recordLabFeedback,
  recoveryPrompt,
} from './physics/runtime/sessionLifecycle'
import {
  AVAILABLE_LAB_CONTAINER_WIDTH,
  AVAILABLE_LAB_HORIZONTAL_PADDING,
} from './physics/TextbookPhysicsExperimentPage'
import { resolvePhysicsReport } from './physics/sessions/PhysicsReportPage'
import type {
  PhysicsEventRecord,
  PhysicsExperimentalCondition,
  PhysicsMeasurementRecord,
  PhysicsSession,
  PhysicsSessionRecoveryResult,
} from './physics/sessions/types'

const sourceRoot = join(process.cwd(), 'src')
const shellPath = join(sourceRoot, 'physics/runtime/PhysicsLabShell.tsx')

class RecordingRepository {
  created: PhysicsSession[] = []
  events: PhysicsEventRecord[] = []
  measurements: PhysicsMeasurementRecord[] = []
  completed: string[] = []

  create(experimentId: string, experimentTitle: string): PhysicsSession {
    const session: PhysicsSession = {
      version: 1,
      id: `session-${this.created.length + 1}`,
      experimentId,
      experimentTitle,
      status: 'IN_PROGRESS',
      createdAt: '2026-07-13T00:00:00.000Z',
      updatedAt: '2026-07-13T00:00:00.000Z',
      events: [],
      measurements: [],
    }
    this.created.push(session)
    return session
  }

  appendEvent(id: string, event: PhysicsEventRecord): PhysicsSession {
    this.events.push(event)
    return { ...this.created.find((session) => session.id === id)!, events: [event] }
  }

  appendMeasurement(id: string, measurement: PhysicsMeasurementRecord): PhysicsSession {
    this.measurements.push(measurement)
    return { ...this.created.find((session) => session.id === id)!, measurements: [measurement] }
  }

  complete(id: string, event?: PhysicsEventRecord): PhysicsSession | undefined {
    const index = this.created.findIndex((session) => session.id === id)
    const current = this.created[index]
    if (!current || current.status === 'COMPLETED') return undefined

    const completed = {
      ...current,
      status: 'COMPLETED' as const,
      events: event ? [...current.events, event] : current.events,
    }
    this.created[index] = completed
    this.completed.push(id)
    if (event) this.events.push(event)
    return completed
  }
}

const recovery: PhysicsSessionRecoveryResult = {
  status: 'malformed',
  backupCreated: true,
  liveKeyRetained: false,
}

const derivedMeasurements = [{
  trialId: 'trial-1',
  key: 'temperature',
  label: '水温',
  value: 32,
  unit: '℃',
  kind: 'raw' as const,
}]

const conditions: readonly PhysicsExperimentalCondition[] = [
  { label: '水的质量', value: 100 },
  { label: '初温', value: '20℃' },
]

describe('physics lab shell', () => {
  it('exposes the required experiment controls', () => {
    expect(existsSync(shellPath)).toBe(true)

    const source = readFileSync(shellPath, 'utf8')
    for (const label of ['实验步骤', '当前读数', '数据表格', '撤销', '重做', '重置', '实验报告']) {
      expect(source).toContain(label)
    }
    expect(source).toContain('aria-label')
  })

  it('uses the runtime atomic command result for semantic feedback and disables commands after completion', () => {
    const source = readFileSync(shellPath, 'utf8')

    expect(source).toContain('const transition = runtime.dispatch(action)')
    expect(source).not.toContain('controller.reduce(runtime.state, action)')
    expect(source).toContain('disabled={isCompleted}')
  })

  it('creates one session per lab mount and records accepted and rejected actions', () => {
    const repository = new RecordingRepository()
    const coordinator = createLabSessionCoordinator(repository, 'water-temperature', '用温度计测量水的温度')

    const first = coordinator.ensureSession()
    const second = coordinator.ensureSession()

    expect(second.id).toBe(first.id)
    expect(repository.created).toHaveLength(1)

    recordLabFeedback(repository, first.id, 'place-thermometer', { outcome: 'accepted', message: '温度计已放入水中' }, '2026-07-13T00:01:00.000Z')
    recordLabFeedback(repository, first.id, 'read-too-early', { outcome: 'rejected', message: '示数尚未稳定' }, '2026-07-13T00:02:00.000Z')

    expect(repository.events.map((event) => [event.action, event.outcome, event.detail])).toEqual([
      ['place-thermometer', 'accepted', '温度计已放入水中'],
      ['read-too-early', 'rejected', '示数尚未稳定'],
    ])
    expect(coordinator.createNewSession().id).not.toBe(first.id)
    expect(repository.created).toHaveLength(2)
  })

  it('forwards structured conditions, marks completion, and groups measurements by trial', () => {
    const repository = new RecordingRepository()
    const session = createLabSessionCoordinator(repository, 'water-temperature', '用温度计测量水的温度').ensureSession()

    recordDerivedMeasurements(repository, session.id, derivedMeasurements, conditions, '2026-07-13T00:03:00.000Z')
    const grouped = groupMeasurementsByTrial(repository.measurements)

    expect(repository.measurements[0]).toMatchObject({
      ...derivedMeasurements[0],
      at: '2026-07-13T00:03:00.000Z',
      conditions,
    })
    expect(grouped).toEqual([{ trialId: 'trial-1', conditions, measurements: repository.measurements }])

    const completionFeedback = { outcome: 'accepted' as const, message: '瀹為獙宸插畬鎴?' }
    completeLabSession(repository, session.id, completionFeedback)
    completeLabSession(repository, session.id, completionFeedback)
    expect(repository.completed).toEqual([session.id])
    expect(repository.events.filter((event) => event.action === 'complete-lab')).toHaveLength(1)
  })

  it('guarantees the available-lab desktop scene width while retaining responsive rails', () => {
    const source = readFileSync(shellPath, 'utf8')
    const layout = readFileSync(join(sourceRoot, 'components/Layout/Layout.tsx'), 'utf8')
    const textbookPage = readFileSync(join(sourceRoot, 'physics/TextbookPhysicsExperimentPage.tsx'), 'utf8')
    const layoutContentWidth = Math.min(AVAILABLE_LAB_CONTAINER_WIDTH, LAB_MAIN_MAX_WIDTH)
      - (LAB_MAIN_HORIZONTAL_PADDING * 2)
    const sceneWidth = layoutContentWidth
      - (AVAILABLE_LAB_HORIZONTAL_PADDING * 2)
      - (LAB_DESKTOP_LAYOUT.gap * 2)
      - LAB_DESKTOP_LAYOUT.apparatusWidth
      - LAB_DESKTOP_LAYOUT.stepsWidth

    expect(LAB_DESKTOP_LAYOUT).toEqual({
      breakpoint: '2xl',
      apparatusWidth: 240,
      sceneMinWidth: 853,
      stepsWidth: 300,
      gap: 16,
    })
    expect(sceneWidth).toBeGreaterThanOrEqual(LAB_DESKTOP_LAYOUT.sceneMinWidth)
    expect(sceneWidth).toBeGreaterThanOrEqual(853.34)
    expect(sceneWidth / (16 / 9)).toBeGreaterThanOrEqual(480)
    expect(source).toContain('2xl:grid-cols-[240px_minmax(0,1fr)_300px]')
    expect(source).toContain('2xl:min-h-[480px]')
    expect(layout).toContain("location.pathname.startsWith('/physics/labs/')")
    expect(layout).toContain('max-w-[1536px]')
    expect(layout).toContain('2xl:px-0')
    expect(layout).toContain("'max-w-[1420px] md:px-8'")
    expect(textbookPage).toContain('max-w-[1536px]')
    expect(textbookPage).toContain('mx-auto max-w-4xl')
  })

  it('keeps the scene fluid below 2xl without a mobile aspect-ratio width constraint', () => {
    const source = readFileSync(shellPath, 'utf8')

    expect(source).toContain('flex min-h-[300px]')
    expect(source).toContain('md:aspect-[16/9]')
    expect(source).not.toContain('flex aspect-[16/9] min-h-[300px]')
    expect(source).toContain('<div className="min-w-0 flex-1">')
    expect(source).toContain('<Scene state={runtime.state} dispatch={dispatchSemantic} />')
  })

  it('describes recoverable storage failures with a new-session action', () => {
    expect(recoveryPrompt(recovery)).toEqual({
      title: '本地实验记录无法恢复',
      actionLabel: '创建新会话',
    })
    expect(recoveryPrompt({ ...recovery, status: 'restored' })).toBeUndefined()
  })

  it('keeps scheduled experiments out of the registry while surfacing available registry gaps', () => {
    const scheduled = textbookExperimentById.get('ruler-length-measurement')!
    const available: TextbookPhysicsExperiment = { ...scheduled, availability: 'available' }

    expect(resolveLabRegistration(scheduled, new Map()).kind).toBe('scheduled')
    expect(resolveLabRegistration(available, new Map())).toMatchObject({
      kind: 'configuration-error',
      experimentId: available.id,
    })
  })

  it('models unknown and removed reports without throwing', () => {
    const experiment = textbookExperimentById.get('ruler-length-measurement')!
    const repository = new RecordingRepository()
    const session = repository.create(experiment.id, experiment.title)

    expect(resolvePhysicsReport(undefined, textbookExperimentById).kind).toBe('missing-session')
    expect(resolvePhysicsReport({ ...session, experimentId: 'removed' }, textbookExperimentById).kind).toBe('removed-experiment')
    expect(resolvePhysicsReport(session, textbookExperimentById)).toMatchObject({ kind: 'report', experiment })
  })

  it('keeps session routes isolated from normal experiment pages', () => {
    const app = readFileSync(join(sourceRoot, 'App.tsx'), 'utf8')
    const layout = readFileSync(join(sourceRoot, 'components/Layout/Layout.tsx'), 'utf8')
    const textbookPage = readFileSync(join(sourceRoot, 'physics/TextbookPhysicsExperimentPage.tsx'), 'utf8')

    expect(app).toContain('path="physics/sessions"')
    expect(app).toContain('path="physics/sessions/:id/report"')
    expect(app.indexOf('path="physics/sessions"')).toBeLessThan(app.indexOf('path="physics/:slug"'))
    expect(layout).toContain("'/physics/sessions'")
    expect(textbookPage).toContain("availability === 'available'")
    expect(textbookPage).toContain('PhysicsLabHost')
  })
})
