import type { LabAction, LabController, LabRuntime } from './types'

const HISTORY_LIMIT = 30
const controllerKey = Symbol('labController')

type ControlledLabRuntime<TState> = LabRuntime<TState> & {
  readonly [controllerKey]: LabController<TState>
}

export function createLabRuntime<TState>(controller: LabController<TState>): LabRuntime<TState> {
  return withController({
    present: controller.createInitialState(),
    past: [],
    future: [],
    feedback: null,
  }, controller)
}

export function reduceLabAction<TState>(
  runtime: LabRuntime<TState>,
  action: LabAction,
): LabRuntime<TState> {
  const controller = controllerFor(runtime)

  switch (action.type) {
    case 'undo':
      return undo(runtime, controller)
    case 'redo':
      return redo(runtime, controller)
    case 'reset':
      return createLabRuntime(controller)
    case 'hydrate':
      return hydrateLabRuntime(runtime, action.payload)
    default:
      return reduceSemanticAction(runtime, action, controller)
  }
}

export function hydrateLabRuntime<TState>(
  runtime: LabRuntime<TState>,
  snapshot: unknown,
): LabRuntime<TState> {
  const controller = controllerFor(runtime)
  return withController({
    present: controller.restore(snapshot),
    past: [],
    future: [],
    feedback: null,
  }, controller)
}

function reduceSemanticAction<TState>(
  runtime: LabRuntime<TState>,
  action: LabAction,
  controller: LabController<TState>,
): LabRuntime<TState> {
  const transition = controller.reduce(runtime.present, action)

  if (transition.feedback.outcome === 'rejected') {
    return withController({
      ...runtime,
      feedback: transition.feedback,
    }, controller)
  }

  return withController({
    present: transition.state,
    past: appendHistory(runtime.past, runtime.present),
    future: [],
    feedback: transition.feedback,
  }, controller)
}

function undo<TState>(runtime: LabRuntime<TState>, controller: LabController<TState>): LabRuntime<TState> {
  const previous = runtime.past.at(-1)
  if (previous === undefined) return runtime

  return withController({
    present: previous,
    past: runtime.past.slice(0, -1),
    future: [runtime.present, ...runtime.future],
    feedback: runtime.feedback,
  }, controller)
}

function redo<TState>(runtime: LabRuntime<TState>, controller: LabController<TState>): LabRuntime<TState> {
  const next = runtime.future[0]
  if (next === undefined) return runtime

  return withController({
    present: next,
    past: appendHistory(runtime.past, runtime.present),
    future: runtime.future.slice(1),
    feedback: runtime.feedback,
  }, controller)
}

function appendHistory<TState>(history: readonly TState[], state: TState): TState[] {
  return [...history, state].slice(-HISTORY_LIMIT)
}

function controllerFor<TState>(runtime: LabRuntime<TState>): LabController<TState> {
  const controller = (runtime as ControlledLabRuntime<TState>)[controllerKey]
  if (controller === undefined) throw new Error('Lab runtime must be created with createLabRuntime')
  return controller
}

function withController<TState>(runtime: LabRuntime<TState>, controller: LabController<TState>): LabRuntime<TState> {
  Object.defineProperty(runtime, controllerKey, {
    value: controller,
    enumerable: false,
  })
  return runtime as ControlledLabRuntime<TState>
}
