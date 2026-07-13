import type { PhysicsExperimentalCondition } from '../../sessions/types'
import type { LabController, LabFeedback, LabTransition, DerivedMeasurement, Position } from '../../runtime/types'
import {
  COOKING_OIL_SPECIFIC_HEAT_CAPACITY,
  DEFAULT_HEATER_POWER,
  DEFAULT_SAMPLE_MASS,
  EQUAL_MASS_TOLERANCE,
  HEAT_CAPACITY_SNAP_ZONES,
  INITIAL_TEMPERATURE,
  isInsideSnapZone,
  MINIMUM_RECORDING_SECONDS,
  type HeatCapacityDragSubject,
  type HeatCapacitySubstance,
  WATER_SPECIFIC_HEAT_CAPACITY,
} from './definition'

export {
  COOKING_OIL_SPECIFIC_HEAT_CAPACITY,
  WATER_SPECIFIC_HEAT_CAPACITY,
} from './definition'

export interface HeatCapacityConfig {
  waterMass: number
  oilMass: number
  heaterPower: number
}

export interface HeatCapacityTrial {
  readonly id: string
  readonly waterMass: number
  readonly oilMass: number
  readonly heaterPower: number
  readonly initialTemperature: number
  readonly waterTemperature: number
  readonly oilTemperature: number
  readonly elapsedSeconds: number
}

export interface HeatCapacityState extends HeatCapacityConfig {
  elapsedSeconds: number
  waterTemperature: number
  oilTemperature: number
  waterThermometerPlaced: boolean
  oilThermometerPlaced: boolean
  waterHeaterPlaced: boolean
  oilHeaterPlaced: boolean
  heatersPlaced: boolean
  heating: boolean
  activeTrialId: string | null
  trials: readonly HeatCapacityTrial[]
}

const accepted = (message: string): LabFeedback => ({ outcome: 'accepted', message })
const rejected = (message: string): LabFeedback => ({ outcome: 'rejected', message })

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a finite positive number`)
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a finite non-negative number`)
}

function validStateConfig(state: HeatCapacityConfig): boolean {
  return Number.isFinite(state.waterMass)
    && state.waterMass > 0
    && Number.isFinite(state.oilMass)
    && state.oilMass > 0
    && Number.isFinite(state.heaterPower)
    && state.heaterPower > 0
}

function nextState(state: HeatCapacityState, patch: Partial<HeatCapacityState>): HeatCapacityState {
  const next = { ...state, ...patch, trials: patch.trials ? [...patch.trials] : [...state.trials] }
  return {
    ...next,
    heatersPlaced: next.waterHeaterPlaced && next.oilHeaterPlaced,
  }
}

function transition(state: HeatCapacityState, feedback: LabFeedback): LabTransition<HeatCapacityState> {
  return { state, feedback }
}

function isSubstance(value: unknown): value is HeatCapacitySubstance {
  return value === 'water' || value === 'oil'
}

function isDragSubject(value: unknown): value is HeatCapacityDragSubject {
  return value === 'waterThermometer'
    || value === 'oilThermometer'
    || value === 'waterHeater'
    || value === 'oilHeater'
}

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<Position>
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y)
}

function trialFor(state: HeatCapacityState): HeatCapacityTrial | undefined {
  return state.activeTrialId === null
    ? undefined
    : state.trials.find((trial) => trial.id === state.activeTrialId)
}

export function createHeatCapacityState(config: Partial<HeatCapacityConfig> = {}): HeatCapacityState {
  const waterMass = config.waterMass ?? DEFAULT_SAMPLE_MASS
  const oilMass = config.oilMass ?? DEFAULT_SAMPLE_MASS
  const heaterPower = config.heaterPower ?? DEFAULT_HEATER_POWER
  assertFinitePositive(waterMass, 'waterMass')
  assertFinitePositive(oilMass, 'oilMass')
  assertFinitePositive(heaterPower, 'heaterPower')

  return {
    waterMass,
    oilMass,
    heaterPower,
    elapsedSeconds: 0,
    waterTemperature: INITIAL_TEMPERATURE,
    oilTemperature: INITIAL_TEMPERATURE,
    waterThermometerPlaced: false,
    oilThermometerPlaced: false,
    waterHeaterPlaced: false,
    oilHeaterPlaced: false,
    heatersPlaced: false,
    heating: false,
    activeTrialId: null,
    trials: [],
  }
}

export function temperatureAfterEnergy(
  initialTemperature: number,
  power: number,
  seconds: number,
  massKg: number,
  heatCapacity: number,
): number {
  assertFiniteNonNegative(initialTemperature, 'initialTemperature')
  assertFinitePositive(power, 'power')
  assertFiniteNonNegative(seconds, 'seconds')
  assertFinitePositive(massKg, 'massKg')
  assertFinitePositive(heatCapacity, 'heatCapacity')
  return initialTemperature + (power * seconds) / (massKg * heatCapacity)
}

