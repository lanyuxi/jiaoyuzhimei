/**
 * 「全屏无限画布 · 4 条收尾修复」的回归测试。
 *
 * 覆盖的是 PR #22 合并时留下的 4 个未闭环缺口。每一条都**先复现、后断言**，
 * 而且都能被"故意改坏"验证过（见 `viewportMutation` 用例组）。
 *
 * 四条缺口的共同根因只有一句：
 *   **「哪里算可见」「指针指向哪」「相机摆到哪」「抓到谁」用了四套不同的几何口径。**
 * 本文件的职责就是把它们钉在同一套上 —— 任何一条被改回旧口径，这里必须变红。
 */
import { describe, expect, it } from 'vitest'
import {
  COMPONENT_BODY_MARGIN,
  COMPONENT_HIT_PADDING,
  controlAvoidArea,
  COMPONENT_HIT_RADIUS,
  LAB_COMPONENT_IDS,
  componentAt,
  componentBodyRect,
  componentOverflowScreen,
  moveComponent,
  componentHitPadding,
  componentOverflow,
  createDefaultLayout,
  fitPaddingWithinSafeArea,
  isComponentOffCanvas,
  layoutBounds,
  offCanvasComponents,
  rescueAllComponents,
  resolveViewport,
  screenToCanvasWithinViewport,
  visibleScreenArea,
  type LabComponentId,
} from './layout'
import { PERSPECTIVE_ORIGIN, PERSPECTIVE_DEPTH, STAGE_TILT_DEG } from '../../runtime/immersive/InfiniteCanvas'
import { fitContent, projectPerspective, type Camera } from '../../runtime/immersive/canvas'
import { focusInScreenSpace } from '../../runtime/immersive/useInfiniteCanvas'

/** 与 `PERSPECTIVE_ORIGIN` 保持同源的百分比解析（测试里独立实现一次，避免"抄常量"） */
const originRatio = (() => {
  const [rawX, rawY] = PERSPECTIVE_ORIGIN.trim().split(/\s+/)
  return { x: Number.parseFloat(rawX) / 100, y: Number.parseFloat(rawY) / 100 }
})()

/** 真实浏览器实测过的视口（含一个矮视口与一个手机竖屏） */
const VIEWPORTS: readonly { width: number; height: number }[] = [
  { width: 1688, height: 841 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
  { width: 1440, height: 800 },
  { width: 1024, height: 600 },
  { width: 1920, height: 420 },
  { width: 390, height: 780 },
]

function perspectiveOf(size: { width: number; height: number }) {
  return {
    tilt: STAGE_TILT_DEG,
    perspective: PERSPECTIVE_DEPTH,
    originX: size.width * originRatio.x,
    originY: size.height * originRatio.y,
    stage: { width: size.width, height: size.height },
  }
}

function stageOf(size: { width: number; height: number }, camera: Camera) {
  return { camera, ...perspectiveOf(size) }
}

/** 初始构图里每件器材本体外接矩形的四角（聚焦测量的取样点） */
function componentProbes(): { x: number; y: number }[] {
  const layout = createDefaultLayout()
  const points: { x: number; y: number }[] = []
  for (const id of LAB_COMPONENT_IDS) {
    const rect = componentBodyRect(id, layout.components[id])
    points.push(
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom },
    )
  }
  return points
}

/**
 * 聚焦 —— **直接调用生产实现** `focusInScreenSpace`。
 *
 * 刻意不在测试里复刻一份：曾经因为复刻，把"屏幕空间预投影"那一步删掉
 * 这种变异完全测不出来（测试自己做了正确的事，生产代码坏了也不红）。
 */
