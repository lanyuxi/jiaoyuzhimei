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

export interface PointerCaptureTarget {
  setPointerCapture(pointerId: number): void
  hasPointerCapture(pointerId: number): boolean
  releasePointerCapture(pointerId: number): void
}

export interface PointerDragStage {
  getBoundingClientRect(): Pick<DOMRect, 'left' | 'top'>
}

export interface PointerDragEvent {
  pointerId: number
  clientX: number
  clientY: number
  currentTarget: PointerCaptureTarget
}

export interface PointerDragAdapterOptions {
  stage(): PointerDragStage | null
  dispatch(action: LabAction): void
}

export interface PointerDragAdapter {
  onPointerDown(event: PointerDragEvent, subject?: unknown): void
  onPointerMove(event: PointerDragEvent): void
  onPointerUp(event: PointerDragEvent): void
  onPointerCancel(event: PointerDragEvent): void
}

export function createPointerDragAdapter({ stage, dispatch }: PointerDragAdapterOptions): PointerDragAdapter {
  let activeDrag: ActiveDrag | null = null

  const positionFor = (event: PointerDragEvent): Position | null => {
    const currentStage = stage()
    if (currentStage === null) return null

    const rect = currentStage.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const emit = (type: 'dragStart' | 'dragMove' | 'dragEnd', event: PointerDragEvent): void => {
    const position = positionFor(event)
    if (activeDrag === null || position === null) return

    dispatch({ type, payload: { subject: activeDrag.subject, position } })
  }

  const finishDrag = (event: PointerDragEvent): void => {
    if (activeDrag?.pointerId !== event.pointerId) return

    emit('dragEnd', event)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activeDrag = null
  }

  return {
    onPointerDown: (event, subject) => {
      if (activeDrag !== null || positionFor(event) === null) return

      activeDrag = { pointerId: event.pointerId, subject }
      event.currentTarget.setPointerCapture(event.pointerId)
      emit('dragStart', event)
    },
    onPointerMove: (event) => {
      if (activeDrag?.pointerId === event.pointerId) emit('dragMove', event)
    },
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
  }
}

export function usePointerDrag(options: PointerDragOptions): PointerDragApi {
  const optionsRef = useRef(options)
  optionsRef.current = options
  const adapterRef = useRef<PointerDragAdapter | null>(null)

  if (adapterRef.current === null) {
    adapterRef.current = createPointerDragAdapter({
      stage: () => optionsRef.current.stageRef.current,
      dispatch: (action) => optionsRef.current.dispatch(action),
    })
  }

  return adapterRef.current
}
