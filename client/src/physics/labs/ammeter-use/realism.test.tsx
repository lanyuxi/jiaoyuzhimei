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

/**
 * 解析一个标签的 `transform` / `style.transform`，返回平移量。
 *
 * 这是第五轮复审点名的根因：上一版只认**属性形式的单层** `<g transform="translate(x y)">`，
 * 于是下面三条路整类溜过去（都已实测复现）：
 *   · `style={{ transform: 'translate(66px, 0px)' }}` —— 表盘悬在表壳外，54/54 全绿；
 *   · `rotate / scale / matrix` —— 任何解析不了的写法被静默跳过；
 *   · 没被 `data-part` 标记的元素 —— 自证红线遍历不到，任何平移都不检查（169/169 全绿）。
 *
 * 所以这里改成「**要么完全懂，要么报错**」：
 *   · 同时解析属性形式与 `style` 形式的 transform；
 *   · 认识的平移（`translate` / `translateX` / `translateY`）如实累加；
 *   · 认识的**非平移**变换（`rotate` / `scale` / `matrix` / `skew`）按原样透出，
 *     由调用方决定是否合法（`<g transform="rotate(...)">` 是合法用法）；
 *   · 只要出现**任何**解析不了的非零变换，**直接抛错** —— 静默跳过正是前几轮反复翻车的机制。
 */
const KNOWN_TRANSFORM_FUNCTIONS = ['translate', 'translateX', 'translateY', 'rotate', 'scale', 'matrix', 'skewX', 'skewY', 'skew']

/** 把 `px` 之类的单位后缀去掉，留下数字；带未知单位时返回 NaN（交给调用方报错） */
function numeric(raw: string | undefined): number {
  if (raw === undefined) return Number.NaN
  const match = raw.trim().match(/^(-?[\d.]+(?:e[-+]?\d+)?)(px|)$/i)
  if (match === null) return Number.NaN
  return Number(match[1])
}

type TransformPart = { fn: string; args: number[]; raw: string }

/**
 * 解析一条 transform 字符串为函数列表。写法不认识就直接抛错。
 * 覆盖：`translate(66px, 0px)`、`translate(66 0)`、`translateX(20)`、
 *      `rotate(45 0 0)`、`scale(1.2)`、`matrix(a b c d e f)`、多函数串联。
 */
function parseTransform(raw: string, where: string): TransformPart[] {
  const parts: TransformPart[] = []
  let cursor = 0
  while (cursor < raw.length) {
    const skipped = raw.slice(cursor).match(/^[\s,]+/)
    if (skipped !== null) {
      cursor += skipped[0].length
      continue
    }
    const head = raw.slice(cursor).match(/^([A-Za-z]+)\s*\(([^)]*)\)/)
    if (head === null) {
      throw new Error(`${where}: 无法解析的 transform 片段 "${raw.slice(cursor)}"（只支持 ${KNOWN_TRANSFORM_FUNCTIONS.join(' / ')}）`)
    }
    const fn = head[1]
    if (!KNOWN_TRANSFORM_FUNCTIONS.includes(fn)) {
      throw new Error(`${where}: 出现未知变换函数 ${fn}()，几何判据看不懂它，拒绝静默跳过`)
    }
    const args = head[2].split(/[\s,]+/).filter((token) => token.length > 0).map((token) => {
      const value = numeric(token)
      if (!Number.isFinite(value)) {
        throw new Error(`${where}: 变换参数 "${token}" 不是可解析的数值`)
      }
      return value
    })
    parts.push({ fn, args, raw: head[0] })
    cursor += head[0].length
  }
  return parts
}

/** 从 HTML 标签原文里取出原始的 transform 字符串（属性形式与 style 形式都算） */
function rawTransformOf(rawTag: string): string | null {
  const attribute = rawTag.match(/\btransform="([^"]*)"/)
  const styleAttribute = rawTag.match(/\bstyle="([^"]*)"/)
  const fromStyle = styleAttribute === null ? undefined : styleAttribute[1].match(/(?:^|;)\s*transform\s*:\s*([^;]+)/)
  const list = [attribute?.[1], fromStyle?.[1]].filter((item): item is string => item !== undefined)
  if (list.length === 0) return null
  return list.join(' ')
}

/** 把一条 transform 分解成「平移量」与「其它（旋转/缩放/矩阵）函数」 */
function decomposeTransform(raw: string, where: string): { translate: { x: number; y: number }; others: TransformPart[] } {
  const translate = { x: 0, y: 0 }
  const others: TransformPart[] = []
  for (const part of parseTransform(raw, where)) {
    if (part.fn === 'translate') {
      translate.x += part.args[0] ?? 0
      translate.y += part.args[1] ?? 0
    } else if (part.fn === 'translateX') {
      translate.x += part.args[0] ?? 0
    } else if (part.fn === 'translateY') {
      translate.y += part.args[0] ?? 0
    } else {
      others.push(part)
    }
  }
  return { translate, others }
}

/**
 * 维护 `<g>` 栈并累计 translate / style.transform，得到某个下标处的世界坐标偏移。
 *
 * 关键纪律：**只认 `<g>` 的变换**。若在绘图元素（rect / path / text …）上直接写 transform，
 * 说明几何口径已经失控，直接抛错而不是静默按 0 处理。
 */
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
      const raw = rawTransformOf(rawTag)
      const { translate, others } = raw === null
        ? { translate: { x: 0, y: 0 }, others: [] }
        : decomposeTransform(raw, 'worldOffsetAt')
      if (others.length > 0 && !rawTag.includes('data-anchor="local"')) {
        // 只算 translate 是不够的：`scale` / `matrix` / `rotate` 同样会改变图元落点，
        // 若静默按 0 处理，几何判据就是"看着像覆盖了"（复审点名的同源问题）。
        throw new Error(`worldOffsetAt: <g> 上有非平移变换 ${others.map((o) => o.raw).join(' ')}，几何口径无法推导`)
      }
      stack.push(translate)
    } else if (rawTransformOf(rawTag) !== null) {
      // 绘图元素上直接挂 transform：几何判据按「声明坐标 == 渲染坐标」推导，
      // 这里看不懂就抛错，绝不静默当成 0（静默是前几轮反复翻车的机制）。
      throw new Error(`worldOffsetAt: <${name}> 上直接写了 transform，几何口径无法推导`)
    }
    cursor = end + 1
  }
  return stack.reduce((acc, item) => ({ x: acc.x + item.x, y: acc.y + item.y }), { x: 0, y: 0 })
}

/**
 * 渲染结果里**每一层 `<g>`** 的累计平移量，用于「画面上任何东西被挪走都要被看见」。
 *
 * 关键纪律（第五轮复审漏洞 C 的根治）：这里**不依赖 `data-part`**。
 * 老实现只遍历带标记的元素，于是「没被标记的元素被平移」完全不检查 ——
 * 实测把内圈量程数字包一层 `translate(0 200)`，目录 169/169 全绿而数字飘出表体 200px。
 *
 * 两种**合法**的平移在源码里必须显式声明 `data-anchor`，不能靠"恰好为 0"：
 *   · `data-anchor="root"`  —— 组件根节点，把器材摆到世界坐标 (x, y)，任意值合法；
 *   · `data-anchor="local"` —— 器材内部的局部装配（螺钉、卡箍、灯座、刀片转轴），
 *                              它是"声明坐标即渲染坐标"的显式声明，因此不参与红线检查。
 *
 * 未声明的 `<g>`：累计平移必须为 0。任何"偷偷包一层 `<g>` 把零件挪走"的改动都会立刻红，
 * 而且**无论它有没有被 `data-part` 标记**。
 */
type GroupInfo = { x: number; y: number; tag: string; anchor: string | null; hasNonTranslate: boolean }

function groupInfos(html: string): GroupInfo[] {
  const infos: GroupInfo[] = []
  const stack: Array<{ x: number; y: number }> = []
  let cursor = 0
  while (cursor < html.length) {
    const lt = html.indexOf('<', cursor)
    if (lt === -1) break
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
    const name = rawTag.replace(/^\//, '').split(/[\s/>]/)[0].toLowerCase()
    if (rawTag.startsWith('/')) {
      if (name === 'g') stack.pop()
      cursor = end + 1
      continue
    }
    if (name === 'g') {
      const raw = rawTransformOf(rawTag)
      const { translate, others } = raw === null
        ? { translate: { x: 0, y: 0 }, others: [] }
        : decomposeTransform(raw, 'groupInfos')
      const inherited = stack[stack.length - 1] ?? { x: 0, y: 0 }
      stack.push({ x: inherited.x + translate.x, y: inherited.y + translate.y })
      const anchor = rawTag.match(/data-anchor="([^"]+)"/)
      infos.push({
        x: stack[stack.length - 1].x,
        y: stack[stack.length - 1].y,
        tag: rawTag,
        anchor: anchor === null ? null : anchor[1],
        hasNonTranslate: others.length > 0,
      })
      if (rawTag.endsWith('/')) stack.pop()
    }
    cursor = end + 1
  }
  return infos
}

/**
 * 未声明 `data-anchor` 的 `<g>` 必须既**没有平移**、也**没有其它变换** —— 否则几何口径与画面脱节。
 *
 * 只查平移是不够的：`scale` / `matrix` 同样改变图元落点，而它们不体现在 translate 累计里。
 * 实测过这条：给表盘外包一层 `scale(1.4)` 时，只查平移的实现全绿（漏检）。
 */
function undeclaredOffsetGroups(html: string): GroupInfo[] {
  return groupInfos(html).filter(
    (info) =>
      info.anchor === null &&
      (Math.abs(info.x) > 1e-9 || Math.abs(info.y) > 1e-9 || info.hasNonTranslate),
  )
}

/** 可绘制元素总数（不含 `<g>` / `<defs>` / 渐变等非图元），用于覆盖面互证 */
const PAINTABLE_TAGS = ['rect', 'circle', 'ellipse', 'line', 'path', 'text', 'polygon', 'polyline'] as const

function paintableElementCount(html: string): number {
  let total = 0
  for (const tag of PAINTABLE_TAGS) total += count(html, tag)
  return total
}

/**
 * 列出**没有** data-part 的可绘制元素标签原文。
 *
 * 注意不能拿「带标记的元素数」去和「图元总数」相减 —— 同一个 data-part 会被
 * 多份实例复用（如 31 根刻度线共用 `ammeter-scale-outer`），数量口径根本对不上。
 * 这里直接数"没标记的那些"，口径唯一且不会算错。
 */
function unmarkedPaintableTags(html: string): string[] {
  const pattern = new RegExp(`<(${PAINTABLE_TAGS.join('|')})\\b[^>]*>`, 'g')
  return [...html.matchAll(pattern)]
    .map((match) => match[0])
    .filter((tag) => !tag.includes('data-part='))
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

/**
 * 某个带 data-part 的**矩形**实例的枚举（世界坐标），用于"每份实例都必须画在自己的主体里"。
 * 与 `renderedPart` 的区别：`renderedPart` 只取第一份，这里取全部 —— 前面反复踩过
 * 「只守住第一份」的坑（4 圈螺纹只判 1 圈、5 颗螺钉只判第 1 颗）。
 */
function renderedParts(html: string, part: string): Array<{ x: number; y: number; width: number; height: number }> {
  const pattern = new RegExp(`<rect\\b[^>]*data-part="${part}"[^>]*>`, 'g')
  const list: Array<{ x: number; y: number; width: number; height: number }> = []
  for (const match of html.matchAll(pattern)) {
    const tag = match[0]
    const local = {
      x: Number(tag.match(/\bx="(-?[\d.]+)"/)?.[1]),
      y: Number(tag.match(/\by="(-?[\d.]+)"/)?.[1]),
      width: Number(tag.match(/\bwidth="(-?[\d.]+)"/)?.[1]),
      height: Number(tag.match(/\bheight="(-?[\d.]+)"/)?.[1]),
    }
    if (![local.x, local.y, local.width, local.height].every(Number.isFinite)) continue
    const o = worldOffsetAt(html, match.index ?? 0)
    list.push({ x: o.x + local.x, y: o.y + local.y, width: local.width, height: local.height })
  }
  return list
}

/** 某个带 data-part 的**线段**实例（世界坐标端点） */
function renderedLines(html: string, part?: string): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const pattern = part === undefined ? /<line\b[^>]*>/g : new RegExp(`<line\\b[^>]*data-part="${part}"[^>]*>`, 'g')
  const list: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (const match of html.matchAll(pattern)) {
    const tag = match[0]
    const local = {
      x1: Number(tag.match(/\bx1="(-?[\d.]+)"/)?.[1]),
      y1: Number(tag.match(/\by1="(-?[\d.]+)"/)?.[1]),
      x2: Number(tag.match(/\bx2="(-?[\d.]+)"/)?.[1]),
      y2: Number(tag.match(/\by2="(-?[\d.]+)"/)?.[1]),
    }
    if (![local.x1, local.y1, local.x2, local.y2].every(Number.isFinite)) continue
    const o = worldOffsetAt(html, match.index ?? 0)
    list.push({ x1: o.x + local.x1, y1: o.y + local.y1, x2: o.x + local.x2, y2: o.y + local.y2 })
  }
  return list
}