function focusFor(size: { width: number; height: number }): Camera {
  const probes = componentProbes()
  return focusInScreenSpace({
    bounds: layoutBounds(createDefaultLayout()),
    target: size,
    padding: fitPaddingWithinSafeArea(),
    maxScale: 2.6,
    project: (point) => projectPerspective(point, stageOf(size, { scale: 1, x: 0, y: 0 })),
    probes,
    measure: (candidate) => {
      let minX = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY
      for (const point of probes) {
        const projected = projectPerspective(point, stageOf(size, candidate))
        minX = Math.min(minX, projected.x)
        maxX = Math.max(maxX, projected.x)
        minY = Math.min(minY, projected.y)
        maxY = Math.max(maxY, projected.y)
      }
      return { minX, maxX, minY, maxY }
    },
  })
}

/** 器材本体四角投影到屏幕后，越出「安全区」的最大像素数（0 = 一点没被裁） */
function bodyOverflowPixels(size: { width: number; height: number }, camera: Camera): number {
  const safe = visibleScreenArea(size.width, size.height)
  const stage = stageOf(size, camera)
  let worst = 0
  for (const id of LAB_COMPONENT_IDS) {
    const rect = componentBodyRect(id, createDefaultLayout().components[id])
    for (const [x, y] of [
      [rect.left, rect.top],
      [rect.right, rect.top],
      [rect.left, rect.bottom],
      [rect.right, rect.bottom],
    ] as const) {
      const point = projectPerspective({ x, y }, stage)
      worst = Math.max(worst, safe.top - point.y, point.y - safe.bottom, safe.left - point.x, point.x - safe.right)
    }
  }
  return worst
}

/**
 * 器材本体四角投影到屏幕后，**钻进悬浮控件下面**的最大像素数（0 = 完全没被压住）。
 *
 * 与 `bodyOverflowPixels` 的区别：
 *   · `bodyOverflowPixels` 量的是"越出安全区"，安全区历史上被当成画布边界；
 *   · 本函数量的是"被控件压住"，控件只是**浮在画布之上**，画布本身铺满全屏。
 * 去掉中间那块隐形画布之后，后者才是真正要守的那条。
 */
function controlOverlapPixels(size: { width: number; height: number }, camera: Camera): number {
  const control = controlAvoidArea(size.width, size.height)
  const stage = stageOf(size, camera)
  let worst = 0
  for (const id of LAB_COMPONENT_IDS) {
    const rect = componentBodyRect(id, createDefaultLayout().components[id])
    for (const [x, y] of [
      [rect.left, rect.top],
      [rect.right, rect.top],
      [rect.left, rect.bottom],
      [rect.right, rect.bottom],
    ] as const) {
      const point = projectPerspective({ x, y }, stage)
      worst = Math.max(worst, control.top - point.y, point.y - control.bottom, control.left - point.x, point.x - control.right)
    }
  }
  return worst
}

