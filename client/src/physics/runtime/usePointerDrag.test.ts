import { describe, expect, it } from 'vitest'
import { createPointerDragAdapter } from './usePointerDrag'
import type { LabAction } from './types'

function createTarget() {
  const captured = new Set<number>()
  const calls = {
    captured: [] as number[],
    released: [] as number[],
  }

  return {
    calls,
    target: {
      getBoundingClientRect: () => ({ left: 100, top: 50 }),
      setPointerCapture: (pointerId: number) => {
        captured.add(pointerId)
        calls.captured.push(pointerId)
      },
      hasPointerCapture: (pointerId: number) => captured.has(pointerId),
      releasePointerCapture: (pointerId: number) => {
        captured.delete(pointerId)
        calls.released.push(pointerId)
      },
    },
  }
}

function event(pointerId: number, clientX: number, clientY: number, currentTarget: ReturnType<typeof createTarget>['target']) {
  return { pointerId, clientX, clientY, currentTarget }
}

describe('pointer drag adapter', () => {
  it('captures the active pointer, emits an end on pointerup, and releases it', () => {
    const { target, calls } = createTarget()
    const actions: LabAction[] = []
    const drag = createPointerDragAdapter({ stage: () => target, dispatch: (action) => actions.push(action) })

    drag.onPointerDown(event(1, 120, 80, target), { id: 'mass' })
    drag.onPointerMove(event(1, 130, 90, target))
    drag.onPointerUp(event(1, 140, 100, target))

    expect(calls.captured).toEqual([1])
    expect(calls.released).toEqual([1])
    expect(actions).toEqual([
      { type: 'dragStart', payload: { subject: { id: 'mass' }, position: { x: 20, y: 30 } } },
      { type: 'dragMove', payload: { subject: { id: 'mass' }, position: { x: 30, y: 40 } } },
      { type: 'dragEnd', payload: { subject: { id: 'mass' }, position: { x: 40, y: 50 } } },
    ])
  })

  it('keeps the first pointer active through competing events and emits a distinct cancellation semantic', () => {
    const { target, calls } = createTarget()
    const actions: LabAction[] = []
    const drag = createPointerDragAdapter({ stage: () => target, dispatch: (action) => actions.push(action) })

    drag.onPointerDown(event(1, 120, 80, target), { id: 'first' })
    drag.onPointerDown(event(2, 220, 180, target), { id: 'second' })
    drag.onPointerMove(event(2, 230, 190, target))
    drag.onPointerUp(event(2, 240, 200, target))
    drag.onPointerCancel(event(1, 130, 90, target))
    drag.onPointerUp(event(1, 140, 100, target))

    expect(calls.captured).toEqual([1])
    expect(calls.released).toEqual([1])
    expect(actions).toEqual([
      { type: 'dragStart', payload: { subject: { id: 'first' }, position: { x: 20, y: 30 } } },
      { type: 'dragCancel', payload: { subject: { id: 'first' }, position: { x: 30, y: 40 } } },
    ])
  })
})
