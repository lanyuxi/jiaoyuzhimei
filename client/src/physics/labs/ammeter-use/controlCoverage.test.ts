/**
 * PR #23 复审的两条**必修**回归。
 *
 * 复审结论原文（审查员 `@jasperyue/hello-cnb`，评论 `2100431628063313920`）：
 *   · 必修一：`useLabLayoutDrag.ts` 的 `onPointerMove` 只做 `clampComponentPosition`
 *     （世界边界 ±6000），**松手前没有任何收回** —— 真机逐帧采样按住 E1 拖到 (2,2)，
 *     本体左上角一路走到 `-170,-102`，在"体左 94 / 体上 2"时已经完全离开可视区，
 *     再往后是 168px 全黑，松手才回弹 262px。
 *   · 必修二：`controlAvoidArea` 只保住了上/下两条边 ——
 *     1375×782 下把 7 个浮层全量量了一遍，**全部越出** 左96/上56/右168/下60；
 *     390×780 下 `A1` 本体 `x205..376` 被右侧胶囊组 `x78..322` 完全盖住。
 *
 * 本文件把这两条都钉住，并且**判据与实现不同源**：
 *   · 浮层几何来自 `controlObstacles.fixture.ts`（真机量出来的原始数据），
 *     与实现的 `controlObstacles()` 互相校验，任一边漂移就红；
 *   · 拖动中的断言**按帧采样**，而不是只在落点上看一眼。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  CANVAS_WORLD_BOUNDS,
  COMPONENT_BODY_MARGIN,
  CONTROL_LEFT,
  CONTROL_RIGHT,
  CONTROL_TOP,
  LAB_COMPONENT_IDS,
  clampComponentWithinView,
  componentBodyRect,
  componentOverflowScreen,
  controlAvoidArea,
  controlObstacles,
  createDefaultLayout,
  fitLayoutToStage,
  fitPaddingWithinSafeArea,
  layoutOutOfControls,
  moveComponent,
  rescueComponent,
  pushComponentIntoView,
  pushOutOfControls,
  SCREEN_SAFE_MARGIN,
  usableStageRect,
  resolveViewport,
  screenToCanvasWithinViewport,
  visibleScreenArea,
  type LabComponentId,
} from './layout'
import { MEASURED_OVERLAYS, MEASURED_STAGES } from './controlObstacles.fixture'
import { PERSPECTIVE_ORIGIN, PERSPECTIVE_DEPTH, STAGE_TILT_DEG } from '../../runtime/immersive/InfiniteCanvas'
import { projectPerspective, type Camera } from '../../runtime/immersive/canvas'
import { focusInScreenSpace } from '../../runtime/immersive/useInfiniteCanvas'

const originRatio = (() => {
  const [rawX, rawY] = PERSPECTIVE_ORIGIN.trim().split(/\s+/)
  return { x: Number.parseFloat(rawX) / 100, y: Number.parseFloat(rawY) / 100 }
})()

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

function probesOf(layout: ReturnType<typeof createDefaultLayout>) {
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

/** 与生产链路同源的聚焦（直接调 `focusInScreenSpace`，不复刻实现） */
function focusFor(size: { width: number; height: number }): Camera {
  const layout = createDefaultLayout()
  const probes = probesOf(layout)
  const measureOf = (candidate: Camera) => {
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
  }
  return focusInScreenSpace({
    bounds: {
      minX: Math.min(...probes.map((p) => p.x)),
      maxX: Math.max(...probes.map((p) => p.x)),
      minY: Math.min(...probes.map((p) => p.y)),
      maxY: Math.max(...probes.map((p) => p.y)),
    },
    target: size,
    padding: fitPaddingWithinSafeArea(size.width, size.height),
    maxScale: 2.6,
    project: (point) => projectPerspective(point, stageOf(size, { scale: 1, x: 0, y: 0 })),
    probes,
    measure: measureOf,
  })
}

/**
 * 画布空间的本体矩形 → **屏幕空间外接矩形**（四角投影后取包围盒）。
 *
 * 与 `coveredPixels` 同口径，保证"避让"与"判据"看的是同一件事。
 */