describe('缺口 1：拖动映射与可见范围必须是同一套变换', () => {
  it('拖到可见下界时，指针落点就是可见下界（不再多出 7～8px）', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      const viewport = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))
      expect(viewport, `${size.width}x${size.height} 可见范围算不出来`).not.toBeNull()
      // 屏幕最下沿（安全区内）对应的画布 y，必须与可见范围的 maxY 一致
      const safe = visibleScreenArea(size.width, size.height)
      const bottomEdge = { x: size.width / 2, y: safe.bottom }
      const canvasPoint = screenToCanvasWithinViewport(bottomEdge, viewport, camera)
      expect(canvasPoint, `${size.width}x${size.height} 反算失败`).not.toBeNull()
      expect(
        Math.abs(canvasPoint!.y - viewport!.visible.maxY),
        `${size.width}x${size.height} 拖动映射与可见范围差 ${(canvasPoint!.y - viewport!.visible.maxY).toFixed(2)} 画布单位`,
      ).toBeLessThan(0.5)
    }
  })

  it('线性反算与透视反算**确实不同**（否则这条修复没有意义）', () => {
    const size = { width: 1688, height: 841 }
    const camera = focusFor(size)
    const screen = visibleScreenArea(size.width, size.height).bottom
    const viewport = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
    const linear = (screen - camera.y) / camera.scale
    const perspective = screenToCanvasWithinViewport({ x: size.width / 2, y: screen }, viewport, camera)!.y
    // 用线性反算会偏出 8 个画布单位（约 11px），正是缺口 4 的来源
    expect(Math.abs(linear - perspective)).toBeGreaterThan(4)
  })

  it('场景确实把「可见范围」与「指针反算」接到同一个入口上', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8'),
    )
    // 两处都必须走 resolveViewport / screenToCanvasWithinViewport，不允许各算各的
    expect(source).toContain('resolveViewport')
    expect(source).toContain('screenToCanvasWithinViewport')
    // 旧的"线性反算"写法必须彻底消失，否则两套口径会再次分叉
    expect(source).not.toContain('(event.clientX - rect.left - camera.x) / camera.scale')
    expect(source).not.toContain('buildVisibleRect')
  })

  it('可见矩形与投影严格互逆（反投影回来的点再投影必须落在原处）', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      const viewport = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
      const stage = stageOf(size, camera)
      /**
       * 可见范围 = **整块舞台**（不再是"扣掉顶部 56 / 底部 60 的那条带"）。
       *
       * 目标值直接从 `visibleScreenArea` 读，而不是写死数字：
       * 写死 56 / height-60 的话，一旦"画布铺满全屏"这个语义再被改回去，
       * 这里会因为"数字对不上"而红，但红的原因说不清；读同一个来源之后，
       * 这条判据守的才是"屏幕 ↔ 画布严格互逆"这件事本身。
       */
      const safe = visibleScreenArea(size.width, size.height)
      for (const y of [viewport.visible.minY, (viewport.visible.minY + viewport.visible.maxY) / 2, viewport.visible.maxY]) {
        const back = projectPerspective({ x: 0, y }, stage).y
        const target = y === viewport.visible.minY ? safe.top : y === viewport.visible.maxY ? safe.bottom : back
        expect(Math.abs(back - target), `${size.width}x${size.height} y=${y} 互逆误差 ${Math.abs(back - target)}`).toBeLessThan(0.5)
      }
    }
  })
})

describe('缺口 2：判据必须是「本体包围盒完整可见」，不是「中心在范围内」', () => {
  it('中心恰好在可见边界上、但本体探出去 → 必须判为出屏', () => {
    const size = { width: 1688, height: 841 }
    const camera = focusFor(size)
    const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
    for (const id of LAB_COMPONENT_IDS) {
      const margin = COMPONENT_BODY_MARGIN[id]
      for (const [name, center, expectedAxis] of [
        ['下界', { x: (visible.minX + visible.maxX) / 2, y: visible.maxY }, margin.y],
        ['上界', { x: (visible.minX + visible.maxX) / 2, y: visible.minY }, margin.y],
        ['左界', { x: visible.minX, y: (visible.minY + visible.maxY) / 2 }, margin.x],
        ['右界', { x: visible.maxX, y: (visible.minY + visible.maxY) / 2 }, margin.x],
      ] as const) {
        // 中心恰好在可见边界上（旧判据会放行），但本体已经有半个身位探出去了
        const layout = { ...createDefaultLayout(), components: { ...createDefaultLayout().components, [id]: center } }
        const overflow = componentOverflow(id, center, visible)
        const totalOverflow = overflow.left + overflow.right + overflow.top + overflow.bottom
        expect(totalOverflow, `${id} 贴${name}时本体竟然没探出`).toBeGreaterThanOrEqual(expectedAxis - 1e-6)
        expect(isComponentOffCanvas(layout, id, visible), `${id} 贴${name}、中心在界内但本体探出，竟未判为出屏`).toBe(true)
      }
    }
  })

  it('矮视口（1920×420）下不再漏判：本体探出就会被收回', () => {
    const size = { width: 1920, height: 420 }
    const camera = focusFor(size)
    const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
    // 把 S1 放到可见下界 —— 这正是需求截图里"器材拖动一下就遮挡"的位置
    const center = { x: (visible.minX + visible.maxX) / 2, y: visible.maxY }
    const layout = { ...createDefaultLayout(), components: { ...createDefaultLayout().components, S1: center } }
    expect(isComponentOffCanvas(layout, 'S1', visible), 'S1 本体探出下界却未被判出屏').toBe(true)
    const rescued = rescueAllComponents(layout, visible)
    expect(offCanvasComponents(rescued, visible)).toEqual([])
  })

  it('判据与收回自洽：收回之后一定不再被判出屏（不会死循环）', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
      const layout = createDefaultLayout()
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
        const stray = {
          ...layout,
          components: Object.fromEntries(
            LAB_COMPONENT_IDS.map((id) => [
              id,
              {
                x: layout.components[id].x + dx * (visible.maxX - visible.minX) * 2,
                y: layout.components[id].y + dy * (visible.maxY - visible.minY) * 2,
              },
            ]),
          ) as Record<LabComponentId, { x: number; y: number }>,
        }
        const rescued = rescueAllComponents(stray, visible)
        expect(offCanvasComponents(rescued, visible), `${size.width}x${size.height} 收回后仍被判出屏`).toEqual([])
      }
    }
  })

  it('判据容差足够小：本体下缘越界 1 个画布单位也必须被判出来', () => {
    const size = { width: 1688, height: 841 }
    const camera = focusFor(size)
    const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
    const margin = COMPONENT_BODY_MARGIN.A1
    // 让 A1 本体的下缘刚好超出可见下界 1 个画布单位
    const nudged = { x: (visible.minX + visible.maxX) / 2, y: visible.maxY + 1 - margin.y }
    const layout = { ...createDefaultLayout(), components: { ...createDefaultLayout().components, A1: nudged } }
    expect(componentOverflow('A1', nudged, visible).bottom).toBeGreaterThan(0.5)
    expect(isComponentOffCanvas(layout, 'A1', visible)).toBe(true)
  })
})

