/**
 * 「整个屏幕的无限画布」回归测试。
 *
 * 需求原话：
 *   · 要的是**整个屏幕**的无限画布，而不仅仅是中间那一块固定的；
 *   · 器材**拖动一下就遮挡了**（截图中器材被拖到边缘后整体滑出屏幕）。
 *
 * 这两句对应的是同一个几何事实，因此这里把它固化成可判定的断言：
 *
 *   1. **画布不是一块固定矩形** —— 相机变换之后，屏幕上的每一个像素位置
 *      都对应一个可达的布局坐标；能被拖到的世界范围必须远大于可见范围。
 *      历史上 `CANVAS_WORLD_BOUNDS` 恰好相反：可拖世界（3840 宽）
 *      只有可见世界（约 1000 宽）的不到 4 倍，而且钳制边界落在**屏幕里面**，
 *      于是"往边上一拖，器材就出了屏幕"。
 *
 *   2. **拖动后器材必须仍完整可见** —— 松手时不变量校验会把器材收回可见范围，
 *      任何"拖一下就看不见 / 被遮挡"的改动都会在这里变红。
 *
 *   3. **这条防线不靠"我记得的结构件清单"** —— 覆盖全部 5 件器材 ×
 *      可见范围四个角 + 四个方向甩出屏幕，逐件逐角判定。
 */
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AmmeterScene } from './CompetitorScene'
import { createAmmeterState } from './controller'
import {
  CANVAS_WORLD_BOUNDS,
  LAB_COMPONENT_IDS,
  MIN_WORLD_TO_VIEW_RATIO,
  UNREACHABLE_WORLD_MARGIN,
  buildVisibleRect,
  clampComponentPosition,
  createDefaultLayout,
  isComponentOffCanvas,
  layoutBounds,
  moveComponent,
  offCanvasComponents,
  rescueAllComponents,
  rescueComponent,
  worldSpan,
  type CanvasVisibleRect,
  type LabComponentId,
} from './layout'
import { COMPONENT_BODY_MARGIN, COMPONENT_HIT_RADIUS } from './layout'

const noop = () => {}
const render = () => renderToString(<AmmeterScene state={createAmmeterState()} dispatch={noop} />)

/** 模拟一个 1688×841 的舞台在 fitContent 后的相机（与浏览器实测一致） */
const STAGE = { width: 1688, height: 841 }
const CAMERA = { scale: 1.41735, x: 134.588, y: 22.3575 }
/** 顶部悬浮控件 56px、底部读数条 60px 的安全边距，与场景常量保持一致 */
const SAFE_TOP = 56
const SAFE_BOTTOM = 60

function visibleRectOf(camera = CAMERA): CanvasVisibleRect {
  return buildVisibleRect(
    { left: 0, top: SAFE_TOP, right: STAGE.width, bottom: STAGE.height - SAFE_BOTTOM },
    camera,
  )
}

