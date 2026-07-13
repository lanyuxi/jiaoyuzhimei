import { describe, expect, it } from 'vitest'
import { textbookPhysicsExperiments } from '../../curriculum/catalog'
import { labRegistry } from '../registry'
import { HEAT_CAPACITY_SNAP_ZONES } from './definition'
import {
  COOKING_OIL_SPECIFIC_HEAT_CAPACITY,
  WATER_SPECIFIC_HEAT_CAPACITY,
  createHeatCapacityState,
  heatCapacityController,
  temperatureAfterEnergy,
} from './controller'

function dispatchSequence(...actions: Array<{ type: string; payload?: unknown }>) {
  return actions.reduce(
    (state, action) => heatCapacityController.reduce(state, action).state,
    heatCapacityController.createInitialState(),
  )
}

function preparedState() {
  return dispatchSequence(
    { type: 'placeThermometer', payload: 'water' },
    { type: 'placeThermometer', payload: 'oil' },
    { type: 'placeHeater', payload: 'water' },
    { type: 'placeHeater', payload: 'oil' },
  )
}

describe('heat capacity comparison controller', () => {
  it('heats equal masses according to Q = cmΔT with the water and oil constants', () => {
    const initial = createHeatCapacityState({ waterMass: 0.2, oilMass: 0.2, heaterPower: 80 })
    const heated = heatCapacityController.reduce(
      { ...initial, heating: true },
      { type: 'tick', payload: 60 },
    ).state

    expect(WATER_SPECIFIC_HEAT_CAPACITY).toBe(4200)
    expect(COOKING_OIL_SPECIFIC_HEAT_CAPACITY).toBe(2100)
    expect(heated.waterTemperature).toBeCloseTo(25 + 4800 / (0.2 * 4200), 4)
    expect(heated.oilTemperature).toBeCloseTo(25 + 4800 / (0.2 * 2100), 4)
    expect(heated.oilTemperature).toBeGreaterThan(heated.waterTemperature)
  })

  it('rejects invalid or non-finite configurations and elapsed time', () => {
    expect(() => createHeatCapacityState({ waterMass: 0 })).toThrow(RangeError)
    expect(() => createHeatCapacityState({ oilMass: Number.NaN })).toThrow(RangeError)
    expect(() => temperatureAfterEnergy(25, 80, Number.POSITIVE_INFINITY, 0.2, 4200)).toThrow(RangeError)

    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const invalidTick = heatCapacityController.reduce(started, { type: 'tick', payload: Number.NaN })

    expect(invalidTick.state).toBe(started)
    expect(invalidTick.feedback.outcome).toBe('rejected')
    expect(heatCapacityController.reduce(started, { type: 'tick', payload: -1 }).feedback.outcome).toBe('rejected')
  })

  it('requires matched masses and a complete apparatus before starting', () => {
    const emptyStart = heatCapacityController.reduce(heatCapacityController.createInitialState(), { type: 'start' })
    const unequal = heatCapacityController.reduce(
      preparedState(),
      { type: 'setMass', payload: { substance: 'oil', mass: 0.25 } },
    ).state

    expect(emptyStart.feedback.outcome).toBe('rejected')
    expect(heatCapacityController.reduce(unequal, { type: 'start' }).feedback.outcome).toBe('rejected')
    expect(heatCapacityController.reduce(preparedState(), { type: 'start' }).state.heating).toBe(true)
  })

  it('rejects duplicate start and stop commands', () => {
    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const duplicateStart = heatCapacityController.reduce(started, { type: 'start' })
    const stopped = heatCapacityController.reduce(started, { type: 'stop' }).state

    expect(duplicateStart.state).toBe(started)
    expect(duplicateStart.feedback.outcome).toBe('rejected')
    expect(heatCapacityController.reduce(stopped, { type: 'stop' }).feedback.outcome).toBe('rejected')
  })

  it('accumulates elapsed time deterministically only while heating', () => {
    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const firstTick = heatCapacityController.reduce(started, { type: 'tick', payload: 12.5 }).state
    const secondTick = heatCapacityController.reduce(firstTick, { type: 'tick', payload: 17.5 }).state
    const stopped = heatCapacityController.reduce(secondTick, { type: 'stop' }).state

    expect(secondTick.elapsedSeconds).toBe(30)
    expect(secondTick.waterTemperature).toBeCloseTo(25 + (80 * 30) / (0.2 * 4200), 8)
    expect(heatCapacityController.reduce(stopped, { type: 'tick', payload: 1 }).state).toBe(stopped)
  })

  it('records only stopped trials of at least thirty seconds with both probes and heaters', () => {
    const missingProbes = heatCapacityController.reduce(heatCapacityController.createInitialState(), { type: 'record' })
    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const tooEarly = heatCapacityController.reduce(
      heatCapacityController.reduce(started, { type: 'tick', payload: 29 }).state,
      { type: 'stop' },
    ).state
    const recorded = heatCapacityController.reduce(
      heatCapacityController.reduce(heatCapacityController.reduce(started, { type: 'tick', payload: 30 }).state, { type: 'stop' }).state,
      { type: 'record' },
    )

    expect(missingProbes.feedback).toEqual({ outcome: 'rejected', message: '请先把两支温度计分别放入水和食用油中' })
    expect(heatCapacityController.reduce(started, { type: 'record' }).feedback.outcome).toBe('rejected')
    expect(heatCapacityController.reduce(tooEarly, { type: 'record' }).feedback.outcome).toBe('rejected')
    expect(recorded.state.trials).toHaveLength(1)
    expect(recorded.state.activeTrialId).toBe(recorded.state.trials[0]?.id)
  })

  it('locks masses after starting, requires a reset to unlock them, and revalidates equal masses before recording', () => {
    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const stopped = heatCapacityController.reduce(
      heatCapacityController.reduce(started, { type: 'tick', payload: 30 }).state,
      { type: 'stop' },
    ).state
    const changedMass = heatCapacityController.reduce(stopped, { type: 'setMass', payload: { substance: 'oil', mass: 0.25 } })
    const recorded = heatCapacityController.reduce(changedMass.state, { type: 'record' })
    const unequal = heatCapacityController.reduce(
      { ...stopped, oilMass: 0.25 },
      { type: 'record' },
    )
    const reset = heatCapacityController.reduce(stopped, { type: 'resetTrial' }).state

    expect(changedMass.state).toBe(stopped)
    expect(changedMass.feedback.outcome).toBe('rejected')
    expect(recorded.state.trials).toHaveLength(1)
    expect(unequal.state.trials).toHaveLength(0)
    expect(unequal.feedback.outcome).toBe('rejected')
    expect(heatCapacityController.reduce(reset, { type: 'setMass', payload: { substance: 'oil', mass: 0.25 } }).feedback.outcome).toBe('accepted')
  })

  it('places each apparatus only when its drag ends inside its own explicit snap zone', () => {
    const placementKeyBySubject = {
      waterThermometer: 'waterThermometerPlaced',
      oilThermometer: 'oilThermometerPlaced',
      waterHeater: 'waterHeaterPlaced',
      oilHeater: 'oilHeaterPlaced',
    } as const

    for (const subject of Object.keys(HEAT_CAPACITY_SNAP_ZONES) as Array<keyof typeof HEAT_CAPACITY_SNAP_ZONES>) {
      const zone = HEAT_CAPACITY_SNAP_ZONES[subject]
      const inside = heatCapacityController.reduce(heatCapacityController.createInitialState(), {
        type: 'dragEnd',
        payload: { subject, position: { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 } },
      }).state
      const outside = heatCapacityController.reduce(heatCapacityController.createInitialState(), {
        type: 'dragEnd',
        payload: { subject, position: { x: zone.x - 1, y: zone.y } },
      })

      expect(inside[placementKeyBySubject[subject]]).toBe(true)
      expect(outside.state).toEqual(heatCapacityController.createInitialState())
      expect(outside.feedback.outcome).toBe('rejected')
    }

    const initial = heatCapacityController.createInitialState()
    const cancelled = heatCapacityController.reduce(initial, {
      type: 'dragCancel',
      payload: { subject: 'waterThermometer', position: { x: 300, y: 200 } },
    })

    expect(cancelled.state).toBe(initial)
    expect(cancelled.feedback.outcome).toBe('accepted')
  })

  it('keeps recorded trials immutable, clears only the active trial on reset, and exposes snapshot measurements', () => {
    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const stopped = heatCapacityController.reduce(
      heatCapacityController.reduce(started, { type: 'tick', payload: 30 }).state,
      { type: 'stop' },
    ).state
    const recorded = heatCapacityController.reduce(stopped, { type: 'record' }).state
    const lockedMassChange = heatCapacityController.reduce(recorded, { type: 'setMass', payload: { substance: 'water', mass: 0.3 } }).state
    const reset = heatCapacityController.reduce(lockedMassChange, { type: 'resetTrial' }).state
    const changedMass = heatCapacityController.reduce(reset, { type: 'setMass', payload: { substance: 'water', mass: 0.3 } }).state

    expect(changedMass.trials[0]).toEqual(recorded.trials[0])
    expect(changedMass.trials).not.toBe(recorded.trials)
    expect(lockedMassChange).toBe(recorded)
    expect(Object.isFrozen(recorded.trials[0])).toBe(true)
    expect(reset.trials).toEqual(recorded.trials)
    expect(reset.trials).not.toBe(recorded.trials)
    expect(reset.activeTrialId).toBeNull()
    expect(reset.elapsedSeconds).toBe(0)
    expect(changedMass.waterMass).toBe(0.3)
    expect(heatCapacityController.deriveMeasurements(recorded).map((measurement) => measurement.key)).toEqual([
      'waterTemperature',
      'oilTemperature',
      'heatingTime',
      'waterTemperatureChange',
      'oilTemperatureChange',
    ])
    expect(heatCapacityController.deriveMeasurements(reset)).toEqual([])
  })

  it('reports trial conditions and completes after a recorded comparison', () => {
    const started = heatCapacityController.reduce(preparedState(), { type: 'start' }).state
    const stopped = heatCapacityController.reduce(
      heatCapacityController.reduce(started, { type: 'tick', payload: 30 }).state,
      { type: 'stop' },
    ).state
    const recorded = heatCapacityController.reduce(stopped, { type: 'record' }).state

    expect(heatCapacityController.conditions(recorded)).toEqual([
      { label: '水的质量', value: 0.2 },
      { label: '食用油的质量', value: 0.2 },
      { label: '初温', value: 25 },
      { label: '加热功率', value: 80 },
      { label: '水的比热容', value: 4200 },
      { label: '食用油的比热容', value: 2100 },
    ])
    expect(heatCapacityController.completion(recorded)).toEqual({ complete: true, message: '已完成水和食用油吸热能力的比较' })
  })

  it('keeps the available curriculum labs registered against their catalog records', () => {
    const available = textbookPhysicsExperiments.filter((experiment) => experiment.availability === 'available')

    expect(available.map((experiment) => experiment.id)).toEqual(['heat-capacity-comparison', 'series-parallel-circuit'])
    expect(available.map((experiment) => experiment.labId)).toEqual(['heat-capacity-comparison', 'series-parallel-circuit'])
    expect(labRegistry.get('heat-capacity-comparison')?.experimentId).toBe('heat-capacity-comparison')
    expect(labRegistry.get('series-parallel-circuit')?.experimentId).toBe('series-parallel-circuit')
  })
})