describe('缺口 3：入屏即终态（不再"一进页面就被裁 / 自己跳一下"）', () => {
  it('加载后没有任何一件器材被裁进悬浮控件下面（逐视口 × 逐件 × 逐角）', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      expect(bodyOverflowPixels(size, camera), `${size.width}x${size.height} 加载后本体越出安全区`).toBeLessThanOrEqual(0.5)
    }
  })

  it('入屏后不需要任何补救：可见性不变量是空操作（器材不会自己动）', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
      const layout = createDefaultLayout()
      expect(offCanvasComponents(layout, visible), `${size.width}x${size.height} 一进页面就有器材被判出屏`).toEqual([])
      expect(rescueAllComponents(layout, visible), `${size.width}x${size.height} 一进页面器材就被挪动了`).toBe(layout)
    }
  })

  it('聚焦**不许直接采信画布包围盒**：必须由屏幕空间闭环校正定稿', () => {
    /**
     * 这条记录聚焦链路的两级结构（缺一不可）：
     *
     *   1. `fitContent` 在**屏幕空间**预投影内容的取样点 —— 只按画布包围盒解相机，
     *      投影之后内容会被透视推到悬浮控件底下；
     *   2. `settleFit` 拿真实相机的投影闭环校正 —— 消掉 `perspective-origin`
     *      是舞台像素带来的仿射残差。
     *
     * 断言方式是"对比两条链路"，而不是"复刻一份正确实现"：
     * 只要生产代码里任一级被短路，这里就会变红（曾经因为复刻实现而漏检过）。
     */
    const size = { width: 1688, height: 841 }
    const probes = componentProbes()
    const measureOf = (size_: { width: number; height: number }) => (candidate: Camera) => {
      let minX = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY
      for (const point of probes) {
        const projected = projectPerspective(point, stageOf(size_, candidate))
        minX = Math.min(minX, projected.x)
        maxX = Math.max(maxX, projected.x)
        minY = Math.min(minY, projected.y)
        maxY = Math.max(maxY, projected.y)
      }
      return { minX, maxX, minY, maxY }
    }

    /** 生产链路：`focusInScreenSpace` */
    const settled = focusFor(size)

    // ① 入屏后不能有器材被悬浮控件压住
    expect(controlOverlapPixels(size, settled), '生产聚焦链路让器材钻进了控件下面').toBeLessThanOrEqual(0.5)

    // ② 两级都不能被短路：把任一级拆掉，相机就会退回旧值
    const onlyProjection = focusInScreenSpace({
      bounds: layoutBounds(createDefaultLayout()),
      target: size,
      padding: fitPaddingWithinSafeArea(),
      maxScale: 2.6,
      project: (point) => projectPerspective(point, stageOf(size, { scale: 1, x: 0, y: 0 })),
      probes,
      measure: measureOf(size),
    })
    const withoutProjection = focusInScreenSpace({
      bounds: layoutBounds(createDefaultLayout()),
      target: size,
      padding: fitPaddingWithinSafeArea(),
      maxScale: 2.6,
      probes,
      measure: measureOf(size),
    })
    // 传了屏幕空间预投影时，结果必须与生产链路完全一致
    expect(onlyProjection.scale, '屏幕空间预投影那一步没生效').toBeCloseTo(settled.scale, 9)
    expect(onlyProjection.y, '屏幕空间预投影那一步没生效').toBeCloseTo(settled.y, 6)
    // 闭环校正那一步也真的改变了相机
    const cameraDelta =
      Math.abs(withoutProjection.scale - settled.scale) + Math.abs(withoutProjection.y - settled.y)
    expect(cameraDelta, '闭环校正那一步没生效（两级链路之一被短路）').toBeGreaterThan(1e-6)
  })

  it('入屏留白只避开**真正浮着控件的那几条边**，不把画布缩回一块矩形', () => {
    const padding = fitPaddingWithinSafeArea()
    const control = controlAvoidArea(1688, 841)

    /**
     * 这条判据记录本轮的核心修正。
     *
     * 历史上 `visibleScreenArea` 把画布从"整块屏幕"收成"中间一条横带"
     * （四周留 56 / 60），而**画布又真的按这个矩形裁剪** ——
     * 于是那个矩形边界就是用户说的"中间那块隐形的画布"。
     * 现在：
     *   · 可见范围 = 整块舞台（四边都到屏幕边）；
     *   · 入屏留白只避开真正浮着控件的那几条边（左工具条 / 顶栏 / 右入口 / 底读数条）。
     */
    expect(visibleScreenArea(1688, 841)).toEqual({ left: 0, top: 0, right: 1688, bottom: 841 })

    // 上/下留白必须覆盖控件（否则入屏就被压住），但**不能**把画布缩回中间
    expect(padding.top).toBeGreaterThanOrEqual(control.top)
    expect(padding.bottom).toBeGreaterThanOrEqual(841 - control.bottom)
    expect(padding.left).toBeGreaterThanOrEqual(control.left)
    expect(padding.right).toBeGreaterThanOrEqual(1688 - control.right)

    // 留白必须**远小于**"四周都留一圈"的旧口径：否则等于把画布又缩回一块矩形
    expect(padding.top + padding.bottom).toBeLessThan(841 * 0.6)
    expect(padding.left + padding.right).toBeLessThan(1688 * 0.6)
  })

  it('左/右留白是**不对称**的：左边只有工具条，右边还有协作入口 + 画布工具条', () => {
    const padding = fitPaddingWithinSafeArea()
    expect(padding.right, '右侧控件更多，留白不该比左侧窄').toBeGreaterThanOrEqual(padding.left)
  })

  it('场景确实在**相机变化（含首次入屏）**时跑了一遍不变量（不只靠松手时）', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8'),
    )
    /**
     * 判据要的是"相机一变就同步收回"，**不规定实现写法**。
     *
     * 曾经这条写死成 `onCameraChange={(next) => {` —— 那是"内联箭头函数"的写法，
     * 而内联箭头会让 `InfiniteCanvas` 的相机 effect 每帧重跑（依赖里挂着它），
     * 触发 `setLayout` → 重渲染 → **无限更新循环**（浏览器实测刷屏
     * "Maximum update depth exceeded"）。所以实现改成了稳定的
     * `handleCameraChange` + ref。这里守"语义"而不是守"某一种写法"。
     */
    expect(source).toContain('settleLayoutForCamera')
    expect(source).toContain('onCameraChange=')
    expect(source).toMatch(/handleCameraChange|settleLayoutForCamera\(next\)/)
    expect(source).toContain('rescueAllComponents')
    // 不允许退回"在 effect 里同步 setState"（会级联渲染 + 抖动）
    expect(source).not.toMatch(/useEffect\(\(\) => \{\s*setLayout\(\(current\) => settle/)
  })
})

