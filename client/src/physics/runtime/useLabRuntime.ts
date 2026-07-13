import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createLabRuntime, reduceLabAction } from './reducer'
import type { DerivedMeasurement, LabAction, LabController, LabFeedback, LabRuntime } from './types'

export interface LabRuntimeApi<TState> {
  state: TState
  feedback: LabFeedback | null
  measurements: readonly DerivedMeasurement[]
  completion: { complete: boolean; message: string }
  dispatch(action: LabAction): LabRuntimeCommandResult<TState>
  undo(): void
  redo(): void
  reset(): void
}

export interface LabRuntimeCommandResult<TState> {
  state: TState
  feedback: LabFeedback | null
}

export interface LabRuntimeBinding<TState> {
  controller: LabController<TState>
  runtime: LabRuntime<TState>
}

export type LabRuntimeBindingAction<TState> =
  | { type: 'binding'; binding: LabRuntimeBinding<TState> }
  | { type: 'action'; binding: LabRuntimeBinding<TState>; action: LabAction }

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
  return reduceLabRuntimeBindingState(binding, {
    type: 'action',
    binding: rebindLabRuntime(binding, controller),
    action,
  })
}

export function dispatchLabRuntimeBinding<TState>(
  binding: LabRuntimeBinding<TState>,
  controller: LabController<TState>,
  action: LabAction,
): { binding: LabRuntimeBinding<TState>; feedback: LabFeedback | null } {
  const nextBinding = reduceLabRuntimeBinding(binding, controller, action)
  return { binding: nextBinding, feedback: nextBinding.runtime.feedback }
}

export function reduceLabRuntimeBindingState<TState>(
  binding: LabRuntimeBinding<TState>,
  action: LabRuntimeBindingAction<TState>,
): LabRuntimeBinding<TState> {
  const activeBinding = binding.controller === action.binding.controller ? binding : action.binding

  if (action.type === 'binding') return activeBinding

  return {
    controller: activeBinding.controller,
    runtime: reduceLabAction(activeBinding.runtime, action.action),
  }
}

export function useLabRuntime<TState>(controller: LabController<TState>): LabRuntimeApi<TState> {
  const [binding, setBinding] = useState(() => createLabRuntimeBinding(controller))
  const bindingRef = useRef(binding)
  const activeBinding = useMemo(
    () => rebindLabRuntime(binding, controller),
    [binding, controller],
  )
  const { runtime } = activeBinding
  const dispatch = useCallback((action: LabAction) => {
    const command = dispatchLabRuntimeBinding(bindingRef.current, controller, action)
    bindingRef.current = command.binding
    setBinding(command.binding)
    return {
      state: command.binding.runtime.present,
      feedback: command.feedback,
    }
  }, [controller])

  useEffect(() => {
    const rebound = rebindLabRuntime(bindingRef.current, controller)
    bindingRef.current = rebound
    setBinding(rebound)
  }, [controller])

  return useMemo(() => ({
    state: runtime.present,
    feedback: runtime.feedback,
    measurements: activeBinding.controller.deriveMeasurements(runtime.present),
    completion: activeBinding.controller.completion(runtime.present),
    dispatch,
    undo: () => { dispatch({ type: 'undo' }) },
    redo: () => { dispatch({ type: 'redo' }) },
    reset: () => { dispatch({ type: 'reset' }) },
  }), [activeBinding, runtime, dispatch])
}