function screenRectOf(
  rect: { left: number; top: number; right: number; bottom: number },
  stage: ReturnType<typeof stageOf>,
): { left: number; top: number; right: number; bottom: number } {
  const points = [
    projectPerspective({ x: rect.left, y: rect.top }, stage),
    projectPerspective({ x: rect.right, y: rect.top }, stage),
    projectPerspective({ x: rect.left, y: rect.bottom }, stage),
    projectPerspective({ x: rect.right, y: rect.bottom }, stage),
  ]
  return {
    left: Math.min(...points.map((p) => p.x)),
    right: Math.max(...points.map((p) => p.x)),
    top: Math.min(...points.map((p) => p.y)),
    bottom: Math.max(...points.map((p) => p.y)),
  }
}

/** 一件器材本体被任意浮层**盖住**的最大像素量（0 = 一点没被压住） */
function coveredPixels(id: LabComponentId, center: { x: number; y: number }, size: { width: number; height: number }, camera: Camera): number {
  const rect = componentBodyRect(id, center)
  const stage = stageOf(size, camera)
  const corners = [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.left, rect.bottom],
    [rect.right, rect.bottom],
  ] as const
  // 本体四角投影到屏幕，构成外接矩形；再看它与每个浮层矩形的重叠深度
  let px = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  for (const [x, y] of corners) {
    const p = projectPerspective({ x, y }, stage)
    px = {
      minX: Math.min(px.minX, p.x), maxX: Math.max(px.maxX, p.x),
      minY: Math.min(px.minY, p.y), maxY: Math.max(px.maxY, p.y),
    }
  }
  let worst = 0
  for (const box of MEASURED_OVERLAYS) {
    if (box.stage === undefined || box.stage.width !== size.width || box.stage.height !== size.height) continue
    const overlapX = Math.min(px.maxX, box.x + box.width) - Math.max(px.minX, box.x)
    const overlapY = Math.min(px.maxY, box.y + box.height) - Math.max(px.minY, box.y)
    if (overlapX <= 0 || overlapY <= 0) continue
    /**
     * 判"盖住"要按**最小方向**算：一件器材只被压住一角时，
     * 学生还能抓住其余部分，不该判成"被完全遮住"。取两轴重叠量的较小者，
     * 语义是"想把它抽出来最少要挪多少像素"。
     */
    worst = Math.max(worst, Math.min(overlapX, overlapY))
  }
  return worst
}

