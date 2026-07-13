import { describe, expect, it } from 'vitest'
import { createLabRuntime, hydrateLabRuntime, reduceLabAction } from './reducer'
import type { LabController } from './types'

interface CounterState {
  value: number
}

const controller: LabController<CounterState> = {
  createInitialState: () => ({ value: 0 }),
  reduce: (state, action) => action.type === 'increment'
    ? { state: { value: state.value + 1 }, feedback: { outcome: 'accepted', message: 'Incremented' } }
    : { state, feedback: { outcome: 'rejected', message: 'Invalid action' } },
  deriveMeasurements: () => [],
  snapshot: (state) => ({ ...state }),
  restore: (snapshot) => typeof snapshot === 'object'
    && snapshot !== null
    && typeof (snapshot as { value?: unknown }).value === 'number'
    ? { value: (snapshot as { value: number }).value }
    : { value: 0 },
  measurementGroups: () => [],
  report: () => ({ calculationResults: [], conclusion: [], errorAnalysis: [] }),
  completion: () => ({ complete: false, message: 'Continue experimenting' }),
}

describe('lab runtime reducer', () => {
  it('records accepted semantic actions and supports undo', () => {
    const runtime = createLabRuntime(controller)
    const next = reduceLabAction(runtime, { type: 'increment' })

    expect(next.present.value).toBe(1)
    expect(next.past).toHaveLength(1)
    expect(next.feedback).toEqual({ outcome: 'accepted', message: 'Incremented' })
    expect(reduceLabAction(next, { type: 'undo' }).present.value).toBe(0)
  })

  it('preserves history when the controller rejects an action', () => {
    const accepted = reduceLabAction(createLabRuntime(controller), { type: 'increment' })
    const rejected = reduceLabAction(accepted, { type: 'invalid' })

    expect(rejected.present).toBe(accepted.present)
    expect(rejected.past).toBe(accepted.past)
    expect(rejected.future).toBe(accepted.future)
    expect(rejected.feedback).toEqual({ outcome: 'rejected', message: 'Invalid action' })
  })

  it('keeps only the thirty most recent history entries', () => {
    let runtime = createLabRuntime(controller)

    for (let index = 0; index < 31; index += 1) {
      runtime = reduceLabAction(runtime, { type: 'increment' })
    }

    expect(runtime.present.value).toBe(31)
    expect(runtime.past).toHaveLength(30)
    expect(runtime.past[0]).toEqual({ value: 1 })
    expect(runtime.past.at(-1)).toEqual({ value: 30 })
  })

  it('clears redo history after an accepted semantic action', () => {
    const first = reduceLabAction(createLabRuntime(controller), { type: 'increment' })
    const second = reduceLabAction(first, { type: 'increment' })
    const undone = reduceLabAction(second, { type: 'undo' })
    const next = reduceLabAction(undone, { type: 'increment' })

    expect(undone.future).toEqual([{ value: 2 }])
    expect(next.future).toEqual([])
    expect(next.present).toEqual({ value: 2 })
  })

  it('restores the next state from future on redo without mutating history', () => {
    const initial = createLabRuntime(controller)
    const first = reduceLabAction(initial, { type: 'increment' })
    const second = reduceLabAction(first, { type: 'increment' })
    const undone = reduceLabAction(second, { type: 'undo' })
    const redone = reduceLabAction(undone, { type: 'redo' })

    expect(undone.present).toBe(first.present)
    expect(undone.past).toEqual([initial.present])
    expect(undone.future).toEqual([second.present])
    expect(redone.present).toBe(second.present)
    expect(redone.past).toEqual([initial.present, first.present])
    expect(redone.future).toEqual([])
    expect(redone.past).not.toBe(undone.past)
    expect(redone.future).not.toBe(undone.future)
  })

  it('restores initial state and clears history on reset', () => {
    const changed = reduceLabAction(createLabRuntime(controller), { type: 'increment' })
    const reset = reduceLabAction(changed, { type: 'reset' })

    expect(reset.present).toEqual({ value: 0 })
    expect(reset.present).not.toBe(changed.past[0])
    expect(reset.past).toEqual([])
    expect(reset.future).toEqual([])
    expect(reset.feedback).toBeNull()
  })

  it('hydrates a validated controller snapshot without manufacturing undo history', () => {
    const changed = reduceLabAction(createLabRuntime(controller), { type: 'increment' })

    const hydrated = hydrateLabRuntime(changed, { value: 7 })
    const invalid = hydrateLabRuntime(hydrated, { value: 'bad' })

    expect(hydrated).toMatchObject({ present: { value: 7 }, past: [], future: [], feedback: null })
    expect(invalid).toMatchObject({ present: { value: 0 }, past: [], future: [], feedback: null })
  })

  it('leaves an empty undo stack unchanged', () => {
    const runtime = createLabRuntime(controller)

    expect(reduceLabAction(runtime, { type: 'undo' })).toBe(runtime)
  })

  it('leaves an empty redo stack unchanged', () => {
    const runtime = createLabRuntime(controller)

    expect(reduceLabAction(runtime, { type: 'redo' })).toBe(runtime)
  })

  it('does not mutate previous runtime objects or history arrays', () => {
    const initial = createLabRuntime(controller)
    const incremented = reduceLabAction(initial, { type: 'increment' })
    const undone = reduceLabAction(incremented, { type: 'undo' })

    expect(initial).toEqual({ present: { value: 0 }, past: [], future: [], feedback: null })
    expect(incremented).toEqual({
      present: { value: 1 },
      past: [{ value: 0 }],
      future: [],
      feedback: { outcome: 'accepted', message: 'Incremented' },
    })
    expect(undone.past).not.toBe(incremented.past)
    expect(undone.future).not.toBe(incremented.future)
  })
})
