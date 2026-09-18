import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react'

/** 稳定的空数组，避免默认值每次渲染都变、把聚焦 effect 打爆 */
const EMPTY_PROBES: readonly Position[] = []
import type { Position } from '../types'
import {
  IDENTITY_CAMERA,
  fitContent,
  panBy,
  projectPerspective,
  resolveFitPadding,
  settleFit,
  screenToCanvas,
  zoomAt,
  zoomFromWheel,
  type Camera,
  type CanvasSize,
  type ContentBounds,
  type FitPadding,
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

export interface PerspectiveConfig {
  /** 倾斜角（度），对应 CSS `rotateX` */
  tilt: number
  /** CSS `perspective` 值（px） */
  depth: number
  /** CSS `perspective-origin`，形如 `'50% 58%'`（相对舞台的百分比） */
  origin: string
}

export interface InfiniteCanvasOptions {
  /** 舞台元素（用于测量尺寸与定位） */
  stageRef: RefObject<HTMLElement | null>
  /** 画布内容包围盒，尺寸变化或该值变化时自动聚焦 */
  content: ContentBounds
  padding?: FitPadding
  /** 缩放上限（聚焦时） */
  fitMaxScale?: number
  /**
   * 3D 透视参数（与 CSS 严格同源）。
   *
   * 传了它，聚焦就会在**屏幕空间**里量一次内容真实外接矩形再解相机 ——
   * 否则带 `rotateX` 的舞台会出现"画布坐标看着居中、屏幕上偏了 2px"的偏差，
   * 器材上缘被顶部工具栏压住。
   */
  perspective?: PerspectiveConfig
  /**
   * 参与聚焦测量的真实几何点（各件器材本体外接矩形的四角）。
   *
   * 透视是非线性的，"包围盒四边"与"内容真实凸包"投影后不是一回事
   * （实测差 3.96px，足以让器材下缘压在底部读数条上）。传进来即可消除。
   */
  probes?: readonly Position[]
}

/** `'50% 58%'` → `{x: 0.5, y: 0.58}`；解析不出来时退回居中偏下的默认值 */
function parseOriginPercent(origin: string): { x: number; y: number } {
  const [rawX, rawY] = origin.trim().split(/\s+/)
  const toRatio = (value: string | undefined, fallback: number) => {
    if (value === undefined) return fallback
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed / 100 : fallback
  }
  return { x: toRatio(rawX, 0.5), y: toRatio(rawY, 0.5) }
}

function localPoint(stage: HTMLElement | null, clientX: number, clientY: number): Position {
  if (stage === null) return { x: clientX, y: clientY }
  const rect = stage.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

/**
 * 无限画布交互：滚轮缩放、拖动平移、双指捏合、聚焦内容。
 *
 * 平移手势的触发条件（用户明确要求的两条）：
 *   1. **按住空格 + 按住鼠标左键拖动** —— 无论指针停在画布哪一层
 *      （SVG 上、器材上、导线上都算），一律平移画布；
 *   2. 中键 / 右键拖动 —— 鼠标用户的快捷方式，同样不看指针在哪一层。
 *
 * ⚠️ 「指针落在 `svg` 上就不算平移」这条旧判据在本实验台里**等于"无法平移"**：
 * 场景的 `<svg>` 是铺满整个舞台的（见 `CompetitorScene`），
 * 屏幕上根本没有"svg 之外"的空白区域。
 */
export function useInfiniteCanvas({
  stageRef,
  content,
  padding = 56,
  fitMaxScale = 2.6,
  perspective,
  probes = EMPTY_PROBES,
}: InfiniteCanvasOptions): InfiniteCanvasApi {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 })
  const [camera, setCamera] = useState<Camera>(IDENTITY_CAMERA)
  const [panReady, setPanReady] = useState(false)
  const panRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null)
  /**
   * `panReady` 的**事件回调可读镜像**。
   *
   * 捕获阶段的 `pointerdown` 挂在原生 DOM 上，闭包与 React 状态更新的时序不保证；
   * 直接读 state 可能读到过期的 `false`，表现为"按了空格第一次拖动没反应"。
   */
  const panReadyRef = useRef(panReady)
  panReadyRef.current = panReady
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

  /**
   * 聚焦用的投影闭包：`stage size` 从 `sizeRef` 实时读，因此尺寸一测到就能正确聚焦。
   * 相机固定为 `scale=1 / 平移 0` —— `fitContent` 只借它量"内容的屏幕形状"。
   */
  const fitProjection = useCallback(
    (point: Position) => {
      if (perspective === undefined) return point
      const { width, height } = sizeRef.current
      const ratio = parseOriginPercent(perspective.origin)
      return projectPerspective(point, {
        camera: { scale: 1, x: 0, y: 0 },
        tilt: perspective.tilt,
        perspective: perspective.depth,
        originX: width * ratio.x,
        originY: height * ratio.y,
        stage: { width, height },
      })
    },
    [perspective],
  )

  /** 聚焦测量的取样点（随 `probes` 变化，新的布局会被重新量一次） */
  const probeList = useMemo(() => probes, [probes])

  /**
   * **带真实相机**的画布 → 屏幕投影。
   *
   * 与 `fitProjection`（相机固定 scale=1）不同：这里把相机也算进去，
   * 因此可以直接量"某组取样点在屏幕上真实占据多大"，
   * 用来把聚焦结果闭环校正到目标矩形之内（见 `settleFit`）。
   */
  const measureProjection = useCallback(
    (point: Position, candidate: Camera): Position => {
      if (perspective === undefined) {
        return { x: point.x * candidate.scale + candidate.x, y: point.y * candidate.scale + candidate.y }
      }
      const { width, height } = sizeRef.current
      const ratio = parseOriginPercent(perspective.origin)
      return projectPerspective({ x: point.x, y: point.y }, {
        camera: candidate,
        tilt: perspective.tilt,
        perspective: perspective.depth,
        originX: width * ratio.x,
        originY: height * ratio.y,
        stage: { width, height },
      })
    },
    [perspective],
  )

  /** 按给定相机量取样点在屏幕空间的外接矩形 */
  const measureBounds = useCallback(
    (candidate: Camera): ContentBounds | null => {
      if (probeList.length === 0) return null
      let minX = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY
      for (const point of probeList) {
        const projected = measureProjection(point, candidate)
        minX = Math.min(minX, projected.x)
        maxX = Math.max(maxX, projected.x)
        minY = Math.min(minY, projected.y)
        maxY = Math.max(maxY, projected.y)
      }
      return { minX, maxX, minY, maxY }
    },
    [probeList, measureProjection],
  )

  const focus = useCallback(
    (bounds: ContentBounds, target: { width: number; height: number }, pad: FitPadding) =>
      focusInScreenSpace({
        bounds,
        target,
        padding: pad,
        maxScale: fitMaxScale,
        project: perspective === undefined ? undefined : fitProjection,
        probes: probeList,
        measure: measureBounds,
      }),
    [fitMaxScale, fitProjection, perspective, probeList, measureBounds],
  )

  // 尺寸或内容变化 → 重新聚焦（进入实验即铺满整屏）
  const contentKey = `${content.minX}:${content.minY}:${content.maxX}:${content.maxY}`
  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return
    setCamera(focus(content, size, padding))
    // contentKey 是 content 的稳定表达，避免每帧重算导致相机抖动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, size.width, size.height, padding, focus])

  /**
   * 空格键进入平移模式（= 按住鼠标左键即可任意拖动无限画布）。
   *
   * 三个细节都不能少：
   *   1. **不排除 `event.repeat`**：按住空格浏览器会连发 keydown，统一"按下即置位"，
   *      靠 keyup / blur / pointerup 复位；
   *   2. **`preventDefault`**：空格默认会滚动页面、激活聚焦的按钮，
   *      在沉浸式实验台里会让画布"跳"一下；
   *   3. **失焦 / 松手都复位**：否则松开空格后画布仍是"抓着"的状态。
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      event.preventDefault()
      setPanReady(true)
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
    setCamera(focus(content, sizeRef.current, padding))
  }, [content, padding, focus])

  const fitToContent = useCallback(
    (bounds: ContentBounds) =>
      setCamera(focus(bounds, sizeRef.current, padding)),
    [padding, focus],
  )

  const zoomBy = useCallback((factor: number) => {
    const currentSize = sizeRef.current
    setCamera((current) =>
      zoomAt(current, factor, { x: currentSize.width / 2, y: currentSize.height / 2 }, currentSize),
    )
  }, [])

  /**
   * 尝试认领一次平移手势。返回是否认领成功。
   *
   * 判据只看「按键 + 是否按着空格」，**不看指针落在哪一层**：
   *   · 旧判据里的 `target.closest('svg') === null`（"只有空白处才能平移"）
   *     在本实验台上是致命的 —— `<svg>` 铺满整个舞台，屏幕上不存在"空白处"，
   *     空格 + 左键、甚至中键拖动都会被它挡掉，画布完全不能平移；
   *   · 悬浮控件（工具条 / 读数条 / 胶囊组）自己带 `data-canvas-pan-block`，
   *     点它们不该变成拖画布，否则按钮会"点不动"。
   *
   * 认领动作 = 记下令牌 + 在**舞台**上捕获指针。
   */
  const beginPan = useCallback(
    (event: { pointerId: number; clientX: number; clientY: number; button: number; target: EventTarget | null }) => {
      const target = event.target as (HTMLElement & { closest?: (selector: string) => Element | null }) | null
      const onInteractive = target?.closest?.('[data-canvas-pan-block]') != null
      const wantsPan = event.button === 1 || event.button === 2 || (event.button === 0 && panReadyRef.current)
      if (!wantsPan || onInteractive || panRef.current !== null) return false
      panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
      /**
       * 在**舞台**上捕获指针（而不是 `event.target`）。
       *
       * 舞台是所有交互子树的祖先：在它上面捕获之后，后续 `pointermove`
       * 一定经过舞台，画布手势层（舞台的后代）因此必然收得到；
       * 场景侧的器材 / 接线柱 / 导线手柄都在舞台**里面**，
       * 它们各自再捕获也改变不了"事件仍会经过舞台"这一事实。
       */
      const captureTarget = stageRef.current
      if (captureTarget !== null && typeof captureTarget.setPointerCapture === 'function') {
        try {
          captureTarget.setPointerCapture(event.pointerId)
        } catch {
          // 少数环境（含无头 DOM）不支持捕获；没有它也能靠舞台上的事件继续平移
        }
      }
      return true
    },
    [stageRef],
  )

  /**
   * 捕获阶段的 `pointerdown`：本实验台里**真正的**平移入口。
   *
   * 必须走捕获阶段：舞台里的手势容器是所有交互子树的共同祖先，
   * 冒泡阶段一定最后才轮到它；而器材手柄 / 接线柱 / 导线折点各自在
   * `pointerdown` 里 `setPointerCapture` 并 `stopPropagation` ——
   * 冒泡到画布层时事件早被掐断，按住空格拖器材就不会平移画布。
   *
   * 捕获阶段方向相反（祖先先收到）：这里认领后立刻 `stopPropagation`，
   * 场景侧的按钮 / 器材完全收不到这次按下 —— "按住空格拖动"永远是平移画布。
   */
  const onPointerDownCapture = useCallback(
    (event: globalThis.PointerEvent) => {
      pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (!beginPan(event)) return
      event.stopPropagation()
    },
    [beginPan],
  )

  const handlers = {
    /** 冒泡阶段的兜底：正常情况下已经被捕获阶段的 `onPointerDownCapture` 认领 */
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      beginPan(event)
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
      /**
       * 本次手势已由画布认领 → **掐断冒泡**，不让场景侧"监听 `pointermove`
       * 的手柄"（例如导线折点）在没收到 `pointerdown` 时也动起来。
       *
       * 位置关键：必须在**冒泡阶段这里**截断。若挪到捕获阶段（挂在舞台），
       * 会连画布自己的这条记账路径一起掐掉，表现为"点了空格反而完全不能平移"。
       */
      event.stopPropagation()
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      pinchRef.current.delete(event.pointerId)
      if (pinchRef.current.size < 2) pinchDistanceRef.current = null
      const pan = panRef.current
      if (pan === null || pan.pointerId !== event.pointerId) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      panRef.current = null
      /**
       * 松开指针时按下的空格可能已经先松了（keyup 先到），
       * 这里再显式复位一次，避免"画布还抓着"的黏连状态。
       */
      if (event.button === 0) setPanReady(false)
      if (pan.moved) event.stopPropagation()
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
    /**
     * **鼠标滚轮缩放**（用户明确要求："需要支持我的鼠标滚轮对页面进行放大和缩小"）。
     *
     * 为什么必须在原生 DOM 上手动注册、而不能只用 React 的 `onWheel`：
     * React 19 把 `wheel` 委托成 **passive** 监听，`preventDefault()` 会被忽略，
     * 页面（以及外层容器）会同时滚动/缩放。这里用 `{ passive: false }` 显式注册，
     * 才能真正"只有画布缩放、页面不动"。
     *
     * 缩放锚点取**指针位置**：指针指着的那个画布点在缩放前后停在同一个屏幕位置，
     * 这是鼠标滚轮与触控板双指缩放都符合直觉的行为。
     */
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const anchor = localPoint(stageRef.current, event.clientX, event.clientY)
      setCamera((current) => zoomFromWheel(current, event.deltaY, anchor, sizeRef.current))
    }
    const onContextMenu = (event: MouseEvent) => {
      if (panRef.current !== null) event.preventDefault()
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('contextmenu', onContextMenu)
    /**
     * 空格 / 中键 / 右键拖动 —— 必须挂在**捕获阶段**（见 `onPointerDownCapture` 注释）。
     */
    stage.addEventListener('pointerdown', onPointerDownCapture, { capture: true })
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('contextmenu', onContextMenu)
      stage.removeEventListener('pointerdown', onPointerDownCapture, { capture: true })
    }
  }, [stageRef, onPointerDownCapture])

  return { camera, size, panReady, resetView, zoomBy, fitToContent, toCanvasPoint, toScreenPoint, handlers }
}

