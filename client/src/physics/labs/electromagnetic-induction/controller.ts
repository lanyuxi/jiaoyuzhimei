import type { PhysicsExperimentalCondition } from '../../sessions/types'
import type { DerivedMeasurement, LabController, LabFeedback, LabTransition, Position } from '../../runtime/types'
import {
  CIRCUIT_RESISTANCE_OHMS,
  CONDUCTOR_LENGTH_METERS,
  GALVANOMETER_MAX_CURRENT_AMPS,
  MAGNETIC_FIELD_TESLA,
  RAIL,
  isInsideMagnetGap,
  signedFieldTesla,
  type MagneticFieldDirection,
} from './definition'

export interface InducedCurrentInput {
  closed: boolean
  fieldTesla: number
  lengthMeters: number
  velocity: number
  resistanceOhms?: number
}

export type InductionObservation = 'stationary' | 'right' | 'left'

interface DragSample {
  readonly x: number
  readonly at: number
}

interface MotionSample {
  readonly direction: Exclude<InductionObservation, 'stationary'>
  readonly crossedGap: boolean
}

export interface PendingMovement {
  readonly direction: Exclude<InductionObservation, 'stationary'>
  readonly circuitClosed: true
  readonly fieldDirection: MagneticFieldDirection
  readonly velocityMetersPerSecond: number
}

export interface InductionTrial {
  readonly id: string
  readonly observation: InductionObservation
  readonly currentAmps: number
  readonly circuitClosed: true
  readonly fieldDirection: MagneticFieldDirection
  readonly velocityMetersPerSecond: number
}

export interface InductionLabState {
  circuitClosed: boolean
  fieldDirection: MagneticFieldDirection
  conductorX: number
  velocityMetersPerSecond: number
  drag: DragSample | null
  motion: MotionSample | null
  pendingMovement: PendingMovement | null
  trials: readonly InductionTrial[]
}

