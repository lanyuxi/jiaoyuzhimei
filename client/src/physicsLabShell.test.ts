import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  LAB_MAIN_HORIZONTAL_PADDING,
  LAB_MAIN_MAX_WIDTH,
} from './components/Layout/Layout'
import { textbookExperimentById } from './physics/curriculum/catalog'
import type { TextbookPhysicsExperiment } from './physics/curriculum/types'
import { resolveLabRegistration } from './physics/PhysicsLabHost'
import { HeatCapacityScene } from './physics/labs/heat-capacity/HeatCapacityScene'
import { heatCapacityController } from './physics/labs/heat-capacity/controller'
import { ElectromagneticInductionScene } from './physics/labs/electromagnetic-induction/ElectromagneticInductionScene'
import { electromagneticInductionController } from './physics/labs/electromagnetic-induction/controller'
import {
  CIRCUIT_TERMINAL_HIT_STROKE,
  SeriesParallelScene,
  circuitTerminalHitSegment,
} from './physics/labs/series-parallel/SeriesParallelScene'
import { seriesParallelController } from './physics/labs/series-parallel/controller'
import { CIRCUIT_TERMINALS } from './physics/labs/series-parallel/definition'
import { groupMeasurementsByTrial } from './physics/runtime/MeasurementTable'
import { LAB_DESKTOP_LAYOUT } from './physics/runtime/PhysicsLabShell'
import { createLabRuntime, hydrateLabRuntime, reduceLabAction } from './physics/runtime/reducer'
import {
  createLabSessionCoordinator,
  completeLabSession,
  recordDerivedMeasurements,
  recordLabFeedback,
  recoveryPrompt,
  synchronizeLabSession,
} from './physics/runtime/sessionLifecycle'
import {
  AVAILABLE_LAB_CONTAINER_WIDTH,
  AVAILABLE_LAB_HORIZONTAL_PADDING,
} from './physics/TextbookPhysicsExperimentPage'
import { physicsReportSections, resolvePhysicsReport } from './physics/sessions/PhysicsReportPage'
import { PhysicsSessionRepository } from './physics/sessions/repository'
import type {
  PhysicsEventRecord,
  PhysicsExperimentalCondition,
  PhysicsMeasurementRecord,
  PhysicsSession,
  PhysicsSessionRecoveryResult,
  StorageLike,
} from './physics/sessions/types'

const sourceRoot = join(process.cwd(), 'src')
const shellPath = join(sourceRoot, 'physics/runtime/PhysicsLabShell.tsx')

class RecordingRepository {
  created: PhysicsSession[] = []
  restorable: PhysicsSession[] = []
  events: PhysicsEventRecord[] = []
  measurements: PhysicsMeasurementRecord[] = []
  completed: string[] = []

  findLatestInProgress(experimentId: string): PhysicsSession | undefined {
    return this.restorable
      .filter((session) => session.experimentId === experimentId && session.status === 'IN_PROGRESS')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id))[0]
  }

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

class MemorySessionStorage implements StorageLike {
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

function recordedHeatState() {
  const actions = [
    { type: 'placeThermometer', payload: 'water' },
    { type: 'placeThermometer', payload: 'oil' },
    { type: 'placeHeater', payload: 'water' },
    { type: 'placeHeater', payload: 'oil' },
    { type: 'start' },
    { type: 'tick', payload: 30 },
    { type: 'stop' },
    { type: 'record' },
  ]
  return actions.reduce(
    (state, action) => heatCapacityController.reduce(state, action).state,
    heatCapacityController.createInitialState(),
  )
}

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

  it('restores an active session across fresh coordinators without creating another record', () => {
    const repository = new RecordingRepository()
    const active: PhysicsSession = {
      version: 1,
      id: 'restored-session',
      experimentId: 'water-temperature',
      experimentTitle: 'Water temperature',
      status: 'IN_PROGRESS',
      createdAt: '2026-07-13T00:00:00.000Z',
      updatedAt: '2026-07-13T00:01:00.000Z',
      events: [],
      measurements: [{
        trialId: 'restored-trial',
        key: 'temperature',
        label: 'Temperature',
        value: 32,
        unit: 'C',
        kind: 'raw',
        at: '2026-07-13T00:01:00.000Z',
        conditions: [...conditions],
      }],
    }
    repository.restorable = [
      { ...active, id: 'completed-session', status: 'COMPLETED' },
      { ...active, id: 'different-experiment-session', experimentId: 'different-experiment' },
      active,
    ]

    const firstCoordinator = createLabSessionCoordinator(repository, 'water-temperature', 'Water temperature')
    const restored = firstCoordinator.ensureSession()
    const remounted = createLabSessionCoordinator(repository, 'water-temperature', 'Water temperature').ensureSession()

    expect(restored).toEqual(active)
    expect(remounted).toEqual(active)
    expect(remounted.measurements).toEqual(active.measurements)
    expect(repository.created).toHaveLength(0)
    expect(firstCoordinator.createNewSession().id).not.toBe(active.id)
    expect(repository.created).toHaveLength(1)
  })

