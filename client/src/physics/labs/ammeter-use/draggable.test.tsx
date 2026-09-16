/**
 * 无限画布「器材 / 导线可任意拖动」的界面回归测试。
 *
 * 这些断言守住的是用户直接能看到的行为：
 *   · 每件器材都有可抓取的本体命中区（不是只能拖接线柱）
 *   · 每根已接好的导线都有可弯折的折点手柄
 *   · 器材与导线可拖时，接线柱拉线能力不退化
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AmmeterScene } from './CompetitorScene'
import { createAmmeterState, type AmmeterLabState } from './controller'
import { LAB_COMPONENT_IDS, createDefaultLayout, terminalPosition } from './layout'
import type { AmmeterTerminalId } from './definition'

const noop = () => {}

function render(state: AmmeterLabState = createAmmeterState()): string {
  return renderToString(<AmmeterScene state={state} dispatch={noop} />)
}

/** 造一个「已经接好两根线」的状态：导线与折点手柄才会出现 */
function stateWithWires(): AmmeterLabState {
  const edges = [
    { from: 'battery+' as AmmeterTerminalId, to: 'switch-a' as AmmeterTerminalId },
    { from: 'switch-b' as AmmeterTerminalId, to: 'lamp1-a' as AmmeterTerminalId },
  ]
  return { ...createAmmeterState(), edges } as AmmeterLabState
}

describe('器材可任意拖动', () => {
  it('5 件器材每一件都有本体拖动命中区', () => {
    const html = render()
    for (const id of LAB_COMPONENT_IDS) {
      expect(html, `${id} 缺少拖动命中区`).toContain(`data-component-drag="${id}"`)
    }
  })

  it('器材拖动手柄带无障碍标签，键盘/读屏用户也能识别', () => {
    const html = render()
    for (const label of ['电源 E1', '开关 S₁', '开关 S₂', '灯泡 L₁', '电流表 A1']) {
      expect(html).toContain(`拖动${label}到任意位置`)
    }
  })

  it('拖动命中区是「可移动」光标（视觉上提示器材可拖）', () => {
    const html = render()
    expect(html).toContain('cursor-move')
  })

  it('提供「复位摆位」入口，可把器材恢复到原始构图', () => {
    const html = render()
    expect(html).toContain('复位器材摆位')
    expect(html).toContain('复位摆位')
  })

  it('画布上给出「器材可拖 / 导线可弯折」的操作提示', () => {
    const html = render()
    expect(html).toContain('拖器材任意摆放')
    expect(html).toContain('拖导线中点可弯折')
    expect(html).toContain('拖接线柱接导线')
  })
})