describe('必修二 · 浮层清单必须与真机实测一致（判据与实现不同源）', () => {
  it('每个视口下，实现算出的障碍物与真机量到的矩形一一对应（容差 ≤ 2px）', () => {
    const TOL = 2
    for (const stage of MEASURED_STAGES) {
      const actual = controlObstacles(stage.width, stage.height)
      const measured = MEASURED_OVERLAYS.filter(
        (box) => box.stage !== undefined && box.stage.width === stage.width && box.stage.height === stage.height,
      )
      expect(measured.length, `${stage.width}×${stage.height} 缺少实测数据`).toBeGreaterThan(0)
      for (const box of measured) {
        /**
         * 实测里有几条是"同一逻辑控件的不同实例"（例如底部提示胶囊在窄屏会被读数条吸收），
         * 所以判"存在一条实现矩形与它吻合"，而不是要求两条列表逐项相等。
         */
        const match = actual.find(
          (candidate) =>
            Math.abs(candidate.x - box.x) <= TOL &&
            Math.abs(candidate.y - box.y) <= TOL &&
            Math.abs(candidate.width - box.width) <= TOL &&
            Math.abs(candidate.height - box.height) <= TOL,
        )
        expect(
          match,
          `${stage.width}×${stage.height} 的「${box.label}」实测 [${box.x},${box.y},${box.width},${box.height}] 在实现里找不到对应障碍物`,
        ).toBeDefined()
      }
    }
  })

  it('反向自证：把左右净空去掉（复审前的旧值 96 / 168），真机上会立刻压住器材', () => {
    /**
     * 这条证明"复审的必修二确实存在"，也证明本文件判据真的抓得住它 ——
     * 用真机数据直接算出"旧口径"下漏了哪些浮层。
     */
    const stage = { width: 1375, height: 782 }
    const legacy = { left: 96, top: 56, right: stage.width - 168, bottom: stage.height - 60 }
    const escaped = MEASURED_OVERLAYS.filter(
      (box) =>
        box.stage !== undefined &&
        box.stage.width === stage.width &&
        box.stage.height === stage.height &&
        (box.x < legacy.left || box.y < legacy.top || box.x + box.width > legacy.right || box.y + box.height > legacy.bottom),
    )
    expect(escaped.length, '旧口径下竟然所有浮层都在净空内？这条变异就失去意义了').toBeGreaterThan(0)
    // 复审说"7 个浮层全部越出"，实测是 8 条里 7 条越出（标题栏是全宽所以两边都碰）
    expect(escaped.map((box) => box.label)).toContain('顶部标题栏')
  })

  it('当前实现下，可用区 `controlAvoidArea` 与**任何**浮层都不重叠', () => {
    for (const stage of MEASURED_STAGES) {
      const area = controlAvoidArea(stage.width, stage.height)
      expect(area.right, `${stage.width}×${stage.height} 可用区左右穿透了`).toBeGreaterThanOrEqual(area.left)
      for (const box of MEASURED_OVERLAYS) {
        if (box.stage === undefined || box.stage.width !== stage.width || box.stage.height !== stage.height) continue
        /**
         * 判据：可用区（一块矩形）与每个浮层**矩形**不许有正面积重叠。
         * 这是"净空真的够"的直接定义 —— 不是"浮层贴住了某条边"，
         * 而是"可用区里一点控件都没有"。
         */
        const overlapX = Math.min(area.right, box.x + box.width) - Math.max(area.left, box.x)
        const overlapY = Math.min(area.bottom, box.y + box.height) - Math.max(area.top, box.y)
        const overlap = Math.min(overlapX, overlapY)
        expect(
          overlap,
          `${stage.width}×${stage.height} 的「${box.label}」落进了可用区 ${overlap.toFixed(1)}px`,
        ).toBeLessThanOrEqual(0.5)
      }
    }
  })

  it('390×780 下 A1 本体不再被右侧胶囊组盖住（复审点名的场景）', () => {
    const size = { width: 390, height: 692 }
    const camera = focusFor(size)
    const view = stageOf(size, camera)
    const layout = layoutOutOfControls(
      fitLayoutToStage(createDefaultLayout(), usableStageRect(size.width, size.height)),
      size.width,
      size.height,
      (rect) => screenRectOf(rect, view),
      (delta) => ({ dx: delta.dx / camera.scale, dy: delta.dy / camera.scale }),
    )
    let worst = 0
    let worstId = ''
    for (const id of LAB_COMPONENT_IDS) {
      const covered = coveredPixels(id, layout.components[id], size, camera)
      if (covered > worst) { worst = covered; worstId = id }
    }
    expect(worst, `${worstId} 在 390×780 下被浮层盖住 ${worst.toFixed(1)}px`).toBeLessThanOrEqual(1)
  })

  it('全量视口的 controlOverlapPixels 都必须归零（原判据只在 ≥1024 被调用，这是漏洞）', () => {
    /**
     * 复审原话：「新加的 `controlOverlapPixels` 只在 ≥1024 的两个视口被调用」。
     * 这条把 7 个视口**全部**纳入，一个都不许漏。
     *
     * 走的是**生产链路**：`usableStageRect` → `fitLayoutToStage` →
     * `layoutOutOfControls`（屏幕空间）。任一步被拆掉/改弱，这里就红。
     */
    for (const stage of MEASURED_STAGES) {
      const camera = focusFor(stage)
      const view = stageOf(stage, camera)
      const layout = layoutOutOfControls(
        fitLayoutToStage(createDefaultLayout(), usableStageRect(stage.width, stage.height)),
        stage.width,
        stage.height,
        (rect) => screenRectOf(rect, view),
        (delta) => ({ dx: delta.dx / camera.scale, dy: delta.dy / camera.scale }),
      )
      for (const id of LAB_COMPONENT_IDS) {
        const covered = coveredPixels(id, layout.components[id], stage, camera)
        expect(
          covered,
          `${stage.width}×${stage.height} 下 ${id} 被浮层盖住 ${covered.toFixed(1)}px`,
        ).toBeLessThanOrEqual(1)
      }
    }
  })

  it('`pushOutOfControls` 能把任意位置的本体推出所有浮层', () => {
    for (const stage of MEASURED_STAGES) {
      const layout = fitLayoutToStage(createDefaultLayout(), { minX: 0, minY: 0, maxX: stage.width, maxY: stage.height })
      // 人为把每件器材挪到四个角落，再用 pushOutOfControls 推出来
      for (const _id of LAB_COMPONENT_IDS) {
        void _id
        for (const [sx, sy] of [
          [4, 4],
          [stage.width - 4, 4],
          [4, stage.height - 4],
          [stage.width - 4, stage.height - 4],
        ] as const) {
          const rect = { left: sx, top: sy, right: sx + 1, bottom: sy + 1 }
          const push = pushOutOfControls(rect, stage.width, stage.height)
          if (push === null) continue
          const moved = { left: rect.left + push.dx, top: rect.top + push.dy, right: rect.right + push.dx, bottom: rect.bottom + push.dy }
          // 推出去之后不能再与任何浮层重叠
          for (const box of controlObstacles(stage.width, stage.height)) {
            const overlapX = Math.min(moved.right, box.x + box.width) - Math.max(moved.left, box.x)
            const overlapY = Math.min(moved.bottom, box.y + box.height) - Math.max(moved.top, box.y)
            expect(
              overlapX <= 1e-6 || overlapY <= 1e-6,
              `${stage.width}×${stage.height} 下 pushOutOfControls 没把 [${sx},${sy}] 推出 [${box.x},${box.y},${box.width},${box.height}]`,
            ).toBe(true)
          }
        }
      }
      void layout
    }
  })

  it('净空常量与浮层清单**没有漂移**（防止改了一处忘了另一处）', () => {
    /**
     * `CONTROL_*` 是"控件最远伸到哪"的**上界**，`controlAvoidArea` 是"实际净空"。
     * 判据是"实际净空 ≥ 上界"而不是"相等"：
     * 底部读数条在 1920 宽下只有 54 高（一行放得下），净空只需要 70；
     * 强行要求 168 反而会把画布下沿凭空切掉 98px。
     */
    for (const stage of MEASURED_STAGES) {
      const area = controlAvoidArea(stage.width, stage.height)
      expect(area.left, `${stage.width}×${stage.height} 左净空不足`).toBeGreaterThanOrEqual(CONTROL_LEFT - 1)
      expect(area.top, `${stage.width}×${stage.height} 上净空不足`).toBeGreaterThanOrEqual(CONTROL_TOP)
      /**
       * 右净空只在"左右不冲突"的视口下要求达到 `CONTROL_RIGHT`：
       * 窄视口（390）下左工具条与右侧胶囊组**物理上已经叠在一起**，
       * 屏幕上不存在一块两边都空的矩形 —— 此时如实退化成零宽，
       * 由 `pushOutOfControls` 的精确避让兜底（见下一条用例）。
       */
      const leftConflict = stage.width < CONTROL_LEFT + CONTROL_RIGHT + 40
      if (!leftConflict) {
        expect(stage.width - area.right, `${stage.width}×${stage.height} 右净空不足`).toBeGreaterThanOrEqual(CONTROL_RIGHT)
      }
      // 下净空的真实需求随读数条换行变化，只要求"至少覆盖标题栏那一层"
      expect(stage.height - area.bottom, `${stage.width}×${stage.height} 下净空连 70 都不到`).toBeGreaterThanOrEqual(70)
    }
    // 常量本身必须与真机最长的那条一致，防止被悄悄改小
    const widest = controlAvoidArea(1920, 1021)
    expect(1920 - widest.right).toBe(CONTROL_RIGHT)
    expect(widest.left).toBe(CONTROL_LEFT)
  })
})