  it('hydrates a fresh runtime from the restored coordinator snapshot', () => {
    const repository = new PhysicsSessionRepository(new MemorySessionStorage())
    const experiment = textbookExperimentById.get('heat-capacity-comparison')!
    const session = repository.create(experiment.id, experiment.title)
    const state = heatCapacityController.reduce(
      heatCapacityController.createInitialState(),
      { type: 'placeThermometer', payload: 'water' },
    ).state
    synchronizeLabSession(repository, session.id, {
      controller: heatCapacityController,
      state,
      experiment,
    })

    const restoredSession = createLabSessionCoordinator(repository, experiment.id, experiment.title).ensureSession()
    const runtime = hydrateLabRuntime(
      createLabRuntime(heatCapacityController),
      restoredSession.runtimeSnapshot,
    )

    expect(runtime.present.waterThermometerPlaced).toBe(true)
    expect(runtime.past).toEqual([])
    expect(runtime.future).toEqual([])
  })

  it('synchronizes complete measurement rows without duplicates across undo and global reset', () => {
    const repository = new PhysicsSessionRepository(new MemorySessionStorage())
    const experiment = textbookExperimentById.get('heat-capacity-comparison')!
    const session = repository.create(experiment.id, experiment.title)
    const actions = [
      { type: 'placeThermometer', payload: 'water' },
      { type: 'placeThermometer', payload: 'oil' },
      { type: 'placeHeater', payload: 'water' },
      { type: 'placeHeater', payload: 'oil' },
      { type: 'start' },
      { type: 'tick', payload: 30 },
      { type: 'stop' },
      { type: 'record' },
    ]
    const recorded = actions.reduce(
      (runtime, action) => reduceLabAction(runtime, action),
      createLabRuntime(heatCapacityController),
    )

    synchronizeLabSession(repository, session.id, {
      controller: heatCapacityController,
      state: recorded.present,
      experiment,
    })
    synchronizeLabSession(repository, session.id, {
      controller: heatCapacityController,
      state: recorded.present,
      experiment,
    })
    expect(repository.get(session.id)?.measurements).toHaveLength(5)

    const undone = reduceLabAction(recorded, { type: 'undo' })
    synchronizeLabSession(repository, session.id, {
      controller: heatCapacityController,
      state: undone.present,
      experiment,
    })
    expect(repository.get(session.id)?.measurements).toEqual([])

    synchronizeLabSession(repository, session.id, {
      controller: heatCapacityController,
      state: recorded.present,
      experiment,
    })
    const reset = reduceLabAction(recorded, { type: 'reset' })
    synchronizeLabSession(repository, session.id, {
      controller: heatCapacityController,
      state: reset.present,
      experiment,
    })
    expect(repository.get(session.id)?.measurements).toEqual([])
  })

  it('synchronizes nonempty measurements and structured report sections before completion', () => {
    const repository = new PhysicsSessionRepository(new MemorySessionStorage())
    const experiment = textbookExperimentById.get('heat-capacity-comparison')!
    const session = repository.create(experiment.id, experiment.title)
    const completed = completeLabSession(
      repository,
      session.id,
      { outcome: 'accepted', message: 'Completed' },
      '2026-07-13T00:05:00.000Z',
      { controller: heatCapacityController, state: recordedHeatState(), experiment },
    )

    expect(completed?.status).toBe('COMPLETED')
    expect(completed?.measurements).toHaveLength(5)
    expect(completed?.runtimeSnapshot).toBeDefined()
    const sections = physicsReportSections(completed!, experiment)
    expect(sections.calculationResults).toEqual(completed?.report?.calculationResults)
    expect(sections.errorAnalysis).toEqual(completed?.report?.errorAnalysis)
    expect(sections.calculationResults.join(' ')).toContain('Q = cmΔT')
    expect(sections.errorAnalysis.join(' ')).toContain('散热')
  })

  it('keeps one session within a coordinator and records accepted and rejected actions', () => {
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

    expect(source).toContain('flex min-h-[480px]')
    expect(source).toContain('md:min-h-[300px] md:aspect-[16/9]')
    expect(source).not.toContain('flex aspect-[16/9] min-h-[300px]')
    expect(source).toContain('<div className="min-w-0 flex-1">')
    expect(source).toContain('<Scene state={runtime.state} dispatch={dispatchSemantic} />')
  })

