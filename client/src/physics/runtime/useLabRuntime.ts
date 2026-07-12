import { useMemo, useReducer } from 'react'
import { createLabRuntime, reduceLabAction } from './reducer'
import type { DerivedMeasurement, LabAction, LabController, LabFeedback, LabRuntime } from './types'

export interface LabRuntimeApi<TState> {
  state: TState
  feedback: LabFeedback | null
  measurements: readonly DerivedMeasurement[]
  completion: { complete: boolean; message: string }
  dispatch(action: LabAction): void
  undo(): void
  redo(): void
  reset(): void
}

export interface LabRuntimeBinding<TState> {
  controller: LabController<TState>
  runtime: LabRuntime<TState>
}

export function createLabRuntimeBinding<TState>(controller: LabController<TState>): LabRuntimeBinding<TState> {
  return { controller, runtime: createLabRuntime(controller) }
}

export function rebindLabRuntime<TState>(
  binding: LabRuntimeBinding<TState>,
  controller: LabController<TState>,
): LabRuntimeBinding<TState> {
  return binding.controller === controller ? binding : createLabRuntimeBinding(controller)
}

export function reduceLabRuntimeBinding<TState>(
  binding: LabRuntimeBinding<TState>,
  controller: LabController<TState>,
  action: LabAction,
): LabRuntimeBinding<TState> {
  const activeBinding = rebindLabRuntime(binding, controller)
  return {
    controller: activeBinding.controller,
    runtime: reduceLabAction(activeBinding.runtime, action),
  }
}

export function useLabRuntime<TState>(controller: LabController<TState>): LabRuntimeApi<TState> {
  const [binding, dispatch] = useReducer(
    (state: LabRuntimeBinding<TState>, action: LabAction) => reduceLabRuntimeBinding(state, controller, action),
    controller,
    createLabRuntimeBinding,
  )
  const activeBinding = rebindLabRuntime(binding, controller)
  const { runtime } = activeBinding

  return useMemo(() => ({
    state: runtime.present,
    feedback: runtime.feedback,
    measurements: activeBinding.controller.deriveMeasurements(runtime.present),
    completion: activeBinding.controller.completion(runtime.present),
    dispatch,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    reset: () => dispatch({ type: 'reset' }),
  }), [activeBinding, runtime, dispatch])
}