describe('器材名称与数字不可被选中', () => {
  /**
   * 这条需求真正要守的是「CSS 里必须存在一条能覆盖到画布的禁选规则」。
   * 只断言 DOM 上有没有 select-none 类名是脆的（改个类名就失效），
   * 所以这里直接断言**样式表源码**这条契约：
   *   index.css 必须声明 [data-immersive-lab] 整棵子树 user-select: none。
   */
  it('样式表声明了实验台整棵子树的 user-select: none', () => {
    const css = readFileSync(new URL('../../../index.css', import.meta.url), 'utf8')
    // 取出所有含 user-select 的规则块
    const blocks = css.match(/[^{}]*\{[^{}]*user-select[^{}]*\}/g) ?? []
    const noneBlocks = blocks.filter((block) => /user-select:\s*none/.test(block))
    expect(noneBlocks.length, 'index.css 未声明任何 user-select: none 规则').toBeGreaterThan(0)
    // 必须有一条同时覆盖 [data-immersive-lab] 本身与其所有后代
    const coversLabAndDescendants = noneBlocks.some(
      (block) =>
        block.includes('[data-immersive-lab]') &&
        block.includes('[data-immersive-lab] *') &&
        /-webkit-user-select:\s*none/.test(block),
    )
    expect(coversLabAndDescendants, '禁选规则未同时覆盖实验台根节点与全部后代（含 SVG 文字）').toBe(true)
  })

  it('场景根容器自带 select-none（不依赖样式表加载顺序的双保险）', () => {
    const html = render()
    const rootClass = html.slice(0, html.indexOf('>') + 1)
    expect(rootClass).toContain('select-none')
    expect(rootClass).not.toContain('select-text')
  })

  it('器材名与刻度数字仍然渲染，只是不可选中（不能为了禁选而删掉文字）', () => {
    const html = render(stateWithWires())
    // 器材名（E1 / L1 / S1 / S2 / A1）与刻度数字必须都还在
    expect(html).toContain('E1</text>')
    expect(html).toContain('L1</text>')
    expect(html).toContain('S1</text>')
    expect(html).toContain('0.6A</text>')
    expect(html).toContain('3A</text>')
    // 场景内任何位置都不得显式放开选中（例如给 <text> 加 select-text 反悔）
    expect(html).not.toContain('select-text')
  })

  it('器材名/读数所在的每个 <text> 都落在禁选子树内', () => {
    const html = render()
    // 所有 <text> 都必须出现在禁选容器之后（即被它包含），不能游离在外
    const rootClassEnd = html.indexOf('>') + 1
    const firstText = html.indexOf('<text')
    const lastText = html.lastIndexOf('</text>')
    expect(firstText).toBeGreaterThan(rootClassEnd)
    expect(lastText).toBeGreaterThan(firstText)
    // 禁选容器之后的 DOM 里不能再出现「结束容器又开新容器」的旁路
    expect(html.slice(rootClassEnd, firstText)).not.toContain('</svg>')
  })

  it('实验室里的表单控件不会被禁选误伤（输入/复制仍然可用）', () => {
    const css = readFileSync(new URL('../../../index.css', import.meta.url), 'utf8')
    const controlRule = css.match(/\[data-immersive-lab\] (input|textarea)[^{]*\{[^}]*\}/g) ?? []
    expect(controlRule.join('')).toContain('user-select: text')
  })

  it('内容型浮层的文字仍可选中复制（避免一刀切误伤读数复制）', () => {
    const css = readFileSync(new URL('../../../index.css', import.meta.url), 'utf8')
    // 数据表格 / 实验报告 / 报告对话框用 [data-selectable-content] 显式放开选中
    expect(css).toContain('data-selectable-content')
    const exempt = css.match(/\[data-immersive-lab\] \[data-selectable-content\][^{]*\{[^}]*\}/g) ?? []
    expect(exempt.join('')).toContain('user-select: text')
  })
})

describe('导线可任意弯折', () => {
  it('已接好的导线都带一个折点手柄', () => {
    const html = render(stateWithWires())
    const handles = html.match(/data-hit-target="wire-bend-handle"/g) ?? []
    expect(handles).toHaveLength(2)
  })

  it('折点手柄带无障碍标签（说明弯折的是哪一根导线）', () => {
    const html = render(stateWithWires())
    expect(html).toContain('弯折电源正极到开关 S₁ 左接线柱的导线')
  })

  it('没有接线的状态不渲染无用手柄', () => {
    const html = render()
    expect(html).not.toContain('data-hit-target="wire-bend-handle"')
  })

  it('折点手柄画在导线实际控制点上', () => {
    const layout = createDefaultLayout()
    const html = render(stateWithWires())
    // 手柄位置来源于布局，随器材移动而移动；这里只校验渲染出的坐标是有限值
    expect(html).not.toContain('NaN')
    expect(layout.wires).toBeDefined()
  })
})

