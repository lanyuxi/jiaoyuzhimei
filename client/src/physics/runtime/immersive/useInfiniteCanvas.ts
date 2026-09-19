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
  const panRef = useRef<{
    pointerId: number
    /** 上一帧位置（用于算增量平移） */
    x: number
    y: number
    /** 按下点（用于判定"这次手势到底是点击还是拖动"） */
    originX: number
    originY: number
    moved: boolean
  } | null>(null)
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

  /**
   * 聚焦边距的**稳定表达**。
   *
   * ⚠️ `padding` 的原型是对象字面量（调用方常写成
   * `padding={fitPaddingWithinSafeArea(w, h)}`），**每次渲染都是新引用**。
   * 直接把它放进依赖数组，会让下面的"重新聚焦" effect **每次渲染都重跑一次**，
   * 于是：滚轮刚把 `scale` 改掉 → 渲染 → effect 重跑 → `setCamera(focus(...))`
   * 把相机**打回初始构图** —— 用户看到的是"滚轮放大一下又自己弹回去了"，
   * 空格平移同理（画布一移动就被拉回原位）。
   *
   * 这里把边距拆成四个数值再拼成字符串，只认**值**、不认引用；
   * `paddingRef` 保证 effect 里读到的是最新值。
   */
  const paddingRef = useRef(padding)
  paddingRef.current = padding
  const resolvedPadding = resolveFitPadding(padding)
  const paddingKey = `${resolvedPadding.top}:${resolvedPadding.right}:${resolvedPadding.bottom}:${resolvedPadding.left}`

  // 尺寸或内容变化 → 重新聚焦（进入实验即铺满整屏）
  const contentKey = `${content.minX}:${content.minY}:${content.maxX}:${content.maxY}`
  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return
    setCamera(focus(content, size, paddingRef.current))
    /**
     * `contentKey` / `paddingKey` 是 `content` / `padding` 的**稳定值表达**：
     * 只依赖"值有没有真的变"，不依赖"引用是不是同一个"，
     * 否则每帧重算会把相机打回初始构图（见 `paddingKey` 的注释）。
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, size.width, size.height, paddingKey, focus])

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
    const onBlur = () => {
      setPanReady(false)
    }
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
   * 平移资格判据（**纯判断，不带副作用**）。
   *
   * 判据只看两件事：按键组合 + 指针是否落在带 `data-canvas-pan-block` 的悬浮控件上。
   *
   *   · **不看指针落在哪一层**：旧判据里的 `target.closest('svg') === null`
   *     （"只有空白处才能平移"）在本实验台上是致命的 —— `<svg>` 铺满整个舞台，
   *     屏幕上不存在"空白处"，空格 + 左键、甚至中键拖动都会被它挡掉；
   *   · **但要看是否命中悬浮控件**：工具条 / 读数条 / 胶囊组自己带
   *     `data-canvas-pan-block`，点它们不该变成拖画布，否则按钮会"点不动"。
   *
   * ⚠️ 必须用 `pointerdown` **当时**的 `event.target`。
   * 捕获阶段它是真实目标（尚未发生捕获重定向）；一旦认领并捕获指针，
   * 后续事件的 `target` 就变成捕获元素了。
   */
  const panEligible = useCallback((event: { button: number; target: EventTarget | null }) => {
    const target = event.target as (HTMLElement & { closest?: (selector: string) => Element | null }) | null
    // 悬浮控件（工具条 / 读数条 / 胶囊）自己声明"这里按下不是拖画布"，直接放行给它们
    if (target?.closest?.('[data-canvas-pan-block]') != null) return false
    return event.button === 1 || event.button === 2 || (event.button === 0 && panReadyRef.current)
  }, [])

  /**
   * 捕获阶段的 `pointerdown`：本实验台里**真正的**平移入口。
   *
   * 为什么必须是捕获阶段：器材手柄 / 接线柱 / 导线折点各自在 `pointerdown` 里
   * `setPointerCapture` + `stopPropagation`；冒泡阶段轮到手势层时事件早被掐断。
   * 捕获阶段方向相反（祖先先收到），因此画布能先看到这次按下，
   * "按住空格拖器材"才不会变成"把器材拖走"。
   *
   * ⚠️ 但捕获阶段认领**必须带守卫**：`event.target` 命中 `data-canvas-pan-block`
   * 时必须原样放行，既不捕获也不截断。否则画布会把整棵子树里的悬浮控件
   * （工具条的 放大/缩小/复位/铺满，它们挂在 `InfiniteCanvas` 内部、`stageRef` 覆盖不到）
   * 一起吞掉 —— 真实 Chromium 实测按钮的 `pointerdown / pointerup / click` 一个都不再触发，
   * 且卡住后没有恢复路径。守卫加上之后按钮照常响应。
   *
   * ⚠️ 捕获要打在**手势层**（`event.currentTarget`）上，**不能**打在更外层的舞台：
   * 真实 Chromium 实测，指针捕获会把后续 `pointermove` 重定向到捕获元素本身，
   * 而且**不会再下发给它的后代**；手势层是舞台的子节点，在舞台（祖先）上捕获会让
   * 手势层的 `onPointerMove`（真正执行平移的那段代码）完全收不到事件，
   * 表现为"捕获成功、画布纹丝不动"。
   */
  const onPointerDownCapture = useCallback(
    (event: globalThis.PointerEvent) => {
      /**
       * ⚠️ **认领与捏合登记必须互斥**（真实 Chromium / happy-dom 均实测复现过回归）。
       *
       * 这条监听挂在手势层上，而手势层是**所有**指针的共同祖先：
       * 学生拖器材时，器材手柄自己会 `setPointerCapture` + `stopPropagation`，
       * 但**捕获阶段先跑**，所以那一次按下也一定会到这里。
       *
       * 若在这里**无条件** `pinchRef.set(...)`：被器材占走的那一指会**永久留在
       * `pinchRef` 里**（真实设备上 `pointercancel` 基本不会来），
       * 于是下一次任意指针按下就凑到 `pinchRef.size === 2`，
       * `onPointerMove` 直接进捏合分支按两点**中点**做 `zoomAt` ——
       * 表现是**拖器材时画布自己越缩越小**（实测 `scale 1 → 0.5`）。
       *
       * 所以：**认领走了的指针不进 `pinchRef`**，只把"确实空出来的第二指"留给捏合。
       */
      if (panRef.current === null && panEligible(event)) {
        panRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          originX: event.clientX,
          originY: event.clientY,
          moved: false,
        }
        const captureTarget = event.currentTarget as
          | (EventTarget & { setPointerCapture?: (id: number) => void })
          | null
        if (captureTarget !== null && typeof captureTarget.setPointerCapture === 'function') {
          try {
            captureTarget.setPointerCapture(event.pointerId)
          } catch {
            // 少数环境（含无头 DOM）不支持捕获；没有它也能靠手势层上的事件继续平移
          }
        }
        // 认领后立刻截断：场景侧的器材 / 接线柱 / 导线收不到这次按下，不会被顺手拖走
        event.stopPropagation()
        return
      }
      /**
       * ⚠️ 到这里**仍然不能登记进 `pinchRef`**。
       *
       * 走到这里有两种情况，且都无法区分"这一指最终归谁"：
       *   · 学生**拖器材 / 接导线**——场景侧手柄随后会
       *     `setPointerCapture` + `stopPropagation`，这一指归场景；
       *   · 真的**第二根手指**落在画布空白处——这一指归捏合。
       *
       * 捕获阶段无法分辨它们，而且**场景侧的 `pointerdown` 还没跑**。
       * 因此登记推迟到"事件真的冒泡到手势层"时（`handlers.onPointerDown`）：
       * 那时场景侧若已认领并截断，就根本不会走到那里 ——
       * 被场景占走的指针自然**不会被登记**，也就不会凑出假的"双指"。
       */
    },
    [panEligible],
  )

  const handlers = {
    /**
     * 冒泡阶段兜底。
     *
     * 正常情况下平移已在**捕获阶段**认领（`onPointerDownCapture`）。
     * 这里只处理"捕获阶段没跑"的场景（例如测试里直接从后代派发合成事件），
     * 判据与捕获阶段完全一致，避免两条入口口径不一。
     */
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      // 与捕获阶段同一条纪律：认领与捏合登记互斥（见 `onPointerDownCapture` 注释）
      if (panRef.current === null && panEligible(event)) {
        panRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          originX: event.clientX,
          originY: event.clientY,
          moved: false,
        }
        return
      }
      pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const panning = panRef.current !== null && panRef.current.pointerId === event.pointerId
      /**
       * ⚠️ **正在平移的那一指不参与捏合** —— 这是**防御性**代码，不是被测试覆盖的行为。
       *
       * 认领平移时不会把它登记进 `pinchRef`（见 `onPointerDownCapture`），
       * 所以在当前两个入口下这里**进不去**。
       * 保留它是因为"平移与捏合同源"是这个文件里最容易被改回去的一处：
       * 一旦有人让认领也登记 `pinchRef`，平移中就会多出一次按两点中点的 `zoomAt`
       * （实测 `scale 1 → 1.4`）。删掉它**不会让任何判据变红**，
       * 请把它当"护栏"而不是"多余分支"。
       */
      if (!panning && pinchRef.current.has(event.pointerId)) {
        pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      }
      // 双指捏合缩放
      if (!panning && pinchRef.current.size === 2) {
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
      /**
       * `moved` = "这次手势到底是**点击**还是**拖动**"。
       *
       * ⚠️ 这里踩过两个坑，都不是"阈值调多大"的问题：
       *
       * 1. **不能用相邻两帧的位移判定**：只要位移由**多帧亚像素步长**组成
       *    （高刷鼠标、触控板 `pointerrawupdate` 合并、系统缩放、慢速拖动），
       *    每帧都不到 1px，`moved` 会**全程为 false** ——
       *    明明画布已跟手走了 180px，却仍被判成"点击"。
       *    后果不是识别不准，而是下面的逃生阀清掉 `panReady`，
       *    让"按住空格 + 拖过一次慢速拖动"之后的**所有拖动永久失效**（实测第二次 dx=0）。
       *
       * 2. **也不能只看"相对按下点是否超过 1px"**：一次被截断的拖动可能只走了 0.4px，
       *    它**根本不该算点击** —— 逃生阀一旦在这里清掉空格状态，
       *    接下来的真实拖动就整个失效。
       *
       * 因此判据是：**只要真的产生过位移（`dx`/`dy` 非零，即确实调用了 `panBy`），
       * 就算拖动**。这与"区分点击与拖动"的意图一致，也不会误伤任何真实拖动。
       */
      if (!pan.moved && (dx !== 0 || dy !== 0)) pan.moved = true
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
      const target = event.currentTarget as (Element & {
        hasPointerCapture?: (id: number) => boolean
        releasePointerCapture?: (id: number) => void
      }) | null
      if (target?.hasPointerCapture?.(event.pointerId) === true) {
        target.releasePointerCapture?.(event.pointerId)
      }
      panRef.current = null
      /**
       * ⚠️ **刻意不复位 `panReady`**。
       *
       * 用户原话是「空格键 = 按住长按鼠标左键不松开，可以任意拖动」——
       * "按住不放"期间必须能**连续拖多次**。这里一旦清掉 `panReady`，
       * 第二次拖动就完全失效（真实 Chromium 实测：连拖两次，第二次 `dx=0`）。
       *
       * 空格状态的复位时机：`keyup`（真的松开了空格）、`blur`（窗口失焦）、
       * `pointercancel`（手势被系统打断）。
       *
       * ⚠️ 再加一条**逃生阀**：`pointerup` 时若这次**根本没拖动过**
       * （`moved === false`，也就是一次"点击"而不是"拖拽"），也清掉 `panReady`。
       *
       * 理由：「按住空格 + 左键点某个控件」与「按住空格拖动画布」是同一个手势前缀，
       * 画布必然要抢在其中一种前面。抢下来之后如果学生松开鼠标却**忘了松开空格**，
       * 之后任何一次左键拖动都会继续拖画布，看起来像"鼠标坏了"。
       * 这条逃生阀不会影响诉求「按住不松开可以任意拖动」——
       * 真正的拖动会把 `moved` 置为 `true`，`panReady` 依然保持。
       */
      if (!pan.moved && event.button === 0) setPanReady(false)
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
    /**
     * 手势层元素：渲染 `handlers` 的那个 `div`（`InfiniteCanvas` 给它打了
     * `data-canvas-gesture-layer`）。
     *
     * 平移手势必须**挂在这里、也捕获在这里**，理由有两条：
     *   · 挂在这里：器材手柄 / 接线柱 / 导线各自在 `pointerdown` 里
     *     `setPointerCapture` + `stopPropagation`，冒泡阶段手势层收不到，
     *     所以这条监听必须走**捕获阶段**；
     *   · 捕获在这里：浏览器把捕获后的 `pointermove` **只派发给捕获元素本身，
     *     不再下发给它的后代**（真实 Chromium 实测）。真正执行平移的
     *     `onPointerMove` 就挂在手势层上 —— 若捕获在祖先舞台，
     *     手势层反而收不到事件，表现为"捕获成功、画布纹丝不动"。
     */
    const gesture = stage.querySelector<HTMLElement>('[data-canvas-gesture-layer]')
    gesture?.addEventListener('pointerdown', onPointerDownCapture, { capture: true })
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('contextmenu', onContextMenu)
      gesture?.removeEventListener('pointerdown', onPointerDownCapture, { capture: true })
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