describe('无限画布：可拖世界必须远大于可见范围', () => {
  it('可拖世界宽/高大于可见范围的 4 倍（不是"中间那一块固定矩形"）', () => {
    const visible = visibleRectOf()!
    const visibleWidth = visible.maxX - visible.minX
    const visibleHeight = visible.maxY - visible.minY
    const span = worldSpan()
    expect(span.width / visibleWidth, '可拖世界宽度相对可见范围太小').toBeGreaterThan(MIN_WORLD_TO_VIEW_RATIO)
    expect(span.height / visibleHeight, '可拖世界高度相对可见范围太小').toBeGreaterThan(MIN_WORLD_TO_VIEW_RATIO)
  })

  it('历史上那个 3840×2340 的硬钳制被实测证明"框"不住屏幕', () => {
    // 复现旧值：宽 3840、高 2340。可见世界只有约 1000×520，
    // 比值不到 4 —— 这正是"器材一拖就出屏幕"的根因。
    const visible = visibleRectOf()!
    const visibleWidth = visible.maxX - visible.minX
    const oldWidth = 2400 - -1440
    expect(oldWidth / visibleWidth).toBeLessThan(MIN_WORLD_TO_VIEW_RATIO)
    // 新边界必须显著大于旧边界
    expect(worldSpan().width).toBeGreaterThan(oldWidth)
  })

  it('可见范围完全落在可拖世界之内（屏幕上的每个位置都能放器材）', () => {
    const visible = visibleRectOf()!
    expect(visible.minX).toBeGreaterThan(CANVAS_WORLD_BOUNDS.minX)
    expect(visible.maxX).toBeLessThan(CANVAS_WORLD_BOUNDS.maxX)
    expect(visible.minY).toBeGreaterThan(CANVAS_WORLD_BOUNDS.minY)
    expect(visible.maxY).toBeLessThan(CANVAS_WORLD_BOUNDS.maxY)
  })

  it('防丢失兜底范围足够大，但确实存在（不会真的无限到找不回）', () => {
    expect(UNREACHABLE_WORLD_MARGIN).toBeGreaterThanOrEqual(4000)
    expect(Number.isFinite(CANVAS_WORLD_BOUNDS.minX)).toBe(true)
    expect(Number.isFinite(CANVAS_WORLD_BOUNDS.maxY)).toBe(true)
  })

  it('屏幕上每个像素格都能承载器材（逐格判定可见范围可放）', () => {
    const visible = visibleRectOf()!
    // 在可见范围内均匀取 7×5 个落点，每件器材都能放进去且判定为"可见"
    for (const id of LAB_COMPONENT_IDS) {
      const margin = COMPONENT_BODY_MARGIN[id]
      for (let ix = 0; ix <= 6; ix += 1) {
        for (let iy = 0; iy <= 4; iy += 1) {
          const point = {
            x: visible.minX + margin.x + ((visible.maxX - visible.minX - margin.x * 2) * ix) / 6,
            y: visible.minY + margin.y + ((visible.maxY - visible.minY - margin.y * 2) * iy) / 4,
          }
          const layout = moveComponent(createDefaultLayout(), id, clampComponentPosition(id, point))
          expect(
            isComponentOffCanvas(layout, id, visible),
            `${id} 在可见范围内的落点 ${JSON.stringify(point)} 被判成"屏幕外"`,
          ).toBe(false)
        }
      }
    }
  })
})

