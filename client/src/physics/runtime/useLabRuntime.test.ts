import { describe, expect, it } from 'vitest'
import {
  createLabRuntimeBinding,
  reduceLabRuntimeBinding,
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
})