/** 某个带 data-part 的圆实例（世界坐标） */
function renderedCircles(html: string, part: string): Array<{ cx: number; cy: number; r: number }> {
  const pattern = new RegExp(`<circle\\b[^>]*data-part="${part}"[^>]*>`, 'g')
  const list: Array<{ cx: number; cy: number; r: number }> = []
  for (const match of html.matchAll(pattern)) {
    const tag = match[0]
    const local = {
      cx: Number(tag.match(/\bcx="(-?[\d.]+)"/)?.[1]),
      cy: Number(tag.match(/\bcy="(-?[\d.]+)"/)?.[1]),
      r: Number(tag.match(/\br="(-?[\d.]+)"/)?.[1]),
    }
    if (![local.cx, local.cy, local.r].every(Number.isFinite)) continue
    const o = worldOffsetAt(html, match.index ?? 0)
    list.push({ cx: o.x + local.cx, cy: o.y + local.cy, r: local.r })
  }
  return list
}

/**
 * 某组矩形，**并且把祖先链上的 rotate 真正施加到角点上**（世界坐标）。
 *
 * 背景：`worldOffsetAt` 只累加 translate —— 这对绝大多数判据是对的（几何红线要求
 * 除 `data-anchor` 外不得有变换），但**开关刀片**与**电流表指针**是刻意用
 * `<g data-anchor="local" transform="rotate(...)">` 装配的。
 * 只读声明坐标会让"刀片抬起 32°"完全看不见（实测落差 0.0px，判据假绿）。
 *
 * 所以这里单独提供一个"带旋转"的解析出口，**仅**用于确实带 rotate 的局部装配件。
 */
function renderedPartsRotated(
  html: string,
  part: string,
): Array<{ corners: Array<{ x: number; y: number }> }> {
  const pattern = new RegExp(`<rect\\b[^>]*data-part="${part}"[^>]*>`, 'g')
  const list: Array<{ corners: Array<{ x: number; y: number }> }> = []
  for (const match of html.matchAll(pattern)) {
    const tag = match[0]
    const x = Number(tag.match(/\bx="(-?[\d.]+)"/)?.[1])
    const y = Number(tag.match(/\by="(-?[\d.]+)"/)?.[1])
    const width = Number(tag.match(/\bwidth="(-?[\d.]+)"/)?.[1])
    const height = Number(tag.match(/\bheight="(-?[\d.]+)"/)?.[1])
    if (![x, y, width, height].every(Number.isFinite)) continue

    // 收集祖先链上的 translate 与 rotate（按从外到内的顺序施加）
    const operations = ancestorOperations(html, match.index ?? 0)
    const corners = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ].map((point) => {
      let current = point
      for (const operation of operations) {
        if (operation.fn === 'translate') {
          current = { x: current.x + (operation.args[0] ?? 0), y: current.y + (operation.args[1] ?? 0) }
        } else if (operation.fn === 'rotate') {
          const angle = ((operation.args[0] ?? 0) * Math.PI) / 180
          const cx = operation.args[1] ?? 0
          const cy = operation.args[2] ?? 0
          const dx = current.x - cx
          const dy = current.y - cy
          current = { x: cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) }
        }
      }
      return current
    })
    list.push({ corners })
  }
  return list
}

/** 祖先 `<g>` 链上的变换操作，按从外到内排列（供带旋转的解析使用） */
function ancestorOperations(html: string, index: number): TransformPart[] {
  const stack: string[] = []
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
    const name = rawTag.replace(/^\//, '').split(/[\s/>]/)[0].toLowerCase()
    if (rawTag.startsWith('/')) {
      if (name === 'g') stack.pop()
    } else if (name === 'g') {
      stack.push(rawTag)
      if (rawTag.endsWith('/')) stack.pop()
    }
    cursor = end + 1
  }
  const operations: TransformPart[] = []
  for (const tag of stack) {
    const raw = rawTransformOf(tag)
    if (raw === null) continue
    operations.push(...parseTransform(raw, 'ancestorOperations').filter((part) => part.fn === 'translate' || part.fn === 'rotate'))
  }
  return operations
}

/**
 * 某个带 `data-part` 的 **path** 实例的几何包围盒（世界坐标）。
 *
 * 补齐 `renderedParts`（只认 rect）的缺口：电池卡箍（`E1-clamp`）、灯座筒口（`lamp-socket`）、
 * 玻璃泡（`lamp-glass`）这些承力结构都是 `<path>`，
 * 用 rect 解析会得到空集合，于是"零件飘出主体"的判据对它们整类失效（实测漏检过）。
 */
function renderedPathBounds(html: string, part: string): Array<{ minX: number; maxX: number; minY: number; maxY: number }> {
  const pattern = new RegExp(`<path\\b[^>]*data-part="${part}"[^>]*>`, 'g')
  const list: Array<{ minX: number; maxX: number; minY: number; maxY: number }> = []
  for (const match of html.matchAll(pattern)) {
    const points = pathPoints(match[0])
    if (points.length === 0) continue
    const o = worldOffsetAt(html, match.index ?? 0)
    const xs = points.map(([x]) => x + o.x)
    const ys = points.map(([, y]) => y + o.y)
    list.push({ minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) })
  }
  return list
}

/** 某组矩形的合并包围盒 */
function unionBounds(list: Array<{ x: number; y: number; width: number; height: number }>) {
  return {
    minX: Math.min(...list.map((item) => item.x)),
    maxX: Math.max(...list.map((item) => item.x + item.width)),
    minY: Math.min(...list.map((item) => item.y)),
    maxY: Math.max(...list.map((item) => item.y + item.height)),
  }
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

/**
 * 提取指针的 \`rotate()\`：角度 + 转轴（用于判断指针是否画在表盘内）。
 *
 * 纪律（复审选修改必修）：**恰好 1 个 rotate 组**。多了说明引入了装饰性 rotate，
 * 判据会静默指向错的元素 —— 那正是前几轮翻车的形态，所以这里宁可"响亮地失败"。
 * 同时转轴坐标必须换算到**世界坐标**（叠加祖先链的 translate / style.transform）。
 */
function needlePivot(html: string): { angle: number; pivot: { x: number; y: number } } | null {
  const tagPattern = /<g\b[^>]*>/g
  const rotateGroups: Array<{ tag: string; index: number; parts: TransformPart[] }> = []
  for (const match of html.matchAll(tagPattern)) {
    const raw = rawTransformOf(match[0])
    if (raw === null) continue
    const parts = parseTransform(raw, 'needlePivot')
    if (parts.some((part) => part.fn === 'rotate')) {
      rotateGroups.push({ tag: match[0], index: match.index ?? 0, parts })
    }
  }
  if (rotateGroups.length !== 1) return null
  const [group] = rotateGroups
  const rotate = group.parts.find((part) => part.fn === 'rotate')!
  const offset = worldOffsetAt(html, group.index)
  return {
    angle: rotate.args[0] ?? 0,
    pivot: { x: offset.x + (rotate.args[1] ?? 0), y: offset.y + (rotate.args[2] ?? 0) },
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
    /**
     * 判据纪律：必须按**渲染出的元素**逐层判色，不能用 `expect(html).toMatch(/#e2953a/)`
     * 这种「全文出现过这个色就算过」的写法 —— 那正是本轮补的第 5 条盲区：
     * 色一样、角色不一样（例如把橙色刷到正极铜帽上、把环标刷成灰色），全文搜色照样通过。
     * 这里改成读**色板**（见 `paintPalette`）：每个可绘制元素的真实颜色都在里面，
     * 因此可以直接断言「品牌环标的色相必须是橙色系」。
     */
    const palette = paintPalette(html)
    // 色板必须真的有内容，否则后面的颜色判据都是空转
    expect(palette.size, '色板为空，说明颜色判据抓不到任何东西').toBeGreaterThan(10)

    /** 把一个"颜色写法"解析成它实际呈现的颜色序列（渐变引用要先展开到色标） */
    const coloursOf = (fill: string): Array<{ r: number; g: number; b: number }> => {
      const raw = fill.startsWith('url(') ? resolvedStopColours(html, fill) : [fill]
      return raw
        .map((colour) => colourToRgb(colour))
        .filter((rgb): rgb is { r: number; g: number; b: number } => rgb !== null)
    }

    // 橙色印刷环标：色相必须落在橙/琥珀区间（real 1 号电池的品牌色带）
    const bandFills = paintFillsOfPart(html, 'cell-band')
    expect(bandFills.length, '电池环标一个都没渲染出来').toBeGreaterThanOrEqual(4)
    expect(
      bandFills.some((fill) => coloursOf(fill).some((rgb) => isOrangeHue(rgb))),
      '电池环标里没有橙色印刷带',
    ).toBe(true)

    // 锌壳筒身：本体必须用中性灰（低饱和）
    const bodyFills = paintFillsOfPart(html, 'cell-body')
    expect(bodyFills.length).toBeGreaterThan(0)
    for (const fill of bodyFills) {
      const rgbs = coloursOf(fill)
      expect(rgbs.length, `筒身本体的颜色 ${fill} 解析不了`).toBeGreaterThan(0)
      for (const rgb of rgbs) {
        expect(saturation(rgb), `筒身本体饱和度太高（看着像塑料彩壳而不是锌壳）：${fill}`).toBeLessThan(0.18)
      }
    }

    // 正极铜帽必须带黄铜色相（暖色、中低饱和）
    const positiveFills = paintFillsOfPart(html, 'cell-positive')
    expect(positiveFills.length).toBeGreaterThanOrEqual(4)
    expect(
      positiveFills.some((fill) => coloursOf(fill).some((rgb) => isWarmBrass(rgb))),
      '正极铜帽没有黄铜色',
    ).toBe(true)
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
    // 铰链轴销：不只判半径，还限定它必须落在刀片转轴处（旋转基准点 -58/-6）。
    // 注意标签属性顺序（data-part 在最前），所以用不带顺序假设的子串判定。
    expect(open).toMatch(/<circle\b[^>]*cx="-58"[^>]*cy="-6"[^>]*r="6"/)
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

/* ------------------------------------------------------------------ *
 * 外观（颜色 / 光影 / 材质）判据
 *
 * 前六轮复审把**几何**维度守得很死，但外观维度整类没有被守：
 * 实测把「橙色品牌环标」的色相从橙改成绿、把环标箔高光删掉、
 * 把圆柱体积渐变的首尾压成同一个颜色，`ammeter-use` 目录 **173/173 全绿**，
 * 而器材立刻退回"灰盒子"观感 —— 正是需求原话「跟真实的器材一模一样」最核心的部分。
 *
 * 所以下面这组判据把**颜色本身**也纳入红线，并且同样遵守前几轮的纪律：
 *   · 读**渲染结果**，不读源码文本、不手抄常量；
 *   · 逐**元素实例**判色，不做"全文出现过这个色"的弱判据；
 *   · 渐变按**色标序列**判（首尾明度跨度、真被引用），而不是只看渐变存不存在。
 * ------------------------------------------------------------------ */

/** `#rgb` / `#rrggbb` -> 0-255 三元组；解析不了返回 null（绝不静默当成某个默认色） */
function hexToRgb(raw: string | undefined): { r: number; g: number; b: number } | null {
  if (raw === undefined) return null
  const value = raw.trim()
  const short = value.match(/^#([0-9a-f]{3})$/i)
  if (short !== null) {
    const [r, g, b] = short[1].split('')
    return { r: Number.parseInt(r + r, 16), g: Number.parseInt(g + g, 16), b: Number.parseInt(b + b, 16) }
  }
  const long = value.match(/^#([0-9a-f]{6})$/i)
  if (long !== null) {
    return {
      r: Number.parseInt(long[1].slice(0, 2), 16),
      g: Number.parseInt(long[1].slice(2, 4), 16),
      b: Number.parseInt(long[1].slice(4, 6), 16),
    }
  }
  return null
}

/** rgba(r, g, b, a) -> 三元组（忽略 alpha；alpha 另有专用判据） */
function rgbaToRgb(raw: string): { r: number; g: number; b: number } | null {
  const match = raw.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/)
  if (match === null) return null
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) }
}

/** 任意颜色写法 -> 三元组；解析不了返回 null */
function colourToRgb(raw: string): { r: number; g: number; b: number } | null {
  return hexToRgb(raw) ?? rgbaToRgb(raw)
}

/** 相对明度 0（黑）～1（白） */
function luminance(rgb: { r: number; g: number; b: number }): number {
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
}

/** HSV 意义上的饱和度 0～1（用于"锌壳必须是中性灰""环标必须是彩色"这类判据） */
function saturation(rgb: { r: number; g: number; b: number }): number {
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  return max === 0 ? 0 : (max - min) / max
}

/** 色相角 0～360 */
function hueDegrees(rgb: { r: number; g: number; b: number }): number {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return 0
  let hue: number
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  return ((hue * 60) + 360) % 360
}

/** 橙 / 琥珀色相区间（真实干电池品牌环标），并排除"灰得看不出颜色"的低饱和色 */
function isOrangeHue(rgb: { r: number; g: number; b: number }): boolean {
  const hue = hueDegrees(rgb)
  return hue >= 15 && hue <= 48 && saturation(rgb) > 0.35
}

/** 黄铜：暖色相 + 中低饱和 + 不太暗（#b9a071 / #d9c187 / #e8d5ab 一类） */
function isWarmBrass(rgb: { r: number; g: number; b: number }): boolean {
  const hue = hueDegrees(rgb)
  return hue >= 25 && hue <= 60 && saturation(rgb) > 0.12 && saturation(rgb) < 0.65 && luminance(rgb) > 0.35
}

/** 从渲染结果里取出某个渐变（linear/radial 都算）的色标颜色序列 */
function gradientStops(html: string, gradientId: string): Array<{ offset: number; colour: string }> {
  const definition = html.match(new RegExp(`<(linear|radial)Gradient id="${gradientId}"[^>]*>([\\s\\S]*?)</\\1Gradient>`))
  if (definition === null) return []
  return [...definition[2].matchAll(/<stop offset="([\d.]+)%"[^>]*stop-color="([^"]+)"/g)].map((match) => ({
    offset: Number(match[1]),
    colour: match[2],
  }))
}

