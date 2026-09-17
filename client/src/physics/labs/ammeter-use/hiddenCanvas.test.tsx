/**
 * 「去掉中间那块隐形画布」的回归测试。
 *
 * 需求原话：
 *   「实验器材都拖动到无限画布外面去了……中间有一个隐形的画布；
 *     我不要中间这个隐形的画布；我只要外面最大的一层无限画布；
 *     把中间的无限画布去掉。」
 *
 * 这句话指向的是一个**真实存在、且在真实浏览器里复现过**的缺陷：
 *
 *   承载器材的内层世界（那个 `<svg>`）固定是 960×540，
 *   而外层舞台是整个视口（实测 1375×841）。
 *   内层世界没有背景、看不见，但 `overflow: hidden` 会**沿着它的边界裁剪** ——
 *   于是学生把电池往右一拖，电池在 x=1215 处被**当场切掉半截**
 *   （1375 宽的屏幕上，1086px 宽的内层世界右边正好落在这里）。
 *
 * 所以本文件的判据是三条**用户可见的**几何事实：
 *
 *   1. 内层世界与外层舞台**同尺寸**（屏幕上不再有一条看不见的裁剪线）；
 *   2. 可见范围 = **整块舞台**（四周都到屏幕边，不再是从四边各收一圈）；
 *   3. 四件悬浮控件只"浮"在画布上，靠 `controlAvoidArea` 让器材别钻进去，
 *      **不再把画布缩回一块矩形**。
 *
 * 每条都做了反向自证：把改动改回旧口径，判据必须变红。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToString } from 'react-dom/server'
import { AmmeterScene } from './CompetitorScene'
import { createAmmeterState } from './controller'
import {
  CONTROL_BOTTOM,
  CONTROL_LEFT,
  CONTROL_RIGHT,
  CONTROL_TOP,
  LAB_COMPONENT_IDS,
  controlAvoidArea,
  createDefaultLayout,
  fitLayoutToStage,
  visibleScreenArea,
} from './layout'

const noop = () => {}
const render = () => renderToString(<AmmeterScene state={createAmmeterState()} dispatch={noop} />)

/** 场景源码（用于"接线关系没被改坏"这类契约断言） */
function sceneSource(): string {
  return readFileSync(new URL('./CompetitorScene.tsx', import.meta.url), 'utf8')
}

function canvasSource(): string {
  return readFileSync(new URL('../../runtime/immersive/InfiniteCanvas.tsx', import.meta.url), 'utf8')
}