describe('拖动后器材必须仍然完整可见（拖动遮挡的直接解药）', () => {
  it('把每件器材甩到可见范围之外，都会被判定为"出屏幕"', () => {
    const visible = visibleRectOf()!
    const far = [
      { x: visible.minX - 4000, y: visible.minY - 4000 },
      { x: visible.maxX + 4000, y: visible.minY - 4000 },
      { x: visible.minX - 4000, y: visible.maxY + 4000 },
      { x: visible.maxX + 4000, y: visible.maxY + 4000 },
    ]
    for (const id of LAB_COMPONENT_IDS) {
      for (const point of far) {
        const layout = moveComponent(createDefaultLayout(), id, point)
        expect(isComponentOffCanvas(layout, id, visible), `${id} 甩到 ${JSON.stringify(point)} 竟然没被判出屏幕`).toBe(true)
      }
    }
  })

  it('松手收回后，任何一件器材都重新落在可见范围内', () => {
    const visible = visibleRectOf()!
    for (const id of LAB_COMPONENT_IDS) {
      for (const point of [
        { x: -9000, y: -9000 },
        { x: 9000, y: 9000 },
        { x: visible.minX - 500, y: visible.maxY + 500 },
      ]) {
        const stray = moveComponent(createDefaultLayout(), id, point)
        const rescued = rescueComponent(stray, id, visible)
        expect(isComponentOffCanvas(rescued, id, visible), `${id} 收回后仍在屏幕外`).toBe(false)
      }
    }
  })

  it('收回只做最小位移：仍被判为可见的器材绝不无谓挪动', () => {
    const visible = visibleRectOf()!
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      // 只有"被判为跑出屏幕"的器材才允许被收回；没跑丢的一律原封不动
      if (isComponentOffCanvas(layout, id, visible)) return
      expect(rescueComponent(layout, id, visible), `${id} 没跑丢却被挪动了`).toBe(layout)
    }
  })

  it('收回的目标盒永远非空（视野再窄也不会把器材收进一个空盒）', () => {
    // 覆盖从极窄手机竖屏到超宽屏
    for (const size of [
      { width: 360, height: 400 },
      { width: 390, height: 780 },
      { width: 800, height: 300 },
      { width: 1688, height: 512 },
      { width: 2560, height: 1200 },
    ]) {
      const visible = buildVisibleRect({ left: 0, top: 0, right: size.width, bottom: size.height }, { scale: 1, x: 0, y: 0 })!
      for (const id of LAB_COMPONENT_IDS) {
        const rescued = rescueComponent(moveComponent(createDefaultLayout(), id, { x: -99999, y: 99999 }), id, visible)
        // 收回后必须不再被判为跑出屏幕 —— 这是判据与收回自洽性的核心
        expect(isComponentOffCanvas(rescued, id, visible), `${size.width}x${size.height} 下 ${id} 收回后仍被判跑出屏幕`).toBe(false)
      }
    }
  })

  it('收回后至少还看得见器材的大部分（中心在内，不贴着屏幕边）', () => {
    const visible = visibleRectOf()!
    for (const id of LAB_COMPONENT_IDS) {
      const rescued = rescueComponent(moveComponent(createDefaultLayout(), id, { x: -9000, y: 9000 }), id, visible)
      const center = rescued.components[id]
      expect(center.x).toBeGreaterThan(visible.minX)
      expect(center.x).toBeLessThan(visible.maxX)
      expect(center.y).toBeGreaterThan(visible.minY)
      expect(center.y).toBeLessThan(visible.maxY)
    }
  })

  it('「全部收回」一次把件件器材都拉回可见范围', () => {
    const visible = visibleRectOf()!
    let layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) layout = moveComponent(layout, id, { x: 8000, y: -8000 })
    expect(offCanvasComponents(layout, visible)).toHaveLength(LAB_COMPONENT_IDS.length)
    const rescued = rescueAllComponents(layout, visible)
    expect(offCanvasComponents(rescued, visible)).toEqual([])
  })

  it('可见范围未知（相机还没测量出来）时不做任何判定，不会误伤', () => {
    const layout = createDefaultLayout()
    expect(isComponentOffCanvas(layout, 'A1', null)).toBe(false)
    expect(offCanvasComponents(layout, null)).toEqual([])
    expect(rescueAllComponents(layout, null)).toBe(layout)
  })

  it('相机参数非法时返回 null，而不是算出 NaN 的可见范围', () => {
    expect(buildVisibleRect({ left: 0, top: 0, right: 800, bottom: 600 }, { scale: 0, x: 0, y: 0 })).toBeNull()
    expect(buildVisibleRect({ left: 0, top: 0, right: 800, bottom: 600 }, { scale: Number.NaN, x: 0, y: 0 })).toBeNull()
    expect(buildVisibleRect({ left: 0, top: 0, right: 0, bottom: 0 }, CAMERA)).toBeNull()
  })

  it('缩放越小可见范围越大（放大画布时可见范围收紧，这是正确的）', () => {
    const zoomedOut = buildVisibleRect({ left: 0, top: 0, right: STAGE.width, bottom: STAGE.height }, { scale: 0.2, x: 0, y: 0 })!
    const zoomedIn = buildVisibleRect({ left: 0, top: 0, right: STAGE.width, bottom: STAGE.height }, { scale: 4, x: 0, y: 0 })!
    expect(zoomedOut.maxX - zoomedOut.minX).toBeGreaterThan(zoomedIn.maxX - zoomedIn.minX)
  })

  it('相机把视野对准初始构图时，全部器材都判为可见（不会一进页面就被挪动）', () => {
    // 复刻 fitContent 的结果：把初始构图摆到视野中心
    const bounds = layoutBounds(createDefaultLayout())
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const camera = {
      scale: CAMERA.scale,
      x: STAGE.width / 2 - centerX * CAMERA.scale,
      y: (STAGE.height - SAFE_TOP - SAFE_BOTTOM) / 2 + SAFE_TOP - centerY * CAMERA.scale,
    }
    const visible = visibleRectOf(camera)!
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      // 判据语义 = 「器材还有可见部分在视野里」，所以相机对准构图时必须全部可见
      expect(isComponentOffCanvas(layout, id, visible), `${id} 在相机对准构图时被判成出屏幕`).toBe(false)
    }
    // 没有任何器材跑丢 → 全部收回是空操作，一进页面不会自己动
    expect(offCanvasComponents(layout, visible)).toEqual([])
    expect(rescueAllComponents(layout, visible)).toBe(layout)
  })

  it('放大到 4 倍后视野只剩构图的一小块，此时判出屏幕是正确行为', () => {
    const zoomedIn = buildVisibleRect({ left: 0, top: 0, right: STAGE.width, bottom: STAGE.height }, { scale: 4, x: 0, y: 0 })!
    // 视野只覆盖世界坐标 [0,422]×[0,210]，远离初始构图的器材本就不在视野里
    expect(offCanvasComponents(createDefaultLayout(), zoomedIn).length).toBeGreaterThan(0)
    // 但收回之后必须全部回到视野内，且不再被判定出屏幕（自洽性）
    const rescued = rescueAllComponents(createDefaultLayout(), zoomedIn)
    expect(offCanvasComponents(rescued, zoomedIn)).toEqual([])
  })
})