/** 某条 `fill="url(#uid-xxx)"` 引用解析出的全部色标颜色（按出现顺序） */
function resolvedStopColours(html: string, fill: string): string[] {
  const id = fill.match(/url\(#([^)]+)\)/)?.[1]
  if (id === undefined) return []
  return gradientStops(html, id).map((stop) => stop.colour)
}

/**
 * 某个 data-part 的所有实例的**生效颜色**（fill / stroke），按渲染顺序。
 *
 * 关键：必须是**生效值**而不是「本元素自己有没有写这个属性」。
 * SVG 的 `fill` / `stroke` 是继承属性，`<line data-part="switch-handle-grip" />` 的
 * 颜色写在父级 `<g stroke="...">` 上 —— 只读元素自身的属性会取到空数组，
 * 于是「把防滑纹删掉」这条判据会因为**判据自己取不到颜色**而假绿（实测踩过）。
 * 所以这里按祖先链向上解析，取第一个声明该属性的祖先。
 */
function paintFillsOfPart(html: string, part: string, attribute: 'fill' | 'stroke' = 'fill'): string[] {
  const pattern = new RegExp(`<[a-z]+\\b[^>]*data-part="${part}"[^>]*>`, 'g')
  const values: string[] = []
  for (const match of html.matchAll(pattern)) {
    const own = match[0].match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1]
    if (own !== undefined) {
      values.push(own)
      continue
    }
    // 向上找祖先链上的继承值（限定在 <g> 上，与几何判据同源）
    const inherited = inheritedPresentation(html, match.index ?? 0, attribute)
    if (inherited !== undefined) values.push(inherited)
  }
  return values
}

/** 从某个下标向前回溯，取祖先 `<g>` 链上最近一次声明的 `fill` / `stroke` */
function inheritedPresentation(html: string, index: number, attribute: 'fill' | 'stroke'): string | undefined {
  const stack: string[] = []
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
    const name = rawTag.replace(/^\//, '').split(/[\s/>]/)[0].toLowerCase()
    if (rawTag.startsWith('/')) {
      if (name === 'g') stack.pop()
    } else if (name === 'g') {
      stack.push(rawTag)
      if (rawTag.endsWith('/')) stack.pop()
    }
    cursor = end + 1
  }
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const value = stack[i].match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1]
    if (value !== undefined) return value
  }
  return undefined
}

/**
 * 整张「色板」：渲染结果里**每个可绘制元素**（含 `<stop>`）的真实颜色与所属 data-part。
 *
 * 这是外观判据的唯一出口 —— 和几何判据的 `worldOffsetAt` 对应。
 * 它同时给出**覆盖面**：`parts` 里出现过的 data-part 数量可以与元素总数互证，
 * 从而保证"我不会漏检某个元素"，而不是靠我记得把清单写全。
 */
function paintPalette(html: string): Map<string, { tag: string; part: string | null; colour: string }> {
  const palette = new Map<string, { tag: string; part: string | null; colour: string }>()
  for (const match of html.matchAll(/<(rect|circle|ellipse|line|path|text|polygon|polyline)\b[^>]*>/g)) {
    const tag = match[0]
    const raw = tag.match(/\bfill="([^"]+)"/)?.[1] ?? tag.match(/\bstroke="([^"]+)"/)?.[1]
    if (raw === undefined || raw === 'none') continue
    const uid = `${match.index ?? 0}:${raw}`
    palette.set(uid, { tag: match[1], part: tag.match(/data-part="([^"]+)"/)?.[1] ?? null, colour: raw })
  }
  // 渐变色标同样是"画面上真实的颜色"，必须一起纳入色板
  for (const match of html.matchAll(/<stop offset="([\d.]+)%"[^>]*stop-color="([^"]+)"[^>]*\/>/g)) {
    palette.set(`stop@${match.index ?? 0}`, { tag: 'stop', part: null, colour: match[2] })
  }
  return palette
}

/** 只有"看得见颜色"的颜色写法才纳入色板断言（url(#…) 需要先解析到色标） */
function directColoursOfPalette(palette: Map<string, { colour: string }>): string[] {
  return [...palette.values()].map((item) => item.colour).filter((colour) => !colour.startsWith('url('))
}

/**
 * 外观回归（本轮新增）：把「颜色 / 光影 / 材质」纳入红线。
 *
 * 前六轮的判据全部落在**几何位置**上，于是外观维度整类失守。实测（每个变异体都真跑过）：
 *
 *   | 变异体                                       | 改前结果        |
 *   | -------------------------------------------- | --------------- |
 *   | 圆柱体积渐变首尾压成同一颜色（死色筒身）     | **173/173 全绿** |
 *   | 筒身轮廓描边整条删除                          | **173/173 全绿** |
 *   | 筒身镜面反射带整条删除                        | **173/173 全绿** |
 *   | 正极铜帽的亮面分层删掉一层                    | **173/173 全绿** |
 *   | 电流表盘内阴影（上沿）删除                    | **173/173 全绿** |
 *   | 橙色品牌环标色相由橙改成绿                    | 仅 1 条红       |
 *   | 橙色品牌环标箔亮边删除                        | **173/173 全绿** |
 *
 * 需求原话是「**跟真实的器材一模一样**」，而干电池最显眼的真实特征恰恰就是
 * 那圈橙色品牌印刷、锌筒的体积光影与端部亮面。把它们改坏而测试全绿，
 * 与第五轮那条「画面崩了但 169 全绿」是同一类问题，只是换了一个维度。
 *
 * 判据纪律与几何判据一致：读渲染结果、逐元素实例判、渐变按色标序列判。
 */
