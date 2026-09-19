/**
 * 沉浸式实验详情页回归测试。
 *
 * 这些断言直接对应需求原文：
 *   · 实验占据整个屏幕（fixed inset-0 + 100dvh），不再缩在中间一小块
 *   · 实验详情页去掉实验器材、实验步骤、主标题、副标题
 *   · 从实验列表点进来直接全屏进入实验
 *   · 3D 效果 + 无限画布
 */
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import ImmersiveLabStage from './ImmersiveLabStage'
import InfiniteCanvas from './InfiniteCanvas'
import { fitContent } from './canvas'
import { getTextbookExperimentTarget } from '../../catalogState'

/** 真 class token 判定：只看 class="…" 属性值，按空白切分后精确匹配 */
function hasClass(rawTag: string, token: string): boolean {
  const match = rawTag.match(/class\s*=\s*"([^"]*)"/i) ?? rawTag.match(/class\s*=\s*'([^']*)'/i)
  if (!match) return false
  return match[1].split(/\s+/).includes(token)
}

describe('沉浸式实验详情页外壳', () => {
  function renderStage(children = <div data-testid="scene" />) {
    return renderToString(
      <MemoryRouter>
        <ImmersiveLabStage title="练习使用电流表" backTo="/physics">
          {children}
        </ImmersiveLabStage>
      </MemoryRouter>,
    )
  }

  it('实验占满整个屏幕而不是页面中间一小块', () => {
    const html = renderStage()
    expect(html).toContain('data-immersive-lab="true"')
    expect(html).toContain('fixed inset-0')
    expect(html).toContain('100dvh')
    expect(html).toContain('z-[60]')
  })

  it('实验详情页不渲染实验器材与实验步骤清单', () => {
    const html = renderStage()
    expect(html).not.toContain('实验器材')
    expect(html).not.toContain('实验步骤')
    expect(html).not.toContain('学习目标')
    expect(html).not.toContain('前置知识')
  })

  it('标题收敛为画布上的悬浮条，不占据布局空间', () => {
    const html = renderStage()
    expect(html).toContain('练习使用电流表')
    expect(html).toContain('aria-label="返回实验列表"')
    // 悬浮条是 absolute 定位，不参与文档流
    expect(html).toContain('absolute left-0 right-0 top-0')
  })

  it('画布撑满外壳的剩余空间（flex-1 + min-h-0）', () => {
    const html = renderStage()
    expect(html).toContain('min-h-0 flex-1')
  })

  it('实验台禁止文字被选中：外壳自带 select-none', () => {
    const html = renderStage()
    // 外壳根节点必须自带禁选（不依赖样式表加载顺序）
    const rootTag = html.slice(0, html.indexOf('>') + 1)
    expect(rootTag).toContain('data-immersive-lab')
    // 必须是真的 class token，而不是「某个属性值里恰好含 select-none 子串」
    expect(hasClass(rootTag, 'select-none'), '外壳根节点缺少 select-none 类（真类名，不是属性值里的子串）').toBe(true)
    expect(hasClass(rootTag, 'select-text'), '外壳根节点不得放开文字选中').toBe(false)
  })
})

describe('无限画布组件', () => {
  it('提供 3D 透视与缩放工具条', () => {
    const html = renderToString(
      <InfiniteCanvas stageRef={{ current: null }} content={{ minX: 0, minY: 0, maxX: 960, maxY: 540 }}>
        <div />
      </InfiniteCanvas>,
    )
    expect(html).toContain('data-immersive-canvas="true"')
    expect(html).toContain('perspective:1600px')
    expect(html).toContain('放大')
    expect(html).toContain('缩小')
    expect(html).toContain('复位视角')
    expect(html).toContain('铺满画布')
    // 底部提示必须把用户明确要求的三件事都写出来：滚轮缩放、空格+拖动平移、缩放百分比
    expect(html).toContain('滚轮缩放 · 空格+拖动平移 · 中键/右键拖动')
  })

  it('画布世界延伸到场景之外，支持无限平移', () => {
    const html = renderToString(
      <InfiniteCanvas stageRef={{ current: null }} content={{ minX: 0, minY: 0, maxX: 960, maxY: 540 }}>
        <div data-testid="content" />
      </InfiniteCanvas>,
    )
    // 内容被放在一个可平移/缩放的世界层中，而不是固定尺寸的画布里
    expect(html).toContain('translate3d(')
    expect(html).toContain('transform-origin:0 0')
  })

  it('画布不绘制地平线网格（否则会形成一块背景方框）', () => {
    const html = renderToString(
      <InfiniteCanvas stageRef={{ current: null }} content={{ minX: 0, minY: 0, maxX: 960, maxY: 540 }}>
        <div />
      </InfiniteCanvas>,
    )
    // 原先的 72px 网格用 linear-gradient + mask 画出来，现在必须一个都不剩
    expect(html).not.toContain('background-size:72px 72px')
    expect(html).not.toContain('perspective:900px')
    expect(html).not.toContain('[perspective:900px]')
  })

  it('画布世界层禁止文字被选中（器材名/数字不产生选区）', () => {
    const html = renderToString(
      <InfiniteCanvas stageRef={{ current: null }} content={{ minX: 0, minY: 0, maxX: 960, maxY: 540 }}>
        <div data-testid="content" />
      </InfiniteCanvas>,
    )
    // 世界层是承载 SVG 场景的那一层，必须自带禁选
    const worldTag = html.slice(html.indexOf('translate3d('))
    const worldClass = worldTag.slice(worldTag.indexOf('class="'), worldTag.indexOf('>'))
    expect(worldClass).toContain('select-none')
    expect(worldClass).not.toContain('select-text')
  })

  it('进入实验时按内容包围盒聚焦（器材铺满整屏）', () => {
    const camera = fitContent({ minX: 0, minY: 0, maxX: 960, maxY: 540 }, { width: 1920, height: 1080 }, 48)
    // 1920×1080 视口下，960×540 的场景至少铺满视口宽或高
    const renderedWidth = 960 * camera.scale
    const renderedHeight = 540 * camera.scale
    expect(Math.max(renderedWidth / 1920, renderedHeight / 1080)).toBeGreaterThan(0.9)
  })
})

describe('实验列表到详情页的入口', () => {
  it('可用实验的卡片直达全屏实验详情页', () => {
    expect(getTextbookExperimentTarget({ availability: 'available', id: 'ammeter-use' })).toBe('/physics/labs/ammeter-use')
  })

  it('制作中的实验没有详情页入口', () => {
    expect(getTextbookExperimentTarget({ availability: 'scheduled', id: 'x' })).toBeUndefined()
  })
})