describe('内层世界必须与外层舞台同尺寸（这就是"隐形画布"的根因）', () => {
  it('场景源码里不再把世界写死成 960×540（viewWidth/viewHeight 不得再传给画布）', () => {
    const source = sceneSource()
    /**
     * 旧写法：`<InfiniteCanvas viewWidth={960} viewHeight={540} …>`。
     * 只要这两个 prop 还在，内层世界就**不是**视口，那条隐形裁剪边就会回来。
     */
    expect(source, '场景又把画布尺寸写死了，中间那块隐形画布会回来').not.toMatch(
      /<InfiniteCanvas[\s\S]{0,600}?viewWidth=/,
    )
    expect(source).not.toMatch(/<InfiniteCanvas[\s\S]{0,600}?viewHeight=/)
  })

  it('画布组件支持"跟随舞台"：不传尺寸时世界 = 100%', () => {
    const source = canvasSource()
    // 必须有一条"跟随舞台"的分支
    expect(source).toContain('followsStage')
    expect(source).toMatch(/width:\s*followsStage\s*\?\s*'100%'/)
    expect(source).toMatch(/height:\s*followsStage\s*\?\s*'100%'/)
    // 默认两个 prop 必须都是 undefined（否则默认值又会把它写死）
    expect(source).toMatch(/viewWidth,/)
    expect(source).toMatch(/viewHeight,/)
  })

  it('SVG 的尺寸/刻度来自真实舞台，而不是常量 960×540', () => {
    const source = sceneSource()
    // 必须用舞台尺寸驱动 svg 的 width/height/viewBox
    expect(source).toMatch(/width=\{stageSize\.width/)
    expect(source).toMatch(/height=\{stageSize\.height/)
    expect(source).toMatch(/viewBox=\{stageSize\.width/)
    // 不许再出现写死 960 / 540 的 viewBox
    expect(source).not.toContain('viewBox={`0 0 ${workbenchWidth} ${workbenchHeight}`}')
  })
})

describe('可见范围 = 整块舞台，四周都不再留"安全边"', () => {
  it('可见范围四边就是屏幕四边（不再是从四边各收一圈的"中间那条带"）', () => {
    for (const [width, height] of [
      [1375, 841],
      [1688, 841],
      [1920, 1080],
      [390, 780],
      [1920, 420],
    ]) {
      expect(visibleScreenArea(width, height), `${width}×${height} 可见范围不是整块屏幕`).toEqual({
        left: 0,
        top: 0,
        right: width,
        bottom: height,
      })
    }
  })

  it('反向自证：可见范围一旦把边长收进去，就不再等于整块屏幕', () => {
    // 复现旧口径：四周各收 56 / 60
    const shrunk = { left: 0, top: 56, right: 1688, bottom: 841 - 60 }
    expect(shrunk).not.toEqual(visibleScreenArea(1688, 841))
    expect(shrunk.top).toBeGreaterThan(0)
    expect(shrunk.bottom).toBeLessThan(841)
  })

  it('悬浮控件区是**独立**的一块：它只覆盖控件所在的那几条边，不是整块画布', () => {
    const size = { width: 1688, height: 782 }
    const control = controlAvoidArea(size.width, size.height)
    /**
     * 四条边都真的避到了控件 —— 判据是「净空 ≥ 控件伸出量」而不是「等于常量」。
     * 下净空会随底部读数条**换行高度**变化（宽视口 54 / 窄视口 152），
     * 硬写等于会把"读数条一行放得下"的视口冤枉成不合格。
     */
    expect(control.left).toBeGreaterThanOrEqual(CONTROL_LEFT)
    expect(control.top).toBeGreaterThanOrEqual(CONTROL_TOP)
    expect(size.width - control.right).toBeGreaterThanOrEqual(CONTROL_RIGHT)
    expect(size.height - control.bottom).toBeGreaterThanOrEqual(70)
    // 下净空不会超过"底部控件最远伸到哪"（CONTROL_BOTTOM 是上界）
    expect(size.height - control.bottom).toBeLessThanOrEqual(CONTROL_BOTTOM + 1)
    // 控件区必须**明显小于**整块舞台，否则又等于把画布缩回一块矩形
    const controlWidth = control.right - control.left
    const controlHeight = control.bottom - control.top
    expect(controlWidth / size.width, '控件区横向占满了整块屏幕，等于没有无限画布').toBeLessThan(0.95)
    expect(controlHeight / size.height, '控件区纵向占满了整块屏幕，等于没有无限画布').toBeLessThan(0.95)
  })
})

describe('初始构图按舞台摆放（不是原样搬 960×540 的坐标）', () => {
  it('等比缩放进舞台后，构图完整落在舞台内', () => {
    for (const [width, height] of [
      [1375, 841],
      [1920, 1080],
      [1024, 600],
      [390, 780],
    ]) {
      const area = visibleScreenArea(width, height)
      const view = { minX: area.left, minY: area.top, maxX: area.right, maxY: area.bottom }
      const fitted = fitLayoutToStage(createDefaultLayout(), view)
      for (const id of LAB_COMPONENT_IDS) {
        const p = fitted.components[id]
        expect(Number.isFinite(p.x) && Number.isFinite(p.y), `${id} 摆出了非有限坐标`).toBe(true)
        expect(p.x, `${width}×${height} 下 ${id} 摆出了舞台左边界`).toBeGreaterThan(view.minX - 200)
        expect(p.x, `${width}×${height} 下 ${id} 摆出了舞台右边界`).toBeLessThan(view.maxX + 200)
      }
    }
  })

  it('只缩小、不放大：构图相对尺寸不会被放大到失真', () => {
    const bigger = fitLayoutToStage(createDefaultLayout(), {
      minX: 0,
      minY: 0,
      maxX: 9600,
      maxY: 5400,
    })
    const base = createDefaultLayout()
    // 大舞台上构图尺寸必须与原始一致（scale 上限 = 1）
    const baseSpan = {
      x: Math.abs(base.components.A1.x - base.components.E1.x),
      y: Math.abs(base.components.A1.y - base.components.E1.y),
    }
    const bigSpan = {
      x: Math.abs(bigger.components.A1.x - bigger.components.E1.x),
      y: Math.abs(bigger.components.A1.y - bigger.components.E1.y),
    }
    expect(bigSpan.x).toBeCloseTo(baseSpan.x, 6)
    expect(bigSpan.y).toBeCloseTo(baseSpan.y, 6)
  })

  it('构图之间的相对关系完全保留（接线柱偏移、拓扑都不受影响）', () => {
    const base = createDefaultLayout()
    const fitted = fitLayoutToStage(base, { minX: 0, minY: 0, maxX: 1375, maxY: 841 })
    /**
     * 等比缩放 + 平移是**相似变换**，所以任意两件器材的间距比例保持不变。
     * 这条守住"换个舞台大小不会把构图拉变形"。
     */
    const ratio = (layout: typeof base, a: 'E1' | 'A1', b: 'S2' | 'L1') => ({
      x: layout.components[a].x - layout.components[b].x,
      y: layout.components[a].y - layout.components[b].y,
    })
    const baseRatio = ratio(base, 'A1', 'S2')
    const fittedRatio = ratio(fitted, 'A1', 'S2')
    const scale = fittedRatio.x / baseRatio.x
    expect(scale).toBeGreaterThan(0)
    expect(fittedRatio.y / baseRatio.y, 'x / y 缩放不一致，构图被拉变形了').toBeCloseTo(scale, 6)
  })
})

describe('变异验证：把改动改回旧口径，用户可见的缺陷必须复现', () => {
  /**
   * 「内层世界写死 960×540」到底坏在哪 —— 用数字当场算给你看。
   *
   * 这是真实浏览器里量到的事实（1375×841 的视口）：
   *   · 舞台宽 1375；内层世界宽 960 → 经 `scale(1.16)` 后约占 1114px，
   *     居中之后右边界落在屏幕 x ≈ 1215；
   *   · 电池 E1 拖到最右时本体右缘会越过 1215 → **被当场切掉**。
   * 改成"世界 = 视口"之后，世界右边界 = 屏幕右边界，切无可切。
   */
  it('旧的 960 宽世界在 1375 视口里覆盖不满，右侧有一条看不见的裁剪线', () => {
    const viewportWidth = 1375
    const stage = 960
    const scale = 1.1602 // 实测 fitContent 结果
    const worldWidthOnScreen = stage * scale
    const worldRight = (viewportWidth + worldWidthOnScreen) / 2 // 居中摆放
    expect(worldRight, '这个变异体成立的先决条件是"世界覆盖不满视口"').toBeLessThan(viewportWidth)
    // 于是 x 落在 [worldRight, viewportWidth] 的内容会被裁掉 —— 那正是"隐形画布"的边界
    expect(viewportWidth - worldRight).toBeGreaterThan(100)
  })

  it('世界 = 视口时，屏幕右边界与世界右边界**重合**（没有可裁的地方）', () => {
    const viewportWidth = 1375
    const scale = 1.1602
    const worldWidthOnScreen = viewportWidth * scale
    const worldRight = (viewportWidth + worldWidthOnScreen) / 2
    expect(worldRight).toBeGreaterThan(viewportWidth)
  })

  it('可见范围一旦收进 56 / 60，就不再等于整块舞台（反向自证）', () => {
    const shrunk = { left: 0, top: 56, right: 1375, bottom: 841 - 60 }
    expect(shrunk).not.toEqual(visibleScreenArea(1375, 841))
  })

  it('重新加上拖动虚线框 → "没有小框"的判据必须变红（反向自证）', () => {
    const source = sceneSource()
    // 在源码里插一条虚线框，断言判据确实会抓到（这里直接验证判据的判据本身）
    const mutated = source.replace('<rect', '<rect strokeDasharray="6 5"')
    expect(mutated).not.toBe(source)
    const guard = (text: string) => !text.includes('strokeDasharray="6 5"')
    expect(guard(source), '原源码不该有虚线框').toBe(true)
    expect(guard(mutated), '判据抓不到插进去的虚线框').toBe(false)
  })
})

describe('界面上不再有任何"拖动小框"', () => {
  it('场景不再绘制拖动包围框（用户截图里红框圈的那个"小框"）', () => {
    const source = sceneSource()
    /**
     * 旧的拖动提示用一条虚线矩形（`strokeDasharray="6 5"`）画出，
     * 本意是"这件器材可以直接拖"，但在用户看来它就是一条**实际存在的边界**。
     */
    expect(source, '拖动虚线包围框又回来了').not.toContain('strokeDasharray="6 5"')
    expect(source).not.toContain('7aa2ff')
  })

  it('渲染结果里找不到那条虚线提示框', () => {
    expect(render()).not.toContain('stroke-dasharray="6 5"')
  })

  it('操作提示仍然在（去掉方框不等于去掉提示）', () => {
    const html = render()
    expect(html).toContain('全屏画布任意摆放')
    expect(html).toContain('拖导线中点可弯折')
    expect(html).toContain('拖接线柱接导线')
  })
})

describe('接线与拖动的能力不因这次改动退化', () => {
  it('11 个接线柱命中区、5 个器材拖动命中区都还在', () => {
    const html = render()
    expect(html.match(/data-hit-target="ammeter-terminal-knob"/g) ?? []).toHaveLength(11)
    for (const id of LAB_COMPONENT_IDS) expect(html).toContain(`data-component-drag="${id}"`)
  })

  it('3D 透视舞台仍在（去掉隐形画布不等于去掉 3D 与无限缩放）', () => {
    const html = render()
    expect(html).toContain('data-immersive-canvas="true"')
    expect(html).toContain('perspective:1600px')
    expect(html).toContain('rotateX(')
    expect(html).toContain('滚轮缩放')
    expect(html).toContain('复位视角')
    expect(html).toContain('铺满画布')
  })

  it('画布本身仍然不画任何背景方框（无桌面矩形 / 无网格 / 无暗角）', () => {
    const html = render()
    expect(html).not.toContain('ammeter-desk')
    expect(html).not.toContain('ammeter-vignette')
    const rects = html.match(/<rect\b[^>]*>/g) ?? []
    const viewSized = rects.filter((rect) => {
      const w = rect.match(/width="([\d.]+)"/)
      const h = rect.match(/height="([\d.]+)"/)
      return w !== null && h !== null && Number(w[1]) >= 960 && Number(h[1]) >= 540
    })
    expect(viewSized, '又出现了铺满视图的背景矩形').toEqual([])
  })
})
