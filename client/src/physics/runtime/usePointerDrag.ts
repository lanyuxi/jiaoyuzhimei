import { useRef } from 'react'
import type { PointerEvent, RefObject } from 'react'
import type { LabAction, Position } from './types'

interface ActiveDrag {
  pointerId: number
  subject: unknown
}

export interface PointerDragApi {
  onPointerDown(event: PointerEvent<HTMLElement>, subject?: unknown): void
  onPointerMove(event: PointerEvent<HTMLElement>): void
  onPointerUp(event: PointerEvent<HTMLElement>): void
  onPointerCancel(event: PointerEvent<HTMLElement>): void
}

export interface PointerDragOptions {
  stageRef: RefObject<HTMLElement | null>
  dispatch(action: LabAction): void
}

export function usePointerDrag({ stageRef, dispatch }: PointerDragOptions): PointerDragApi {
  const activeDrag = useRef<ActiveDrag | null>(null)

  const positionFor = (event: PointerEvent<HTMLElement>): Position | null => {
    const stage = stageRef.current
    if (stage === null) return null

    const rect = stage.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const emit = (type: 'dragStart' | 'dragMove' | 'dragEnd', event: PointerEvent<HTMLElement>): void => {
    const drag = activeDrag.current
    const position = positionFor(event)
    if (drag === null || position === null) return

    dispatch({ type, payload: { subject: drag.subject, position } })
  }

  const finishDrag = (event: PointerEvent<HTMLElement>): void => {
    if (activeDrag.current?.pointerId !== event.pointerId) return

    emit('dragEnd', event)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activeDrag.current = null
  }

  return {
    onPointerDown: (event, subject) => {
      if (positionFor(event) === null) return

      activeDrag.current = { pointerId: event.pointerId, subject }
      event.currentTarget.setPointerCapture(event.pointerId)
      emit('dragStart', event)
    },
    onPointerMove: (event) => {
      if (activeDrag.current?.pointerId === event.pointerId) emit('dragMove', event)
    },
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
  }
}