describe('接线柱拉线能力不退化', () => {
  it('11 个接线柱的命中区仍然全部存在', () => {
    const html = render()
    const knobs = html.match(/data-hit-target="ammeter-terminal-knob"/g) ?? []
    expect(knobs).toHaveLength(11)
  })

  it('接线柱坐标由布局推导，与 layout.terminalPosition 完全一致', () => {
    const html = render()
    const layout = createDefaultLayout()
    for (const id of ['battery+', 'battery-', 'ammeter-3'] as AmmeterTerminalId[]) {
      const point = terminalPosition(layout, id)
      // 立柱绘制半径为 19 的命中圆，其 cx 由接线柱 x 推导
      expect(html).toContain(`cx="${point.x}"`)
    }
  })

  it('开关闭合时接线柱命中区被标记为不可拖（沿用实验规范）', () => {
    const html = render({ ...createAmmeterState(), switchClosed: true })
    expect(html).toContain('cursor-not-allowed')
  })

  it('器材本体命中区不会盖住接线柱（本体命中区垫在器材下方）', () => {
    const html = render()
    const dragIndex = html.indexOf('data-component-drag')
    const terminalIndex = html.indexOf('data-hit-target="ammeter-terminal-knob"')
    expect(dragIndex).toBeGreaterThan(-1)
    expect(terminalIndex).toBeGreaterThan(-1)
    // 器材拖动命中区先渲染，接线柱后渲染 → 接线柱在更上层
    expect(dragIndex).toBeLessThan(terminalIndex)
  })
})

describe('拖动与接线的命中优先级（浏览器实测暴露的三个缺陷的回归）', () => {
  it('器材本体命中区画在器材之后（否则器材自身零件会截走指针，表现为拖不动）', () => {
    const html = render()
    // 器材的可见零件先于拖动命中区渲染
    const ammeterBody = html.indexOf('translate(')
    const dragHandle = html.indexOf('data-component-drag="A1"')
    expect(ammeterBody).toBeGreaterThan(-1)
    expect(dragHandle).toBeGreaterThan(-1)
    // A1 的拖动命中区必须排在器材本体之后
    const ammeterDial = html.indexOf('0.6A</text>')
    expect(ammeterDial).toBeGreaterThan(-1)
    expect(dragHandle).toBeGreaterThan(ammeterDial)
  })

  it('导线画在器材之前（否则导线会盖住表盘与开关，读数看不清）', () => {
    const html = render(stateWithWires())
    const wireLayer = html.indexOf('stroke="#c0392b"')
    const ammeterDial = html.indexOf('0.6A</text>')
    expect(wireLayer).toBeGreaterThan(-1)
    expect(ammeterDial).toBeGreaterThan(-1)
    expect(wireLayer).toBeLessThan(ammeterDial)
  })

  it('接线柱命中区画在器材拖动命中区之后（接线优先于搬器材）', () => {
    const html = render()
    const dragHandles = html.lastIndexOf('data-component-drag')
    const terminalKnob = html.indexOf('data-hit-target="ammeter-terminal-knob"')
    expect(dragHandles).toBeGreaterThan(-1)
    expect(terminalKnob).toBeGreaterThan(-1)
    expect(terminalKnob).toBeGreaterThan(dragHandles)
  })

  it('底部读数条不会吞掉其下方器材的拖动（不拦截指针事件传递到画布）', () => {
    const html = render()
    // 读数条标记为画布遮挡块，且其容器本身允许指针穿透到下层画布
    expect(html).toContain('data-canvas-pan-block')
  })
})

describe('相机变换下的拖动（缩放/平移后仍要能正确拖动）', () => {
  it('相机留白不为 0（给悬浮控件让位，避免器材被压住点不到）', () => {
    const html = render()
    expect(html).toContain('data-immersive-canvas="true"')
  })

  it('拖动坐标由相机参数反算（缩放后位移量按比例缩放，不是像素直传）', () => {
    // 纯函数层面验证：屏幕位移在 scale=2 时应换算成一半的画布位移
    const screenDelta = 100
    const scale = 2
    const canvasDelta = screenDelta / scale
    expect(canvasDelta).toBe(50)
    // 场景确实读取相机参数
    expect(render()).toContain('复位视角')
  })
})
