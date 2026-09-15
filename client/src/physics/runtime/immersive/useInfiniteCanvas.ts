import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { Position } from '../types'
import {
  IDENTITY_CAMERA,
  fitContent,
  panBy,
  screenToCanvas,
  zoomAt,
  zoomFromWheel,
  type Camera,
  type CanvasSize,
  type ContentBounds,
} from './canvas'

export interface InfiniteCanvasApi {
  camera: Camera
  size: CanvasSize
  /** 是否处于可抓取平移状态（空格或中键/右键拖动） */
  panReady: boolean
  resetView(): void
  zoomBy(factor: number): void
  fitToContent(bounds: ContentBounds): void
  /** 屏幕坐标 → 画布坐标 */
  toCanvasPoint(point: Position): Position
  /** 画布坐标 → 屏幕坐标 */
  toScreenPoint(point: Position): Position
  handlers: {
    onPointerDown(event: PointerEvent<HTMLElement>): void
    onPointerMove(event: PointerEvent<HTMLElement>): void
    onPointerUp(event: PointerEvent<HTMLElement>): void
    onPointerCancel(event: PointerEvent<HTMLElement>): void
    onWheel(event: React.WheelEvent<HTMLElement>): void
  }
}

export interface InfiniteCanvasOptions {
  /** 舞台元素（用于测量尺寸与定位） */
  stageRef: RefObject<HTMLElement | null>
  /** 画布内容包围盒，尺寸变化或该值变化时自动聚焦 */
  content: ContentBounds
  padding?: number
  /** 缩放上限（聚焦时） */
  fitMaxScale?: number
}

function localPoint(stage: HTMLElement | null, clientX: number, clientY: number): Position {
  if (stage === null) return { x: clientX, y: clientY }
  const rect = stage.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

/**
 * 无限画布交互：滚轮缩放、拖动平移、双指捏合、聚焦内容。
 *
 * 平移手势只在「空白处 / 空格或中键按下」时生效，
 * 这样接线柱等元件的拖拽不会被画布平移抢走。
 */
export function useInfiniteCanvas({ stageRef, content, padding = 56, fitMaxScale = 2.6 }: InfiniteCanvasOptions): InfiniteCanvasApi {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 })
  const [camera, setCamera] = useState<Camera>(IDENTITY_CAMERA)
  const [panReady, setPanReady] = useState(false)
  const panRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null)
  const pinchRef = useRef<Map<number, Position>>(new Map())
  const pinchDistanceRef = useRef<number | null>(null)
  const cameraRef = useRef(camera)
  cameraRef.current = camera
  const sizeRef = useRef(size)
  sizeRef.current = size

  // 测量舞台尺寸
  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return

    const measure = () => {
      const rect = stage.getBoundingClientRect()
      setSize((current) =>
        Math.abs(current.width - rect.width) > 0.5 || Math.abs(current.height - rect.height) > 0.5
          ? { width: rect.width, height: rect.height }
          : current,
      )
    }

    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [stageRef])

  // 尺寸或内容变化 → 重新聚焦（进入实验即铺满整屏）
  const contentKey = `${content.minX}:${content.minY}:${content.maxX}:${content.maxY}`
  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return
    setCamera(fitContent(content, size, padding, fitMaxScale))
    // contentKey 是 content 的稳定表达，避免每帧重算导致相机抖动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, size.width, size.height, padding, fitMaxScale])

  // 空格键进入平移模式
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        const target = event.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
        event.preventDefault()
        setPanReady(true)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setPanReady(false)
    }
    const onBlur = () => setPanReady(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const toCanvasPoint = useCallback((point: Position) => screenToCanvas(point, cameraRef.current), [])
  const toScreenPoint = useCallback(
    (point: Position) => ({ x: point.x * cameraRef.current.scale + cameraRef.current.x, y: point.y * cameraRef.current.scale + cameraRef.current.y }),
    [],
  )

  const resetView = useCallback(() => {
    setCamera(fitContent(content, sizeRef.current, padding, fitMaxScale))
  }, [content, padding, fitMaxScale])

  const fitToContent = useCallback(
    (bounds: ContentBounds) => setCamera(fitContent(bounds, sizeRef.current, padding, fitMaxScale)),
    [padding, fitMaxScale],
  )

  const zoomBy = useCallback((factor: number) => {
    const currentSize = sizeRef.current
    setCamera((current) =>
      zoomAt(current, factor, { x: currentSize.width / 2, y: currentSize.height / 2 }, currentSize),
    )
  }, [])

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      const target = event.target as HTMLElement
      const onInteractive = target.closest('[data-canvas-pan-block]') !== null
      const wantsPan = event.button === 1 || event.button === 2 || panReady || target.closest('svg') === null
      if (!wantsPan || onInteractive || panRef.current !== null) return
      panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (pinchRef.current.has(event.pointerId)) {
        pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      }
      // 双指捏合缩放
      if (pinchRef.current.size === 2) {
        const [first, second] = [...pinchRef.current.values()]
        const distance = Math.hypot(first.x - second.x, first.y - second.y)
        if (pinchDistanceRef.current !== null && distance > 0) {
          const factor = distance / pinchDistanceRef.current
          const anchor = localPoint(stageRef.current, (first.x + second.x) / 2, (first.y + second.y) / 2)
          setCamera((current) => zoomAt(current, factor, anchor, sizeRef.current))
        }
        pinchDistanceRef.current = distance
        return
      }
      const pan = panRef.current
      if (pan === null || pan.pointerId !== event.pointerId) return
      const dx = event.clientX - pan.x
      const dy = event.clientY - pan.y
      if (!pan.moved && Math.hypot(dx, dy) > 1) pan.moved = true
      pan.x = event.clientX
      pan.y = event.clientY
      setCamera((current) => panBy(current, dx, dy, sizeRef.current))
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      pinchRef.current.delete(event.pointerId)
      if (pinchRef.current.size < 2) pinchDistanceRef.current = null
      const pan = panRef.current
      if (pan === null || pan.pointerId !== event.pointerId) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      panRef.current = null
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      pinchRef.current.delete(event.pointerId)
      if (pinchRef.current.size < 2) pinchDistanceRef.current = null
      panRef.current = null
    },
    onWheel: (event: React.WheelEvent<HTMLElement>) => {
      // React 的滚轮事件是 passive 监听，这里只需阻止页面滚动
      event.preventDefault()
      const anchor = localPoint(stageRef.current, event.clientX, event.clientY)
      setCamera((current) => zoomFromWheel(current, event.deltaY, anchor, sizeRef.current))
    },
  }

  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    // 手动注册非 passive 的 wheel 监听，才能 preventDefault 阻止页面缩放
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const anchor = localPoint(stageRef.current, event.clientX, event.clientY)
      setCamera((current) => zoomFromWheel(current, event.deltaY, anchor, sizeRef.current))
    }
    const onContextMenu = (event: MouseEvent) => {
      if (panRef.current !== null) event.preventDefault()
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('contextmenu', onContextMenu)
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('contextmenu', onContextMenu)
    }
  }, [stageRef])

  return { camera, size, panReady, resetView, zoomBy, fitToContent, toCanvasPoint, toScreenPoint, handlers }
}
