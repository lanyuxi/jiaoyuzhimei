import { describe, expect, it } from 'vitest'
import {
  createLabRuntimeBinding,
  reduceLabRuntimeBinding,
  reduceLabRuntimeBindingState,
  rebindLabRuntime,
} from './useLabRuntime'
import type { LabController } from './types'

interface CounterState {
  controller: string
  value: number
}

function createController(name: string, initialValue: number): LabController<CounterState> {
  return {
    createInitialState: () => ({ controller: name, value: initialValue }),
    reduce: (state, action) => ({
      state: action.type === 'increment'
        ? { controller: name, value: state.value + 1 }
        : state,
      feedback: {
        outcome: action.type === 'increment' ? 'accepted' : 'rejected',
        message: name,
      },
    }),
    deriveMeasurements: (state) => [{
      trialId: name,
      key: 'value',
      label: name,
      value: state.value,
      unit: '',
      kind: 'raw',
    }],
    completion: () => ({ complete: false, message: name }),
  }
}

function createCountingController(name: string, initialValue: number) {
  let initializations = 0

  return {
    controller: {
      ...createController(name, initialValue),
      createInitialState: () => {
        initializations += 1
        return { controller: name, value: initialValue }
      },
    },
    initializations: () => initializations,
  }
}

describe('lab runtime adapter', () => {
  it('reinitializes and consistently uses a replacement controller', () => {
    const original = createController('original', 0)
    const replacement = createController('replacement', 10)
    const binding = createLabRuntimeBinding(original)
    const rebound = rebindLabRuntime(binding, replacement)
    const dispatched = reduceLabRuntimeBinding(binding, replacement, { type: 'increment' })
    const reset = reduceLabRuntimeBinding(dispatched, replacement, { type: 'reset' })

    expect(rebound).not.toBe(binding)
    expect(rebound.controller).toBe(replacement)
    expect(rebound.runtime.present).toEqual({ controller: 'replacement', value: 10 })
    expect(dispatched.runtime.present).toEqual({ controller: 'replacement', value: 11 })
    expect(dispatched.controller.deriveMeasurements(dispatched.runtime.present)).toMatchObject([
      { trialId: 'replacement', value: 11 },
    ])
    expect(reset.runtime.present).toEqual({ controller: 'replacement', value: 10 })
  })

  it('commits every A to B to A identity transition before dispatching actions', () => {
    const a = createCountingController('A', 0)
    const b = createCountingController('B', 10)
    let binding = createLabRuntimeBinding(a.controller)

    binding = reduceLabRuntimeBindingState(binding, {
      type: 'action',
      binding,
      action: { type: 'increment' },
    })
    const bBinding = createLabRuntimeBinding(b.controller)
    binding = reduceLabRuntimeBindingState(binding, { type: 'binding', binding: bBinding })

    expect(binding.controller).toBe(b.controller)
    expect(binding.runtime).toMatchObject({ present: { controller: 'B', value: 10 }, past: [], future: [] })
    expect(a.initializations()).toBe(1)
    expect(b.initializations()).toBe(1)

    binding = reduceLabRuntimeBindingState(binding, {
      type: 'action',
      binding,
      action: { type: 'increment' },
    })
    const freshABinding = createLabRuntimeBinding(a.controller)
    binding = reduceLabRuntimeBindingState(binding, { type: 'binding', binding: freshABinding })

    expect(binding.controller).toBe(a.controller)
    expect(binding.runtime).toMatchObject({ present: { controller: 'A', value: 0 }, past: [], future: [] })
    expect(a.initializations()).toBe(2)
    expect(b.initializations()).toBe(1)

    binding = reduceLabRuntimeBindingState(binding, {
      type: 'action',
      binding,
      action: { type: 'increment' },
    })

    expect(binding.runtime).toMatchObject({
      present: { controller: 'A', value: 1 },
      past: [{ controller: 'A', value: 0 }],
      future: [],
    })
  })
})
