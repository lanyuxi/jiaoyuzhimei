/**
 * 「器材写实化」回归测试。
 *
 * 需求是"让器材看起来跟真实物理世界的器材一样"，因此这里守的不是某个具体形状，
 * 而是**写实所必需的结构特征**：真实器材一定有这些东西，示意图没有。
 * 测试按器材逐件断言这些特征，任何人把这件器材改回"几个圆角矩形"，都会被打回。
 *
 * 判定方式：
 *   1. 结构特征 —— 必须出现该器材真实存在的部件（电池的铜帽/环标、开关的刀座与手柄、
 *      灯泡的螺旋灯头与灯丝、电流表的指针与双排刻度）；
 *   2. 写实光影 —— 必须使用渐变（metal/圆柱体积）并且带接触阴影，不能是纯色块；
 *   3. 电气不变量 —— 接线柱坐标、量程、指针角度这些"物理正确"的部分不能因为改画面而变；
 *   4. 可访问性 —— 写实归写实，接线柱/拖动命中区不能少。
 */
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import {
  AmmeterA1,
  BatteryHolderE1,
  KnifeSwitch,
  LampHolderL1,
  TerminalPost,
} from './CompetitorParts'
import { NEEDLE_LIMIT_ANGLE, RANGE_SPEC, needleAngle, type AmmeterTerminalId } from './definition'
import { createDefaultLayout, moveComponent, terminalPosition } from './layout'

function render(node: React.ReactElement): string {
  return renderToString(<svg>{node}</svg>)
}

/**
 * 从**渲染出的 SVG**里提取某件器材壳体的实际包围盒，而不是在测试里手抄一份副本。
 *
 * 这一点是第二轮复审点名的关键：如果测试里的包围盒是 CompetitorParts.tsx 的手抄副本，
 * 那它只是「一个常量 vs 另一个常量」，画面怎么改都不会红，等于没守。
 * 这里改为解析真实渲染结果，绘制一旦挪位，测试立刻跟着变。
 */
/**
 * 统一的「世界坐标」口径。
 *
 * 复审连续三轮指出的根因是同一个：**几何口径不统一**。
 * 只修 `renderedBounds` 是不够的 —— 只要别的判据改成直接读 `data-part` 标签上的
 * **声明属性**（局部坐标），那么任何「在目标元素外面再包一层 `<g transform>`」的改动
 * 都会整体平移坐标，而「局部 vs 局部」的相对比较对共同祖先的平移完全免疫：
 *   · 表盘整棵子树包一层 translate(66 0) → 表盘画到表壳右边外面，测试全绿；
 *   · 接线台肩包一层 translate(40 0) → 接线柱与画面脱开 40px，测试全绿。
 *
 * 所以这里把「按祖先链累计 translate → 世界坐标」做成**唯一出口**，
 * 所有几何判据（包围盒、矩形结构件、指针转轴、路径点）一律走它。
 */

/** 解析 HTML，维护 `<g>` 栈并累计 translate，得到某个下标处的世界坐标偏移 */
function worldOffsetAt(html: string, index: number): { x: number; y: number } {
  const stack: Array<{ x: number; y: number }> = []
  let cursor = 0
  while (cursor < index) {
    const lt = html.indexOf('<', cursor)
    if (lt === -1 || lt >= index) break
    let end = lt + 1
    let quote: string | null = null
    while (end < html.length) {
      const ch = html[end]
      if (quote !== null) {
        if (ch === quote) quote = null
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === '>') {
        break
      }
      end += 1
    }
    const rawTag = html.slice(lt + 1, end)
    const isClose = rawTag.startsWith('/')
    const name = rawTag.replace(/^\//, '').split(/[\s/>]/)[0].toLowerCase()
    if (isClose) {
      if (name === 'g') stack.pop()
    } else if (name === 'g') {
      const translate = rawTag.match(/transform="translate\((-?[\d.]+)[ ,]+(-?[\d.]+)\)"/)
      stack.push(
        translate !== null
          ? { x: Number(translate[1]), y: Number(translate[2]) }
          : { x: 0, y: 0 },
      )
    }
    cursor = end + 1
  }
  return stack.reduce((acc, item) => ({ x: acc.x + item.x, y: acc.y + item.y }), { x: 0, y: 0 })
}

/** 遍历所有匹配标签，回调拿到标签原文、起始下标与**世界坐标偏移** */
function eachTag(
  html: string,
  regex: RegExp,
  handler: (tag: string, index: number, offset: { x: number; y: number }) => void,
): void {
  for (const match of html.matchAll(regex)) {
    const index = match.index ?? 0
    handler(match[0], index, worldOffsetAt(html, index))
  }
}

/** 某个带 data-part 的元素所处位置的世界坐标偏移（用于自证式红线） */
function worldOffsetOfPart(html: string, part: string): { x: number; y: number } | null {
  const match = html.match(new RegExp(`<[a-z]+\\b[^>]*data-part="${part}"[^>]*>`))
  if (match === null) return null
  return worldOffsetAt(html, match.index ?? 0)
}

/** 列出渲染结果里所有带 data-part 的元素名 */
function allDataParts(html: string): string[] {
  return [...new Set([...html.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]))]
}

function renderedBounds(html: string): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let found = false
  const visit = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    found = true
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  eachTag(html, /<rect\b[^>]*>/g, (tag, _index, o) => {
    const x = Number(tag.match(/\bx="(-?[\d.]+)"/)?.[1])
    const y = Number(tag.match(/\by="(-?[\d.]+)"/)?.[1])
    const w = Number(tag.match(/\bwidth="(-?[\d.]+)"/)?.[1])
    const h = Number(tag.match(/\bheight="(-?[\d.]+)"/)?.[1])
    if (![x, y, w, h].every(Number.isFinite)) return
    visit(o.x + x, o.y + y)
    visit(o.x + x + w, o.y + y + h)
  })
  eachTag(html, /<circle\b[^>]*>/g, (tag, _index, o) => {
    const cx = Number(tag.match(/\bcx="(-?[\d.]+)"/)?.[1])
    const cy = Number(tag.match(/\bcy="(-?[\d.]+)"/)?.[1])
    const r = Number(tag.match(/\br="(-?[\d.]+)"/)?.[1])
    if (![cx, cy, r].every(Number.isFinite)) return
    visit(o.x + cx - r, o.y + cy - r)
    visit(o.x + cx + r, o.y + cy + r)
  })
  eachTag(html, /<ellipse\b[^>]*>/g, (tag, _index, o) => {
    const cx = Number(tag.match(/\bcx="(-?[\d.]+)"/)?.[1])
    const cy = Number(tag.match(/\bcy="(-?[\d.]+)"/)?.[1])
    const rx = Number(tag.match(/\brx="(-?[\d.]+)"/)?.[1])
    const ry = Number(tag.match(/\bry="(-?[\d.]+)"/)?.[1])
    if (![cx, cy, rx, ry].every(Number.isFinite)) return
    visit(o.x + cx - rx, o.y + cy - ry)
    visit(o.x + cx + rx, o.y + cy + ry)
  })
  eachTag(html, /<line\b[^>]*>/g, (tag, _index, o) => {
    visit(
      o.x + Number(tag.match(/\bx1="(-?[\d.]+)"/)?.[1]),
      o.y + Number(tag.match(/\by1="(-?[\d.]+)"/)?.[1]),
    )
    visit(
      o.x + Number(tag.match(/\bx2="(-?[\d.]+)"/)?.[1]),
      o.y + Number(tag.match(/\by2="(-?[\d.]+)"/)?.[1]),
    )
  })
  eachTag(html, /<path\b[^>]*\bd="([^"]+)"/g, (tag, _index, o) => {
    for (const [x, y] of pathPoints(tag)) visit(o.x + x, o.y + y)
  })
  return found ? { minX, maxX, minY, maxY } : null
}