describe('写实外观（颜色 / 光影 / 材质）不得被无声改坏', () => {
  const E1 = render(<BatteryHolderE1 x={0} y={0} />)
  const A1 = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
  const L1 = render(<LampHolderL1 x={0} y={0} lit={false} />)
  const L1_ON = render(<LampHolderL1 x={0} y={0} lit />)
  const S1 = render(<KnifeSwitch x={0} y={0} closed={false} label="S1" />)

  it('每个渐变色标都必须有可解析的颜色，且渐变必须真的被引用', () => {
    /**
     * 外观判据的地基：画面的颜色只有两种来源 —— 直接色值（hex/rgba）与渐变引用。
     * 这里先保证「所有颜色都看得懂」，后面的判据才不会是假绿。
     * 顺带守住「渐变定义了必须被引用」：把 `fill="url(#…)"` 换成纯色也一样要红。
     */
    for (const [name, html] of [['电池 E1', E1], ['电流表 A1', A1], ['灯泡 L1', L1], ['开关 S1', S1]] as const) {
      const palette = paintPalette(html)
      expect(palette.size, `${name} 的色板为空`).toBeGreaterThan(10)

      const unreadable = directColoursOfPalette(palette).filter((colour) => colourToRgb(colour) === null && colour !== 'none')
      expect(unreadable, `${name} 出现无法解析的颜色写法，外观判据会静默漏掉它们`).toEqual([])

      // 渐变引用必须指向真实存在的渐变定义。
      // 注意：这里**不**要求每件器材都必须用渐变 —— 电流表 A1 是纯色扁平写实（深壳浅盘 + 红针），
      // 强制要求渐变会逼出"为了过测试而硬加渐变"的假写实。只要用到了，就必须可解析、可复现。
      const referenced = [...new Set([...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]))]
      for (const id of referenced) {
        expect(gradientStops(html, id).length, `${name} 引用了渐变 ${id} 但它没有可解析的色标`).toBeGreaterThanOrEqual(2)
      }
      // 但**金属筒身/玻璃泡**这类靠渐变表达体积的器材必须真的有渐变
      if (['电池 E1', '灯泡 L1'].includes(name)) {
        expect(referenced.length, `${name} 没有使用任何渐变（靠体积光影写实的器材失去渐变会退回色块）`).toBeGreaterThan(0)
      }
      // 反向：定义了的渐变不允许无人引用（防止"改了 id 导致全都退回纯色"）
      const defined = [...html.matchAll(/<(?:linear|radial)Gradient id="([^"]+)"/g)].map((m) => m[1])
      for (const id of defined) {
        expect(html, `${name} 的渐变 ${id} 定义了却没有被引用（画面会退回纯色）`).toContain(`url(#${id})`)
      }
    }
  })

  it('圆柱体积渐变必须有真实的明暗跨度（首尾同色 = 死色筒身，必须红）', () => {
    /**
     * 这是本轮筛出的第 1 条外观盲区：把 `cyl` 渐变的 5 个色标压成同一个颜色，
     * 干电池立刻变成一块灰色平板，`ammeter-use` 目录仍然 173/173 全绿。
     *
     * 判据：金属筒身的渐变**首尾色标明度跨度必须够大**。
     * 实测真值 0.360（0.370 → 0.214），退化成同色时为 0，阈值 0.18 有充分余量。
     */
    const bodyFill = paintFillsOfPart(E1, 'cell-body')[0]
    expect(bodyFill, '筒身本体没有渲染出来').toBeDefined()
    const stops = resolvedStopColours(E1, bodyFill)
    expect(stops.length, '圆柱渐变没有色标').toBeGreaterThanOrEqual(3)

    const lums = stops.map((colour) => {
      const rgb = colourToRgb(colour)
      expect(rgb, `圆柱渐变色标 ${colour} 解析不了`).not.toBeNull()
      return luminance(rgb!)
    })
    const span = Math.max(...lums) - Math.min(...lums)
    expect(span, `圆柱渐变的明度跨度只有 ${span.toFixed(3)}，筒身看着是一块死色（真实金属筒身需要明显的明暗过渡）`)
      .toBeGreaterThan(0.18)

    // 并且**必须往两个方向走**：上亮下暗（竖向受光），而不是"亮—亮—更亮"这种单调渐变
    expect(lums[0], '圆柱顶部应当受光（比中部亮）').toBeGreaterThan(lums[lums.length - 1])
    expect(Math.max(...lums) - lums[lums.length - 1], '圆柱底部应当明显转暗，才有体积感').toBeGreaterThan(0.12)

    // 品牌环标渐变同样要有跨度（否则印刷带平面化）
    const bandStops = resolvedStopColours(E1, paintFillsOfPart(E1, 'cell-band').find((fill) => fill.startsWith('url('))!)
    const bandLums = bandStops.map((colour) => luminance(colourToRgb(colour)!))
    expect(Math.max(...bandLums) - Math.min(...bandLums), '橙色品牌环标渐变被压平，印刷带失去金属感').toBeGreaterThan(0.18)
  })

  it('电池的品牌环标必须是橙色印刷带，且带箔亮边（改色相 / 删亮边都要红）', () => {
    /**
     * 第 2 条盲区：把品牌环标的色相从橙整体改成绿，只有 1 条断言变红；
     * 把 `#f4bd6f` 那条箔亮边删掉，**173/173 全绿**。
     *
     * 判据：环标里必须存在**橙色相**（色相 15°～48° 且饱和度 > 0.35）的填充，
     * 并且必须存在一条明亮的箔边（高饱和暖色 + 高明度），而不是"有个橙色出现就算过"。
     * 因为这里逐的是 `cell-band` 的**实例**，所以橙色被刷到别的零件上不算数。
     */
    const fills = paintFillsOfPart(E1, 'cell-band')
    expect(fills.length, '电池环标实例数不对').toBeGreaterThanOrEqual(4)

    // 橙色印刷带：要么是橙色渐变（看色标），要么是直接橙色
    const orangeEvidence = fills.filter((fill) => {
      const colours = fill.startsWith('url(') ? resolvedStopColours(E1, fill) : [fill]
      return colours.some((colour) => {
        const rgb = colourToRgb(colour)
        return rgb !== null && isOrangeHue(rgb)
      })
    })
    expect(orangeEvidence.length, '品牌环标里没有任何橙色印刷带（色相被改掉 / 被去色）').toBeGreaterThan(0)

    // 箔亮边：环标里必须有一条高明度的暖色亮线（真实干电池的印刷箔边）
    const foil = fills.find((fill) => {
      const rgb = colourToRgb(fill)
      return rgb !== null && isOrangeHue(rgb) && luminance(rgb) > 0.6
    })
    expect(foil, '品牌环标的箔亮边被删掉了（印刷带失去金属反光）').toBeDefined()

    /**
     * 关键补充（本轮变异测试自查出来的漏检）：只要求"环标里存在橙色"是不够的 ——
     * 那层箔亮边本身就是实心橙色，于是把**品牌印刷带渐变的主色相**从橙改成绿，
     * 断言依然被箔亮边满足（实测 180/180 全绿）。
     * 所以必须直接判「品牌印刷带的渐变里面」有橙色，且**主体色标**也是橙色。
     */
    const bandGradients = fills.filter((fill) => fill.startsWith('url('))
    expect(bandGradients.length, '品牌印刷带没有使用渐变').toBeGreaterThan(0)
    const orangeGradients = bandGradients.filter((fill) => {
      const stops = resolvedStopColours(E1, fill)
      // 主体 = 面积占比最大的中段色标，这里取"最饱和的那个"，它就是印刷带的品牌色
      const rgbs = stops.map((colour) => colourToRgb(colour)).filter((rgb): rgb is { r: number; g: number; b: number } => rgb !== null)
      const saturated = rgbs.reduce((best, rgb) => (saturation(rgb) > saturation(best) ? rgb : best), rgbs[0])
      return isOrangeHue(saturated)
    })
    expect(orangeGradients.length, '品牌印刷带的渐变主体色相不是橙色（印刷带被改成了别的颜色）').toBeGreaterThan(0)

    /**
     * 且橙色印刷带必须是环标里**面积最大**的那一片 —— 否则"把橙色缩成一小条"仍然能过。
     * 用渲染出来的矩形面积判（`cell-band` 里用橙色渐变填充的那些）。
     */
    const bandRects = [...E1.matchAll(/<rect\b[^>]*data-part="cell-band"[^>]*>/g)].map((match) => {
      const fill = match[0].match(/\bfill="([^"]+)"/)?.[1] ?? ''
      const width = Number(match[0].match(/\bwidth="([\d.]+)"/)?.[1])
      const height = Number(match[0].match(/\bheight="([\d.]+)"/)?.[1])
      const stops = fill.startsWith('url(') ? resolvedStopColours(E1, fill) : [fill]
      const rgbs = stops.map((colour) => colourToRgb(colour)).filter((rgb): rgb is { r: number; g: number; b: number } => rgb !== null)
      const saturated = rgbs.reduce((best, rgb) => (saturation(rgb) > saturation(best) ? rgb : best), rgbs[0])
      return { area: width * height, orange: saturated !== undefined && isOrangeHue(saturated) }
    })
    const orangeArea = Math.max(0, ...bandRects.filter((item) => item.orange).map((item) => item.area))
    const totalArea = bandRects.reduce((sum, item) => sum + item.area, 0)
    expect(totalArea, '环标矩形没有解析出面积').toBeGreaterThan(0)
    expect(orangeArea / totalArea, '橙色印刷带在环标里的占比太小（真实干电池的品牌印刷带是主色）').toBeGreaterThan(0.3)

    // 锌壳筒身必须仍是中性灰：把环标的橙色"扩散"到筒身上会红
    for (const fill of paintFillsOfPart(E1, 'cell-body')) {
      const colours = fill.startsWith('url(') ? resolvedStopColours(E1, fill) : [fill]
      for (const colour of colours) {
        const rgb = colourToRgb(colour)
        expect(saturation(rgb!), `筒身本体出现高饱和色 ${colour}（锌壳应当是中性的）`).toBeLessThan(0.25)
      }
    }
  })

  it('端正/负极的金属件必须有分层亮面（删掉任一层都要红）', () => {
    /**
     * 第 3 / 4 条盲区：筒身轮廓描边、镜面反射带、正极铜帽亮面被整层删除时全绿。
     * 真实金属件的写实感来自「本体 + 轮廓 + 亮面」三层，少一层就变成色块。
     *
     * 判据用**明度阶梯**：同一件器材的金属层里，必须同时存在
     * 「暗部（luminance < 0.35）」「亮部（> 0.75）」两类颜色，并且数量足够；
     * 单纯删掉任何一层都会让其中一侧塌掉。
     */
    const lumOf = (fill: string) => {
      const rgb = colourToRgb(fill)
      return rgb === null ? null : luminance(rgb)
    }
    const allDirect = (html: string, parts: string[]) =>
      parts.flatMap((part) => paintFillsOfPart(html, part)).map(lumOf).filter((v): v is number => v !== null)

    // (a) 电池筒身：反射带（白，fill）+ 轮廓描边（深，stroke）都必须在
    const bodyLums = allDirect(E1, ['cell-body', 'cell-highlight'])
    expect(bodyLums.some((lum) => lum > 0.9), '筒身的镜面反射带（近白高光）被删掉了').toBe(true)
    // 轮廓是描边（stroke），单独取
    const outlineStrokes = paintFillsOfPart(E1, 'cell-outline', 'stroke')
    expect(outlineStrokes.length, '筒身的轮廓描边被删掉了，金属件变成没有边缘的色块').toBeGreaterThan(0)
    for (const stroke of outlineStrokes) {
      expect(luminance(colourToRgb(stroke)!), `筒身轮廓描边 ${stroke} 不够暗，金属件失去边缘`).toBeLessThan(0.3)
    }

    // (b) 正极铜帽：必须同时有亮面（近白/浅黄）与过渡面，不能只剩一片同色
    const positiveLums = allDirect(E1, ['cell-positive'])
    expect(positiveLums.length, '正极铜帽的分层不够').toBeGreaterThanOrEqual(4)
    expect(positiveLums.some((lum) => lum > 0.85), '正极铜帽的高光亮面被删掉了').toBe(true)
    expect(positiveLums.some((lum) => lum < 0.72 && lum > 0.3), '正极铜帽缺少中间过渡面（只剩高光与暗部，看着是贴纸）').toBe(true)

    // (c) 表盘内凹：上沿暗 + 下沿亮，两个方向的内阴影都必须在
    const dialShadowLums = allDirect(A1, ['ammeter-dial-shadow'])
    expect(dialShadowLums.length, '表盘内阴影被整层删掉了').toBeGreaterThanOrEqual(2)
    // 表盘提亮由「右沿」与「下沿」两层组成，删掉任一层都会让内凹感塌一半 —— 按层数严格判
    const highlights = [...A1.matchAll(/<rect\b[^>]*data-part="ammeter-dial-highlight"[^>]*>/g)]
    expect(highlights.length, '表盘提亮层数不对（右沿 + 下沿两层，删掉任一层都不行）').toBe(2)
    const highlightLums = allDirect(A1, ['ammeter-dial-highlight'])
    expect(highlightLums.every((lum) => lum > 0.9), '表盘提亮不是近白色（提亮失去作用）').toBe(true)
    // 两层必须真的落在两个不同的方向：一层贴右沿（窄而高）、一层贴下沿（宽而扁）
    const highlightTags = highlights.map((match) => ({
      width: Number(match[0].match(/\bwidth="([\d.]+)"/)?.[1]),
      height: Number(match[0].match(/\bheight="([\d.]+)"/)?.[1]),
    }))
    expect(highlightTags.some((t) => t.height > t.width), '贴右沿的竖向提亮层被删掉了').toBe(true)
    expect(highlightTags.some((t) => t.width > t.height), '贴下沿的横向提亮层被删掉了').toBe(true)

    // (d) 接线柱旋帽必须有顶面亮光与帽身暗部（真实可以手拧的旋帽）
    const terminalHtml = render(<TerminalPost x={0} y={0} polarity="+" connected={false} />)
    const capFills = [...terminalHtml.matchAll(/\bfill="(#[0-9a-fA-F]{3,6})"/g)].map((m) => m[1])
    const capLums = capFills.map((fill) => luminance(colourToRgb(fill)!))
    expect(capLums.some((lum) => lum > 0.55), '接线柱旋帽的顶面高光被删掉了').toBe(true)
    expect(capLums.some((lum) => lum < 0.25), '接线柱旋帽的暗部被删掉了（旋帽变成一块平色）').toBe(true)
  })

  it('写实外观的实例覆盖面互证：按实例份数逐层验收，不能只守住第一份', () => {
    /**
     * 与几何判据同源的纪律：清单按"我记得的结构件"列，就等于没有覆盖面保证。
     * 外观同样要按**实例份数**互证 —— 否则「4 圈螺纹只标记 1 圈」「5 颗螺钉只判第 1 颗」
     * 这类遗漏仍然能溜过去。
     *
     * 这里同时做两件事：
     *   1. 严例 —— 每一份实例都必须有可解析的颜色（漏标/漏配色就红）；
     *   2. 反例 —— 把整份实例删掉，色板里该类实例的颜色种类数必须真的变少（证明判据不空转）。
     */
    const colourKindsOf = (html: string, part: string) =>
      new Set(paintFillsOfPart(html, part).map((fill) => (fill.startsWith('url(') ? resolvedStopColours(html, fill).join('|') : fill)))

    // 正极铜帽 5 层（本体 + 亮面 + 帽身 + 亮面 + 凸点），每一层的颜色都不同
    const positive = paintFillsOfPart(E1, 'cell-positive')
    expect(positive.length, '正极铜帽实例份数不对').toBe(5)
    expect(new Set(positive).size, '正极铜帽存在完全同色的层（画了但看不出分层）').toBe(positive.length)

    // 筒身反射带 2 条（上镜像 + 下反光），颜色或透明度不同
    expect(paintFillsOfPart(E1, 'cell-highlight').length, '筒身反射带实例份数不对').toBe(2)

    // 底座两端十字螺钉：2 颗 × 2 层圆 + 1 条十字槽
    expect(paintFillsOfPart(E1, 'baseplate-screw').length, '底座螺钉实例份数不对').toBe(4)

    // 灯泡螺旋灯头：4 圈螺纹 + 主体 + 两侧暗部 + 中部高光
    expect(paintFillsOfPart(L1, 'lamp-thread-turn').length, '灯头螺纹圈数不对').toBe(4)

    // 开关手柄 3 层（本体 + 上沿 + 描边）+ 3 道防滑纹（纹路是描边）
    expect(paintFillsOfPart(S1, 'switch-handle').length, '开关手柄分层不够').toBe(3)
    expect(paintFillsOfPart(S1, 'switch-handle-grip', 'stroke').length, '开关手柄防滑纹缺失').toBe(3)
    // 灯座左右暗部（stroke-less fill）与中部高光
    expect(paintFillsOfPart(L1, 'lamp-thread-shade').length, '灯头两侧暗部缺失').toBe(2)
    expect(paintFillsOfPart(L1, 'lamp-thread-highlight').length, '灯头中部高光缺失').toBe(1)

    // 反例：把筒身反射带整条删掉后，该类实例的颜色种类必须真的减少（证明判据不空转）
    const stripped = E1.replace(/<rect\b[^>]*data-part="cell-highlight"[^>]*>/g, '')
    expect(stripped, '变异体没有注入成功').not.toBe(E1)
    expect(colourKindsOf(stripped, 'cell-highlight').size).toBe(0)
    expect(colourKindsOf(E1, 'cell-highlight').size).toBeGreaterThan(0)

    // 再补一个：把 5 层正极铜帽删成 1 层，实例份数判据必须红
    const flattened = E1.replace(/<rect\b[^>]*data-part="cell-positive"[^>]*>/g, '').replace(
      /<rect\b[^>]*data-part="cell-body"[^>]*\/>/,
      (tag) => tag,
    )
    expect(flattened).not.toBe(E1)
    expect(paintFillsOfPart(flattened, 'cell-positive').length, '正极铜帽整层删掉后，实例份数判据没红').toBe(0)

    // 覆盖面的"严例"：所有列进清单的结构件在渲染结果里都必须真的有实例
    for (const part of [
      'cell-body', 'cell-band', 'cell-highlight', 'cell-outline', 'cell-positive', 'cell-negative',
      'lamp-glass', 'lamp-thread-turn', 'lamp-thread-shade', 'lamp-thread-highlight', 'lamp-filament', 'lamp-lead',
      'switch-blade', 'switch-blade-tip', 'switch-handle', 'switch-handle-grip', 'switch-jaw-hinge', 'switch-jaw-contact',
      'ammeter-shell', 'ammeter-dial', 'ammeter-needle', 'ammeter-needle-tail', 'ammeter-scale-outer', 'ammeter-scale-inner',
    ]) {
      const owner = part.startsWith('cell-') ? E1
        : part.startsWith('lamp-') ? L1
        : part.startsWith('switch-') ? S1
        : A1
      const present = paintFillsOfPart(owner, part).length > 0
        || paintFillsOfPart(owner, part, 'stroke').length > 0
        || new RegExp(`data-part="${part}"`).test(owner)
      expect(present, `${part} 在渲染结果里找不到实例，外观覆盖面清单已经失真`).toBe(true)
    }
  })

  it('发光与不发光在**颜色**上必须真的不同（不只是多两个圆）', () => {
    /**
     * 灯泡"点亮"是写实的关键状态。上一版只断言"两种外观字符串不同"，
     * 那只要多一个装饰元素就满足了。这里按颜色验收：点亮后必须出现暖色发光色，
     * 且玻璃/灯丝的颜色温度必须整体变暖。
     */
    const warmth = (html: string) => {
      const fills = paintFillsOfPart(html, 'lamp-filament').concat(paintFillsOfPart(html, 'lamp-glass'))
      const rgbs = fills.map((fill) => (fill.startsWith('url(') ? resolvedStopColours(html, fill)[0] : fill))
        .map((colour) => colourToRgb(colour))
        .filter((rgb): rgb is { r: number; g: number; b: number } => rgb !== null)
      // 暖度 = R - B
      return rgbs.reduce((sum, rgb) => sum + (rgb.r - rgb.b), 0) / rgbs.length
    }
    const offWarmth = warmth(L1)
    const onWarmth = warmth(L1_ON)
    expect(onWarmth, `点亮后的灯丝/玻璃没有变暖（关 ${offWarmth.toFixed(1)} → 开 ${onWarmth.toFixed(1)}）`)
      .toBeGreaterThan(offWarmth + 20)

    // 点亮必须真的出现暖色发光色（灯丝/光晕）
    const onColours = directColoursOfPalette(paintPalette(L1_ON))
      .map((colour) => colourToRgb(colour))
      .filter((rgb): rgb is { r: number; g: number; b: number } => rgb !== null)
    expect(onColours.some((rgb) => rgb.r > 200 && rgb.r - rgb.b > 60), '点亮后没有任何暖色发光色').toBe(true)

    // 灯丝点亮后必须更亮更粗（stroke-width 加大）
    const offWidth = Number(paintFillsOfPart(L1, 'lamp-filament')[0] === undefined ? 0 : L1.match(/data-part="lamp-filament"[^>]*stroke-width="([\d.]+)"/)?.[1])
    const onWidth = Number(L1_ON.match(/data-part="lamp-filament"[^>]*stroke-width="([\d.]+)"/)?.[1])
    expect(onWidth, '点亮后灯丝没有变粗').toBeGreaterThan(offWidth)
  })

  it('电流表的"深壳 + 米白盘 + 红针"三色关系不能被改坏', () => {
    /**
     * 第 6 条盲区：电流表的颜色关系没有被任何判据守住。
     * 真实教学电流表的识别度来自三件事：深色外壳、米白色表盘、红色指针。
     * 这里按**元素到颜色的绑定关系**验收（而不是"全文出现过红色"）。
     */
    const shellFill = paintFillsOfPart(A1, 'ammeter-shell')[0]
    const dialFill = paintFillsOfPart(A1, 'ammeter-dial')[0]
    const shellRgb = colourToRgb(shellFill)!
    const dialRgb = colourToRgb(dialFill)!

    // 表壳必须明显比表盘暗（深壳浅盘）
    expect(luminance(shellRgb), '表壳不够暗，与表盘分不出层次').toBeLessThan(0.3)
    expect(luminance(dialRgb), '表盘不够亮，深壳浅盘的关系被破坏').toBeGreaterThan(0.8)
    expect(luminance(dialRgb) - luminance(shellRgb), '表壳与表盘的明度差太小').toBeGreaterThan(0.5)

    // 表盘应当偏暖的米白（不是冷白），否则不像老式教学仪表
    expect(dialRgb.r, '表盘不是米白（偏冷）').toBeGreaterThan(dialRgb.b)

    // 指针必须是高饱和红（正常）与更亮的告警红（过载）
    const needleFill = paintFillsOfPart(A1, 'ammeter-needle')[0]
    const needleRgb = colourToRgb(needleFill)!
    expect(hueDegrees(needleRgb), '指针色相不在红色区间').toBeLessThan(15)
    expect(saturation(needleRgb), '指针不够红（识别度丢失）').toBeGreaterThan(0.6)
    const over = render(<AmmeterA1 x={0} y={0} reading={3} range="3A" overRange label="A1" />)
    const overFill = paintFillsOfPart(over, 'ammeter-needle')[0]
    expect(luminance(colourToRgb(overFill)!), '过载时的告警红没有比正常红更亮').toBeGreaterThan(luminance(needleRgb))
    // 尾针配重必须是深红（不是和针体同色，否则配重看不出来）
    const tailFill = paintFillsOfPart(A1, 'ammeter-needle-tail')[0]
    expect(luminance(colourToRgb(tailFill)!), '尾针配重与针体颜色太接近').toBeLessThan(luminance(needleRgb))

    // 刻度墨色必须深于表盘（否则刻度看不见）
    const scaleFills = paintFillsOfPart(A1, 'ammeter-scale-outer', 'stroke')
    expect(scaleFills.length).toBeGreaterThan(0)
    for (const fill of scaleFills) {
      expect(luminance(colourToRgb(fill)!), `刻度线 ${fill} 太浅，压在米白表盘上看不清`).toBeLessThan(luminance(dialRgb) - 0.4)
    }
  })

  it('内阴影/高光必须落在**渲染出的**对应元素边界内（挪走内阴影要红）', () => {
    /**
     * 外观与几何的交界：颜色画对了但画到别的地方（例如把表盘内阴影挪到表壳上），
     * 观感同样是坏的。这里把「颜色所属元素」与「几何位置」绑起来验收。
     */
    const dial = renderedPart(A1, 'ammeter-dial')!
    const dialBox = { x0: dial.x, y0: dial.y, x1: dial.x + dial.width, y1: dial.y + dial.height }

    const shadows = [...A1.matchAll(/<rect\b[^>]*data-part="ammeter-dial-shadow"[^>]*>/g)]
    expect(shadows.length, '表盘内阴影缺失').toBeGreaterThanOrEqual(2)
    for (const shadow of shadows) {
      const index = shadow.index ?? 0
      const offset = worldOffsetAt(A1, index)
      const x = offset.x + Number(shadow[0].match(/\bx="(-?[\d.]+)"/)?.[1])
      const y = offset.y + Number(shadow[0].match(/\by="(-?[\d.]+)"/)?.[1])
      const w = Number(shadow[0].match(/\bwidth="(-?[\d.]+)"/)?.[1])
      const h = Number(shadow[0].match(/\bheight="(-?[\d.]+)"/)?.[1])
      expect(x, '表盘内阴影跑到表盘左边界外').toBeGreaterThanOrEqual(dialBox.x0 - 1)
      expect(y, '表盘内阴影跑到表盘上边界外').toBeGreaterThanOrEqual(dialBox.y0 - 1)
      expect(x + w, '表盘内阴影跑到表盘右边界外').toBeLessThanOrEqual(dialBox.x1 + 1)
      expect(y + h, '表盘内阴影跑到表盘下边界外').toBeLessThanOrEqual(dialBox.y1 + 1)
    }

    // 接触阴影必须画在器材脚下：其世界坐标 y 必须落在器材渲染出的包围盒下沿附近
    for (const [name, html] of [['电池 E1', E1], ['灯泡 L1', L1], ['电流表 A1', A1]] as const) {
      const bounds = renderedBounds(html)!
      const shadow = [...html.matchAll(/<ellipse\b[^>]*data-part="ground-shadow"[^>]*>/g)][0]
      expect(shadow, `${name} 缺少接触阴影`).toBeDefined()
      const cy = Number(shadow[0].match(/\bcy="(-?[\d.]+)"/)?.[1])
      expect(cy, `${name} 的接触阴影跑到器材上方了（不再贴地）`).toBeGreaterThan(bounds.maxY - 30)
      expect(cy, `${name} 的接触阴影离器材太远（飘在画面外）`).toBeLessThan(bounds.maxY)
    }
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
    /**
     * 判据是「**针尖**到转轴的距离」，所以必须先把针尖那个点**唯一定位**出来，
     * 不能拿"针体所有点里最大的那个"——针体是条窄四边形，这个值对长度变化很不敏感
     * （实测：针尖缩短 40px，最长点只缩了 3.2px，断言仍然通过 = 静默漏检）。
     *
     * 定位方式：针尖是**离转轴最远的那一对点**，取它们的**平均**。
     * 这样即使将来针尖改成尖角（单点）或平口（两点），判据都稳定。
     */
    const needlePoints = pathPointsFromTag(needleTag![0])
    expect(needlePoints.length, '没有解析出指针针体的坐标').toBeGreaterThan(2)
    const radii = needlePoints.map(([x, y]) => Math.hypot(x - needle.pivot.x, y - needle.pivot.y))
    const maxRadius = Math.max(...radii)
    // 与转轴距离「贴着最大值」的那些点就是针尖那一对（容差 1px）
    const tipPoints = needlePoints.filter(([x, y]) => maxRadius - Math.hypot(x - needle.pivot.x, y - needle.pivot.y) < 1)
    expect(tipPoints.length, '没有定位到指针针尖').toBeGreaterThan(0)
    const tipDistance = tipPoints.reduce((sum, [x, y]) => sum + Math.hypot(x - needle.pivot.x, y - needle.pivot.y), 0) / tipPoints.length
    // 尾针（离转轴最近的点）必须明显更短：真实的指针是"长针 + 短配重"
    const tailDistance = Math.min(...radii)
    expect(tipDistance, `指针形状不对：针尖(${tipDistance.toFixed(1)}) 没有比尾针(${tailDistance.toFixed(1)}) 长`)
      .toBeGreaterThan(tailDistance + 20)
    // 刻度弧半径从弧线的 A 指令读出
    const arcRadius = Number(arcs[0][0].match(/A ([\d.]+) \1/)?.[1])
    expect(arcRadius).toBeGreaterThan(0)
    expect(tipDistance, `针尖半径 ${tipDistance.toFixed(1)} 远小于刻度半径 ${arcRadius.toFixed(1)}（指针被缩短）`)
      .toBeGreaterThan(arcRadius - 12)
    expect(tipDistance, `针尖半径 ${tipDistance.toFixed(1)} 超出刻度半径 ${arcRadius.toFixed(1)} 太多`).toBeLessThan(arcRadius + 12)

    // 尾针配重必须真的存在（整块删掉也要红）
    const tail = html.match(/<rect\b[^>]*data-part="ammeter-needle-tail"[^>]*>/)
    expect(tail, '指针尾部配重被删掉了').not.toBeNull()
    // 针体高光也是针的一部分，一并守住
    expect(html.match(/<path\b[^>]*data-part="ammeter-needle-gloss"[^>]*>/), '针体高光被删掉了').not.toBeNull()

    // 3) 转轴帽必须存在，且落在表盘内
    const hubs = [...html.matchAll(/<circle\b[^>]*data-part="ammeter-needle-hub"[^>]*>/g)]
    // 转轴帽由"实心帽 + 外圈描边"两层构成。只判 > 0 是不够的：
    // 删掉实心层后描边还在，断言仍然通过（实测漏检）。所以按层数严格判。
    expect(hubs.length, '转轴帽的两层（实心帽 + 外圈描边）必须都在，删掉任一层都不行').toBe(2)
    for (const hub of hubs) {
      const hubX = Number(hub[0].match(/\bcx="(-?[\d.]+)"/)?.[1])
      const hubY = Number(hub[0].match(/\bcy="(-?[\d.]+)"/)?.[1])
      expect(hubX).toBeGreaterThanOrEqual(dialBox.x0)
      expect(hubX).toBeLessThanOrEqual(dialBox.x1)
      expect(hubY, '转轴帽挪出了表盘').toBeGreaterThanOrEqual(dialBox.y0)
      expect(hubY, '转轴帽挪出了表盘').toBeLessThanOrEqual(dialBox.y1)
    }

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
      'ammeter-needle-tail',
      'ammeter-needle-hub',
      'ammeter-glyph',
      'ammeter-arc',
      'ammeter-scale-outer',
      'ammeter-scale-inner',
      'ammeter-number-outer',
      'ammeter-number-inner',
      'ammeter-label-neg',
      'ammeter-label-06',
      'ammeter-label-3',
      'ammeter-reading',
      'ammeter-name',
      'ammeter-dial-shadow',
      'ammeter-glass-reflection',
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

  it('自证式红线：未被声明为 root/local 的 <g> 一律不得做任何变换（与 data-part 无关）', () => {
    /**
     * 第五轮复审的漏洞 C：自证红线原来只遍历**带 data-part 的元素**，
     * 于是「没被标记的元素被平移」完全不检查 —— 实测把内圈量程数字包一层
     * `translate(0 200)`，`ammeter-use` 目录 **169/169 全绿**，而整排数字飘到了表体下方 200px。
     *
     * 这里不依赖任何标记：直接遍历渲染结果里**每一层 `<g>`**。
     * 只有显式声明 `data-anchor="root"`（器材摆位）与 `data-anchor="local"`（内部局部装配）
     * 的两种 `<g>` 允许平移，其余一律必须为 0。画面上任何东西被挪走都会红，
     * 跟"我记不记得标记它"无关。
     */
    const cases = [
      ['电池 E1', render(<BatteryHolderE1 x={0} y={0} />)],
      ['开关 S1', render(<KnifeSwitch x={0} y={0} closed={false} label="S1" />)],
      ['灯泡 L1', render(<LampHolderL1 x={0} y={0} lit={false} />)],
      ['电流表 A1', render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)],
    ] as const
    for (const [name, html] of cases) {
      // 预条件：声明过的合法装配确实存在（否则这条红线是因为"没有任何 <g>"而假绿）
      const anchors = groupInfos(html).map((info) => info.anchor)
      expect(anchors, `${name} 没有声明任何 root 锚点`).toContain('root')
      const offenders = undeclaredOffsetGroups(html).map((info) =>
        info.hasNonTranslate
          ? `<g> 带了非平移变换：${info.tag}`
          : `<g> 平移了 ${JSON.stringify({ x: info.x, y: info.y })}：${info.tag}`,
      )
      expect(
        offenders,
        `${name} 里有 <g> 偷偷做了变换，但画面几何仍按声明坐标推导。` +
          '（若这是合法的内部装配，必须显式声明 data-anchor="local"）',
      ).toEqual([])
    }

    /**
     * 反向自证 1 / 2 / 3：给一个元素包一层平移，必须被抓到。
     *
     * 这里直接对**渲染出的真实 HTML** 做注入（包在某个绘图元素外面），
     * 而不是改源码再渲染 —— 这样才能精确模拟复审那种"外层注入 `<g>`"的变异体。
     */
    const base = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const inject = (wrapper: string) => {
      const probe = base.match(/<ellipse\b[^>]*data-part="ammeter-needle-hub-shadow"[^>]*>/)
      expect(probe, '找不到用于注入的探针元素').not.toBeNull()
      const shifted = base.replace(probe![0], wrapper.replace('$1', probe![0]))
      expect(shifted, '注入失败').not.toBe(base)
      return shifted
    }

    // 属性形式，单层
    expect(undeclaredOffsetGroups(inject('<g transform="translate(0 200)">$1</g>')).length).toBeGreaterThan(0)
    // `style` 形式（复审实测的漏洞 A：老实现 54/54 全绿）
    expect(undeclaredOffsetGroups(inject('<g style="transform: translate(0px, 200px)">$1</g>')).length).toBeGreaterThan(0)
    // 混合形式
    expect(undeclaredOffsetGroups(inject('<g transform="translate(3 4)"><g style="transform: translate(5px, 6px)">$1</g></g>')).length).toBeGreaterThan(0)

    // 嵌套两层也要被抓到（复审实测"深度 1 能抓、深度 ≥2 就漏"）
    expect(
      undeclaredOffsetGroups(inject('<g transform="translate(30 0)"><g transform="translate(36 0)">$1</g></g>')).length,
      '嵌套两层的平移被漏掉',
    ).toBeGreaterThan(0)
  })

  it('覆盖面互证：每一个可绘制元素都必须被 data-part 标记（少标一个就红）', () => {
    /**
     * 第五轮复审的原话：「清单是按'我记得的结构件'列的，没有一处判据保证
     * 画面上每一个图元都被某个判据看见」。实测 100 个可绘制元素只有 73 个带标记，
     * 没标记的那 27 个里包含两排量程数字、读数、器材名 —— 全是用户直接读的内容。
     *
     * 所以这里把"必需清单"升级为**互证式**：标记率必须是 100%。
     * 少标任何一个图元这件事本身就会红，而不是靠我记得把清单写全。
     * （若将来确实加了纯装饰件，必须显式声明 data-part="decoration" 才会被放行。）
     */
    for (const [name, html] of [
      ['电池 E1', render(<BatteryHolderE1 x={0} y={0} />)],
      ['开关 S1', render(<KnifeSwitch x={0} y={0} closed={false} label="S1" />)],
      ['灯泡 L1', render(<LampHolderL1 x={0} y={0} lit={false} />)],
      ['电流表 A1', render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)],
    ] as const) {
      const total = paintableElementCount(html)
      const unmarked = unmarkedPaintableTags(html)
      expect(total, `${name} 没渲染出任何图元`).toBeGreaterThan(0)
      expect(
        unmarked.length,
        `${name} 有 ${unmarked.length}/${total} 个可绘制元素没被 data-part 标记，它们会成为几何回归的绕过路径：${unmarked.slice(0, 3).join(' | ')}`,
      ).toBe(0)
    }

    // 反向自证：摘掉一个 data-part，这条必须红
    const stripped = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
      .replace(' data-part="ammeter-glyph"', '')
    expect(unmarkedPaintableTags(stripped)).toHaveLength(1)
  })

  it('参数化的结构件每一份实例都必须被标记（多实例不能只标记第一个）', () => {
    /**
     * 复审指出的绕过形态之一是"只标记了一部分"。上面那条按总量互证，
     * 这条再按**实例份数**互证：`data-part` 出现的次数必须等于该结构的真实实例数，
     * 否则「画了 4 颗螺钉只标记 1 颗」这类改成遗漏仍然能溜过去。
     */
    const ammeter = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const countPart = (html: string, part: string) =>
      (html.match(new RegExp(`data-part="${part}"`, 'g')) ?? []).length

    // 两排刻度各 31 根，一根都不能漏标
    expect(countPart(ammeter, 'ammeter-scale-outer')).toBe(31)
    expect(countPart(ammeter, 'ammeter-scale-inner')).toBe(31)
    // 两排量程数字：外圈 0/1/2/3（4 个）+ 内圈 0/0.2/0.4/0.6（4 个）
    expect(countPart(ammeter, 'ammeter-number-outer')).toBe(4)
    expect(countPart(ammeter, 'ammeter-number-inner')).toBe(4)
    // 两条刻度弧
    expect(countPart(ammeter, 'ammeter-arc')).toBe(2)

    // 开关：底板四角 4 颗螺钉（位置在 data-anchor="local" 的 <g> 里，仍必须逐个标记）
    const switchHtml = render(<KnifeSwitch x={0} y={0} closed={false} label="S1" />)
    expect(countPart(switchHtml, 'switch-screw')).toBe(8)
    // 手柄三道防滑纹
    expect(countPart(switchHtml, 'switch-handle-grip')).toBe(3)

    // 灯泡：4 圈螺纹、2 根引线、2 颗灯座螺钉
    const lamp = render(<LampHolderL1 x={0} y={0} lit={false} />)
    expect(countPart(lamp, 'lamp-thread-turn')).toBe(4)
    expect(countPart(lamp, 'lamp-lead')).toBe(2)
    expect(countPart(lamp, 'lamp-socket-screw')).toBe(4)
  })

  it('transform 解析必须是"要么完全懂、要么报错"，绝不静默跳过', () => {
    /**
     * 复审第 5 轮的根因：老实现只认**属性形式的单层** `translate(x y)`，
     * 遇到 `style` 形式 / `rotate` / `scale` / `matrix` 一律静默当成 0 —— 静默跳过正是反复翻车的机制。
     * 这里直接给解析器喂各种写法，要求它"如实读出"或"响亮失败"。
     */
    const cases: Array<[string, { x: number; y: number }]> = [
      ['translate(66 0)', { x: 66, y: 0 }],
      ['translate(66px, 0px)', { x: 66, y: 0 }],
      ['translateX(40)', { x: 40, y: 0 }],
      ['translateY(-30px)', { x: 0, y: -30 }],
      ['translate(10 20) translate(5 -5)', { x: 15, y: 15 }],
      ['translate(0.5 -0.25)', { x: 0.5, y: -0.25 }],
    ]
    for (const [raw, expected] of cases) {
      expect(decomposeTransform(raw, 'test').translate, `${raw} 解析错了`).toEqual(expected)
    }

    // 非平移但"看得懂"的变换按原样透出，由调用方判断是否合法
    for (const raw of ['rotate(45 0 0)', 'scale(1.2)', 'matrix(1 0 0 1 30 40)', 'skewX(10)']) {
      const { translate, others } = decomposeTransform(raw, 'test')
      expect(translate, `${raw} 不该被当成平移`).toEqual({ x: 0, y: 0 })
      expect(others.length, `${raw} 应该被识别为已知的非平移变换`).toBeGreaterThan(0)
    }

    // 看不懂的写法必须**抛错**，不能静默返回 0
    for (const raw of ['frobnicate(3)', 'translate(50%)', 'translate(1em 0)']) {
      expect(() => decomposeTransform(raw, 'test'), `${raw} 被静默跳过了`).toThrow()
    }

    // 端到端：`style` 形式的表盘平移必须被如实读出（复审实测 54/54 全绿的漏洞 A）
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const styleShifted = html.replace(
      /(<rect\b[^>]*data-part="ammeter-dial"[^>]*>)/,
      '<g style="transform: translate(66px, 0px)">$1</g>',
    )
    expect(styleShifted).not.toBe(html)
    expect(worldOffsetOfPart(styleShifted, 'ammeter-dial'), 'style 形式的平移被静默跳过了')
      .toEqual({ x: 66, y: 0 })

    // 端到端：嵌套多层的 style/属性混合平移必须被如实累加
    const nestedShifted = html.replace(
      /(<rect\b[^>]*data-part="ammeter-dial"[^>]*>)/,
      '<g transform="translate(10 5)"><g style="transform: translate(20px, -15px)">$1</g></g>',
    )
    expect(worldOffsetOfPart(nestedShifted, 'ammeter-dial')).toEqual({ x: 30, y: -10 })
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

/**
 * 「零件不得脱离主体」不变量（本轮补上的几何盲区）。
 *
 * 本轮变异测试自查时发现：把**橙色品牌印刷带**整片右移 200px 挪出电池体外，
 * 全部几何判据仍然全绿 —— 因为既有判据只检查「接线柱是否落在器材包围盒内」，
 * 而包围盒是按**所有元素**算的并集：环标一挪远，包围盒就跟着变大，包含关系反而更宽松。
 *
 * 正确的口径是：包围盒只应由**主体结构**（壳体 / 筒身 / 底板）决定，
 * 其余每一份零件都必须落在主体之内。
 *
 * 判据：把某个 parts 组的**所有实例**的世界坐标包围盒，与主体组（shell）的包围盒比对，
 * 任一实例越界即红。逐实例判（不是并集），因此"把一份挪走"一定会被抓到。
 */
describe('零件必须画在所属主体内（零件飘出器材体即红）', () => {
  /** 断言：parts 里每一份实例都完整落在 shell 包围盒内（带容差，allow 用于允许压边） */
  function assertAllInside(
    html: string,
    shellPart: string,
    parts: string[],
    options: { tolerance?: number; label: string },
  ): void {
    const tolerance = options.tolerance ?? 1.5
    const shell = unionBounds(renderedParts(html, shellPart))
    expect(Number.isFinite(shell.minX), `${options.label}：主体 ${shellPart} 没有渲染出矩形`).toBe(true)

    for (const part of parts) {
      const instances = renderedParts(html, part)
      expect(instances.length, `${options.label}：${part} 没有渲染出任何实例`).toBeGreaterThan(0)
      for (const [index, item] of instances.entries()) {
        expect(item.x, `${options.label}：${part}[${index}] 飘到主体左边之外（x=${item.x.toFixed(1)} < ${shell.minX.toFixed(1)}）`)
          .toBeGreaterThanOrEqual(shell.minX - tolerance)
        expect(item.x + item.width, `${options.label}：${part}[${index}] 飘到主体右边之外`)
          .toBeLessThanOrEqual(shell.maxX + tolerance)
        expect(item.y, `${options.label}：${part}[${index}] 飘到主体上边之外`)
          .toBeGreaterThanOrEqual(shell.minY - tolerance)
        expect(item.y + item.height, `${options.label}：${part}[${index}] 飘到主体下边之外`)
          .toBeLessThanOrEqual(shell.maxY + tolerance)
      }
    }
  }

  it('电池：品牌环标 / 反射带 / 正负极 / 上下环标 都必须画在筒身内', () => {
    const html = render(<BatteryHolderE1 x={0} y={0} />)
    // 筒身是 `cell-body`（rect）；所有贴皮的印刷层必须完整落在它里面
    assertAllInside(html, 'cell-body', ['cell-band', 'cell-highlight'], { label: '电池' })

    // 负极端子与正极铜帽必须贴在筒身两端（不能脱开）
    const body = unionBounds(renderedParts(html, 'cell-body'))
    const negative = renderedParts(html, 'cell-negative')
    const positive = renderedParts(html, 'cell-positive')
    expect(negative.length).toBeGreaterThan(0)
    expect(positive.length).toBeGreaterThan(0)
    /**
     * 左端：锌底必须**套在筒口上**（真实的负极锌底是压扁压在筒身上的，两者必须重叠）。
     * 实测：筒身左沿 x=-80，锌底 x∈[-87,-77] —— 重叠 3px。
     * 判据取"锌底右沿必须越过筒身左沿"，把锌底整体左移 80px 会立刻红。
     */
    const negativeRight = Math.max(...negative.map((n) => n.x + n.width))
    expect(negativeRight, `锌底与筒身脱开了（锌底右沿 ${negativeRight.toFixed(1)} < 筒身左沿 ${body.minX.toFixed(1)}）`)
      .toBeGreaterThan(body.minX)
    // 锌底左沿也不能飘到筒身右侧（整体挪到电池另一头）
    expect(Math.min(...negative.map((n) => n.x)), '锌底被挪到电池右端去了').toBeLessThan(body.minX)
    /**
     * 纵向也必须贴在筒身上：锌底是"压在筒口上的扁帽"，
     * 它的纵向范围必须与筒身**有重叠**，且不能整体跑到筒身上方/下方。
     * 实测：筒身 y∈[-42,-6]，锌底 y∈[-40,-8]（嵌在里面）。
     */
    for (const [index, cap] of negative.entries()) {
      const overlap = Math.min(cap.y + cap.height, body.maxY) - Math.max(cap.y, body.minY)
      expect(overlap, `第 ${index + 1} 层锌底与筒身纵向没有重叠（被移到筒身上方/下方了）`).toBeGreaterThan(0)
      expect(cap.y, `第 ${index + 1} 层锌底整体飘到筒身上方`).toBeGreaterThan(body.minY - 8)
      expect(cap.y + cap.height, `第 ${index + 1} 层锌底整体飘到筒身下方`).toBeLessThan(body.maxY + 8)
    }
    // 正极铜帽同样必须与筒身纵向重叠（铜帽是套在筒口上的）
    for (const [index, cap] of positive.entries()) {
      const overlap = Math.min(cap.y + cap.height, body.maxY) - Math.max(cap.y, body.minY)
      expect(overlap, `第 ${index + 1} 层正极铜帽与筒身纵向没有重叠`).toBeGreaterThan(0)
    }
    // 右端：铜帽向左必须与筒身重叠（真实的铜帽是套在筒口上的）
    expect(Math.min(...positive.map((n) => n.x)), '正极铜帽与筒身脱开了').toBeLessThan(body.maxX + 4)

    /**
     * 反向自证（真实注入，不是空转）：给环标**渲染结果**整体外包一层 200px 平移，
     * 必须立刻被 `assertAllInside` 判为越界。
     * 这条既是"判据真的会红"的证明，也顺带守住 style/属性两种写法的注入路径。
     */
    const injected = html.replace(
      /(<rect\b[^>]*data-part="cell-band"[^>]*>)/,
      '<g transform="translate(200 0)">$1</g>',
    )
    expect(injected, '注入失败').not.toBe(html)
    expect(worldOffsetOfPart(injected, 'cell-band'), '注入的平移没有被几何口径读到').toEqual({ x: 200, y: 0 })
    const injectedBand = renderedParts(injected, 'cell-band')[0]
    expect(
      injectedBand.x > body.maxX,
      '环标右移 200px 后竟然仍在筒身内，说明这个反向自证不成立',
    ).toBe(true)
  })

  it('电池座：卡箍 / 螺钉 / 刻字必须落在底座或电池上（不能飘空）', () => {
    const html = render(<BatteryHolderE1 x={0} y={0} />)
    const plate = unionBounds(renderedParts(html, 'baseplate-face'))
    const body = unionBounds(renderedParts(html, 'cell-body'))

    /**
     * 两道卡箍必须**同时**抱住电池筒身并坐在底座上。
     * 注意：卡箍是 `<path>`，必须按 path 的几何取包围盒（用 rect 解析会得到空集合 = 判据失效）。
     * 实测：卡箍 y∈[-19, 8]，筒身 y∈[-42,-6]，底座顶面 y=5。
     * 判据分三段（这才是卡箍的真实几何关系）：
     *   1. 顶端必须伸进筒身（minY 落在筒身纵向区间内）—— 把卡箍搬到筒身上方就会红；
     *   2. 底端必须伸到底座顶面**以下**（压进底座，不是悬空）；
     *   3. 顶底跨度必须够大（真的是一道"箍"），不能退化成一条短线。
     */
    const clamps = renderedPathBounds(html, 'E1-clamp')
    expect(clamps.length, '没有渲染出卡箍（或卡箍不是 path，判据失效）').toBe(4)
    for (const [index, clamp] of clamps.entries()) {
      expect(clamp.minY, `第 ${index + 1} 道卡箍的顶端没有伸进筒身（被搬到筒身上方了）`).toBeGreaterThan(body.minY)
      expect(clamp.minY, `第 ${index + 1} 道卡箍的顶端穿到筒身下方去了`).toBeLessThan(body.maxY)
      expect(clamp.maxY, `第 ${index + 1} 道卡箍没有伸到底座里（悬空）`).toBeGreaterThan(plate.minY)
      expect(clamp.maxY - clamp.minY, `第 ${index + 1} 道卡箍退化成了一条短线（不再箍住电池）`).toBeGreaterThan(15)
    }
    // 两道卡箍必须分别落在电池左右两段（不是挤在一处）
    const clampCentres = clamps.map((clamp) => (clamp.minX + clamp.maxX) / 2).sort((a, b) => a - b)
    const groups = [clampCentres.filter((c) => c < 0), clampCentres.filter((c) => c >= 0)]
    expect(groups[0].length, '左段卡箍缺失').toBeGreaterThan(0)
    expect(groups[1].length, '右段卡箍缺失').toBeGreaterThan(0)
    expect(Math.abs(groups[0][0] - groups[1][0]), '两道卡箍挤在一起了').toBeGreaterThan(50)

    // 底座两端螺钉：必须落在底座面内
    for (const [index, screw] of renderedCircles(html, 'baseplate-screw').entries()) {
      expect(screw.cx, `第 ${index + 1} 颗底座螺钉飘到左端之外`).toBeGreaterThanOrEqual(plate.minX - 3)
      expect(screw.cx, `第 ${index + 1} 颗底座螺钉飘到右端之外`).toBeLessThanOrEqual(plate.maxX + 3)
    }

    // 正负极刻字：必须落在底座面内（不能飘到画面别处）
    const labels = [...html.matchAll(/<text\b[^>]*data-part="E1-polarity"[^>]*>/g)]
    expect(labels.length, '正负极刻字缺失').toBe(2)
    for (const label of labels) {
      const o = worldOffsetAt(html, label.index ?? 0)
      const x = o.x + Number(label[0].match(/\bx="(-?[\d.]+)"/)?.[1])
      const y = o.y + Number(label[0].match(/\by="(-?[\d.]+)"/)?.[1])
      expect(x, '正负极刻字飘到底座之外').toBeGreaterThanOrEqual(plate.minX - 3)
      expect(x, '正负极刻字飘到底座之外').toBeLessThanOrEqual(plate.maxX + 3)
      expect(y, '正负极刻字飘到底座之外').toBeGreaterThanOrEqual(plate.minY - 3)
      expect(y, '正负极刻字飘到底座之外').toBeLessThanOrEqual(plate.maxY + 6)
    }
  })

  it('灯泡：玻璃泡 / 灯头 / 灯丝 / 引线 必须与灯座和螺纹自洽', () => {
    const html = render(<LampHolderL1 x={0} y={0} lit={false} />)
    // 螺旋灯头（`lamp-thread-body`）在灯座口内
    const socketPoints = [...html.matchAll(/<path\b[^>]*data-part="lamp-socket"[^>]*>/g)]
      .flatMap((match) => pathPoints(match[0]))
    expect(socketPoints.length, '灯座没有解析出几何').toBeGreaterThan(0)
    const socket = {
      minY: Math.min(...socketPoints.map(([, y]) => y)),
      maxY: Math.max(...socketPoints.map(([, y]) => y)),
      minX: Math.min(...socketPoints.map(([x]) => x)),
      maxX: Math.max(...socketPoints.map(([x]) => x)),
    }
    const threadBody = unionBounds(renderedParts(html, 'lamp-thread-body'))
    expect(threadBody.minY, '螺旋灯头整体跑到灯座上方（灯泡飘了）').toBeLessThan(socket.maxY)
    expect(threadBody.maxY, '螺旋灯头没有插进灯座口').toBeGreaterThan(socket.minY)
    // 灯座口是椭圆（横向更宽），灯头左右必须仍在灯座横向范围内
    expect(threadBody.minX, '螺旋灯头横向飘出灯座').toBeGreaterThanOrEqual(socket.minX - 2)
    expect(threadBody.maxX, '螺旋灯头横向飘出灯座').toBeLessThanOrEqual(socket.maxX + 2)

    // 玻璃泡是 path，它与螺纹灯头必须相接（玻璃颈部压在螺纹上，不能有缝）
    const bulbPoints = [...html.matchAll(/<path\b[^>]*data-part="lamp-glass"[^>]*>/g)]
      .flatMap((match) => pathPoints(match[0]))
      .map(([x, y]) => ({ x, y }))
    expect(bulbPoints.length, '玻璃泡没有解析出几何').toBeGreaterThan(0)
    const bulbBottom = Math.max(...bulbPoints.map((p) => p.y))
    /**
     * 玻璃颈部必须**搭在螺纹灯头上**：真实灯泡玻璃泡的下沿压在灯头螺纹的上沿处。
     * 实测：灯头螺纹 y∈[-39,-24]，玻璃泡底 y=-37 —— 两者重叠 2px（无缝）。
     * 判据：底部必须伸进灯头（> 灯头顶沿），但不能越过灯头底面（否则穿到灯座里）。
     */
    /**
     * 说明：`pathPoints` 解析的是路径的**指令点**，不含贝塞尔曲线的真实极值点，
     * 所以玻璃泡底部的解析值（-43）会比实际包络略低一点，与灯头顶沿（-39）之间
     * 存在几像素的解析误差。这里把口径定成「**不得脱开**」：缝隙必须小于 8px，
     * 而且泡底必须落在灯头范围内（不能越过灯头底面插进灯座）。
     * 整块挪走（例如把玻璃泡上移 80px）会立刻红。
     */
    const gap = threadBody.minY - bulbBottom
    expect(gap, `玻璃泡与螺纹灯头之间出现 ${gap.toFixed(1)}px 的缝（灯泡像飘着）`).toBeLessThan(8)
    expect(bulbBottom, '玻璃泡底部穿过整个灯头，插进灯座里了').toBeLessThan(threadBody.maxY)

    // 灯丝与引线必须落在玻璃泡内
    const filament = [...html.matchAll(/<path\b[^>]*data-part="lamp-filament"[^>]*>/g)]
      .flatMap((match) => pathPoints(match[0]))
    expect(filament.length, '灯丝没有解析出几何').toBeGreaterThan(0)
    const bulbTop = Math.min(...bulbPoints.map((p) => p.y))
    const bulbLeft = Math.min(...bulbPoints.map((p) => p.x))
    const bulbRight = Math.max(...bulbPoints.map((p) => p.x))
    for (const [x, y] of filament) {
      expect(y, `灯丝点 y=${y.toFixed(1)} 跑到玻璃泡外（在泡顶之上）`).toBeGreaterThan(bulbTop)
      expect(y, `灯丝点 y=${y.toFixed(1)} 跑到玻璃泡外（在泡底之下）`).toBeLessThan(bulbBottom)
      expect(x, `灯丝点 x=${x.toFixed(1)} 跑到玻璃泡外`).toBeGreaterThan(bulbLeft)
      expect(x, `灯丝点 x=${x.toFixed(1)} 跑到玻璃泡外`).toBeLessThan(bulbRight)
    }
    /**
     * 两根引线必须落在玻璃泡内。
     * 容差 4px：引线的下端正好接在玻璃泡底缘（`pathPoints` 只取指令点，
     * 而玻璃泡底是贝塞尔曲线的极值点，两者会差几像素），这只表示"接在一起"，
     * 不代表"跑出去"。整根引线被搬到泡外（几十像素）一定会红。
     */
    for (const [index, lead] of [...html.matchAll(/<path\b[^>]*data-part="lamp-lead"[^>]*>/g)].entries()) {
      for (const [x, y] of pathPoints(lead[0])) {
        expect(y, `第 ${index + 1} 根引线 y=${y.toFixed(1)} 跑到玻璃泡上方之外`).toBeGreaterThan(bulbTop - 4)
        expect(y, `第 ${index + 1} 根引线 y=${y.toFixed(1)} 跑到玻璃泡下方之外`).toBeLessThan(bulbBottom + 4)
        expect(x, `第 ${index + 1} 根引线横向跑到玻璃泡外`).toBeGreaterThan(bulbLeft)
        expect(x, `第 ${index + 1} 根引线横向跑到玻璃泡外`).toBeLessThan(bulbRight)
      }
    }

    /**
     * 玻璃泡的宽度必须与灯座相称（`lamp-socket` 的透视筒口宽度就是它的落位基准）。
     * 真实小灯泡的玻壳不会比灯座宽出一大截 —— 拉宽成 2 倍会像一个球压在细座上。
     * 实测：灯座口横向 x∈[-22,22]，玻璃泡 halfWidth=25（略宽于灯座，符合真实比例）。
     */
    const bulbWidth = bulbRight - bulbLeft
    const socketWidth = socket.maxX - socket.minX
    expect(bulbWidth, `玻璃泡宽 ${bulbWidth.toFixed(1)} 远超灯座口宽 ${socketWidth.toFixed(1)}（比例失真，像个球压在细座上）`)
      .toBeLessThan(socketWidth * 1.8)
    expect(bulbWidth, '玻璃泡窄得比灯座口还小，不成比例').toBeGreaterThan(socketWidth * 0.6)

    // 灯座固定螺钉必须落在底座面内
    const plate = unionBounds(renderedParts(html, 'baseplate-face'))
    for (const screw of renderedCircles(html, 'lamp-socket-screw')) {
      expect(screw.cy).toBeGreaterThanOrEqual(plate.minY - 6)
      expect(screw.cy).toBeLessThanOrEqual(plate.maxY + 3)
      expect(screw.cx).toBeGreaterThanOrEqual(plate.minX - 3)
      expect(screw.cx).toBeLessThanOrEqual(plate.maxX + 3)
    }
  })

  it('开关：刀片 / 手柄 / 转轴 / 刀座 必须彼此相接', () => {
    const html = render(<KnifeSwitch x={0} y={0} closed={false} label="S1" />)
    const plate = unionBounds(renderedParts(html, 'switch-plate'))
    // 四角螺钉（8 个 circle：4 颗 × 2 层）必须落在底板上
    const screws = renderedCircles(html, 'switch-screw')
    expect(screws.length, '开关底板螺钉层数不对').toBe(8)
    for (const [index, screw] of screws.entries()) {
      expect(screw.cx, `第 ${index + 1} 个螺钉层飘出底板左右`).toBeGreaterThanOrEqual(plate.minX - 2)
      expect(screw.cx, `第 ${index + 1} 个螺钉层飘出底板左右`).toBeLessThanOrEqual(plate.maxX + 2)
      expect(screw.cy, `第 ${index + 1} 个螺钉层飘出底板上下`).toBeGreaterThanOrEqual(plate.minY - 4)
      expect(screw.cy, `第 ${index + 1} 个螺钉层飘出底板上下`).toBeLessThanOrEqual(plate.maxY + 4)
    }

    // 刀座（黄铜夹片）必须坐在底板上
    for (const jaw of ['switch-jaw-hinge', 'switch-jaw-contact']) {
      const instances = renderedParts(html, jaw)
      expect(instances.length, `${jaw} 没有实例`).toBeGreaterThan(0)
      const jawBottom = Math.max(...instances.map((item) => item.y + item.height))
      const jawTop = Math.min(...instances.map((item) => item.y))
      // 底板顶面 y=0、底面 y=22（`switch-plate` 的四个 rect 合成）。
      // 刀座必须**骑在底板顶面上**：脚要伸进底板（>0），但不能穿过底板底面（<22）。
      expect(jawBottom, `${jaw} 整体悬在底板上方，没有落进底板`).toBeGreaterThan(plate.minY)
      expect(jawBottom, `${jaw} 整体穿过底板底面`).toBeLessThan(plate.maxY)
      expect(jawTop, `${jaw} 整体飘到底板下方`).toBeLessThan(plate.maxY)
    }

    // 铰链轴销必须落在铰链刀座的中心（转轴与刀座不能脱开）
    const hinge = renderedCircles(html, 'switch-hinge')
    expect(hinge.length, '铰链轴销层数不对').toBe(2)
    const jawHinge = unionBounds(renderedParts(html, 'switch-jaw-hinge'))
    for (const pin of hinge) {
      expect(pin.cx, '铰链轴销与铰链刀座横向脱开').toBeGreaterThanOrEqual(jawHinge.minX - 2)
      expect(pin.cx, '铰链轴销与铰链刀座横向脱开').toBeLessThanOrEqual(jawHinge.maxX + 2)
      expect(pin.cy, '铰链轴销与铰链刀座纵向脱开').toBeGreaterThanOrEqual(jawHinge.minY - 4)
      expect(pin.cy, '铰链轴销与铰链刀座纵向脱开').toBeLessThanOrEqual(jawHinge.maxY + 4)
    }

    /**
     * 断开时刀片必须**真的抬起**（真开关断开时刀片离开触点座）。
     * 注意判据要用"刀片末端的**竖直落差**"，不能用"刀片中心到触点座中心的距离" ——
     * 刀片只有 11px 高，绕左端旋转 32° 后末端的竖直落差约 25px，
     * 而中心距的变化很小（实测只有 1.5px），拿它判会得到近乎恒定的假绿。
     * 所以这里取刀片**最右端（刀尖侧）**的中心 y，比较两种姿态的落差。
     */
    const closedSource = render(<KnifeSwitch x={0} y={0} closed label="S1" />)
    /**
     * 刀片**刀尖**（离铰链最远的那个角点）的世界坐标 y —— 必须把祖先 `rotate()` 施加进去。
     *
     * 注意：断开时是绕左端铰链**逆时针**抬起，刀尖会同时"向左上"移动，
     * 所以不能用"最右的角点"定位刀尖（那样取到的是靠铰链的那一端，落差变成负数）。
     * 唯一稳定的定义是「离转轴最远」。
     */
    // 铰链位（与 CompetitorParts.tsx 的装配基准一致；这里只作为"转轴在哪"的参照点）
    const hingeX = -58
    const pivotY = -6
    const HINGE = { x: hingeX, y: pivotY }
    const bladeTipY = (source: string) => {
      const blades = renderedPartsRotated(source, 'switch-blade')
      expect(blades.length, '没有渲染出刀片').toBeGreaterThan(0)
      const tip = blades
        .flatMap((item) => item.corners)
        .reduce((best, point) =>
          Math.hypot(point.x - HINGE.x, point.y - HINGE.y) > Math.hypot(best.x - HINGE.x, best.y - HINGE.y) ? point : best,
        )
      return tip.y
    }
    const drop = bladeTipY(closedSource) - bladeTipY(html)
    /**
     * 实测：刀片绕铰链旋转 32° 后，刀尖（离转轴 112px）的竖直落差约 58.5px。
     * 上限取 90px（转轴到刀尖的距离量级），防止"改成一个夸张角度"也能过。
     */
    expect(
      drop,
      `断开时刀片末端没有抬起（落差 ${drop.toFixed(1)}px，真实单刀开关断开时应抬起约 58px）`,
    ).toBeGreaterThan(30)
    expect(drop, `抬升量级不对（落差 ${drop.toFixed(1)}px），不像绕铰链旋转 32°`).toBeLessThan(90)

    // 合闸时刀片末端必须对上触点座的高度（刀片真的落在夹口里）
    const contact = unionBounds(renderedParts(closedSource, 'switch-jaw-contact'))
    expect(
      Math.abs(bladeTipY(closedSource) - (contact.minY + contact.maxY) / 2),
      '合闸时刀片末端没有对齐触点座（没落进夹口）',
    ).toBeLessThan(10)
    // 断开时刀片末端必须明显高于触点座上沿（真的离开了）
    expect(bladeTipY(html), '断开时刀片末端仍不低于触点座上沿').toBeLessThan(contact.minY)
    // 刀尖的横向位置也要跟着走（不是只往上平移），这才是"绕铰链旋转"而不是"整体上移"
    const tipX = (source: string) => renderedPartsRotated(source, 'switch-blade')
      .flatMap((item) => item.corners)
      .reduce((best, point) =>
        Math.hypot(point.x - HINGE.x, point.y - HINGE.y) > Math.hypot(best.x - HINGE.x, best.y - HINGE.y) ? point : best,
      ).x
    expect(tipX(html), '刀尖横向没有移动，说明刀片是整体上移而不是绕铰链旋转').toBeLessThan(tipX(closedSource) - 10)
    // 且刀片必须仍以铰链为轴（旋转时转轴处不动）
    // 刀片上离转轴最近的那个角点，与转轴的距离在任何姿态下都必须基本不变 ——
    // 这才是"绕铰链旋转"的定义（实测约 8.1px，即刀片左端留出的那一点间距）。
    const nearestToHinge = (source: string) =>
      renderedPartsRotated(source, 'switch-blade')
        .flatMap((item) => item.corners)
        .reduce((best, point) =>
          Math.hypot(point.x - HINGE.x, point.y - HINGE.y) < Math.hypot(best.x - HINGE.x, best.y - HINGE.y) ? point : best,
        )
    const radiusToHinge = (source: string) => {
      const point = nearestToHinge(source)
      return Math.hypot(point.x - HINGE.x, point.y - HINGE.y)
    }
    /**
     * 判据是「刀片左端到转轴的距离**不随姿态变化**」——
     * 注意不能判「那个角点坐标不变」：绕轴旋转时角点本来就沿弧线扫动（实测动了 3.4px），
     * 但半径恒定（实测两种姿态都是 6.32）。
     * 若刀片改成"整体平移"而不是绕轴旋转，这个半径会跟着变，判据立刻红。
     */
    expect(
      Math.abs(radiusToHinge(html) - radiusToHinge(closedSource)),
      '刀片左端到转轴的距离随姿态变了，说明不是绕铰链旋转（而是整体平移/换了基准）',
    ).toBeLessThan(1)

    // 手柄防滑纹必须画在手柄上（三道路纹在手柄矩形范围内）
    const handle = unionBounds(renderedParts(html, 'switch-handle'))
    for (const [index, grip] of renderedLines(html, 'switch-handle-grip').entries()) {
      expect(grip.y1, `第 ${index + 1} 道防滑纹画到手柄之外`).toBeGreaterThanOrEqual(handle.minY - 2)
      expect(grip.y2, `第 ${index + 1} 道防滑纹画到手柄之外`).toBeLessThanOrEqual(handle.maxY + 2)
    }
  })

  it('电流表：刻度 / 数字 / 指针 / 转轴 / 读数 必须落在表盘或壳体范围内', () => {
    const html = render(<AmmeterA1 x={0} y={0} reading={0.14} range="0.6A" overRange={false} label="A1" />)
    const shell = unionBounds(renderedParts(html, 'ammeter-shell'))

    // 两排刻度线（62 根）必须全部落在表壳内
    for (const part of ['ammeter-scale-outer', 'ammeter-scale-inner']) {
      const lines = renderedLines(html, part)
      expect(lines.length, `${part} 根数不对`).toBe(31)
      for (const [index, line] of lines.entries()) {
        for (const [x, y] of [[line.x1, line.y1], [line.x2, line.y2]]) {
          expect(x, `${part}[${index}] 飘出表壳左右`).toBeGreaterThanOrEqual(shell.minX - 1)
          expect(x, `${part}[${index}] 飘出表壳左右`).toBeLessThanOrEqual(shell.maxX + 1)
          expect(y, `${part}[${index}] 飘出表壳上下`).toBeGreaterThanOrEqual(shell.minY - 1)
          expect(y, `${part}[${index}] 飘出表壳上下`).toBeLessThanOrEqual(shell.maxY + 1)
        }
      }
    }

    // 两排量程数字（8 个）必须落在表壳内 —— 这是第五轮那条「数字飘到表体下方 200px」的同源判据
    for (const part of ['ammeter-number-outer', 'ammeter-number-inner']) {
      const numbers = [...html.matchAll(new RegExp(`<text\\b[^>]*data-part="${part}"[^>]*>`, 'g'))]
      expect(numbers.length, `${part} 数字个数不对`).toBe(4)
      for (const number of numbers) {
        const o = worldOffsetAt(html, number.index ?? 0)
        const x = o.x + Number(number[0].match(/\bx="(-?[\d.]+)"/)?.[1])
        const y = o.y + Number(number[0].match(/\by="(-?[\d.]+)"/)?.[1])
        expect(x, `${part} 数字飘出表壳左右`).toBeGreaterThanOrEqual(shell.minX - 1)
        expect(x, `${part} 数字飘出表壳左右`).toBeLessThanOrEqual(shell.maxX + 1)
        expect(y, `${part} 数字飘出表壳上下`).toBeGreaterThanOrEqual(shell.minY - 1)
        expect(y, `${part} 数字飘出表壳上下`).toBeLessThanOrEqual(shell.maxY + 1)
      }
    }

    /**
     * 读数大字与器材名必须仍然与表壳**叠在一起**。
     * 读数大字刻意压在壳顶上（"大字号方便投屏"是需求里的原始约束），
     * 所以口径是"不许飘离表壳"（与表壳有实际重叠区间），而不是"完整落在壳内"。
     * 容差按字号给（读数 15px / 器材名 16px），保证"整块挪到画面别处"一定会红。
     */
    for (const [part, fontSize] of [['ammeter-reading', 15], ['ammeter-name', 16]] as const) {
      const tag = html.match(new RegExp(`<text\\b[^>]*data-part="${part}"[^>]*>`))
      expect(tag, `${part} 缺失`).not.toBeNull()
      const o = worldOffsetAt(html, tag!.index ?? 0)
      const x = o.x + Number(tag![0].match(/\bx="(-?[\d.]+)"/)?.[1])
      const y = o.y + Number(tag![0].match(/\by="(-?[\d.]+)"/)?.[1])
      // 横向必须与表壳有重叠：读数大字在壳内居中，器材名刻意压在壳右侧（铭牌位置），
      // 因此口径是"不许飘离表壳"，容差按字号给。
      expect(x, `${part} 横向飘到表壳左边太远`).toBeGreaterThanOrEqual(shell.minX - fontSize)
      expect(x, `${part} 横向飘到表壳右边太远`).toBeLessThanOrEqual(shell.maxX + fontSize)
      // 纵向必须与表壳有重叠（允许压边，最多一个字号的高度）
      expect(y, `${part} 纵向飘到表壳上方太远`).toBeGreaterThan(shell.minY - fontSize)
      expect(y, `${part} 纵向飘到表壳下方`).toBeLessThanOrEqual(shell.maxY + 1)
    }

    // 尾针与转轴帽必须贴在转轴上（配重不能飘走）
    const needle = needlePivot(html)!
    const tail = renderedParts(html, 'ammeter-needle-tail')
    expect(tail.length, '尾针配重缺失').toBe(1)
    expect(Math.hypot(tail[0].x - needle.pivot.x, tail[0].y - needle.pivot.y), '尾针配重与转轴脱开').toBeLessThan(6)
    for (const hub of renderedCircles(html, 'ammeter-needle-hub')) {
      expect(Math.hypot(hub.cx - needle.pivot.x, hub.cy - needle.pivot.y), '转轴帽与转轴脱开').toBeLessThan(1.5)
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
