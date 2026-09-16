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
  // 每个 <g transform="translate(x y)"> 的相对原点也要算进来（用于换算局部坐标）
  for (const match of html.matchAll(/<g transform="translate\((-?[\d.]+) (-?[\d.]+)\)"/g)) {
    visit(Number(match[1]), Number(match[2]))
  }
  for (const match of html.matchAll(/<rect\b[^>]*>/g)) {
    const tag = match[0]
    const x = Number(tag.match(/\bx="(-?[\d.]+)"/)?.[1])
    const y = Number(tag.match(/\by="(-?[\d.]+)"/)?.[1])
    const w = Number(tag.match(/\bwidth="(-?[\d.]+)"/)?.[1])
    const h = Number(tag.match(/\bheight="(-?[\d.]+)"/)?.[1])
    if (![x, y, w, h].every(Number.isFinite)) continue
    visit(x, y)
    visit(x + w, y + h)
  }
  for (const match of html.matchAll(/<circle\b[^>]*>/g)) {
    const tag = match[0]
    const cx = Number(tag.match(/\bcx="(-?[\d.]+)"/)?.[1])
    const cy = Number(tag.match(/\bcy="(-?[\d.]+)"/)?.[1])
    const r = Number(tag.match(/\br="(-?[\d.]+)"/)?.[1])
    if ([cx, cy, r].every(Number.isFinite)) {
      visit(cx - r, cy - r)
      visit(cx + r, cy + r)
    }
  }
  for (const match of html.matchAll(/<ellipse\b[^>]*>/g)) {
    const tag = match[0]
    const cx = Number(tag.match(/\bcx="(-?[\d.]+)"/)?.[1])
    const cy = Number(tag.match(/\bcy="(-?[\d.]+)"/)?.[1])
    const rx = Number(tag.match(/\brx="(-?[\d.]+)"/)?.[1])
    const ry = Number(tag.match(/\bry="(-?[\d.]+)"/)?.[1])
    if ([cx, cy, rx, ry].every(Number.isFinite)) {
      visit(cx - rx, cy - ry)
      visit(cx + rx, cy + ry)
    }
  }
  for (const match of html.matchAll(/<line\b[^>]*>/g)) {
    const tag = match[0]
    visit(Number(tag.match(/\bx1="(-?[\d.]+)"/)?.[1]), Number(tag.match(/\by1="(-?[\d.]+)"/)?.[1]))
    visit(Number(tag.match(/\bx2="(-?[\d.]+)"/)?.[1]), Number(tag.match(/\by2="(-?[\d.]+)"/)?.[1]))
  }
  // <path d="..."> 里所有坐标对（M/L/C/Q/A 后续的数字对）
  for (const match of html.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)) {
    const d = match[1]
    const tokens = d.match(/-?\d+(?:\.\d+)?/g) ?? []
    for (let index = 0; index + 1 < tokens.length; index += 2) {
      visit(Number(tokens[index]), Number(tokens[index + 1]))
    }
  }
  return found ? { minX, maxX, minY, maxY } : null
}

/** 提取指针的 rotate()：角度 + 转轴（用于判断指针是否画在表盘内） */
function needlePivot(html: string): { angle: number; pivot: { x: number; y: number } } | null {
  const match = html.match(/<g transform="rotate\((-?[\d.]+) (-?[\d.]+) (-?[\d.]+)\)"/)
  if (match === null) return null
  return { angle: Number(match[1]), pivot: { x: Number(match[2]), y: Number(match[3]) } }
}

/**
 * 从渲染结果里按 `data-part` 取出某个矩形结构件的**真实几何**。
 * 用 data 属性绑定，测试读到的就是画出来的那块几何，而不是测试里手抄的常量
 * —— 这才是"改坏了会红"的前提。
 */
function renderedPart(html: string, part: string): { x: number; y: number; width: number; height: number } | null {
  const match = html.match(new RegExp(`<rect\\b[^>]*data-part="${part}"[^>]*>`))
  if (match === null) return null
  const tag = match[0]
  return {
    x: Number(tag.match(/\bx="(-?[\d.]+)"/)?.[1]),
    y: Number(tag.match(/\by="(-?[\d.]+)"/)?.[1]),
    width: Number(tag.match(/\bwidth="(-?[\d.]+)"/)?.[1]),
    height: Number(tag.match(/\bheight="(-?[\d.]+)"/)?.[1]),
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
    // 三处刻字分别带 data-part，读出它们的真实 y
    for (const [part, label] of [['ammeter-label-neg', '－'], ['ammeter-label-06', '0.6A'], ['ammeter-label-3', '3A']] as const) {
      const match = html.match(new RegExp(`<text\\b[^>]*data-part="${part}"[^>]*>${label}</text>`))
      expect(match, `${part} 刻字没有渲染出来`).not.toBeNull()
      const y = Number(match![0].match(/\by="(-?[\d.]+)"/)?.[1])
      expect(y, `${label} 刻字跑到了台肩外面（会飘在表体下方）`).toBeGreaterThanOrEqual(flange.y)
      expect(y, `${label} 刻字跑到了台肩外面`).toBeLessThanOrEqual(flange.y + flange.height)
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