const accepted = (message: string): LabFeedback => ({ outcome: 'accepted', message })
const rejected = (message: string): LabFeedback => ({ outcome: 'rejected', message })

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`)
}

function assertPositive(value: number, name: string): void {
  assertFinite(value, name)
  if (value <= 0) throw new RangeError(`${name} must be positive`)
}

function freezeTrials(trials: readonly InductionTrial[]): readonly InductionTrial[] {
  return Object.freeze(trials.map((trial) => Object.freeze({ ...trial })))
}

function freezePendingMovement(pendingMovement: PendingMovement | null): PendingMovement | null {
  return pendingMovement === null ? null : Object.freeze({ ...pendingMovement })
}

function stateWith(state: InductionLabState, patch: Partial<InductionLabState>): InductionLabState {
  const pendingMovement = 'pendingMovement' in patch ? patch.pendingMovement ?? null : state.pendingMovement
  return {
    ...state,
    ...patch,
    pendingMovement: freezePendingMovement(pendingMovement),
    trials: freezeTrials(patch.trials ?? state.trials),
  }
}

function transition(state: InductionLabState, feedback: LabFeedback): LabTransition<InductionLabState> {
  return { state, feedback }
}

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Partial<Position>
  return typeof point.x === 'number' && Number.isFinite(point.x) && typeof point.y === 'number' && Number.isFinite(point.y)
}

function parseDragPayload(payload: unknown): { position: Position; at: number } | null {
  if (typeof payload !== 'object' || payload === null) return null
  const value = payload as { position?: unknown; at?: unknown }
  return isPosition(value.position) && typeof value.at === 'number' && Number.isFinite(value.at) && value.at >= 0
    ? { position: value.position, at: value.at }
    : null
}

export function railPositionFromSvgPoint(position: Position): number | null {
  if (Math.abs(position.y - RAIL.y) > RAIL.hitHeight) return null
  return Math.min(RAIL.right, Math.max(RAIL.left, position.x))
}

export function clampCurrent(current: number): number {
  if (Number.isNaN(current)) return 0
  if (current === Infinity) return GALVANOMETER_MAX_CURRENT_AMPS
  if (current === -Infinity) return -GALVANOMETER_MAX_CURRENT_AMPS
  return Math.min(GALVANOMETER_MAX_CURRENT_AMPS, Math.max(-GALVANOMETER_MAX_CURRENT_AMPS, current))
}

export function inducedCurrent({ closed, fieldTesla, lengthMeters, velocity, resistanceOhms = CIRCUIT_RESISTANCE_OHMS }: InducedCurrentInput): number {
  assertFinite(fieldTesla, 'fieldTesla')
  assertPositive(lengthMeters, 'lengthMeters')
  assertFinite(velocity, 'velocity')
  assertPositive(resistanceOhms, 'resistanceOhms')
  if (!closed) return 0
  return clampCurrent((fieldTesla * lengthMeters * velocity) / resistanceOhms)
}

export function createElectromagneticInductionState(): InductionLabState {
  return {
    circuitClosed: false,
    fieldDirection: 'down',
    conductorX: RAIL.initialX,
    velocityMetersPerSecond: 0,
    drag: null,
    motion: null,
    pendingMovement: null,
    trials: freezeTrials([]),
  }
}

export function liveCurrentFor(state: InductionLabState): number {
  const cuttingField = state.motion?.crossedGap === true && isInsideMagnetGap(state.conductorX)
  return inducedCurrent({
    closed: state.circuitClosed && cuttingField,
    fieldTesla: signedFieldTesla(state.fieldDirection),
    lengthMeters: CONDUCTOR_LENGTH_METERS,
    velocity: state.velocityMetersPerSecond,
  })
}

function reduceSetCircuit(state: InductionLabState, payload: unknown): LabTransition<InductionLabState> {
  if (payload !== 'open' && payload !== 'closed') return transition(state, rejected('Choose an open or closed circuit.'))
  const circuitClosed = payload === 'closed'
  if (state.circuitClosed === circuitClosed) return transition(state, rejected('The circuit is already in that state.'))
  return transition(stateWith(state, { circuitClosed, velocityMetersPerSecond: 0, drag: null, motion: null, pendingMovement: null }), accepted(circuitClosed ? 'Circuit closed.' : 'Circuit opened.'))
}

function reduceSetFieldDirection(state: InductionLabState, payload: unknown): LabTransition<InductionLabState> {
  if (payload !== 'down' && payload !== 'up') return transition(state, rejected('Choose a magnetic-field direction.'))
  if (payload === state.fieldDirection) return transition(state, accepted('Magnetic-field direction is unchanged.'))
  return transition(stateWith(state, { fieldDirection: payload, velocityMetersPerSecond: 0, drag: null, motion: null, pendingMovement: null }), accepted('Magnetic-field direction reversed; move the conductor again.'))
}

function reduceDragStart(state: InductionLabState, payload: unknown): LabTransition<InductionLabState> {
  const drag = parseDragPayload(payload)
  if (!drag) return transition(state, rejected('Start the conductor drag on the rail.'))
  const x = railPositionFromSvgPoint(drag.position)
  if (x === null) return transition(state, rejected('Keep the conductor on the rail.'))
  return transition(stateWith(state, {
    conductorX: x,
    velocityMetersPerSecond: 0,
    drag: { x, at: drag.at },
    motion: null,
    pendingMovement: null,
  }), accepted('Conductor selected.'))
}

function reduceDragMove(state: InductionLabState, payload: unknown): LabTransition<InductionLabState> {
  if (state.drag === null) return transition(state, rejected('Start dragging the conductor first.'))
  const drag = parseDragPayload(payload)
  if (!drag) return transition(state, rejected('Keep the conductor on the rail.'))
  const x = railPositionFromSvgPoint(drag.position)
  if (x === null) return transition(state, rejected('Keep the conductor on the rail.'))
  if (drag.at <= state.drag.at) return transition(state, accepted('Ignored a stale drag event.'))

  const distanceMeters = (x - state.drag.x) / RAIL.pixelsPerMeter
  const elapsedSeconds = (drag.at - state.drag.at) / 1000
  const velocityMetersPerSecond = distanceMeters / elapsedSeconds
  const direction = distanceMeters > 0 ? 'right' : distanceMeters < 0 ? 'left' : null
  const crossedGap = direction !== null && isInsideMagnetGap(state.drag.x) && isInsideMagnetGap(x)
  return transition(stateWith(state, {
    conductorX: x,
    velocityMetersPerSecond,
    drag: { x, at: drag.at },
    motion: direction === null ? null : { direction, crossedGap },
  }), accepted('Conductor position updated.'))
}

function pendingMovementFor(state: InductionLabState): PendingMovement | null {
  if (!state.circuitClosed || state.motion?.crossedGap !== true || !isInsideMagnetGap(state.conductorX) || state.velocityMetersPerSecond === 0) return null
  return {
    direction: state.motion.direction,
    circuitClosed: true,
    fieldDirection: state.fieldDirection,
    velocityMetersPerSecond: state.velocityMetersPerSecond,
  }
}

function reduceDragEnd(state: InductionLabState, payload: unknown): LabTransition<InductionLabState> {
  if (state.drag === null) return transition(state, rejected('No conductor drag is active.'))
  const drag = parseDragPayload(payload)
  if (!drag) return transition(stateWith(state, { drag: null, velocityMetersPerSecond: 0, motion: null, pendingMovement: null }), accepted('Conductor released.'))
  const x = railPositionFromSvgPoint(drag.position)
  if (x === null) return transition(stateWith(state, { drag: null, velocityMetersPerSecond: 0, motion: null, pendingMovement: null }), accepted('Conductor released.'))
  const moved = x !== state.drag.x
  const movedState = moved ? reduceDragMove(state, payload).state : state
  return transition(stateWith(movedState, {
    drag: null,
    velocityMetersPerSecond: 0,
    motion: null,
    pendingMovement: pendingMovementFor(movedState),
  }), accepted('Conductor released.'))
}

function pendingMovementMatches(state: InductionLabState): PendingMovement | null {
  const pendingMovement = state.pendingMovement
  if (
    pendingMovement === null
    || !state.circuitClosed
    || !isInsideMagnetGap(state.conductorX)
    || !pendingMovement.circuitClosed
    || pendingMovement.fieldDirection !== state.fieldDirection
  ) return null
  return pendingMovement
}

function observationFor(state: InductionLabState): InductionObservation | null {
  if (!state.circuitClosed || !isInsideMagnetGap(state.conductorX)) return null
  const pendingMovement = pendingMovementMatches(state)
  if (pendingMovement !== null) return pendingMovement.direction
  if (state.motion === null && state.velocityMetersPerSecond === 0) return 'stationary'
  return null
}

function reduceRecord(state: InductionLabState): LabTransition<InductionLabState> {
  if (!state.circuitClosed) return transition(state, rejected('Close the circuit before recording an observation.'))
  if (!isInsideMagnetGap(state.conductorX)) return transition(state, rejected('Place the conductor inside the magnetic gap before recording.'))
  const observation = observationFor(state)
  if (observation === null) return transition(state, rejected('Move the conductor through the magnetic gap before recording this direction.'))
  if (state.trials.some((trial) => trial.observation === observation)) return transition(state, rejected('That observation has already been recorded.'))

  const pendingMovement = pendingMovementMatches(state)
  const currentAmps = pendingMovement === null ? 0 : inducedCurrent({
    closed: pendingMovement.circuitClosed,
    fieldTesla: signedFieldTesla(pendingMovement.fieldDirection),
    lengthMeters: CONDUCTOR_LENGTH_METERS,
    velocity: pendingMovement.velocityMetersPerSecond,
  })
  const trial: InductionTrial = Object.freeze({
    id: `electromagnetic-induction-trial-${state.trials.length + 1}`,
    observation,
    currentAmps,
    circuitClosed: true,
    fieldDirection: pendingMovement?.fieldDirection ?? state.fieldDirection,
    velocityMetersPerSecond: pendingMovement?.velocityMetersPerSecond ?? 0,
  })
  return transition(stateWith(state, { trials: [...state.trials, trial], pendingMovement: null }), accepted('Observation recorded.'))
}

function reduceResetTrial(state: InductionLabState): LabTransition<InductionLabState> {
  return transition(stateWith(state, {
    conductorX: RAIL.initialX,
    velocityMetersPerSecond: 0,
    drag: null,
    motion: null,
    pendingMovement: null,
  }), accepted('Bench reset; recorded observations were preserved.'))
}

function deriveMeasurements(state: InductionLabState): readonly DerivedMeasurement[] {
  const trial = state.trials.at(-1)
  if (!trial) return []
  return [
    { trialId: trial.id, key: 'inducedCurrent', label: 'Induced current', value: trial.currentAmps, unit: 'A', kind: 'raw' },
    { trialId: trial.id, key: 'motionDirection', label: 'Motion direction', value: trial.observation, unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'fieldDirection', label: 'Field direction', value: trial.fieldDirection, unit: '', kind: 'observation' },
    { trialId: trial.id, key: 'circuitState', label: 'Circuit state', value: 'closed', unit: '', kind: 'observation' },
  ]
}

function conditions(state: InductionLabState): readonly PhysicsExperimentalCondition[] {
  const trial = state.trials.at(-1)
  return [
    { label: 'Circuit', value: trial?.circuitClosed ? 'closed' : state.circuitClosed ? 'closed' : 'open' },
    { label: 'Field direction', value: trial?.fieldDirection ?? state.fieldDirection },
    { label: 'Magnetic field', value: MAGNETIC_FIELD_TESLA },
    { label: 'Conductor length', value: CONDUCTOR_LENGTH_METERS },
    { label: 'Resistance', value: CIRCUIT_RESISTANCE_OHMS },
  ]
}

export const electromagneticInductionController: LabController<InductionLabState> & {
  conditions(state: InductionLabState): readonly PhysicsExperimentalCondition[]
} = {
  createInitialState: createElectromagneticInductionState,
  reduce: (state, action) => {
    switch (action.type) {
      case 'setCircuit': return reduceSetCircuit(state, action.payload)
      case 'setFieldDirection': return reduceSetFieldDirection(state, action.payload)
      case 'dragStart': return reduceDragStart(state, action.payload)
      case 'dragMove': return reduceDragMove(state, action.payload)
      case 'dragEnd': return reduceDragEnd(state, action.payload)
      case 'dragCancel': return transition(stateWith(state, { drag: null, velocityMetersPerSecond: 0, motion: null, pendingMovement: null }), accepted('Conductor drag cancelled.'))
      case 'record': return reduceRecord(state)
      case 'resetTrial': return reduceResetTrial(state)
      default: return transition(state, rejected('Unsupported induction-lab action.'))
    }
  },
  deriveMeasurements,
  conditions,
  completion: (state) => {
    const stationary = state.trials.find((trial) => trial.observation === 'stationary')
    const right = state.trials.find((trial) => trial.observation === 'right')
    const left = state.trials.find((trial) => trial.observation === 'left')
    const reversed = right !== undefined && left !== undefined && right.currentAmps * left.currentAmps < 0
    return stationary?.currentAmps === 0 && reversed
      ? { complete: true, message: 'A closed circuit produces current only when the conductor cuts the magnetic field, and reversing motion reverses the current.' }
      : { complete: false, message: 'Record stationary, rightward, and leftward conductor observations in the closed magnetic gap.' }
  },
}
