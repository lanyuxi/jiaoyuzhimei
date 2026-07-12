import { useMemo, useReducer } from 'react'
import { createLabRuntime, reduceLabAction } from './reducer'
import type { DerivedMeasurement, LabAction, LabController, LabFeedback } from './types'

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

export function useLabRuntime<TState>(controller: LabController<TState>): LabRuntimeApi<TState> {
  const [runtime, dispatch] = useReducer(
    (state: ReturnType<typeof createLabRuntime<TState>>, action: LabAction) => reduceLabAction(state, action),
    controller,
    createLabRuntime,
  )

  return useMemo(() => ({
    state: runtime.present,
    feedback: runtime.feedback,
    measurements: controller.deriveMeasurements(runtime.present),
    completion: controller.completion(runtime.present),
    dispatch,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    reset: () => dispatch({ type: 'reset' }),
  }), [controller, runtime, dispatch])
}