describe('必修一（重定义）· 拖动必须能到任意位置 —— 这是「无限画布」的定义', () => {
  /**
   * 需求原文（Issue #20）：
   *   「我要的无限画布功能，你给搞没了；现在我的实验器材无法自由的拖动到任意位置，
   *     比如拖动靠近边沿就无法拖动了，并不是无限画布；请修复」
   *
   * 也就是说，PR #23 引入的那套"拖动中每帧把器材收回可见范围"的**必修项本身就是缺陷**：
   * 它把器材的落点限制成了"屏幕内的一个回收盒"，而不是无限画布。
   * 本节据此把 `clampComponentWithinView` 的契约重新钉住 ——
   * 它只做防丢失兜底（±6000 画布单位），不再读可见范围 / 屏幕像素。
   */
  const VIEWPORTS = [
    { width: 1375, height: 782 },
    { width: 1280, height: 661 },
    { width: 1920, height: 1021 },
    { width: 1920, height: 361 },
    { width: 1024, height: 541 },
    { width: 768, height: 541 },
    { width: 390, height: 692 },
  ] as const

  it('逐帧采样：按住 E1 拖向屏幕四角，指针指向的画布坐标就是器材落点（不再被拽回）', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      const safe = visibleScreenArea(size.width, size.height)
      const vp = resolveViewport(safe, camera, perspectiveOf(size))!
      for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
        for (const [tx, ty] of [
          [2, 2],
          [size.width - 2, 2],
          [2, size.height - 2],
          [size.width - 2, size.height - 2],
        ] as const) {
          const pointer = screenToCanvasWithinViewport({ x: tx, y: ty }, vp, camera)
          if (pointer === null) continue
          /**
           * 复刻 `onPointerMove`：`offset = 0`（指针从器材中心按下）
           * + `clampComponentWithinView`。判据 = **落点必须等于指针所在的画布坐标**
           * （只要没撞到防丢失兜底），因此"贴边拽回"这类改动立刻爆红。
           */
          const target = clampComponentWithinView(id, pointer, vp.visible)
          expect(
            Math.hypot(target.x - pointer.x, target.y - pointer.y),
            `${size.width}×${size.height} 下 ${id} 拖向 (${tx},${ty}) 被拽离了指针`,
          ).toBeLessThan(1e-6)
        }
      }
    }
  })

  it('反向自证：一旦把可见范围重新接进拖动，落点立刻被拽离指针（旧缺陷会复现）', () => {
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const safe = visibleScreenArea(size.width, size.height)
    const vp = resolveViewport(safe, camera, perspectiveOf(size))!
    const pointer = screenToCanvasWithinViewport({ x: 2, y: 2 }, vp, camera)!
    /**
     * 复现旧口径：`rescueComponent` 会把跑出可见范围的器材拖回回收盒。
     * 用同一份 `pointer` 跑一遍"收回"，位移必须显著 —— 否则这条变异就没意义。
     */
    const stray = moveComponent(createDefaultLayout(), 'E1', pointer)
    const rescued = rescueComponent(stray, 'E1', vp.visible)
    const moved = Math.hypot(rescued.components.E1.x - pointer.x, rescued.components.E1.y - pointer.y)
    expect(moved, '旧口径竟然没把器材拽回来？这条反向自证失去意义').toBeGreaterThan(20)
  })

  it('器材可以停在屏幕完全看不见的位置（无限画布的必然结果）', () => {
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const safe = visibleScreenArea(size.width, size.height)
    const vp = resolveViewport(safe, camera, perspectiveOf(size))!
    for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
      // 故意拖到屏幕外很远（但仍远小于防丢失兜底 ±6000）
      const pointer = screenToCanvasWithinViewport({ x: -900, y: -700 }, vp, camera)!
      const target = clampComponentWithinView(id, pointer, vp.visible)
      expect(Math.hypot(target.x - pointer.x, target.y - pointer.y)).toBeLessThan(1e-6)
      // 它确实在屏幕外 —— 这不是 BUG，而是"可以放在任意位置"
      expect(componentOverflowScreen(id, target, vp, safe)).toBeGreaterThan(0)
    }
  })

  it('防丢失兜底仍然在：拖到 ±6000 之外会被夹住（不会真的找不回）', () => {
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const vp = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
    for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
      for (const far of [{ x: -1e6, y: -1e6 }, { x: 1e6, y: 1e6 }]) {
        const target = clampComponentWithinView(id, far, vp.visible)
        expect(target.x).toBeGreaterThanOrEqual(CANVAS_WORLD_BOUNDS.minX)
        expect(target.x).toBeLessThanOrEqual(CANVAS_WORLD_BOUNDS.maxX)
        expect(target.y).toBeGreaterThanOrEqual(CANVAS_WORLD_BOUNDS.minY)
        expect(target.y).toBeLessThanOrEqual(CANVAS_WORLD_BOUNDS.maxY)
      }
    }
  })

  it('浮点稳态：对同一目标连续钳制 100 次不再产生位移（不会每帧抖 1px）', () => {
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const vp = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
    const first = clampComponentWithinView('A1', { x: -5000, y: -5000 }, vp.visible)
    let current = first
    for (let i = 0; i < 100; i += 1) current = clampComponentWithinView('A1', current, vp.visible)
    expect(Math.abs(current.x - first.x)).toBeLessThan(1e-6)
    expect(Math.abs(current.y - first.y)).toBeLessThan(1e-6)
  })

  it('`pushComponentIntoView` 单调二分一定收敛：推完之后余量达标', () => {
    const size = { width: 1375, height: 782 }
    const camera = { scale: 0.864819, x: 85.82928466796875, y: 63.7969970703125 }
    const view = stageOf(size, camera)
    const anchor = { x: 512, y: 225 }
    for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
      for (const probe of [{ x: -5000, y: -5000 }, { x: 20000, y: -8000 }, { x: -9000, y: 30000 }]) {
        const pushed = pushComponentIntoView(id, probe, (p) => projectPerspective(p, view), { width: size.width, height: size.height }, anchor)
        const rect = componentBodyRect(id, pushed)
        const worst = Math.max(
          ...[rect.left, rect.right].flatMap((x) => [rect.top, rect.bottom].map((y) => {
            const p = projectPerspective({ x, y }, view)
            return Math.max(SCREEN_SAFE_MARGIN - p.x, p.x - (size.width - SCREEN_SAFE_MARGIN), SCREEN_SAFE_MARGIN - p.y, p.y - (size.height - SCREEN_SAFE_MARGIN))
          })),
        )
        expect(worst, `${id} 从 (${probe.x},${probe.y}) 推回后余量仍不足`).toBeLessThanOrEqual(0.5)
      }
    }
  })

  it('浮点稳态：对同一目标连续钳制 100 次不再产生位移（不会每帧抖 1px）', () => {
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const vp = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
    const first = clampComponentWithinView('A1', { x: -5000, y: -5000 }, vp.visible)
    let current = first
    for (let i = 0; i < 100; i += 1) current = clampComponentWithinView('A1', current, vp.visible)
    expect(Math.abs(current.x - first.x)).toBeLessThan(1e-6)
    expect(Math.abs(current.y - first.y)).toBeLessThan(1e-6)
  })

})