describe('初始构图与包围盒仍然自洽', () => {
  it('初始 5 件器材全部落在 960×540 视图之内', () => {
    const bounds = layoutBounds(createDefaultLayout())
    for (const id of LAB_COMPONENT_IDS) {
      const center = createDefaultLayout().components[id]
      expect(center.x).toBeGreaterThanOrEqual(bounds.minX)
      expect(center.x).toBeLessThanOrEqual(bounds.maxX)
      expect(center.y).toBeGreaterThanOrEqual(bounds.minY)
      expect(center.y).toBeLessThanOrEqual(bounds.maxY)
    }
  })

  it('每件器材都能被拖到可见范围里的任意角落且不被钳制掉', () => {
    const visible = visibleRectOf()!
    for (const id of LAB_COMPONENT_IDS) {
      for (const corner of [
        { x: visible.minX + COMPONENT_BODY_MARGIN[id].x, y: visible.minY + COMPONENT_BODY_MARGIN[id].y },
        { x: visible.maxX - COMPONENT_BODY_MARGIN[id].x, y: visible.maxY - COMPONENT_BODY_MARGIN[id].y },
      ]) {
        const layout = moveComponent(createDefaultLayout(), id, clampComponentPosition(id, corner))
        const actual = layout.components[id]
        expect(actual.x, `${id} 被钳制掉了 x`).toBeCloseTo(corner.x, 6)
        expect(actual.y, `${id} 被钳制掉了 y`).toBeCloseTo(corner.y, 6)
      }
    }
  })
})

describe('命中区与本体必须同尺寸（回归：收回后仍被切掉一块）', () => {
  it('拖动命中区不得比器材本体大，否则按本体边距收回后仍会探出可见范围', () => {
    for (const id of LAB_COMPONENT_IDS) {
      expect(COMPONENT_HIT_RADIUS[id].rx, `${id} 命中区比本体宽`).toBeLessThanOrEqual(COMPONENT_BODY_MARGIN[id].x)
      expect(COMPONENT_HIT_RADIUS[id].ry, `${id} 命中区比本体高`).toBeLessThanOrEqual(COMPONENT_BODY_MARGIN[id].y)
    }
  })

  it('收回后器材中心必然落在视野之内（不会被收到视野外面）', () => {
    const visible = visibleRectOf()!
    for (const id of LAB_COMPONENT_IDS) {
      for (const point of [{ x: -9000, y: -9000 }, { x: 9000, y: 9000 }]) {
        const rescued = rescueComponent(moveComponent(createDefaultLayout(), id, point), id, visible)
        const center = rescued.components[id]
        expect(center.x, `${id} 收回后中心在视野左侧之外`).toBeGreaterThan(visible.minX)
        expect(center.x, `${id} 收回后中心在视野右侧之外`).toBeLessThan(visible.maxX)
        expect(center.y, `${id} 收回后中心在视野上方之外`).toBeGreaterThan(visible.minY)
        expect(center.y, `${id} 收回后中心在视野下方之外`).toBeLessThan(visible.maxY)
      }
    }
  })

  it('视野足够放下一件器材时，收回后本体完整可见（不被裁）', () => {
    // 用一块足够大的视野，验证"能放下就一定要放下"
    const visible = buildVisibleRect(
      { left: 0, top: 0, right: 1600, bottom: 1200 },
      { scale: 1, x: 0, y: 0 },
    )!
    for (const id of LAB_COMPONENT_IDS) {
      for (const point of [{ x: -9000, y: -9000 }, { x: 9000, y: 9000 }]) {
        const rescued = rescueComponent(moveComponent(createDefaultLayout(), id, point), id, visible)
        const center = rescued.components[id]
        const hit = COMPONENT_HIT_RADIUS[id]
        expect(center.x - hit.rx, `${id} 收回后左缘仍被裁`).toBeGreaterThanOrEqual(visible.minX - 1e-9)
        expect(center.x + hit.rx, `${id} 收回后右缘仍被裁`).toBeLessThanOrEqual(visible.maxX + 1e-9)
        expect(center.y - hit.ry, `${id} 收回后上缘仍被裁`).toBeGreaterThanOrEqual(visible.minY - 1e-9)
        expect(center.y + hit.ry, `${id} 收回后下缘仍被裁`).toBeLessThanOrEqual(visible.maxY + 1e-9)
      }
    }
  })
})