  it('renders Stage A scene roots that fill the fluid child and a non-overlapping heat tray', () => {
    const dispatch = () => undefined
    const sceneMarkup = [
      renderToStaticMarkup(createElement(HeatCapacityScene, { state: heatCapacityController.createInitialState(), dispatch })),
      renderToStaticMarkup(createElement(SeriesParallelScene, { state: seriesParallelController.createInitialState(), dispatch })),
      renderToStaticMarkup(createElement(ElectromagneticInductionScene, { state: electromagneticInductionController.createInitialState(), dispatch })),
    ]

    for (const markup of sceneMarkup) {
      const rootClass = markup.match(/^<div class="([^"]+)"/)?.[1].split(' ') ?? []
      expect(rootClass).toEqual(expect.arrayContaining(['flex', 'h-full', 'w-full', 'min-h-0', 'flex-col']))
      expect(markup).toContain('absolute inset-0 size-full')
    }

    const heatMarkup = sceneMarkup[0]
    expect(heatMarkup).toContain('grid-cols-2')
    expect(heatMarkup).toContain('md:grid-cols-4')
    expect(heatMarkup).not.toContain('bottom-3 grid h-12 w-28')
  })

  it('uses non-scaling mobile hit overlays while preserving visible circuit and conductor geometry', () => {
    const dispatch = () => undefined
    const circuitMarkup = renderToStaticMarkup(createElement(SeriesParallelScene, {
      state: seriesParallelController.createInitialState(),
      dispatch,
    }))
    const inductionMarkup = renderToStaticMarkup(createElement(ElectromagneticInductionScene, {
      state: electromagneticInductionController.createInitialState(),
      dispatch,
    }))

    const mobileScale = 356 / 960
    const hitBounds = Object.keys(CIRCUIT_TERMINALS).map((id) => {
      const segment = circuitTerminalHitSegment(id as keyof typeof CIRCUIT_TERMINALS)
      const halfStroke = CIRCUIT_TERMINAL_HIT_STROKE / 2
      return segment.y1 === segment.y2
        ? {
            id,
            left: Math.min(segment.x1, segment.x2) * mobileScale,
            right: Math.max(segment.x1, segment.x2) * mobileScale,
            top: segment.y1 * mobileScale - halfStroke,
            bottom: segment.y1 * mobileScale + halfStroke,
          }
        : {
            id,
            left: segment.x1 * mobileScale - halfStroke,
            right: segment.x1 * mobileScale + halfStroke,
            top: Math.min(segment.y1, segment.y2) * mobileScale,
            bottom: Math.max(segment.y1, segment.y2) * mobileScale,
          }
    })
    for (const bounds of hitBounds) {
      expect(bounds.right - bounds.left).toBeGreaterThanOrEqual(40)
      expect(bounds.bottom - bounds.top).toBeGreaterThanOrEqual(40)
    }
    for (let leftIndex = 0; leftIndex < hitBounds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < hitBounds.length; rightIndex += 1) {
        const left = hitBounds[leftIndex]!
        const right = hitBounds[rightIndex]!
        const overlapWidth = Math.min(left.right, right.right) - Math.max(left.left, right.left)
        const overlapHeight = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top)
        expect(overlapWidth > 0 && overlapHeight > 0, `${left.id} overlaps ${right.id}`).toBe(false)
      }
    }

    expect(circuitMarkup.match(/data-hit-target="circuit-terminal"/g)).toHaveLength(Object.keys(CIRCUIT_TERMINALS).length)
    expect(circuitMarkup.match(/vector-effect="non-scaling-stroke"/g)).toHaveLength(Object.keys(CIRCUIT_TERMINALS).length)
    expect(circuitMarkup.match(/data-hit-target="circuit-terminal"[^>]*stroke-width="40"/g))
      .toHaveLength(Object.keys(CIRCUIT_TERMINALS).length)
    expect(circuitMarkup.match(/stroke-linecap="butt"/g)).toHaveLength(Object.keys(CIRCUIT_TERMINALS).length)
    expect(circuitMarkup).toContain('r="17"')
    expect(circuitMarkup).toContain('r="11"')

    expect(inductionMarkup).toContain('data-hit-target="induction-conductor"')
    expect(inductionMarkup).toContain('vector-effect="non-scaling-stroke"')
    expect(inductionMarkup).toMatch(/data-hit-target="induction-conductor"[^>]*stroke-width="40"/)
    expect(inductionMarkup).toContain('stroke-width="13"')
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