export function advanceHeating(state: HeatCapacityState, seconds: number): HeatCapacityState {
  if (!state.heating) return state
  if (!validStateConfig(state)) throw new RangeError('Heat capacity configuration must be finite and positive')
  assertFiniteNonNegative(seconds, 'seconds')

  const elapsedSeconds = state.elapsedSeconds + seconds
  return nextState(state, {
    elapsedSeconds,
    waterTemperature: temperatureAfterEnergy(
      INITIAL_TEMPERATURE,
      state.heaterPower,
      elapsedSeconds,
      state.waterMass,
      WATER_SPECIFIC_HEAT_CAPACITY,
    ),
    oilTemperature: temperatureAfterEnergy(
      INITIAL_TEMPERATURE,
      state.heaterPower,
      elapsedSeconds,
      state.oilMass,
      COOKING_OIL_SPECIFIC_HEAT_CAPACITY,
    ),
  })
}

function reduceSetMass(state: HeatCapacityState, payload: unknown): LabTransition<HeatCapacityState> {
  if (state.heating) return transition(state, rejected('加热进行中，不能改变质量'))
  if (typeof payload !== 'object' || payload === null) return transition(state, rejected('质量设置无效'))
  const value = payload as { substance?: unknown; mass?: unknown }
  if (!isSubstance(value.substance) || typeof value.mass !== 'number' || !Number.isFinite(value.mass) || value.mass <= 0) {
    return transition(state, rejected('质量必须是有限的正数'))
  }

  return transition(
    nextState(state, value.substance === 'water' ? { waterMass: value.mass } : { oilMass: value.mass }),
    accepted(`已设置${value.substance === 'water' ? '水' : '食用油'}的质量`),
  )
}

function reducePlace(state: HeatCapacityState, type: 'thermometer' | 'heater', payload: unknown): LabTransition<HeatCapacityState> {
  if (!isSubstance(payload)) return transition(state, rejected('请选择水或食用油的放置位置'))
  const placedKey = type === 'thermometer'
    ? payload === 'water' ? 'waterThermometerPlaced' : 'oilThermometerPlaced'
    : payload === 'water' ? 'waterHeaterPlaced' : 'oilHeaterPlaced'
  if (state[placedKey]) return transition(state, rejected('该器材已经放置到位'))
  const label = type === 'thermometer' ? '温度计' : '加热器'
  return transition(nextState(state, { [placedKey]: true }), accepted(`${label}已放入${payload === 'water' ? '水' : '食用油'}中`))
}

function reduceDragEnd(state: HeatCapacityState, payload: unknown): LabTransition<HeatCapacityState> {
  if (typeof payload !== 'object' || payload === null) return transition(state, rejected('器材没有放入正确的卡槽'))
  const drag = payload as { subject?: unknown; position?: unknown }
  if (!isDragSubject(drag.subject) || !isPosition(drag.position) || !isInsideSnapZone(drag.position, HEAT_CAPACITY_SNAP_ZONES[drag.subject])) {
    return transition(state, rejected('器材没有放入正确的卡槽'))
  }

  const substance: HeatCapacitySubstance = drag.subject.startsWith('water') ? 'water' : 'oil'
  return reducePlace(state, drag.subject.endsWith('Thermometer') ? 'thermometer' : 'heater', substance)
}

function canStart(state: HeatCapacityState): LabFeedback | undefined {
  if (!state.waterThermometerPlaced || !state.oilThermometerPlaced || !state.heatersPlaced) {
    return rejected('请先放置两支温度计和两个相同的加热器')
  }
  if (!validStateConfig(state) || Math.abs(state.waterMass - state.oilMass) > EQUAL_MASS_TOLERANCE) {
    return rejected('请将水和食用油的质量调至相等')
  }
  return undefined
}

function reduceStart(state: HeatCapacityState): LabTransition<HeatCapacityState> {
  if (state.heating) return transition(state, rejected('加热已经开始'))
  const prerequisite = canStart(state)
  if (prerequisite) return transition(state, prerequisite)
  return transition(nextState(state, { heating: true }), accepted('已开始同时加热'))
}

function reduceTick(state: HeatCapacityState, payload: unknown): LabTransition<HeatCapacityState> {
  if (!state.heating) return transition(state, rejected('请先开始加热'))
  if (typeof payload !== 'number' || !Number.isFinite(payload) || payload < 0) {
    return transition(state, rejected('计时增量必须是有限的非负数'))
  }
  return transition(advanceHeating(state, payload), accepted('加热计时已更新'))
}