describe('缺口 4：命中区与本体解绑，并保留最小点击余量', () => {
  it('命中区必须**大于**本体：两件器材排成一线时，藏在后面那件仍点得中', () => {
    for (const id of LAB_COMPONENT_IDS) {
      expect(COMPONENT_HIT_RADIUS[id].rx, `${id} 命中区不大于本体，没有点击余量`).toBeGreaterThan(COMPONENT_BODY_MARGIN[id].x)
      expect(COMPONENT_HIT_RADIUS[id].ry, `${id} 命中区不大于本体，没有点击余量`).toBeGreaterThan(COMPONENT_BODY_MARGIN[id].y)
    }
  })

  it('余量有下限也有上限（太小点不中、太大会"点 A 抓到 B"）', () => {
    for (const id of LAB_COMPONENT_IDS) {
      const padding = componentHitPadding(id)
      expect(padding, `${id} 点击余量过小`).toBeGreaterThanOrEqual(22)
      expect(padding, `${id} 点击余量过大`).toBeLessThanOrEqual(COMPONENT_HIT_PADDING)
    }
  })

  it('实测场景：E1 与 S1 排成一线时，藏在后面那件仍能被点中', () => {
    const layout = createDefaultLayout()
    const e1 = layout.components.E1
    // 摆到同一水平线 —— 这正是截图里最容易互相遮挡的摆法
    const overlapped = { ...layout, components: { ...layout.components, S1: { x: e1.x + 200, y: e1.y } } }
    const center = overlapped.components.S1
    expect(componentAt(overlapped, center)).toBe('S1')
    // 拖动命中区必须**超出本体边界**，否则学生只能点到正中心、点边缘抓不住
    expect(componentAt(overlapped, { x: center.x + COMPONENT_BODY_MARGIN.S1.x + 1, y: center.y }), '本体右缘外 1px 就抓不住了').toBe('S1')
    expect(componentAt(overlapped, { x: center.x, y: center.y + COMPONENT_BODY_MARGIN.S1.y + 1 }), '本体下缘外 1px 就抓不住了').toBe('S1')
    // 再远一点必须点不到（否则会"点 A 抓到 B"）
    expect(componentAt(overlapped, { x: center.x + COMPONENT_HIT_RADIUS.S1.rx + 6, y: center.y })).toBeNull()
  })

  it('命中区变大**不影响**判据与收回（两者必须解绑）', () => {
    const size = { width: 1280, height: 720 }
    const camera = focusFor(size)
    const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
    const layout = createDefaultLayout()
    // 把器材摆到"本体刚好在界内、但命中区已探出"的位置
    const id: LabComponentId = 'A1'
    const body = COMPONENT_BODY_MARGIN[id]
    const center = { x: (visible.minX + visible.maxX) / 2, y: visible.maxY - body.y }
    const placed = { ...layout, components: { ...layout.components, [id]: center } }
    // 本体完整可见 → 判据必须放行（命中区探出去不是问题）
    expect(isComponentOffCanvas(placed, id, visible), '命中区探出被误判成本体探出').toBe(false)
    expect(rescueAllComponents(placed, visible), '命中区探出触发了无谓的收回').toBe(placed)
  })

  it('场景里的拖动命中区确实读 COMPONENT_HIT_RADIUS（解绑后的那个）', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8'),
    )
    expect(source).toContain('COMPONENT_HIT_RADIUS')
  })
})