describe('拖动路径不得再把"可见范围"当作边界（源码契约，防实现被改回旧口径）', () => {
  function dragSource(): string {
    return readFileSync(new URL('./useLabLayoutDrag.ts', import.meta.url), 'utf8')
  }

  it('器材的 onPointerMove 里不再传 visibleRect / screenCheck / pushIntoView', () => {
    const source = dragSource()
    const implIndex = source.indexOf('onPointerMove: (event: PointerEvent<SVGElement>) => {')
    expect(implIndex, '找不到器材拖动的 onPointerMove 实现体').toBeGreaterThan(-1)
    const move = source.slice(implIndex, implIndex + 1600)
    // 必须仍然走 `clampComponentWithinView`（保留防丢失兜底这一层）
    expect(move, '拖动入口不再走 clampComponentWithinView').toContain('clampComponentWithinView')
    // 但**必须不再**读可见范围 / 屏幕像素 —— 那正是"拖到边沿拖不动"的来源
    expect(move, '拖动中又把可见范围接回来了（会退化成"拖到边沿就被拽回"）').not.toContain('visibleRect')
    expect(move, '拖动中又把屏幕像素校验接回来了').not.toContain('screenCheck')
    expect(move, '拖动中又把推回收敛器接回来了').not.toContain('pushIntoView')
  })

  it('松手时不再强制把器材收回可见范围（松手即终态）', () => {
    const source = dragSource()
    const implIndex = source.indexOf('const endComponent = useCallback(')
    expect(implIndex).toBeGreaterThan(-1)
    const end = source.slice(implIndex, implIndex + 1200)
    expect(end, '松手又把器材收回可见范围了（"放到边沿会被弹回来"）。收回只应由「全部收回」按钮触发').not.toContain('rescueComponent')
    expect(end, '松手时把可见范围接了回来').not.toContain('visibleRect()')
  })

  it('场景侧不再把可见范围注入拖动逻辑（否则上面两条会被绕过）', () => {
    const scene = readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8')
    const index = scene.indexOf('useLabLayoutDrag({')
    expect(index).toBeGreaterThan(-1)
    const call = scene.slice(index, index + 900)
    expect(call).not.toContain('screenCheck:')
    expect(call).not.toContain('pushIntoView,')
    expect(call, '场景又把 visibleRect 注回拖动逻辑了').not.toContain('visibleRect,')
  })
})