/** 按 data-part 取某个矩形结构件的**世界坐标**矩形 */
function renderedPart(html: string, part: string): { x: number; y: number; width: number; height: number } | null {
  const match = html.match(new RegExp(`<rect\\b[^>]*data-part="${part}"[^>]*>`))
  if (match === null) return null
  const tag = match[0]
  const local = {
    x: Number(tag.match(/\bx="(-?[\d.]+)"/)?.[1]),
    y: Number(tag.match(/\by="(-?[\d.]+)"/)?.[1]),
    width: Number(tag.match(/\bwidth="(-?[\d.]+)"/)?.[1]),
    height: Number(tag.match(/\bheight="(-?[\d.]+)"/)?.[1]),
  }
  if (![local.x, local.y, local.width, local.height].every(Number.isFinite)) return null
  const o = worldOffsetAt(html, match.index ?? 0)
  return { x: o.x + local.x, y: o.y + local.y, width: local.width, height: local.height }
}

/** 取某个带 data-part 的文本元素（世界坐标） */
function renderedText(html: string, part: string, label: string): { x: number; y: number } | null {
  const match = html.match(new RegExp(`<text\\b[^>]*data-part="${part}"[^>]*>${label}</text>`))
  if (match === null) return null
  const o = worldOffsetAt(html, match.index ?? 0)
  return {
    x: o.x + Number(match[0].match(/\bx="(-?[\d.]+)"/)?.[1] ?? 0),
    y: o.y + Number(match[0].match(/\by="(-?[\d.]+)"/)?.[1] ?? 0),
  }
}

/** 从完整的标签里取出 `d` 并解析坐标点 */
function pathPointsFromTag(tag: string): Array<[number, number]> {
  return pathPoints(tag)
}

/**
 * 按指令跳步解析 `<path d>` 的坐标点（`A` 是 7 个参数，不能两两取对）。
 *
 * 注意：**必须先只取出 `d` 属性再解析**。
 * 直接对整个标签扫数字会把 `fill="#c6281c"` 里的 `6281` 也当成坐标，
 * 于是指针的"有效长度"被一个幽灵点顶满，缩短针尖也测不出来（实测踩过）。
 */
function pathPoints(tag: string): Array<[number, number]> {
  const d = tag.match(/\bd="([^"]+)"/)?.[1]
  if (d === undefined) return []
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const points: Array<[number, number]> = []
  let cursor = 0
  let command = ''
  while (cursor < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[cursor])) {
      command = tokens[cursor]
      cursor += 1
      if (command === 'Z' || command === 'z') continue
    }
    const need = command === 'A' || command === 'a' ? 7 : command === 'C' || command === 'c' ? 6 : command === 'Q' || command === 'q' ? 4 : 2
    const nums: number[] = []
    while (nums.length < need && cursor < tokens.length && !/^[A-Za-z]$/.test(tokens[cursor])) {
      nums.push(Number(tokens[cursor]))
      cursor += 1
    }
    if (nums.length < need) break
    if (command === 'A' || command === 'a') points.push([nums[5], nums[6]])
    else for (let k = 0; k + 1 < nums.length; k += 2) points.push([nums[k], nums[k + 1]])
  }
  return points
}

/** 提取指针的 rotate()：角度 + 转轴（用于判断指针是否画在表盘内） */
function needlePivot(html: string): { angle: number; pivot: { x: number; y: number } } | null {
  // 恰好一个 rotate 组（指针）。多了说明引入了装饰性 rotate，判据会静默指向错元素。
  const matches = [...html.matchAll(/<g transform="rotate\((-?[\d.]+) (-?[\d.]+) (-?[\d.]+)\)"/g)]
  if (matches.length !== 1) return null
  const match = matches[0]
  const o = worldOffsetAt(html, match.index ?? 0)
  return {
    angle: Number(match[1]),
    pivot: { x: o.x + Number(match[2]), y: o.y + Number(match[3]) },
  }
}

/**
 * 指针转轴必须落在**渲染出的**表盘矩形内（不是手抄常量）。
 * 表盘一挪，这条判据跟着挪，因此"指针画到表盘外面"一定会被抓到。
 */
function assertPivotInsideDial(html: string, pivot: { x: number; y: number }): void {
  const dial = renderedPart(html, 'ammeter-dial')
  expect(dial, '没有渲染出表盘').not.toBeNull()
  expect(pivot.x, '指针转轴横向跑出了表盘').toBeGreaterThanOrEqual(dial!.x)
  expect(pivot.x, '指针转轴横向跑出了表盘').toBeLessThanOrEqual(dial!.x + dial!.width)
  expect(pivot.y, '指针转轴纵向跑出了表盘').toBeGreaterThanOrEqual(dial!.y)
  expect(pivot.y, '指针转轴纵向跑出了表盘').toBeLessThanOrEqual(dial!.y + dial!.height)
}

