import { describe, expect, it } from 'vitest'
import { textbookPhysicsExperiments } from '../../curriculum/catalog'
import { mapClientPointToSvgViewBox } from '../../runtime/svgCoordinates'
import { labRegistry } from '../registry'
import {
  clampCurrent,
  createElectromagneticInductionState,
  electromagneticInductionController,
  inducedCurrent,
  railPositionFromSvgPoint,
  type InductionLabState,
} from './controller'
import { MAGNET_GAP, RAIL, type MagneticFieldDirection } from './definition'

function reduce(actions: readonly { type: string; payload?: unknown }[], initial = createElectromagneticInductionState()): InductionLabState {
  return actions.reduce((state, action) => electromagneticInductionController.reduce(state, action).state, initial)
}

function closedState(direction: MagneticFieldDirection = 'down'): InductionLabState {
  return reduce([
    { type: 'setCircuit', payload: 'closed' },
    { type: 'setFieldDirection', payload: direction },
    { type: 'dragStart', payload: { position: { x: 430, y: RAIL.y }, at: 0 } },
    { type: 'dragEnd', payload: { position: { x: 430, y: RAIL.y }, at: 10 } },
  ])
}

function moveInGap(state: InductionLabState, from: number, to: number, at = 100): InductionLabState {
  return reduce([
    { type: 'dragStart', payload: { position: { x: from, y: RAIL.y }, at } },
    { type: 'dragMove', payload: { position: { x: to, y: RAIL.y }, at: at + 100 } },
    { type: 'dragEnd', payload: { position: { x: to, y: RAIL.y }, at: at + 120 } },
  ], state)
}