describe('界面必须给出「全屏画布」与「收回器材」的可见入口', () => {
  it('操作提示明说这是全屏画布（不再是"中间一块"）', () => {
    expect(render()).toContain('全屏画布任意摆放')
  })

  it('初始没有器材出屏幕时不显示"全部收回"（避免无谓的浮层）', () => {
    expect(render()).not.toContain('在屏幕外')
  })

  it('场景在拖动松手时确实接上了可见性校验（而不是只定义了纯函数）', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8'),
    )
    // 场景必须把 visibleRect 传给拖动逻辑，否则收回逻辑永远不会被触发
    expect(source).toContain('visibleRect,')
    // 拖动逻辑必须在松手时调用 rescueComponent
    const dragSource = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./useLabLayoutDrag.ts', import.meta.url), 'utf8'),
    )
    expect(dragSource).toContain('rescueComponent')
    // 松手校验必须用 setLayout 的函数式更新拿最新布局，
    // 而不是在渲染期写 ref（那是 React 明确禁止的写法）
    expect(dragSource).toContain('setLayout((current) =>')
    expect(dragSource).not.toContain('layoutRef.current = layout')
  })
})

describe('画布世界边界不再写死（回归：硬编码 3840×2340）', () => {
  it('边界由初始构图 + 兜底边距推导，改初始构图不会让边界失配', () => {
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      const center = layout.components[id]
      expect(center.x).toBeGreaterThan(CANVAS_WORLD_BOUNDS.minX)
      expect(center.x).toBeLessThan(CANVAS_WORLD_BOUNDS.maxX)
      expect(center.y).toBeGreaterThan(CANVAS_WORLD_BOUNDS.minY)
      expect(center.y).toBeLessThan(CANVAS_WORLD_BOUNDS.maxY)
    }
  })

  it('所有器材都能拖到可见范围内任何一个角落（逐件 × 四角）', () => {
    const visible = visibleRectOf()!
    const corners: Record<string, { x: number; y: number }> = {
      '左上': { x: visible.minX, y: visible.minY },
      '右上': { x: visible.maxX, y: visible.minY },
      '左下': { x: visible.minX, y: visible.maxY },
      '右下': { x: visible.maxX, y: visible.maxY },
    }
    for (const id of LAB_COMPONENT_IDS as LabComponentId[]) {
      for (const [name, corner] of Object.entries(corners)) {
        const layout = moveComponent(createDefaultLayout(), id, clampComponentPosition(id, corner))
        const center = layout.components[id]
        // 器材中心必须落在可见范围之内（否则就是"拖过去看不见"）
        expect(center.x, `${id} 拖到${name}角后 x 落在可见范围外`).toBeGreaterThanOrEqual(visible.minX)
        expect(center.x, `${id} 拖到${name}角后 x 落在可见范围外`).toBeLessThanOrEqual(visible.maxX)
        expect(center.y, `${id} 拖到${name}角后 y 落在可见范围外`).toBeGreaterThanOrEqual(visible.minY)
        expect(center.y, `${id} 拖到${name}角后 y 落在可见范围外`).toBeLessThanOrEqual(visible.maxY)
      }
    }
  })
})