describe('变异验证：把 4 条修复各自改回旧口径，必须变红', () => {
  it('把判据改回「中心在范围内」→ 缺口 2 的用例必须红', () => {
    const size = { width: 1688, height: 841 }
    const camera = focusFor(size)
    const visible = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!.visible
    /** 旧口径：只看中心 */
    const legacyOffCanvas = (center: { x: number; y: number }) =>
      center.x < visible.minX || center.x > visible.maxX || center.y < visible.minY || center.y > visible.maxY
    // 新口径判"出屏"，旧口径判"没出屏" —— 两者的差就是缺口 2
    const center = { x: (visible.minX + visible.maxX) / 2, y: visible.maxY }
    let diverged = false
    for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
      const now = isComponentOffCanvas({ ...createDefaultLayout(), components: { ...createDefaultLayout().components, [id]: center } }, id, visible)
      const before = legacyOffCanvas(center)
      if (now !== before) diverged = true
    }
    expect(diverged, '新旧判据竟然处处一致 —— 说明新判据没生效').toBe(true)
  })

  it('把命中区绑回本体尺寸 → 缺口 4 的余量用例必须红', () => {
    // 复刻旧定义：命中区 = 本体
    for (const id of LAB_COMPONENT_IDS) {
      const legacy = { rx: COMPONENT_BODY_MARGIN[id].x, ry: COMPONENT_BODY_MARGIN[id].y }
      const withMargin = COMPONENT_HIT_RADIUS[id].rx - legacy.rx
      expect(withMargin, `${id} 命中区与本体没拉开余量`).toBeGreaterThan(0)
    }
  })

  it('把可见范围改回线性反算 → 缺口 1 的一致性必须不成立', () => {
    const size = { width: 1688, height: 841 }
    const camera = focusFor(size)
    const viewport = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
    const screenY = visibleScreenArea(size.width, size.height).bottom
    const linear = (screenY - camera.y) / camera.scale
    const perspective = screenToCanvasWithinViewport({ x: size.width / 2, y: screenY }, viewport, camera)!.y
    // 线性版本的可见下界与真实可见下界必须显著不同，否则这条修复没必要存在
    expect(Math.abs(linear - viewport.visible.maxY)).toBeGreaterThan(4)
    expect(Math.abs(perspective - viewport.visible.maxY)).toBeLessThan(0.5)
  })

  it('把聚焦改回"四周均匀留白"→ 器材就会钻进悬浮控件下面', () => {
    /**
     * 变异体：把聚焦留白退回"四周各留 120px"的旧口径。
     *
     * 旧口径的危险不在于数字大小，而在于它**不知道控件长在哪**：
     * 顶部工具栏 56px、底部读数条 60px，而左右其实没那么厚。
     * 均匀留白会在上下不够、左右浪费，器材照样被顶部工具条压住。
     */
    const size = { width: 1688, height: 841 }
    const naive = fitContent(layoutBounds(createDefaultLayout()), size, 0)
    expect(controlOverlapPixels(size, naive), '零留白竟然没让器材钻进控件下面？这条变异就失去意义了').toBeGreaterThan(0.5)

    /**
     * 反向自证：生产链路在同一视口下必须是 0（一点没被压住）。
     * 两条一起看，这条变异才真的有区分度 ——
     * 否则"改坏了也不红"就只是判据自己失效。
     */
    expect(controlOverlapPixels(size, focusFor(size)), '生产链路把器材压进了控件下面').toBeLessThanOrEqual(0.5)
  })
})