/** 统计渲染结果里某类 SVG 元素的数量 */
function count(html: string, tag: string): number {
  return (html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length
}

describe('电源 E1 写实化：真实干电池而非示意方块', () => {
  const html = render(<BatteryHolderE1 x={0} y={0} />)

  it('画出干电池的三大特征：橙色环标、金属筒身、黄铜正极帽', () => {
    // 橙色印刷环标（真实 1 号电池的品牌色带）
    expect(html).toMatch(/#(e2953a|c9772a|8a4a12)/)
    // 锌壳筒身（中性灰）
    expect(html).toMatch(/#(5a5f66|8d939b|767c84|4d5259)/)
    // 正极铜帽（黄铜色）
    expect(html).toMatch(/#(b9a071|d9c187|c6ab74|e8d5ab)/)
  })

  it('筒身用竖向渐变表现圆柱体积，而不是一块纯色', () => {
    // 渐变定义存在，并且确实被 fill 引用（不能只定义一个没人用的渐变）
    const gradientIds = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map((match) => match[1])
    expect(gradientIds.length).toBeGreaterThanOrEqual(3)
    for (const id of gradientIds) {
      expect(html, `渐变 ${id} 定义了却没有被引用`).toContain(`url(#${id})`)
    }
  })

  it('电池有黑色环标分段（真实电池的分色印刷）', () => {
    // 至少两处深色分段：用深灰/黑渐变填充的窄矩形
    const darkFills = (html.match(/#(1f2226|4a4e54|31353a|15181b)/g) ?? []).length
    expect(darkFills).toBeGreaterThanOrEqual(2)
  })

  it('底座带两端十字螺钉（真实电池座是拧在底板上的）', () => {
    // 按结构判定：十字槽是「横竖两条短 path」，一左一右两颗螺钉 => 恰好 2 条横槽 + 2 条竖槽
    const crossSlots = html.match(/M -2\.6 0 L 2\.6 0 M 0 -2\.6 L 0 2\.6/g) ?? []
    expect(crossSlots).toHaveLength(2)
    // 底座顶面必须有独立的高光带（不是一块纯色）
    expect(html).toMatch(/fill="#f2f4f6"/)
  })

  it('正负极标识与器材名 E1 都在', () => {
    expect(html).toContain('－')
    expect(html).toContain('+')
    expect(html).toContain('E1')
  })

  it('有接触阴影（器材落在地面上，不是飘着）', () => {
    expect(html).toMatch(/fill="#05070a"/)
  })
})

describe('开关 S 写实化：单刀开关的刀片/刀座/绝缘手柄', () => {
  const open = render(<KnifeSwitch x={0} y={0} closed={false} label="S1" />)
  const closed = render(<KnifeSwitch x={0} y={0} closed label="S1" />)

  it('合闸与断开是两种不同姿态（刀片真的会抬起来）', () => {
    expect(open).not.toBe(closed)
    expect(open).toMatch(/rotate\(-32 /)
    expect(closed).toMatch(/rotate\(0 /)
  })

  it('有黄铜刀座与铰链轴销（真实开关的夹片结构）', () => {
    expect(open).toMatch(/#(c9a227|e6cc6a)/)
    // 铰链轴销：不只判半径，还限定它必须落在刀片转轴处（旋转基准点 -58/-6）
    expect(open).toMatch(/<circle cx="-58" cy="-6" r="6"/)
  })

  it('刀片是金属高光条（冲压钢片），不是一条黑色线段', () => {
    // 刀片用金属高光色 + 顶部白色镜面反射带
    expect(open).toMatch(/fill="#f2f4f6"/)
    expect(open).toMatch(/fill="#ffffff" opacity="0\.8"/)
    expect(open).not.toMatch(/stroke="#1b1b1b"/)
  })

  it('刀片末端有黑色绝缘手柄（真实单刀开关都有）', () => {
    expect(open).toMatch(/#2c2a28/)
    // 手柄上的防滑纹
    expect(open).toMatch(/stroke="#4a4744"/)
  })

  it('底板是胶木（深色）而不是金属，并带四角螺钉', () => {
    expect(open).toMatch(/#2a2622|#3d3730/)
    expect((open.match(/<circle[^>]*r="3\.2"/g) ?? []).length).toBe(4)
  })

  it('器材名可配置（S1 / S2 共用同一套写实外形）', () => {
    expect(open).toContain('>S1<')
    expect(render(<KnifeSwitch x={0} y={0} closed label="S2" />)).toContain('>S2<')
  })
})

describe('灯泡 L1 写实化：玻璃泡 + 螺旋灯头 + 灯丝', () => {
  const off = render(<LampHolderL1 x={0} y={0} lit={false} />)
  const on = render(<LampHolderL1 x={0} y={0} lit />)

  it('有螺旋灯头（爱迪生螺纹，一圈圈金属螺纹）', () => {
    expect(off).toMatch(/<ellipse[^>]*rx="11\.5"/)
    // 螺纹不止一圈
    expect((off.match(/<ellipse[^>]*rx="11\.5"/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('玻璃泡内有可见灯丝与两根引线', () => {
    // 灯丝是 M 形折线
    expect(off).toMatch(/L -6 [\d.-]+ L 0 [\d.-]+ L 6 /)
    // 引线
    expect((off.match(/stroke="#8c939b"/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('玻璃是半透明渐变（透出内部结构），不是实心色块', () => {
    const gradientIds = [...off.matchAll(/<radialGradient id="([^"]+)"/g)].map((match) => match[1])
    expect(gradientIds).toHaveLength(1)
    expect(off).toContain(`url(#${gradientIds[0]})`)
    // 玻璃必须是半透明（带 alpha），否则里面的灯丝看不见。
    // React 会把 rgba() 原样写进 style/属性，这里按更稳的判据取：存在 0<a<1 的 rgba
    const glassGradient = off.slice(off.indexOf('<radialGradient'), off.indexOf('</radialGradient>'))
    const alphaValues = [...glassGradient.matchAll(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/g)].map((m) => Number(m[1]))
    expect(alphaValues.length, '玻璃渐变里没有任何 rgba 半透明色标').toBeGreaterThan(0)
    expect(alphaValues.every((a) => a > 0 && a < 1), '玻璃色标必须半透明').toBe(true)
  })

  it('发光与不发光是两种外观（灯丝点亮 + 光晕）', () => {
    expect(on).not.toBe(off)
    expect(on).toMatch(/#fff2a8|#ffe9a8/)
    expect(on).toMatch(/opacity="0\.2"|opacity="0\.28"/)
  })

  it('灯头底部有绝缘环与中央触点', () => {
    expect(off).toMatch(/#25282c/)
    expect(off).toMatch(/#c6ab74/)
  })

  it('灯座是金属筒（带高光与暗部）并有固定螺钉', () => {
    expect(off).toMatch(/#c9ced4|#8d949c/)
    expect((off.match(/<circle[^>]*r="3\.4"/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })
})

describe('电流表 A1 写实化：表盘/刻度/指针', () => {
  const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)

  it('表盘是米白色内凹面板，并带内阴影（上深下浅）', () => {
    expect(html).toMatch(/#efe9dc/)
    // 上沿/左沿暗，下沿/右沿亮 —— 内凹的关键
    expect(html).toMatch(/fill="#000000" opacity="0\.22"/)
    expect(html).toMatch(/fill="#ffffff" opacity="0\.5"/)
  })

  it('表壳深色，且与表盘分色（真实仪表是深壳浅盘）', () => {
    expect(html).toMatch(/#25292e/)
    expect(html).toMatch(/#efe9dc/)
  })

  it('画出外圈 0～3 与内圈 0～0.6 两排刻度数字', () => {
    for (const value of ['0', '1', '2', '3']) expect(html).toContain(`>${value}</text>`)
    for (const value of ['0.2', '0.4', '0.6']) expect(html).toContain(`>${value}</text>`)
  })

  it('内外两排刻度必须真的不同（删掉一排或两排画成一样都要红）', () => {
    /**
     * 判据取自**渲染出的几何**：两排刻度线到转轴的距离必须明显不同。
     * 关键是用「线到转轴的距离」而不是「线的中点」，因为刻度线是沿半径方向画的，
     * 中点会随刻度长度变化而漂移，用它比较会失真（实测：把内圈刻意挪到外圈位置中点却几乎不动）。
     * 这里取每条线**靠近转轴的那一端**到转轴的距离，就是该刻度的真实半径。
     */
    const needle = needlePivot(html)!
    const pivot = { x: needle.pivot.x, y: needle.pivot.y }
    const radiusOf = (tag: string) => {
      const x1 = Number(tag.match(/x1="([\d.-]+)"/)?.[1])
      const y1 = Number(tag.match(/y1="([\d.-]+)"/)?.[1])
      const x2 = Number(tag.match(/x2="([\d.-]+)"/)?.[1])
      const y2 = Number(tag.match(/y2="([\d.-]+)"/)?.[1])
      const d1 = Math.hypot(x1 - pivot.x, y1 - pivot.y)
      const d2 = Math.hypot(x2 - pivot.x, y2 - pivot.y)
      // 靠转轴的一端 = 这条刻度的内端半径
      return Math.min(d1, d2)
    }
    const collect = (part: string) =>
      [...html.matchAll(new RegExp(`<line\\b[^>]*data-part="${part}"[^>]*>`, 'g'))].map((m) => radiusOf(m[0]))

    const outer = collect('ammeter-scale-outer')
    const inner = collect('ammeter-scale-inner')
    expect(outer.length, '缺少外圈刻度').toBeGreaterThan(0)
    expect(inner.length, '缺少内圈刻度').toBeGreaterThan(0)

    const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length
    const outerRadius = mean(outer)
    const innerRadius = mean(inner)
    // 内圈必须明显更靠内 —— 把两排画成一样、或删掉内圈，这条立刻红
    expect(innerRadius, `内外两排刻度画成了同一圈（内 ${innerRadius.toFixed(1)} vs 外 ${outerRadius.toFixed(1)}）`)
      .toBeLessThan(outerRadius - 5)

    /**
     * 每一排自己的「刻度长度」也必须成立。
     *
     * 这条守的是一个真实踩过的坑：内圈刻度曾经被写成一个独立循环却复用了外圈的半径区间，
     * 结果两排刻度画在同一圈上（外面看着像只有一排刻度）。
     * 只比较「两排的均值」抓不到它 —— 因为两排会一起漂。
     * 所以这里分别固定每排的**内侧端半径**与**外侧端半径**。
     */
    const spans = (part: string) => {
      const list = [...html.matchAll(new RegExp(`<line\\b[^>]*data-part="${part}"[^>]*>`, 'g'))].map((m) => {
        const tag = m[0]
        const x1 = Number(tag.match(/x1="([\d.-]+)"/)?.[1])
        const y1 = Number(tag.match(/y1="([\d.-]+)"/)?.[1])
        const x2 = Number(tag.match(/x2="([\d.-]+)"/)?.[1])
        const y2 = Number(tag.match(/y2="([\d.-]+)"/)?.[1])
        const d1 = Math.hypot(x1 - pivot.x, y1 - pivot.y)
        const d2 = Math.hypot(x2 - pivot.x, y2 - pivot.y)
        return { innerEnd: Math.min(d1, d2), outerEnd: Math.max(d1, d2) }
      })
      return { innerEnd: mean(list.map((x) => x.innerEnd)), outerEnd: mean(list.map((x) => x.outerEnd)) }
    }
    const outerSpan = spans('ammeter-scale-outer')
    const innerSpan = spans('ammeter-scale-inner')
    // 每排都要有实际的刻度长度（不是退化成一点）
    expect(outerSpan.outerEnd - outerSpan.innerEnd, '外圈刻度退化成没有长度').toBeGreaterThan(3)
    expect(innerSpan.outerEnd - innerSpan.innerEnd, '内圈刻度退化成没有长度').toBeGreaterThan(1)
    // 两排必须落在**不同的半径带**上（这条能抓住"内圈刻度误用外圈半径区间"）
    expect(
      outerSpan.innerEnd,
      `内圈刻度外端(${innerSpan.outerEnd.toFixed(1)})与外圈刻度内端(${outerSpan.innerEnd.toFixed(1)})重叠，两排画在同一圈`,
    ).toBeGreaterThan(innerSpan.outerEnd)

    // 每排都是 31 根（0～30 格）
    expect(outer.length, '外圈刻度根数不对').toBe(31)
    expect(inner.length, '内圈刻度根数不对').toBe(31)
    // 刻度总根数是两排之和
    const allTicks = [...html.matchAll(/<line\b[^>]*data-part="ammeter-scale-(outer|inner)"[^>]*>/g)]
    expect(allTicks.length).toBe(62)

    // 两排刻度弧各一条、且半径不同
    const arcs = [...html.matchAll(/A ([\d.]+) \1 0 0 1/g)].map((m) => Number(m[1]))
    expect(arcs.length, '缺少刻度弧线').toBeGreaterThanOrEqual(2)
    expect(new Set(arcs).size, '两条刻度弧半径相同，看着就是一圈').toBeGreaterThanOrEqual(2)
  })

  it('指针是红色细针并带尾部配重（真实动圈表头特征）', () => {
    expect(html).toMatch(/fill="#c6281c"/)
    expect(html).toMatch(/fill="#7d1c14"/)
  })

  it('有玻璃面反光斜条（不反光的表盘看着像贴纸）', () => {
    expect(html).toMatch(/fill="#ffffff" opacity="0\.13"/)
  })

  it('接线柱刻字 － / 0.6A / 3A 齐全', () => {
    expect(html).toContain('>－</text>')
    expect(html).toContain('>0.6A</text>')
    expect(html).toContain('>3A</text>')
  })

  it('读数与量程铭牌实时反映状态', () => {
    expect(html).toContain('0.14 A')
    expect(html).toContain(RANGE_SPEC['0.6A'].label)
    const three = render(<AmmeterA1 x={0} y={0} reading={2.5} range="3A" overRange={false} label="A1" />)
    expect(three).toContain('2.50 A')
    expect(three).toContain(RANGE_SPEC['3A'].label)
  })

  it('过载时指针变亮红（视觉告警，不只是文字）', () => {
    const over = render(<AmmeterA1 x={0} y={0} reading={3} range="3A" overRange label="A1" />)
    expect(over).toMatch(/fill="#e02b1a"/)
  })

  it('读数非有限值时兜底为 0，绝不把 NaN 写进 SVG 属性', () => {
    // NaN 一旦进了 rotate()/text，浏览器会整段忽略该 transform（指针凭空消失）
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const html = render(<AmmeterA1 x={0} y={0} reading={bad} range="3A" overRange={false} label="A1" />)
      expect(html, `reading=${String(bad)} 时渲染出了 NaN`).not.toContain('NaN')
      expect(html).not.toContain('Infinity')
      expect(html).toContain('0.00 A')
      // 指针仍落在合法角度上（0°），且**转轴必须仍在表盘内**（不能飘到 999/999 那种地方）
      const needle = needlePivot(html)
      expect(needle, '没有渲染出指针的 rotate').not.toBeNull()
      expect(needle!.angle).toBe(0)
      assertPivotInsideDial(html, needle!.pivot)
    }
  })

  it('读数取负或超量程时指针仍被夹在合法角度内', () => {
    const negative = render(<AmmeterA1 x={0} y={0} reading={-9} range="0.6A" overRange={false} label="A1" />)
    const huge = render(<AmmeterA1 x={0} y={0} reading={999} range="0.6A" overRange={false} label="A1" />)
    for (const html of [negative, huge]) {
      expect(html).not.toContain('NaN')
      const needle = needlePivot(html)
      expect(needle).not.toBeNull()
      expect(Math.abs(needle!.angle)).toBeLessThanOrEqual(NEEDLE_LIMIT_ANGLE)
      // 转轴必须落在表盘内 —— 这条能抓住「指针画到表盘外面」的改动
      assertPivotInsideDial(html, needle!.pivot)
    }
  })

  it('未接入量程时也有表盘（不会画成空白盒）', () => {
    const none = render(<AmmeterA1 x={0} y={0} reading={0} range={null} overRange={false} label="A1" />)
    expect(none).toMatch(/#efe9dc/)
    expect(none).toMatch(/fill="#c6281c"/)
  })
})

describe('接线柱写实化：香蕉插座结构', () => {
  const html = render(<TerminalPost x={0} y={0} polarity="+" connected={false} />)
  const connected = render(<TerminalPost x={0} y={0} polarity="+" connected />)

  it('有底座法兰 + 六角/立柱 + 旋帽三层结构', () => {
    // 法兰是椭圆（透视）
    expect(count(html, 'ellipse')).toBeGreaterThanOrEqual(4)
    // 立柱
    expect(html).toMatch(/<path[^>]*M -3\.4 -1/)
  })

  it('旋帽带竖向防滑纹（真实接线柱可以手拧）', () => {
    expect((html.match(/<line\b/g) ?? []).length).toBeGreaterThanOrEqual(6)
  })

  it('顶面有高光，已接线时更亮（表达"接上了"）', () => {
    expect(html).toMatch(/opacity="0\.35"/)
    expect(connected).toMatch(/opacity="0\.6"/)
    expect(connected).not.toBe(html)
  })

  it('正负极性用红/黑区分', () => {
    const negative = render(<TerminalPost x={0} y={0} polarity="-" connected={false} />)
    expect(html).toMatch(/#b32d21/)
    expect(negative).toMatch(/#23262b/)
  })
})

/**
 * 几何回归：把「**实际渲染出的**器材外形」和「layout.ts 推导的接线柱坐标」对上。
 *
 * 关键点（第二轮复审点名）：包围盒**必须从渲染结果里解析出来**，
 * 不能在测试里手抄一份 CompetitorParts.tsx 的副本 —— 手抄副本等于
 * 「一个常量 vs 另一个常量」，画面怎么挪都不会红，等于没守。
 *
 * 这里渲染每件器材的**真实 SVG**，解析它的实际包围盒；
 * 再把接线柱的布局坐标换算成相对器材原点的局部坐标，判定它落在壳体里。
 * 于是：壳体改了、器材挪了、接线柱飘了，只要两者不再自洽，测试立刻红。
 */
describe('器材外形与接线柱坐标几何自洽（防止画面与接线柱脱节）', () => {
  const OWNER: Readonly<Record<AmmeterTerminalId, 'E1' | 'S1' | 'S2' | 'L1' | 'A1'>> = {
    'battery-': 'E1',
    'battery+': 'E1',
    'switch-a': 'S1',
    'switch-b': 'S1',
    'lamp2-a': 'S2',
    'lamp2-b': 'S2',
    'lamp1-a': 'L1',
    'lamp1-b': 'L1',
    'ammeter-neg': 'A1',
    'ammeter-0.6': 'A1',
    'ammeter-3': 'A1',
  }

  /** 渲染单件器材，解析它在「器材局部坐标系」里的真实包围盒 */
  function bodyBoundsOf(id: 'E1' | 'S1' | 'L1' | 'A1') {
    const html = render(
      id === 'E1' ? <BatteryHolderE1 x={0} y={0} />
      : id === 'S1' ? <KnifeSwitch x={0} y={0} closed={false} label="S1" />
      : id === 'L1' ? <LampHolderL1 x={0} y={0} lit={false} />
      : <AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />,
    )
    const bounds = renderedBounds(html)
    expect(bounds, `${id} 没渲染出任何几何`).not.toBeNull()
    return bounds!
  }

  const COMPONENTS = ['E1', 'S1', 'L1', 'A1'] as const

  it('每件器材都渲染出了真实的几何包围盒（不是空壳）', () => {
    for (const id of COMPONENTS) {
      const box = bodyBoundsOf(id)
      expect(box.maxX - box.minX, `${id} 宽度异常`).toBeGreaterThan(60)
      expect(box.maxY - box.minY, `${id} 高度异常`).toBeGreaterThan(30)
    }
  })

  it('每只接线柱都落在**其所属器材渲染出的**包围盒内（飘出器材立刻红）', () => {
    const layout = createDefaultLayout()
    // S2 与 S1 共用同一套外形，直接用 S1 的包围盒
    const bounds: Record<'E1' | 'S1' | 'S2' | 'L1' | 'A1', { minX: number; maxX: number; minY: number; maxY: number }> = {
      E1: bodyBoundsOf('E1'),
      S1: bodyBoundsOf('S1'),
      S2: bodyBoundsOf('S1'),
      L1: bodyBoundsOf('L1'),
      A1: bodyBoundsOf('A1'),
    }
    for (const [terminalId, componentId] of Object.entries(OWNER) as Array<[AmmeterTerminalId, 'E1' | 'S1' | 'S2' | 'L1' | 'A1']>) {
      const center = layout.components[componentId]
      const point = terminalPosition(layout, terminalId)
      const local = { x: point.x - center.x, y: point.y - center.y }
      const box = bounds[componentId]
      expect(local.x, `${terminalId} 的 x 跑出了 ${componentId} 的渲染包围盒`).toBeGreaterThanOrEqual(box.minX)
      expect(local.x, `${terminalId} 的 x 跑出了 ${componentId} 的渲染包围盒`).toBeLessThanOrEqual(box.maxX)
      expect(local.y, `${terminalId} 的 y 跑出了 ${componentId} 的渲染包围盒`).toBeGreaterThanOrEqual(box.minY)
      expect(local.y, `${terminalId} 的 y 跑出了 ${componentId} 的渲染包围盒`).toBeLessThanOrEqual(box.maxY)
    }
  })

  it('写实化把接线柱按 6 倍挪出去时，上一条断言必须变红（反向验证）', () => {
    // 直接模拟「接线柱飘出器材」：把布局里的器材中心挪到远处，
    // 而器材外形仍画在原点 —— 等价于接线柱相对器材偏了很远。
    const layout = createDefaultLayout()
    const box = bodyBoundsOf('A1')
    const center = layout.components.A1
    const point = terminalPosition(layout, 'ammeter-3')
    const local = { x: (point.x - center.x) * 6, y: (point.y - center.y) * 6 }
    const inside = local.x >= box.minX && local.x <= box.maxX && local.y >= box.minY && local.y <= box.maxY
    expect(inside, '接线柱偏了 6 倍却仍被判为在器材内，说明这条几何回归是无效的').toBe(false)
  })

  it('拖动器材后，接线柱仍与其渲染包围盒保持自洽', () => {
    let layout = createDefaultLayout()
    layout = moveComponent(layout, 'A1', { x: 1400, y: 900 })
    layout = moveComponent(layout, 'E1', { x: -600, y: 200 })
    const bounds: Record<'E1' | 'L1' | 'A1', { minX: number; maxX: number; minY: number; maxY: number }> = {
      E1: bodyBoundsOf('E1'),
      L1: bodyBoundsOf('L1'),
      A1: bodyBoundsOf('A1'),
    }
    for (const [terminalId, componentId] of Object.entries(OWNER) as Array<[AmmeterTerminalId, 'E1' | 'S1' | 'S2' | 'L1' | 'A1']>) {
      if (componentId !== 'E1' && componentId !== 'L1' && componentId !== 'A1') continue
      const center = layout.components[componentId]
      const point = terminalPosition(layout, terminalId)
      const box = bounds[componentId]
      expect(point.x - center.x).toBeGreaterThanOrEqual(box.minX)
      expect(point.x - center.x).toBeLessThanOrEqual(box.maxX)
      expect(point.y - center.y).toBeGreaterThanOrEqual(box.minY)
      expect(point.y - center.y).toBeLessThanOrEqual(box.maxY)
    }
  })

  it('表盘、刻度弧、指针、转轴帽必须彼此自洽（任何一件挪走/缩没都要红）', () => {
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const dial = renderedPart(html, 'ammeter-dial')!
    const dialBox = { x0: dial.x, y0: dial.y, x1: dial.x + dial.width, y1: dial.y + dial.height }

    // 1) 刻度弧（两条）必须整体落在表盘内 —— 表盘被挪走 / 刻度悬空都会红
    const arcs = [...html.matchAll(/<path\b[^>]*data-part="ammeter-arc"[^>]*>/g)]
    expect(arcs.length, '缺少刻度弧线').toBeGreaterThan(0)
    for (const arc of arcs) {
      for (const [x, y] of pathPoints(arc[0])) {
        expect(x, `刻度弧的 x=${x.toFixed(1)} 悬在表盘外`).toBeGreaterThanOrEqual(dialBox.x0 - 1)
        expect(x, `刻度弧的 x=${x.toFixed(1)} 悬在表盘外`).toBeLessThanOrEqual(dialBox.x1 + 1)
        expect(y, `刻度弧的 y=${y.toFixed(1)} 悬在表盘外`).toBeGreaterThanOrEqual(dialBox.y0 - 1)
        expect(y, `刻度弧的 y=${y.toFixed(1)} 悬在表盘外`).toBeLessThanOrEqual(dialBox.y1 + 1)
      }
    }

    // 2) 指针针尖到转轴的距离必须接近刻度半径（针被缩短/拉长都要红）
    const needle = needlePivot(html)!
    const needleTag = html.match(/<path\b[^>]*data-part="ammeter-needle"[^>]*>/)
    expect(needleTag, '没有渲染出指针针体').not.toBeNull()
    const needlePoints = pathPointsFromTag(needleTag![0])
    expect(needlePoints.length, '没有解析出指针针体的坐标').toBeGreaterThan(0)
    /**
     * 指针的「有效长度」= 转轴到针体两端的最大距离。
     * 注意不能用「离转轴最远的点」——真实指针在转轴下还有一截配重尾针，
     * 尾针到转轴的距离可能大于针尖，会把判据带偏（实测过：缩短针尖仍然通过）。
     * 所以取**针体在转轴方向上到转轴的最大距离**，也就是针尖所在的半径。
     */
    const radii = needlePoints.map(([x, y]) => Math.hypot(x - needle.pivot.x, y - needle.pivot.y))
    const tipDistance = Math.max(...radii)
    const tailDistance = Math.min(...radii)
    // 针尖必须比尾针长（真实的指针是"长针 + 短配重"）
    expect(tipDistance, '指针的针尖没有比尾针长，形状不对').toBeGreaterThan(tailDistance)
    // 刻度弧半径从弧线的 A 指令读出
    const arcRadius = Number(arcs[0][0].match(/A ([\d.]+) \1/)?.[1])
    expect(arcRadius).toBeGreaterThan(0)
    expect(tipDistance, `针尖半径 ${tipDistance.toFixed(1)} 远小于刻度半径 ${arcRadius.toFixed(1)}（指针被缩短）`)
      .toBeGreaterThan(arcRadius - 12)
    expect(tipDistance, `针尖半径 ${tipDistance.toFixed(1)} 超出刻度半径 ${arcRadius.toFixed(1)} 太多`).toBeLessThan(arcRadius + 12)

    // 3) 转轴帽必须存在，且落在表盘内
    const hub = html.match(/<circle\b[^>]*data-part="ammeter-needle-hub"[^>]*>/)
    expect(hub, '转轴帽被删掉了').not.toBeNull()
    const hubX = Number(hub![0].match(/\bcx="(-?[\d.]+)"/)?.[1])
    const hubY = Number(hub![0].match(/\bcy="(-?[\d.]+)"/)?.[1])
    expect(hubX).toBeGreaterThanOrEqual(dialBox.x0)
    expect(hubX).toBeLessThanOrEqual(dialBox.x1)
    expect(hubY, '转轴帽挪出了表盘').toBeGreaterThanOrEqual(dialBox.y0)
    expect(hubY, '转轴帽挪出了表盘').toBeLessThanOrEqual(dialBox.y1)

    // 4) 中央「A」量程字符必须也存在且落在表盘内
    const glyph = html.match(/<text\b[^>]*data-part="ammeter-glyph"[^>]*>/)
    expect(glyph, '中央 A 被删掉了').not.toBeNull()
    const glyphY = Number(glyph![0].match(/\by="(-?[\d.]+)"/)?.[1])
    expect(glyphY, '中央 A 挪出了表盘').toBeGreaterThanOrEqual(dialBox.y0)
    expect(glyphY, '中央 A 挪出了表盘').toBeLessThanOrEqual(dialBox.y1)
  })

  it('包围盒按祖先链累计平移算世界坐标（回归：<g> 原点不再被当成几何点）', () => {
    /**
     * 复审实测的反例：把电池本体整体平移 200px，旧实现把 `<g>` 的平移原点也算成几何点，
     * 包围盒跟着"膨胀"到新位置 → 看起来什么都没变，49/49 全绿而画面已崩。
     *
     * 这里直接验证渲染 + 解析这条链路：同一个 <rect> 放在不同层级的 translate 里，
     * 解析出的包围盒必须落在对应的世界坐标上。
     */
    const flat = renderToString(
      <svg>
        <rect x={0} y={0} width={10} height={10} />
      </svg>,
    )
    const nested = renderToString(
      <svg>
        <g transform="translate(100 50)">
          <g transform="translate(30 -10)">
            <rect x={0} y={0} width={10} height={10} />
          </g>
        </g>
      </svg>,
    )
    const flatBox = renderedBounds(flat)!
    const nestedBox = renderedBounds(nested)!
    // 累加后应落在 (130, 40) 起、10×10 的方块上
    expect(nestedBox.minX).toBeCloseTo(flatBox.minX + 130, 6)
    expect(nestedBox.minY).toBeCloseTo(flatBox.minY + 40, 6)
    expect(nestedBox.maxX - nestedBox.minX).toBeCloseTo(flatBox.maxX - flatBox.minX, 6)
    expect(nestedBox.maxY - nestedBox.minY).toBeCloseTo(flatBox.maxY - flatBox.minY, 6)
  })

  it('自证式红线：声明坐标系必须与渲染坐标系重合（外包一层 <g> 就红）', () => {
    /**
     * 这是复审给的"一次性封住整类问题"的红线。
     *
     * 前面所有几何判据都是「某一组元素互相包含」。如果**整组一起**被外层
     * `<g transform>` 平移，包含关系不变，判据就静默失效；而画面已经崩了。
     * 所以这里要求：每个带 `data-part` 的元素，其**世界坐标偏移必须为 0**
     * —— 也就是「声明属性写在哪里，就画在哪里」。
     *
     * 真实代码里恰好在根 `<g transform="translate(0 0)">` 内，因此该值恒为 0，零成本；
     * 而任何"在目标元素外再包一层平移"的改动都会让 ≥1 处立刻变红。
     */
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const parts = allDataParts(html)
    expect(parts.length, '没有找到任何 data-part 元素').toBeGreaterThan(0)

    // 覆盖面自证：这些结构件必须都被标记到，
    // 否则「只标记了一部分」时，未标记的那些就会成为绕过路径（实测踩过：labels / arcs）。
    for (const required of [
      'ammeter-shell',
      'ammeter-dial',
      'ammeter-terminal-flange',
      'ammeter-needle',
      'ammeter-needle-hub',
      'ammeter-glyph',
      'ammeter-arc',
      'ammeter-scale-outer',
      'ammeter-scale-inner',
      'ammeter-label-neg',
      'ammeter-label-06',
      'ammeter-label-3',
    ]) {
      expect(parts, `${required} 没有被标记 data-part，会成为几何回归的绕过路径`).toContain(required)
    }

    for (const part of parts) {
      const offset = worldOffsetOfPart(html, part)
      expect(offset, `${part} 的偏移解析失败`).not.toBeNull()
      expect(offset, `${part} 的声明坐标系与渲染坐标系不重合（被外层 <g transform> 平移了）`)
        .toEqual({ x: 0, y: 0 })
    }

    // 反向自证：给它套一层平移后，这条红线必须变红
    const shifted = html.replace(
      /(<rect\b[^>]*data-part="ammeter-dial"[^>]*>)/,
      '<g transform="translate(66 0)">$1</g>',
    )
    expect(shifted, '没有成功注入平移层').not.toBe(html)
    expect(worldOffsetOfPart(shifted, 'ammeter-dial')).toEqual({ x: 66, y: 0 })
  })

  it('整组外观被外层 <g> 平移时也会红（表盘/台肩分别验证）', () => {
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)

    // (b) 表盘整棵子树平移 66px：表盘会跑到表壳右边外面
    const dialShifted = html.replace(
      /(<rect\b[^>]*data-part="ammeter-dial"[^>]*>)/,
      '<g transform="translate(66 0)">$1</g>',
    )
    const dial = renderedPart(dialShifted, 'ammeter-dial')!
    const shell = renderedPart(html, 'ammeter-shell')!
    // 平移后的表盘必须整体（或大部分）落在表壳之外 —— 即该改动确实是坏的
    const dialRight = dial.x + dial.width
    const shellRight = shell.x + shell.width
    expect(dialRight, '表盘平移后仍在表壳内，这个变异体不成立').toBeGreaterThan(shellRight)

    // 而世界坐标口径能把这个偏移如实读出来（局部口径读不出来）
    expect(worldOffsetOfPart(dialShifted, 'ammeter-dial')).toEqual({ x: 66, y: 0 })

    // (a) 接线台肩平移 40px：接线柱与画面脱开
    const flangeShifted = html.replace(
      /(<rect\b[^>]*data-part="ammeter-terminal-flange"[^>]*>)/,
      '<g transform="translate(40 0)">$1</g>',
    )
    expect(worldOffsetOfPart(flangeShifted, 'ammeter-terminal-flange')).toEqual({ x: 40, y: 0 })
  })

  it('平移原点本身不会被算成几何点（否则包围盒会被"撑大"）', () => {
    // 只有 <g translate> 没有任何绘图元素时，包围盒应为空 ——
    // 这直接证明 `<g>` 的平移原点不再被当成几何点。
    const onlyGroup = renderToString(
      <svg>
        <g transform="translate(500 300)" />
      </svg>,
    )
    const withRect = renderToString(
      <svg>
        <g transform="translate(500 300)">
          <rect x={0} y={0} width={10} height={10} />
        </g>
      </svg>,
    )
    expect(renderedBounds(onlyGroup), '<g> 的平移原点被当成了几何点').toBeNull()
    // 有绘图元素时，几何只来自那个元素（10×10），不会因为 translate 而变大
    const box = renderedBounds(withRect)!
    expect(box.maxX - box.minX).toBeCloseTo(10, 6)
    expect(box.maxY - box.minY).toBeCloseTo(10, 6)
    expect(box.minX).toBeCloseTo(500, 6)
    expect(box.minY).toBeCloseTo(300, 6)
  })

  it('电流表的接线柱真的坐在**渲染出的**接线台肩里（挪动台肩立刻红）', () => {
    // 台肩矩形从渲染结果按 data-part 读出，保证"接线柱坐标 vs 画面几何"是真的对上，
    // 而不是拿测试里手抄的常量自证。
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const flange = renderedPart(html, 'ammeter-terminal-flange')
    expect(flange, '电流表没有渲染出接线台肩').not.toBeNull()

    const layout = createDefaultLayout()
    const center = layout.components.A1
    for (const id of ['ammeter-neg', 'ammeter-0.6', 'ammeter-3'] as AmmeterTerminalId[]) {
      const point = terminalPosition(layout, id)
      const local = { x: point.x - center.x, y: point.y - center.y }
      // 接线柱的柱脚与旋帽顶端（约在本体上方 15px）都必须落在台肩内
      expect(local.x, `${id} 的 x 不在台肩内`).toBeGreaterThanOrEqual(flange!.x)
      expect(local.x, `${id} 的 x 不在台肩内`).toBeLessThanOrEqual(flange!.x + flange!.width)
      expect(local.y - 15, `${id} 的旋帽顶端从台肩上沿冒出去了`).toBeGreaterThanOrEqual(flange!.y)
      expect(local.y, `${id} 的柱脚低于台肩下沿`).toBeLessThanOrEqual(flange!.y + flange!.height)
    }
  })

  it('接线台肩必须落在电流表**渲染出的**表壳范围内（窄壳宽台肩会红）', () => {
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const flange = renderedPart(html, 'ammeter-terminal-flange')!
    const shell = renderedPart(html, 'ammeter-shell')!
    expect(flange.x, '台肩左沿超出表壳').toBeGreaterThanOrEqual(shell.x - 1)
    expect(flange.x + flange.width, '台肩右沿超出表壳').toBeLessThanOrEqual(shell.x + shell.width + 1)
    expect(flange.y, '台肩上沿高于表壳顶端').toBeGreaterThanOrEqual(shell.y)
    expect(flange.y + flange.height, '台肩下沿低于表壳底端').toBeLessThanOrEqual(shell.y + shell.height + 1)
  })

  it('接线柱刻字必须落在**渲染出的**台肩范围内（把刻字挪回表体下方会红）', () => {
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const flange = renderedPart(html, 'ammeter-terminal-flange')!
    // 三处刻字分别带 data-part，读它们的**世界坐标** y
    for (const [part, label] of [['ammeter-label-neg', '－'], ['ammeter-label-06', '0.6A'], ['ammeter-label-3', '3A']] as const) {
      const point = renderedText(html, part, label)
      expect(point, `${part} 刻字没有渲染出来`).not.toBeNull()
      expect(point!.y, `${label} 刻字跑到了台肩外面（会飘在表体下方）`).toBeGreaterThanOrEqual(flange.y)
      expect(point!.y, `${label} 刻字跑到了台肩外面`).toBeLessThanOrEqual(flange.y + flange.height)
    }
  })

  it('画出的器材自身不会被几何红线判成"背景方框"/"横跨视图的线"', () => {
    // CompetitorScene.test.tsx 按几何判定：覆盖整个视图的矩形、横跨整个视图的线都算背景。
    // 这里用**真实渲染出的**包围盒验证：器材最宽也不到视图宽度。
    const view = { width: 960, height: 540 }
    for (const id of COMPONENTS) {
      const box = bodyBoundsOf(id)
      // 器材以原点居中，宽度/高度都远小于视图
      expect(box.maxX - box.minX, `${id} 宽到会触碰"背景方框"红线`).toBeLessThan(view.width)
      // 也不存在横跨整个视图的线：最长的零件长度远小于 960
      const html = render(id === 'E1' ? <BatteryHolderE1 x={0} y={0} /> : <AmmeterA1 x={0} y={0} reading={0} range="3A" overRange={false} label="A1" />)
      for (const line of html.matchAll(/<line\b[^>]*>/g)) {
        const tag = line[0]
        const x1 = Number(tag.match(/x1="(-?[\d.]+)"/)?.[1])
        const x2 = Number(tag.match(/x2="(-?[\d.]+)"/)?.[1])
        const y1 = Number(tag.match(/y1="(-?[\d.]+)"/)?.[1])
        const y2 = Number(tag.match(/y2="(-?[\d.]+)"/)?.[1])
        if (![x1, x2, y1, y2].every(Number.isFinite)) continue
        expect(Math.abs(x2 - x1), `${id} 里有横跨视图的线`).toBeLessThan(view.width)
        expect(Math.abs(y2 - y1), `${id} 里有竖跨视图的线`).toBeLessThan(view.height)
      }
    }
  })
})

describe('电气不变量不被写实化改动破坏', () => {
  it('指针角度仍按真实量程映射（0.6A 满偏 60°，3A 满偏 60°）', () => {
    expect(needleAngle(RANGE_SPEC['0.6A'].max, '0.6A')).toBeCloseTo(NEEDLE_LIMIT_ANGLE, 9)
    expect(needleAngle(RANGE_SPEC['3A'].max, '3A')).toBeCloseTo(NEEDLE_LIMIT_ANGLE, 9)
    expect(needleAngle(0, '0.6A')).toBe(0)
  })

  it('指针只能落在 -60°～+60° 之间（不会转过头）', () => {
    for (const reading of [-5, 0, 0.3, 0.6, 3, 5]) {
      const angle = needleAngle(reading, '0.6A')
      expect(angle).toBeGreaterThanOrEqual(-NEEDLE_LIMIT_ANGLE)
      expect(angle).toBeLessThanOrEqual(NEEDLE_LIMIT_ANGLE)
    }
  })

  it('分度值仍是教学要求的 0.02A / 0.1A', () => {
    expect(RANGE_SPEC['0.6A'].division).toBe(0.02)
    expect(RANGE_SPEC['3A'].division).toBe(0.1)
  })
})

describe('写实化只在器材内部改画面，不动外部坐标协议', () => {
  it('器材组件全部只接受 x/y 平移，不改外部坐标协议', () => {
    // 组件签名里只有 x / y 参与定位；接线柱坐标仍由 layout.ts 的 terminalPosition 推导
    const source = readFileSync(new URL('./CompetitorParts.tsx', import.meta.url), 'utf8')
    for (const component of ['BatteryHolderE1', 'KnifeSwitch', 'LampHolderL1', 'AmmeterA1']) {
      expect(source).toContain(`export function ${component}`)
    }
    // 每个器材都以 <g transform={`translate(${x} ${y})`}> 定位
    expect((source.match(/translate\(\$\{x\} \$\{y\}\)/g) ?? []).length).toBeGreaterThanOrEqual(5)
  })

  it('器材组件不直接依赖 layout / 场景，只依赖 definition 与 React', () => {
    const source = readFileSync(new URL('./CompetitorParts.tsx', import.meta.url), 'utf8')
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1])
    expect(imports.length).toBeGreaterThan(0)
    for (const specifier of imports) {
      const allowed = specifier === 'react' || specifier.startsWith('./') || specifier.startsWith('../')
      expect(allowed, `出现了不期望的依赖：${specifier}`).toBe(true)
    }
    expect(imports).toContain('./definition')
    // 不能反向依赖 layout（否则接线柱坐标会与绘制耦合，拖动必然错位）
    expect(imports.some((specifier) => specifier.includes('layout'))).toBe(false)
  })

  it('渐变 id 逐实例唯一，同页多件器材不会串色', () => {
    // 每个渐变 id 都必须带实例前缀（useId），因此同页画两次也互不冲突
    const source = readFileSync(new URL('./CompetitorParts.tsx', import.meta.url), 'utf8')
    // 约定：渐变 id 一律写成 id={`${uid}-xxx`}，因此不会出现写死的静态 id
    const idAttrs = [...source.matchAll(/id=\{`([^`]+)`\}/g)].map((match) => match[1])
    expect(idAttrs.length).toBeGreaterThan(0)
    for (const id of idAttrs) {
      expect(id.startsWith('${uid}-'), `渐变 id "${id}" 未按实例唯一化`).toBe(true)
    }
    // 并且不允许再出现写死的静态 id（HTML 静态属性形式）
    expect(source).not.toMatch(/<\w+[^>]*\sid="[a-z-]+"/)
  })

  it('同页同时渲染两件带渐变的器材时，渐变 id 不重复', () => {
    const doubleBattery = renderToString(
      <svg>
        <BatteryHolderE1 x={0} y={0} />
        <BatteryHolderE1 x={300} y={0} />
      </svg>,
    )
    const ids = [...doubleBattery.matchAll(/<linearGradient id="([^"]+)"/g)].map((match) => match[1])
    expect(ids).toHaveLength(6) // 两节电池 × 3 个渐变
    expect(new Set(ids).size, '两件器材的渐变 id 发生冲突，会导致串色').toBe(ids.length)

    const doubleLamp = renderToString(
      <svg>
        <LampHolderL1 x={0} y={0} lit={false} />
        <LampHolderL1 x={300} y={0} lit={false} />
      </svg>,
    )
    const lampIds = [...doubleLamp.matchAll(/<radialGradient id="([^"]+)"/g)].map((match) => match[1])
    expect(lampIds).toHaveLength(2)
    expect(new Set(lampIds).size).toBe(2)
  })
})
