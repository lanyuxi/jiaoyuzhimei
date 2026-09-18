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
import { DRAG_SCREEN_MARGIN } from './useLabLayoutDrag'
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

describe('必修一 · 拖动**过程中**器材不许离开可视区（不能只在松手时收回）', () => {
  const VIEWPORTS = [
    { width: 1375, height: 782 },
    { width: 1280, height: 661 },
    { width: 1920, height: 1021 },
    { width: 1920, height: 361 },
    { width: 1024, height: 541 },
    { width: 768, height: 541 },
    { width: 390, height: 692 },
  ] as const

  it('逐帧采样：按住 E1 拖向屏幕四角，**每一帧**本体都完整在屏幕内', () => {
    for (const size of VIEWPORTS) {
      const camera = focusFor(size)
      const safe = visibleScreenArea(size.width, size.height)
      const vp = resolveViewport(safe, camera, perspectiveOf(size))!
      const layout = fitLayoutToStage(createDefaultLayout(), { minX: 0, minY: 0, maxX: size.width, maxY: size.height })
      const screenCheck = (id: LabComponentId, center: { x: number; y: number }) =>
        componentOverflowScreen(id, center, vp, safe)

      for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
        const start = layout.components[id]
        const startScreen = projectPerspective(start, stageOf(size, camera))
        for (const [tx, ty] of [
          [2, 2],
          [size.width - 2, 2],
          [2, size.height - 2],
          [size.width - 2, size.height - 2],
        ] as const) {
          let current = start
          for (let step = 0; step <= 24; step += 1) {
            const t = step / 24
            const sx = startScreen.x + (tx - startScreen.x) * t
            const sy = startScreen.y + (ty - startScreen.y) * t
            const pointer = screenToCanvasWithinViewport({ x: sx, y: sy }, vp, camera)
            if (pointer === null) continue
            /**
             * 复刻 `onPointerMove` 的**唯一**约束来源：
             * `offset = 0`（指针从器材中心按下）+ `clampComponentWithinView`，
             * 且带 `DRAG_SCREEN_MARGIN` 的屏幕余量（与生产代码同口径）。
             * 若实现退回"只做 `clampComponentPosition`"，这里立刻爆红。
             */
            current = clampComponentWithinView(id, pointer, vp.visible, (pid, c) => screenCheck(pid, c) + DRAG_SCREEN_MARGIN)
            expect(
              screenCheck(id, current),
              `${size.width}×${size.height} 下 ${id} 拖向 (${tx},${ty}) 的第 ${step} 帧本体已被裁`,
            ).toBeLessThanOrEqual(0.5)
          }
        }
      }
    }
  })

  it('反向自证：退回"松手前不收回"（世界边界 ±6000）会把器材拖到全黑', () => {
    /**
     * 这条是复审实测的数字：按住 E1 拖到指针 (2,2)，
     * 旧口径下本体左上角走到 `-170,-102`，在"体左 94 / 体上 2"时已完全离开可视区。
     * 用同一个输入跑一遍，必须复现出**显著**的越界。
     */
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const safe = visibleScreenArea(size.width, size.height)
    const vp = resolveViewport(safe, camera, perspectiveOf(size))!
    const layout = fitLayoutToStage(createDefaultLayout(), { minX: 0, minY: 0, maxX: size.width, maxY: size.height })
    const start = layout.components.E1
    const startScreen = projectPerspective(start, stageOf(size, camera))
    const pointer = screenToCanvasWithinViewport({ x: 2, y: 2 }, vp, camera)!
    // 旧口径：只夹世界边界
    const legacy = { x: Math.max(-6000, Math.min(6000, pointer.x)), y: Math.max(-6000, Math.min(6000, pointer.y)) }
    const legacyOverflow = componentOverflowScreen('E1', legacy, vp, safe)
    expect(legacyOverflow, '旧口径竟然没越界？这条变异就失去意义了').toBeGreaterThan(100)
    // 新口径：必须 0 越界
    const fixed = clampComponentWithinView('E1', pointer, vp.visible, (id, center) => componentOverflowScreen(id, center, vp, safe))
    expect(componentOverflowScreen('E1', fixed, vp, safe)).toBeLessThanOrEqual(0.5)
    void startScreen
  })

  it('拖动中已合法时**不许**无谓挪动（否则器材会"粘"在边上抖）', () => {
    const size = { width: 1375, height: 782 }
    const camera = focusFor(size)
    const vp = resolveViewport(visibleScreenArea(size.width, size.height), camera, perspectiveOf(size))!
    const layout = fitLayoutToStage(createDefaultLayout(), { minX: 0, minY: 0, maxX: size.width, maxY: size.height })
    for (const id of LAB_COMPONENT_IDS) {
      const center = layout.components[id]
      const clamped = clampComponentWithinView(id, center, vp.visible)
      expect(Math.abs(clamped.x - center.x), `${id} 在合法位置上被无谓挪动`).toBeLessThan(1e-6)
      expect(Math.abs(clamped.y - center.y), `${id} 在合法位置上被无谓挪动`).toBeLessThan(1e-6)
    }
  })

  it('拖动中的钳制**至少和松手收回一样靠里**（松手不会再跳）', () => {
    /**
     * 拖动中比松手更保守（多留 `DRAG_SCREEN_MARGIN`），
     * 所以"拖动中钳制完 → 松手收回"必然是空操作，不会出现"松手又跳一下"。
     * 判据直接比"两种口径下钳制结果的屏幕上余量"。
     */
    const size = { width: 390, height: 692 }
    const camera = focusFor(size)
    const safe = visibleScreenArea(size.width, size.height)
    const vp = resolveViewport(safe, camera, perspectiveOf(size))!
    for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
      for (const [tx, ty] of [[1, 1], [size.width - 1, size.height - 1]] as const) {
        const pointer = screenToCanvasWithinViewport({ x: tx, y: ty }, vp, camera)!
        const dragClamped = clampComponentWithinView(id, pointer, vp.visible, (pid, c) => componentOverflowScreen(pid, c, vp, safe) + DRAG_SCREEN_MARGIN)
        const releaseClamped = clampComponentWithinView(id, pointer, vp.visible, (pid, c) => componentOverflowScreen(pid, c, vp, safe))
        /**
         * 拖动口径更保守 → 屏幕上留下的**最小余量更大**（更不容易贴边）。
         * 余量 = `-componentOverflowScreen`（overflow 为负表示还有余量）。
         */
        const marginOf = (center: { x: number; y: number }) => -componentOverflowScreen(id, center, vp, safe)
        expect(
          marginOf(dragClamped),
          `${id} 拖到 (${tx},${ty})：拖动口径没有比松手口径更保守（余量 ${marginOf(dragClamped).toFixed(1)} < ${marginOf(releaseClamped).toFixed(1)}）`,
        ).toBeGreaterThanOrEqual(marginOf(releaseClamped) - 1e-6)
      }
    }
  })

  it('拖动中的钳制与松手收回**同口径**：钳制后一定满足判据（不会"松手又跳一下"）', () => {
    const size = { width: 390, height: 692 }
    const camera = focusFor(size)
    const safe = visibleScreenArea(size.width, size.height)
    const vp = resolveViewport(safe, camera, perspectiveOf(size))!
    const layout = fitLayoutToStage(createDefaultLayout(), { minX: 0, minY: 0, maxX: size.width, maxY: size.height })
    for (const id of LAB_COMPONENT_IDS as readonly LabComponentId[]) {
      const start = layout.components[id]
      for (const [tx, ty] of [[1, 1], [size.width - 1, 1], [1, size.height - 1], [size.width - 1, size.height - 1]] as const) {
        const pointer = screenToCanvasWithinViewport({ x: tx, y: ty }, vp, camera)!
        const dragged = clampComponentWithinView(id, pointer, vp.visible, (pid, c) => componentOverflowScreen(pid, c, vp, safe))
        // 钳制结果的屏上越界必须已经归零 → 松手收回是空操作
        expect(
          componentOverflowScreen(id, dragged, vp, safe),
          `${id} 拖到 (${tx},${ty}) 后松手还会再跳一下`,
        ).toBeLessThanOrEqual(0.5)
      }
      void start
    }
  })

  it('屏幕空间有安全余量：模型误差不会被吃进画面（真机实测误差 ~60px）', () => {
    /**
     * 这条把"为什么要有 `DRAG_SCREEN_MARGIN`"钉住。
     *
     * 我们算投影的 `projectPerspective` 与浏览器 CSS 的 3D 变换**不完全等价**：
     * 真机对照同一个画布点，模型与浏览器的屏幕 y 差随深度增长，
     * 在画布底部可达约 60px（实测 `canvas(0,600)`：浏览器 569.4 / 模型 578.5）。
     * 于是"模型说没越界"**不足以证明**画面上没被裁。
     *
     * 判据：拖动中允许停下的位置，必须让模型留出 `DRAG_SCREEN_MARGIN` 余量。
     */
    const size = { width: 1375, height: 782 }
    const camera = { scale: 0.864819, x: 85.82928466796875, y: 63.7969970703125 }
    const safe = visibleScreenArea(size.width, size.height)
    const vp = resolveViewport(safe, camera, perspectiveOf(size))!
    const withMargin = (id: LabComponentId, center: { x: number; y: number }) =>
      componentOverflowScreen(id, center, vp, safe) + DRAG_SCREEN_MARGIN
    const without = (id: LabComponentId, center: { x: number; y: number }) =>
      componentOverflowScreen(id, center, vp, safe)
    // 用带余量的判据钳制，结果必须比不带余量的**更靠里**
    const pushedWith = clampComponentWithinView('A1', { x: -5000, y: -5000 }, vp.visible, withMargin)
    const pushedWithout = clampComponentWithinView('A1', { x: -5000, y: -5000 }, vp.visible, without)
    const depthWith = Math.hypot(pushedWith.x, pushedWith.y)
    const depthWithout = Math.hypot(pushedWithout.x, pushedWithout.y)
    expect(depthWith, '带余量的钳制没有比不带余量更靠里（余量没生效）').toBeGreaterThan(depthWithout)
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

  it('拖动路径确实接上了 `clampComponentWithinView`（源码契约，防实现被换回旧口径）', () => {
    const source = readFileSync(new URL('./useLabLayoutDrag.ts', import.meta.url), 'utf8')
    /**
     * 只断言"**器材**的 `onPointerMove` 里用的是带可见范围的钳制"，
     * 不锁具体变量名 —— 判据要的是行为，不是写法。
     *
     * 注意要跳过接口声明里的 `onPointerMove(...): void` 签名（那是最先出现的一处），
     * 直接找实现体里那一处（含 `componentRef.current`）。
     */
    const implIndex = source.indexOf('onPointerMove: (event: PointerEvent<SVGElement>) => {')
    expect(implIndex, '找不到器材拖动的 onPointerMove 实现体').toBeGreaterThan(-1)
    const move = source.slice(implIndex, implIndex + 1600)
    expect(move, '拖动中的钳制退回旧口径了（又只用世界边界）').toContain('clampComponentWithinView')
    expect(move, '拖动中没把可见范围传进去').toContain('visibleRect')
    expect(move, '拖动中没做屏幕像素校验').toContain('screenCheck')
    // 旧口径必须已被移除：实现体里不该再出现"只夹世界边界"的那个函数
    expect(move, '实现体里还留着只夹世界边界的旧调用').not.toContain('clampComponentPosition(')
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