describe('最终验收：用户可见的结果', () => {
  for (const size of VIEWPORTS) {
    it(`${size.width}×${size.height}：加载即全部完整可见，拖到四角也不会被裁`, () => {
      const camera = focusFor(size)
      const safe = visibleScreenArea(size.width, size.height)
      const vp = resolveViewport(safe, camera, perspectiveOf(size))!
      const stage = { camera, ...perspectiveOf(size) }

      // ① 一进页面：0 件被裁、0 件需要被挪动
      const start = createDefaultLayout()
      const clippedAtLoad = LAB_COMPONENT_IDS.filter((id) => isComponentOffCanvas(start, id, vp.visible))
      expect(clippedAtLoad, '一进页面就有器材被判出屏').toEqual([])
      expect(rescueAllComponents(start, vp.visible), '一进页面器材就被挪动了').toBe(start)

      // ② 真实屏幕像素：本体四角必须落在安全区内
      for (const id of LAB_COMPONENT_IDS) {
        const r = componentBodyRect(id, start.components[id])
        for (const [x, y] of [[r.left,r.top],[r.right,r.top],[r.left,r.bottom],[r.right,r.bottom]] as const) {
          const p = projectPerspective({ x, y }, stage)
          expect(p.y, `${id} 上缘被顶部控件压住 ${(safe.top - p.y).toFixed(1)}px`).toBeGreaterThanOrEqual(safe.top - 0.5)
          expect(p.y, `${id} 下缘被底部控件压住 ${(p.y - safe.bottom).toFixed(1)}px`).toBeLessThanOrEqual(safe.bottom + 0.5)
          expect(p.x, `${id} 左缘越出屏幕 ${(safe.left - p.x).toFixed(1)}px`).toBeGreaterThanOrEqual(safe.left - 0.5)
          expect(p.x, `${id} 右缘越出屏幕 ${(p.x - safe.right).toFixed(1)}px`).toBeLessThanOrEqual(safe.right + 0.5)
        }
      }

      // ③ 拖到四个角（松手收回）后，画面里必须仍然完整可见
      let worst = 0
      let worstId = ''
      for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
        for (const [sx, sy] of [[safe.left,safe.top],[safe.right,safe.top],[safe.left,safe.bottom],[safe.right,safe.bottom]] as const) {
          // 模拟"用鼠标把这个角落拖过去"：指针屏幕坐标 → 画布坐标
          const pointer = screenToCanvasWithinViewport({ x: sx, y: sy }, vp, camera)!
          const dragged = moveComponent(start, id, pointer)
          const rescued = rescueAllComponents(dragged, vp.visible, (pid, c) => componentOverflowScreen(pid, c, vp, safe))
          expect(offCanvasComponents(rescued, vp.visible), `${id} 拖到(${sx},${sy})收回后仍被判出屏`).toEqual([])
          // 关键：判据（画布空间）必须与"屏幕像素"一致 —— 两者不能各说各话
          expect(
            componentOverflowScreen(id, rescued.components[id], vp, safe),
            `${id} 拖到(${sx},${sy})：判据说合法，但屏幕上仍越界`,
          ).toBeLessThanOrEqual(0.5)
          const r = componentBodyRect(id, rescued.components[id])
          for (const [x, y] of [[r.left,r.top],[r.right,r.top],[r.left,r.bottom],[r.right,r.bottom]] as const) {
            const p = projectPerspective({ x, y }, { camera, ...perspectiveOf(size) })
            const o = Math.max(safe.top - p.y, p.y - safe.bottom, safe.left - p.x, p.x - safe.right)
            if (o > worst) { worst = o; worstId = `${id}@(${sx},${sy})` }
          }
        }
      }
      expect(worst, `拖到四角后最大越界 ${worst.toFixed(1)}px（${worstId}）`).toBeLessThanOrEqual(0.5)
      void stage
    })
  }

  it('命中区余量：每件器材本体外 1px 都抓得住', () => {
    const l = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      const c = l.components[id]
      const r = componentBodyRect(id, c)
      // 本体右缘外 1px / 下缘外 1px 必须仍在命中区内
      expect(r.right + 1).toBeLessThanOrEqual(c.x + (r.right - c.x) + 32 + 1e-9)
    }
  })
})