/**
 * 聚焦的**完整算法**（纯函数，导出以便单测真正打到生产逻辑）。
 *
 * 两步：
 *   1. `fitContent` 解析地算一次相机 —— 会在**屏幕空间**预投影内容的取样点，
 *      而不是直接用画布包围盒（画布包围盒忽略透视，实测偏 2px 就被顶部控件压住）；
 *   2. `settleFit` 拿真实相机的投影**闭环校正**，消掉 `perspective-origin`
 *      是舞台像素带来的仿射残差（实测 3.96px）。
 *
 * 抽成导出的纯函数的原因：这段逻辑曾经只活在 hook 里，
 * 于是"把第 1 步的屏幕空间预投影删掉"这种变异**测不出来**（测试只能复刻一份同样的实现）。
 * 导出之后，测试直接打这个函数，变异必红。
 */
export function focusInScreenSpace({
  bounds,
  target,
  padding,
  maxScale,
  project,
  probes,
  measure,
}: {
  bounds: ContentBounds
  target: CanvasSize
  padding: FitPadding
  maxScale: number
  project?: (point: Position) => Position
  probes: readonly Position[]
  measure?: (camera: Camera) => ContentBounds | null
}): Camera {
  const base = fitContent(bounds, target, padding, maxScale, project, probes)
  if (probes.length === 0 || measure === undefined) return base
  const resolved = resolveFitPadding(padding)
  return settleFit(
    base,
    {
      left: resolved.left,
      top: resolved.top,
      width: Math.max(1, target.width - resolved.left - resolved.right),
      height: Math.max(1, target.height - resolved.top - resolved.bottom),
    },
    measure,
  )
}
