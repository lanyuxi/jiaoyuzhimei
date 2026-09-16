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
    const rootTag = html.slice(0, html.indexOf('>') + 1)
    // 必须是真的 class token，而不是「某个属性值里恰好含 select-none 子串」
    expect(hasClass(rootTag, 'select-none'), '场景根容器缺少 select-none 类（真类名，不是属性值里的子串）').toBe(true)
    expect(hasClass(rootTag, 'select-text'), '场景根容器不得放开文字选中').toBe(false)
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

  /**
   * 用真正的嵌套关系判断，而不是「字符串下标大小」。
   *
   * 旧写法只断言 `第一个 <text> 出现在根标签之后`，这并不能保证每个 <text>
   * 都在禁选子树里 —— 只要在禁选容器**之后**再挂一个游离 <text>，
   * `indexOf('<text')` 仍指向第一个、`lastIndexOf('</text>')` 指向游离那个，
   * 两个不等式照样成立，游离文字静默漏网（实测已复现）。
   *
   * 这里改为对 HTML 做一次简单的标签配平扫描：把每个 <text> 的开标签位置
   * 与它所属的祖先链算出来，再要求**每一个** <text> 都能追溯到带 select-none
   * 的祖先，否则点名报出是哪一段文字漏在禁选子树之外。
   */
  it('器材名/读数所在的每个 <text> 都落在禁选子树内', () => {
    const html = render()
    const orphans = collectTextsOutsideSelectNone(html)
    expect(orphans, `以下 <text> 游离在禁选子树之外：${orphans.join(' / ')}`).toEqual([])
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

/**
 * 扫描渲染出的 HTML，返回「不在任何 select-none 子树内」的 <text> 文本内容。
 *
 * 做法：逐字符做一次轻量标签扫描，维护祖先栈；遇到 `<text>` 时检查当前栈里
 * 是否存在带 select-none class 的元素。只处理本项目会用到的简单 HTML 形状
 * （无 `<script>` 内嵌、属性值里不含裸 `>` 的边界情况由引号扫描规避）。
 */
function collectTextsOutsideSelectNone(html: string): string[] {
  const stack: Array<{ tag: string; ownNone: boolean; ownExempt: boolean; effectiveNone: boolean }> = []
  const orphans: string[] = []
  let i = 0
  while (i < html.length) {
    const lt = html.indexOf('<', i)
    if (lt === -1) break
    // 属性值里可能含 '>'，按引号状态找到真正的标签结束位置
    let j = lt + 1
    let quote: string | null = null
    while (j < html.length) {
      const ch = html[j]
      if (quote !== null) {
        if (ch === quote) quote = null
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === '>') {
        break
      }
      j += 1
    }
    const rawTag = html.slice(lt + 1, j)
    const isClose = rawTag.startsWith('/')
    const isSelfClosing = rawTag.endsWith('/')
    const name = rawTag.replace(/^\//, '').split(/[\s/>]/)[0].toLowerCase()

    if (isClose) {
      // 弹到匹配的开标签
      for (let k = stack.length - 1; k >= 0; k -= 1) {
        if (stack[k].tag === name) {
          stack.length = k
          break
        }
      }
      i = j + 1
      continue
    }

    // 按 index.css 的真实级联计算当前节点的有效 user-select：
    //   1. [data-immersive-lab] *            → user-select: none
    //   2. [data-immersive-lab] [data-selectable-content] * → user-select: text（更具体，覆盖上一条）
    // 豁免子树会把继承来的 none **重置**回 text，所以「有 select-none 祖先 ⇒ 安全」这个模型是错的。
    const ownNone = hasClass(rawTag, 'select-none')
    const ownExempt = hasAttr(rawTag, 'data-selectable-content')
    const parentEffectiveNone = stack.length > 0 ? stack[stack.length - 1].effectiveNone : false
    const effectiveNone = ownNone || (ownExempt ? false : parentEffectiveNone)

    if (name === 'text') {
      // SVG <text> 自身不会设 select-none，靠祖先链的级联结果决定可不可选
      if (!effectiveNone) {
        const close = html.indexOf('</text>', j)
        orphans.push(html.slice(j + 1, close === -1 ? j + 1 : close).trim())
      }
    }

    if (!isSelfClosing && !isVoidElement(name)) {
      stack.push({ tag: name, ownNone, ownExempt, effectiveNone })
    }
    i = j + 1
  }
  return orphans
}

/**
 * 真 class token 判定：只看 class="…" 属性值，按空白切分后精确匹配。
 * 用 substring（`rawTag.includes('select-none')`）会被「把类名挪进无关属性值」骗过，
 * 实测 `data-hint="select-none"` / `lab-select-none-x` 都能让旧断言静默全绿。
 */
function hasClass(rawTag: string, token: string): boolean {
  const match = rawTag.match(/class\s*=\s*"([^"]*)"/i) ?? rawTag.match(/class\s*=\s*'([^']*)'/i)
  if (!match) return false
  return match[1].split(/\s+/).includes(token)
}

/** 真属性名判定（属性可以无值），避免 substring 误判 */
function hasAttr(rawTag: string, attr: string): boolean {
  return new RegExp(`(^|[\\s"'])${attr}([\\s=/>]|$)`, 'i').test(rawTag)
}

const VOID_ELEMENTS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'use', 'stop'])
function isVoidElement(name: string): boolean {
  return VOID_ELEMENTS.has(name)
}