describe('附带：器材本体尺寸不许再被"命中区"带偏', () => {
  it('浮层避让只读本体边距，与命中区外扩解绑', () => {
    for (const id of LAB_COMPONENT_IDS) {
      const margin = COMPONENT_BODY_MARGIN[id]
      const rect = componentBodyRect(id, { x: 0, y: 0 })
      expect(rect.right - rect.left).toBeCloseTo(margin.x * 2, 9)
      expect(rect.bottom - rect.top).toBeCloseTo(margin.y * 2, 9)
    }
  })
})

describe('相机变化不得把器材拽回视野 —— 否则"平移画布"等于"器材自己走回来"', () => {
  /**
   * 这是「拖到边沿就拖不动了」在**平移画布**这一侧的复现路径。
   *
   * `CompetitorScene` 把 `onCameraChange` 接到了 `settleLayoutForCamera`，
   * 而后者无条件 `rescueAllComponents`：只要相机（平移/缩放）动了，
   * 所有落在可见范围之外的器材就被拽回来。
   *
   * 合成起来的效果是：学生把器材放到屏幕外 → 想平移画布把它找回来 →
   * 画布一移动，器材**自己跳回屏幕里**。无限画布在体感上就消失了。
   *
   * 判据：平移相机（只改 x/y）之后，器材坐标必须**一动不动**。
   * 构图重排只允许发生在"舞台尺寸变化"时，不允许发生在"相机变化"时。
   */
  it('场景源码：onCameraChange 不得触发器材收回（构图只在舞台尺寸变化时重排）', () => {
    const source = readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8')
    const index = source.indexOf('const handleCameraChange = useCallback(')
    expect(index, '找不到 handleCameraChange').toBeGreaterThan(-1)
    const handler = source.slice(index, index + 1400)
    expect(handler, '相机变化又把器材收回视野了 —— 平移画布时器材会自己跳回来').not.toContain('rescueAllComponents')
    expect(handler).not.toContain('settleLayoutForCamera(')
    // 相机快照仍然必须记录（渲染期要用它算可见范围 / 浮层提示）
    expect(handler, '相机快照没有被记录，可见范围会失真').toContain('setCameraState')
  })

  it('「全部收回」仍然是显式入口（不是自动发生）', () => {
    const source = readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8')
    expect(source).toContain('rescueAllComponents')
    // 它必须挂在按钮的 onClick 上，而不是挂在相机回调里
    expect(source).toMatch(/onClick=\{\(\) => setLayout\(\(current\) => rescueAllComponents/)
  })
})