describe('electromagnetic induction controller', () => {
  it('calculates I = BLv/R and produces no current for an open circuit or zero velocity', () => {
    expect(inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4, resistanceOhms: 2 })).toBeCloseTo(0.01)
    expect(inducedCurrent({ closed: false, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4 })).toBe(0)
    expect(inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0 })).toBe(0)
  })

  it('reverses the signed current when either velocity or field direction reverses', () => {
    const right = inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4 })
    expect(inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: -0.4 })).toBeCloseTo(-right)
    expect(inducedCurrent({ closed: true, fieldTesla: -0.5, lengthMeters: 0.1, velocity: 0.4 })).toBeCloseTo(-right)
  })

  it('rejects invalid dimensions and resistance while clamping finite current to the meter range', () => {
    for (const fieldTesla of [Number.NaN, Infinity]) {
      expect(() => inducedCurrent({ closed: true, fieldTesla, lengthMeters: 0.1, velocity: 0.4 })).toThrow(RangeError)
    }
    expect(() => inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0, velocity: 0.4 })).toThrow(RangeError)
    expect(() => inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: Number.NaN })).toThrow(RangeError)
    expect(() => inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4, resistanceOhms: 0 })).toThrow(RangeError)
    expect(() => inducedCurrent({ closed: true, fieldTesla: 0.5, lengthMeters: 0.1, velocity: 0.4, resistanceOhms: -1 })).toThrow(RangeError)
    expect(clampCurrent(Infinity)).toBe(1)
    expect(clampCurrent(-Infinity)).toBe(-1)
    expect(clampCurrent(0.3)).toBe(0.3)
  })

  it('detects the gap and maps only rail-valid SVG positions, including letterboxed coordinates', () => {
    expect(railPositionFromSvgPoint({ x: MAGNET_GAP.left, y: RAIL.y })).toBe(MAGNET_GAP.left)
    expect(railPositionFromSvgPoint({ x: MAGNET_GAP.right, y: RAIL.y })).toBe(MAGNET_GAP.right)
    expect(railPositionFromSvgPoint({ x: MAGNET_GAP.left - 1, y: RAIL.y })).toBe(MAGNET_GAP.left - 1)
    expect(railPositionFromSvgPoint({ x: 500, y: RAIL.y + RAIL.hitHeight + 1 })).toBeNull()

    const mapped = mapClientPointToSvgViewBox(
      { clientX: 1200, clientY: 270 },
      { rect: { left: 0, top: 0, width: 1920, height: 540 }, viewBox: { x: 0, y: 0, width: 960, height: 540 } },
    )
    expect(mapped).toEqual({ x: 720, y: 270 })
    expect(mapped && railPositionFromSvgPoint({ x: mapped.x, y: RAIL.y })).toBe(720)
  })

  it('rejects outside-gap and open-circuit records', () => {
    const open = reduce([{ type: 'record' }])
    expect(open.trials).toEqual([])

    const outside = moveInGap(closedState(), 640, 720)
    const recorded = electromagneticInductionController.reduce(outside, { type: 'record' })
    expect(recorded.feedback.outcome).toBe('rejected')
    expect(recorded.state.trials).toEqual([])
  })

  it('records one immutable stationary control observation inside the closed magnetic gap', () => {
    const recorded = electromagneticInductionController.reduce(closedState(), { type: 'record' }).state
    expect(recorded.trials).toHaveLength(1)
    expect(recorded.trials[0]).toMatchObject({ observation: 'stationary', currentAmps: 0, circuitClosed: true })
    expect(Object.isFrozen(recorded.trials)).toBe(true)
    expect(Object.isFrozen(recorded.trials[0]!)).toBe(true)

    const duplicate = electromagneticInductionController.reduce(recorded, { type: 'record' })
    expect(duplicate.feedback.outcome).toBe('rejected')
    expect(duplicate.state).toBe(recorded)
  })

  it('requires separate right and left motion through the gap, recording each observation only once', () => {
    const stationary = electromagneticInductionController.reduce(closedState(), { type: 'record' }).state
    const right = electromagneticInductionController.reduce(moveInGap(stationary, 420, 540), { type: 'record' }).state
    const left = electromagneticInductionController.reduce(moveInGap(right, 540, 420), { type: 'record' }).state

    expect(right.trials.map((trial) => trial.observation)).toEqual(['stationary', 'right'])
    expect(left.trials.map((trial) => trial.observation)).toEqual(['stationary', 'right', 'left'])
    expect(right.trials[1]!.currentAmps).toBeGreaterThan(0)
    expect(left.trials[2]!.currentAmps).toBeLessThan(0)
    expect(electromagneticInductionController.reduce(left, { type: 'record' }).feedback.outcome).toBe('rejected')
  })

  it('completes only after all three observations establish direction reversal', () => {
    const stationary = electromagneticInductionController.reduce(closedState(), { type: 'record' }).state
    const right = electromagneticInductionController.reduce(moveInGap(stationary, 420, 540), { type: 'record' }).state
    const left = electromagneticInductionController.reduce(moveInGap(right, 540, 420), { type: 'record' }).state

    expect(electromagneticInductionController.completion(stationary).complete).toBe(false)
    expect(electromagneticInductionController.completion(right).complete).toBe(false)
    expect(electromagneticInductionController.completion(left)).toMatchObject({ complete: true })
  })

  it('resets the active bench but preserves trials, and changing field direction resets unrecorded motion', () => {
    const stationary = electromagneticInductionController.reduce(closedState(), { type: 'record' }).state
    const moving = moveInGap(stationary, 420, 540)
    const reversed = electromagneticInductionController.reduce(moving, { type: 'setFieldDirection', payload: 'up' }).state
    const reset = electromagneticInductionController.reduce(reversed, { type: 'resetTrial' }).state

    expect(reversed.fieldDirection).toBe('up')
    expect(reversed.velocityMetersPerSecond).toBe(0)
    expect(reversed.trials).toEqual(stationary.trials)
    expect(reset.trials).toEqual(stationary.trials)
    expect(reset.trials).not.toBe(stationary.trials)
    expect(reset.conductorX).toBe(RAIL.initialX)
  })

  it('ignores cancelled and stale multi-pointer drag updates while using elapsed time for monotonic velocity', () => {
    const started = electromagneticInductionController.reduce(closedState(), {
      type: 'dragStart', payload: { position: { x: 420, y: RAIL.y }, at: 100 },
    }).state
    const moved = electromagneticInductionController.reduce(started, {
      type: 'dragMove', payload: { position: { x: 520, y: RAIL.y }, at: 600 },
    }).state
    const delayed = electromagneticInductionController.reduce(moved, {
      type: 'dragMove', payload: { position: { x: 530, y: RAIL.y }, at: 590 },
    }).state
    const cancelled = electromagneticInductionController.reduce(delayed, { type: 'dragCancel' })

    expect(moved.velocityMetersPerSecond).toBeGreaterThan(0)
    expect(delayed).toBe(moved)
    expect(cancelled.state.drag).toBeNull()
    expect(cancelled.state.velocityMetersPerSecond).toBe(0)
  })

  it('exposes current and fixed conditions as structured measurements', () => {
    const state = electromagneticInductionController.reduce(moveInGap(closedState(), 420, 540), { type: 'record' }).state
    expect(electromagneticInductionController.deriveMeasurements(state).map((measurement) => measurement.key))
      .toEqual(['inducedCurrent', 'motionDirection', 'fieldDirection', 'circuitState'])
    expect(electromagneticInductionController.conditions(state)).toEqual([
      { label: 'Circuit', value: 'closed' },
      { label: 'Field direction', value: 'down' },
      { label: 'Magnetic field', value: 0.5 },
      { label: 'Conductor length', value: 0.1 },
      { label: 'Resistance', value: 2 },
    ])
  })

  it('registers exactly three available benchmark labs with matching catalog labIds', () => {
    const available = textbookPhysicsExperiments.filter((experiment) => experiment.availability === 'available')
    expect(available.map((experiment) => experiment.id)).toEqual([
      'heat-capacity-comparison',
      'series-parallel-circuit',
      'electromagnetic-induction',
    ])
    expect(available.map((experiment) => experiment.labId)).toEqual([...labRegistry.keys()])
    expect([...labRegistry.keys()]).toEqual([
      'heat-capacity-comparison',
      'series-parallel-circuit',
      'electromagnetic-induction',
    ])
  })
})