function reduceStop(state: HeatCapacityState): LabTransition<HeatCapacityState> {
  if (!state.heating) return transition(state, rejected('加热尚未开始'))
  return transition(nextState(state, { heating: false }), accepted('已停止加热'))
}

function reduceRecord(state: HeatCapacityState): LabTransition<HeatCapacityState> {
  if (!state.waterThermometerPlaced || !state.oilThermometerPlaced) {
    return transition(state, rejected('请先把两支温度计分别放入水和食用油中'))
  }
  if (!state.heatersPlaced) return transition(state, rejected('请先把两个相同的加热器放到两个烧杯下方'))
  if (state.heating) return transition(state, rejected('请先停止加热再记录数据'))
  if (state.elapsedSeconds < MINIMUM_RECORDING_SECONDS) return transition(state, rejected('加热时间至少需要30秒'))

  const trial = Object.freeze({
    id: `heat-capacity-trial-${state.trials.length + 1}`,
    waterMass: state.waterMass,
    oilMass: state.oilMass,
    heaterPower: state.heaterPower,
    initialTemperature: INITIAL_TEMPERATURE,
    waterTemperature: state.waterTemperature,
    oilTemperature: state.oilTemperature,
    elapsedSeconds: state.elapsedSeconds,
  })
  return transition(
    nextState(state, { trials: [...state.trials, trial], activeTrialId: trial.id }),
    accepted('本次比较数据已记录，请使用数据表格保存读数'),
  )
}

function reduceResetTrial(state: HeatCapacityState): LabTransition<HeatCapacityState> {
  if (state.heating) return transition(state, rejected('请先停止加热再重置本次实验'))
  return transition(nextState(state, {
    elapsedSeconds: 0,
    waterTemperature: INITIAL_TEMPERATURE,
    oilTemperature: INITIAL_TEMPERATURE,
    waterThermometerPlaced: false,
    oilThermometerPlaced: false,
    waterHeaterPlaced: false,
    oilHeaterPlaced: false,
    activeTrialId: null,
  }), accepted('已重置当前实验，历史试次仍被保留'))
}

function deriveMeasurements(state: HeatCapacityState): readonly DerivedMeasurement[] {
  const trial = trialFor(state)
  if (!trial) return []
  return [
    { trialId: trial.id, key: 'waterTemperature', label: '水的末温', value: trial.waterTemperature, unit: '°C', kind: 'raw' },
    { trialId: trial.id, key: 'oilTemperature', label: '食用油的末温', value: trial.oilTemperature, unit: '°C', kind: 'raw' },
    { trialId: trial.id, key: 'heatingTime', label: '加热时间', value: trial.elapsedSeconds, unit: 's', kind: 'raw' },
    { trialId: trial.id, key: 'waterTemperatureChange', label: '水的温度变化', value: trial.waterTemperature - trial.initialTemperature, unit: '°C', kind: 'derived' },
    { trialId: trial.id, key: 'oilTemperatureChange', label: '食用油的温度变化', value: trial.oilTemperature - trial.initialTemperature, unit: '°C', kind: 'derived' },
  ]
}

function conditions(state: HeatCapacityState): readonly PhysicsExperimentalCondition[] {
  const trial = trialFor(state)
  const values = trial ?? state
  return [
    { label: '水的质量', value: values.waterMass },
    { label: '食用油的质量', value: values.oilMass },
    { label: '初温', value: trial?.initialTemperature ?? INITIAL_TEMPERATURE },
    { label: '加热功率', value: values.heaterPower },
    { label: '水的比热容', value: WATER_SPECIFIC_HEAT_CAPACITY },
    { label: '食用油的比热容', value: COOKING_OIL_SPECIFIC_HEAT_CAPACITY },
  ]
}

export const heatCapacityController: LabController<HeatCapacityState> & {
  conditions(state: HeatCapacityState): readonly PhysicsExperimentalCondition[]
} = {
  createInitialState: () => createHeatCapacityState(),
  reduce: (state, action) => {
    switch (action.type) {
      case 'setMass': return reduceSetMass(state, action.payload)
      case 'placeThermometer': return reducePlace(state, 'thermometer', action.payload)
      case 'placeHeater': return reducePlace(state, 'heater', action.payload)
      case 'dragEnd': return reduceDragEnd(state, action.payload)
      case 'start': return reduceStart(state)
      case 'tick': return reduceTick(state, action.payload)
      case 'stop': return reduceStop(state)
      case 'record': return reduceRecord(state)
      case 'resetTrial': return reduceResetTrial(state)
      default: return transition(state, rejected('不支持的实验操作'))
    }
  },
  deriveMeasurements,
  conditions,
  completion: (state) => state.trials.length > 0
    ? { complete: true, message: '已完成水和食用油吸热能力的比较' }
    : { complete: false, message: '请完成一次不少于30秒的水和食用油加热比较并记录数据' },
}
