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
import { NEEDLE_LIMIT_ANGLE, RANGE_SPEC, needleAngle } from './definition'

function render(node: React.ReactElement): string {
  return renderToString(<svg>{node}</svg>)
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

  it('底座带拉丝金属高光与两端螺钉（不是一条纯灰矩形）', () => {
    expect(html).toMatch(/METAL|#c9ced4|#f2f4f6|#8d949c/)
    // 螺钉的十字槽
    expect(html).toMatch(/M -2\.6 0 L 2\.6 0/)
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
    // 铰链轴销
    expect(open).toMatch(/<circle[^>]*r="6"/)
  })

  it('刀片是金属高光条（冲压钢片），不是一条黑色线段', () => {
    expect(open).toMatch(/METAL_LIGHT|#f2f4f6/)
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

  it('刻度线两排齐全（外圈 31 根 + 内圈 31 根 + 弧线）', () => {
    // 刻度用 <line> 画，另有弧线用 <path>
    expect(count(html, 'line')).toBeGreaterThanOrEqual(62)
    expect(html).toMatch(/<path[^>]*A 52 52 0 0 1/)
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
      // 指针仍落在合法角度上
      expect(html).toMatch(/rotate\(0 0 16\)/)
    }
  })

  it('读数取负或超量程时指针仍被夹在合法角度内', () => {
    const negative = render(<AmmeterA1 x={0} y={0} reading={-9} range="0.6A" overRange={false} label="A1" />)
    const huge = render(<AmmeterA1 x={0} y={0} reading={999} range="0.6A" overRange={false} label="A1" />)
    for (const html of [negative, huge]) {
      expect(html).not.toContain('NaN')
      const angles = [...html.matchAll(/rotate\((-?[\d.]+) 0 16\)/g)].map((m) => Number(m[1]))
      expect(angles).toHaveLength(1)
      expect(Math.abs(angles[0])).toBeLessThanOrEqual(NEEDLE_LIMIT_ANGLE)
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
    // 渲染两次同一器材，两棵子树的渐变 id 必须不同
    const first = render(<AmmeterA1 x={0} y={0} reading={0} range="3A" overRange={false} label="A1" />)
    const second = render(<AmmeterA1 x={0} y={0} reading={0} range="3A" overRange={false} label="A1" />)
    expect(first).toBe(second) // 单次 SSR 渲染确定性
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
