// @vitest-environment happy-dom
/**
 * 「无限画布」三条交互需求的**真实 DOM 事件回归**。
 *
 * 需求原文（Issue #20）：
 *   1. 我要的无限画布功能，你给搞没了；现在我的实验器材无法自由的拖动到任意位置，
 *      比如拖动靠近边沿就无法拖动了，并不是无限画布；
 *   2. 需要支持我的鼠标滚轮对页面进行放大和缩小；
 *   3. 需要支持空格键 = 按住长按鼠标左键不松开，可以任意拖动无限画布的位置。
 *
 * 这三条都必须落在**真实事件链**上才有意义，所以本文件不 mock 任何东西：
 * 用 `react-dom/client` 真渲染 `InfiniteCanvas`，用 `happy-dom` 派发真的
 * `keydown` / `pointerdown` / `pointermove` / `wheel` 事件，然后读相机数值。
 *
 * 为什么不用 `renderToString`：SSR 拿不到"按下空格再拖动之后相机动了多少"，
 * 而这正是用户唯一能感知的东西。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createRef, type RefObject } from 'react'
import InfiniteCanvas from './InfiniteCanvas'

/**
 * happy-dom **不实现指针捕获重定向**（它把 `pointermove` 派发给鼠标下的元素，
 * 而不是派发给捕获元素）。这里补上**真实浏览器语义**的桩：
 *
 *   · `setPointerCapture(id)` → 该元素成为后续 `pointermove / pointerup` 的派发目标；
 *   · `releasePointerCapture` / `pointerup` 隐式释放都会取消重定向。
 *
 * ⚠️ 为什么必须是"真重定向"而不是 no-op：no-op 桩会让
 * "画布捕获指针后器材仍收到 `pointermove`" 这类回归**测不出来**，
 * 测试绿只是因为 mock 少了实现，而不是实现正确 —— 这正是上一版被审查打穿的地方。
 */
const captureRegistry = new WeakMap<Element, number>()
let redirectTarget: Element | null = null

function patchPointerCapture(element: Element) {
  const target = element as Element & {
    setPointerCapture?: (id: number) => void
    releasePointerCapture?: (id: number) => void
    hasPointerCapture?: (id: number) => boolean
  }
  target.setPointerCapture = (id: number) => {
    captureRegistry.set(element, id)
    redirectTarget = element
  }
  target.releasePointerCapture = (id: number) => {
    if (captureRegistry.get(element) === id) captureRegistry.delete(element)
    if (redirectTarget === element) redirectTarget = null
  }
  target.hasPointerCapture = (id: number) => captureRegistry.get(element) === id
}

/** 取消当前重定向（真实浏览器在 `pointerup` 时会隐式释放捕获） */
function releaseRedirect() {
  if (redirectTarget !== null) captureRegistry.delete(redirectTarget)
  redirectTarget = null
}

/**
 * 从**原始目标**派发指针事件，并复刻真实浏览器的捕获重定向。
 *
 * 真实语义：一旦某元素捕获了指针，后续 `pointermove` 的 `event.target`
 * **就是那个捕获元素**，不再是鼠标下的元素。因此这里在派发前换成 `redirectTarget`。
 */
function dispatchPointer(type: string, init: PointerEventInit) {
  /**
   * 没有捕获时按"鼠标下的元素"派发是不现实的（测试里没有真实命中测试），
   * 因此未捕获时退化为"从 body 派发"；有捕获时严格按真实语义派发给捕获元素。
   * 断言只依赖"捕获后必须重定向"这一条，未捕获的分支不会被用来证明任何结论。
   */
  const actual = redirectTarget ?? document.body
  const event = pointerEvent(type, init)
  actual.dispatchEvent(event)
  return event
}

/** 固定舞台尺寸：happy-dom 里 `getBoundingClientRect` 恒为 0，必须显式打桩 */
function stubRect(element: Element, width: number, height: number) {
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect
}

interface Harness {
  root: Root
  host: HTMLDivElement
  stage: HTMLElement
  /** 当前渲染出的缩放百分比（从底部提示胶囊里读，与用户看到的一致） */
  zoomLabel(): number
  /** 内部世界层的 transform（相机数值的唯一可见出口） */
  worldTransform(): string
  unmount(): void
}

const SIZE = { width: 1200, height: 800 }

function mount(): Harness {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const stageRef: RefObject<HTMLDivElement | null> = createRef<HTMLDivElement>()

  const root = createRoot(host)
  act(() => {
    root.render(
      <InfiniteCanvas
        stageRef={stageRef}
        content={{ minX: 0, minY: 0, maxX: 400, maxY: 300 }}
        tilt={0}
        showToolbar={false}
      >
        <div data-testid="content" />
      </InfiniteCanvas>,
    )
  })

  const stage = host.querySelector('[data-immersive-canvas]') as HTMLElement
  if (stage === null) throw new Error('找不到画布舞台')
  stubRect(stage, SIZE.width, SIZE.height)
  patchPointerCapture(stage)
  // 舞台尺寸是 ResizeObserver / 首帧测量出来的，打桩后需要再触发一次渲染
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })

  const gestureLayer = stage.querySelector('[data-canvas-gesture-layer]') as HTMLElement
  patchPointerCapture(gestureLayer)
  releaseRedirect()

  const world = stage.querySelector('[style*="translate3d"]') as HTMLElement
  const label = stage.textContent ?? ''

  return {
    root,
    host,
    stage: gestureLayer,
    zoomLabel: () => {
      const text = gestureLayer.ownerDocument.querySelector('[data-immersive-canvas]')?.textContent ?? label
      const match = text.match(/(\d+)%/)
      return match === null ? Number.NaN : Number(match[1])
    },
    worldTransform: () => world.style.transform,
    unmount: () => act(() => root.unmount()),
  }
}

/** 从 `translate3d(x, y, 0) scale(s)` 里取出平移量 */
function panOf(transform: string): { x: number; y: number } {
  const match = transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/)
  if (match === null) throw new Error(`解析不出平移量：${transform}`)
  return { x: Number(match[1]), y: Number(match[2]) }
}

function pointerEvent(type: string, init: PointerEventInit): PointerEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent
  Object.assign(event, { pointerId: 1, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true, ...init })
  return event
}

function wheelEvent(init: { clientX: number; clientY: number; deltaY: number }): WheelEvent {
  const event = new Event('wheel', { bubbles: true, cancelable: true }) as WheelEvent
  Object.assign(event, { deltaMode: 0, ...init })
  return event
}

describe('空格键 + 按住鼠标左键 = 任意拖动无限画布', () => {
  it('按住空格后，指针落在 SVG 上也能拖动画布（旧版本这里完全拖不动）', () => {
    /**
     * 这一条复刻**真实场景的层级**：`<svg>` 铺满整个舞台（见 `CompetitorScene`），
     * 指针永远落在 `svg` 上。旧判据 `target.closest('svg') === null`（"只有空白处才能平移"）
     * 在这里必然放行失败 —— 学生按住空格怎么拖都不动。
     *
     * 复刻方式：把 `svg` 铺满整个手势层（`inset-0`），并从 `svg` 上派发事件。
     */
    const harness = mount()
    const before = panOf(harness.worldTransform())

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
    harness.stage.appendChild(svg)
    // svg 铺满舞台：屏幕上不存在"svg 之外"的空白处
    expect(svg.closest('svg'), '测试前提不成立：svg 没有被正确构造出来').not.toBeNull()

    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    })
    // 真实捕获语义：画布认领后在舞台捕获指针 → pointermove 目标变成舞台。
    // 这里交给 `dispatchPointer` 复刻重定向，而不是手工从舞台派发。
    act(() => {
      dispatchPointer('pointermove', { clientX: 180, clientY: 160 })
    })

    const moved = panOf(harness.worldTransform())
    expect(moved.x - before.x, '空格 + 左键拖动没有平移画布').toBeCloseTo(80, 3)
    expect(moved.y - before.y, '空格 + 左键拖动没有平移画布').toBeCloseTo(60, 3)
    harness.unmount()
  })

  it('不按空格时，在 SVG 上按下不会平移画布（器材拖动的优先级不被抢走）', () => {
    const harness = mount()
    const before = panOf(harness.worldTransform())
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    harness.stage.appendChild(svg)
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
      svg.dispatchEvent(pointerEvent('pointermove', { clientX: 200, clientY: 200 }))
    })
    expect(panOf(harness.worldTransform()), '没按空格却平移了画布').toEqual(before)
    harness.unmount()
  })

  it('松开空格 / 窗口失焦后，画布立即不再跟着指针走', () => {
    const harness = mount()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    harness.stage.appendChild(svg)
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
      svg.dispatchEvent(pointerEvent('pointerup', { clientX: 100, clientY: 100 }))
    })
    const settled = panOf(harness.worldTransform())
    act(() => {
      svg.dispatchEvent(pointerEvent('pointermove', { clientX: 400, clientY: 400 }))
    })
    expect(panOf(harness.worldTransform()), '松开空格后画布仍然在跟着指针走').toEqual(settled)

    // 失焦同样必须复位
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      window.dispatchEvent(new Event('blur'))
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
      svg.dispatchEvent(pointerEvent('pointermove', { clientX: 300, clientY: 300 }))
    })
    expect(panOf(harness.worldTransform()), '窗口失焦后画布仍然在跟着指针走').toEqual(settled)
    releaseRedirect()
    harness.unmount()
  })

  it('空格 + 左键按在「器材」上时，画布照样平移（不会被器材拖走）', () => {
    /**
     * 真实场景：场景里的器材 `<g data-component-drag>` 自己也在 `pointerdown` 里
     * `setPointerCapture`。若画布层不先抢下这次手势，学生按住空格拖器材就会
     * 变成"把器材拖走"，而不是平移画布 —— 需求明确要的是**任意**拖动无限画布。
     */
    const harness = mount()
    const before = panOf(harness.worldTransform())

    // 造一个与场景同构的器材手柄：自己捕获指针 + stopPropagation
    const component = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    component.setAttribute('data-component-drag', 'E1')
    patchPointerCapture(component)
    let componentPointerMoves = 0
    component.addEventListener('pointerdown', (event) => {
      component.setPointerCapture((event as PointerEvent).pointerId)
      event.stopPropagation()
    })
    component.addEventListener('pointermove', () => {
      componentPointerMoves += 1
    })
    harness.stage.appendChild(component)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    act(() => {
      component.dispatchEvent(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }))
    })
    /**
     * 复刻**真实浏览器**的指针捕获语义：一旦某个元素 `setPointerCapture`，
     * 后续 `pointermove` 的**事件目标就是那个捕获元素**，而不再是鼠标下的元素。
     * happy-dom 没有实现这层重定向（它仍把事件派发给鼠标下的 `component`），
     * 所以这里显式从"捕获方"派发，断言才有意义。
     *
     * 浏览器里画布层认领手势后捕获指针 → 事件目标 = 画布手势层 →
     * 器材既收不到 `pointerdown`，也收不到 `pointermove`。
     */
    act(() => {
      dispatchPointer('pointermove', { clientX: 110, clientY: 60 })
    })

    const moved = panOf(harness.worldTransform())
    expect(moved.x - before.x, '按住空格拖器材时画布没有平移').toBeCloseTo(100, 3)
    expect(moved.y - before.y, '按住空格拖器材时画布没有平移').toBeCloseTo(50, 3)
    expect(componentPointerMoves, '平移时器材仍然收到了 pointermove（会被顺手拖走）').toBe(0)
    harness.unmount()
  })

  it('中键 / 右键拖动同样可以平移（鼠标用户的快捷方式）', () => {
    const harness = mount()
    const before = panOf(harness.worldTransform())
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    harness.stage.appendChild(svg)
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 50, clientY: 50, button: 1 }))
      dispatchPointer('pointermove', { clientX: 90, clientY: 30, button: 1 })
    })
    const moved = panOf(harness.worldTransform())
    expect(moved.x - before.x).toBeCloseTo(40, 3)
    expect(moved.y - before.y).toBeCloseTo(-20, 3)
    harness.unmount()
  })

  it('平移是无限的：连续拖 30 次大位移仍然每次都跟手', () => {
    const harness = mount()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    harness.stage.appendChild(svg)

    let x = 0
    let y = 0
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: x, clientY: y }))
    })
    for (let i = 0; i < 30; i += 1) {
      x += 4000
      y -= 3000
      act(() => {
        dispatchPointer('pointermove', { clientX: x, clientY: y })
      })
    }
    const moved = panOf(harness.worldTransform())
    // 30 × 4000 = 120000px，远超旧实现的 CANVAS_OFFSET_MARGIN（1600 / size*6）上限
    expect(Math.abs(moved.x) + Math.abs(moved.y), '平移被某个边界挡住了').toBeGreaterThan(100000)
    harness.unmount()
  })
})

describe('鼠标滚轮缩放画布', () => {
  it('向上滚放大、向下滚缩小', () => {
    const harness = mount()
    const before = panOf(harness.worldTransform())
    void before

    const scaleOf = (transform: string) => Number(transform.match(/scale\(([-\d.]+)\)/)?.[1] ?? Number.NaN)

    const original = scaleOf(harness.worldTransform())
    act(() => {
      harness.stage.dispatchEvent(wheelEvent({ clientX: 600, clientY: 400, deltaY: -240 }))
    })
    const zoomedIn = scaleOf(harness.worldTransform())
    expect(zoomedIn, '滚轮向上没有放大').toBeGreaterThan(original)

    act(() => {
      harness.stage.dispatchEvent(wheelEvent({ clientX: 600, clientY: 400, deltaY: 480 }))
    })
    const zoomedOut = scaleOf(harness.worldTransform())
    expect(zoomedOut, '滚轮向下没有缩小').toBeLessThan(zoomedIn)
    harness.unmount()
  })

  it('缩放锚在指针下方：指针指着的那个画布点在缩放前后停在同一个屏幕位置', () => {
    const harness = mount()
    const scaleOf = (transform: string) => Number(transform.match(/scale\(([-\d.]+)\)/)?.[1] ?? Number.NaN)
    const anchor = { clientX: 900, clientY: 200 }

    const before = harness.worldTransform()
    const scaleBefore = scaleOf(before)
    const panBefore = panOf(before)
    // 指针下的画布坐标
    const canvasX = (anchor.clientX - panBefore.x) / scaleBefore
    const canvasY = (anchor.clientY - panBefore.y) / scaleBefore

    act(() => {
      harness.stage.dispatchEvent(wheelEvent({ ...anchor, deltaY: -300 }))
    })

    const after = harness.worldTransform()
    const scaleAfter = scaleOf(after)
    const panAfter = panOf(after)
    expect(scaleAfter).toBeGreaterThan(scaleBefore)
    expect(canvasX * scaleAfter + panAfter.x, '缩放后指针下的内容跑了').toBeCloseTo(anchor.clientX, 3)
    expect(canvasY * scaleAfter + panAfter.y, '缩放后指针下的内容跑了').toBeCloseTo(anchor.clientY, 3)
    harness.unmount()
  })

  it('滚轮事件被 preventDefault（不会同时把宿主页面滚走）', () => {
    const harness = mount()
    const event = wheelEvent({ clientX: 600, clientY: 400, deltaY: -120 })
    act(() => {
      harness.stage.dispatchEvent(event)
    })
    expect(event.defaultPrevented, '滚轮没有被 preventDefault，页面会跟着一起滚').toBe(true)
    harness.unmount()
  })

  it('缩放有上下限（可以无限缩放但不会算到 NaN / 失控）', () => {
    const harness = mount()
    const scaleOf = (transform: string) => Number(transform.match(/scale\(([-\d.]+)\)/)?.[1] ?? Number.NaN)
    act(() => {
      for (let i = 0; i < 200; i += 1) {
        harness.stage.dispatchEvent(wheelEvent({ clientX: 100, clientY: 100, deltaY: -400 }))
      }
    })
    const maxed = scaleOf(harness.worldTransform())
    expect(Number.isFinite(maxed)).toBe(true)
    expect(maxed).toBeLessThanOrEqual(14)

    act(() => {
      for (let i = 0; i < 400; i += 1) {
        harness.stage.dispatchEvent(wheelEvent({ clientX: 100, clientY: 100, deltaY: 400 }))
      }
    })
    const mined = scaleOf(harness.worldTransform())
    expect(Number.isFinite(mined)).toBe(true)
    expect(mined).toBeGreaterThanOrEqual(0.18)
    harness.unmount()
  })

  it('缩放之后仍然可以平移（缩放不会把平移锁死）', () => {
    const harness = mount()
    const panOfWorld = () => panOf(harness.worldTransform())
    act(() => {
      harness.stage.dispatchEvent(wheelEvent({ clientX: 600, clientY: 400, deltaY: -200 }))
    })
    const before = panOfWorld()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    harness.stage.appendChild(svg)
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
      dispatchPointer('pointermove', { clientX: 250, clientY: 0 })
    })
    const after = panOfWorld()
    expect(after.x - before.x).toBeCloseTo(250, 3)
    harness.unmount()
  })
})

describe('空格平移不得吞掉悬浮控件（审查必修 1）', () => {
  /**
   * 真实 Chromium 实测的回归：捕获阶段用 `stopPropagation` + `setPointerCapture`
   * 认领手势后，画布工具条（`InfiniteCanvas` **内部**、`stageRef` 覆盖不到）
   * 的 `pointerdown / pointerup / click` 一个都不再触发 —— 按钮彻底点不动，
   * 且卡住后没有恢复路径（只能切路由）。
   *
   * 这一条就是那个回归的直接判据：按住空格点按钮，按钮必须照常响应。
   */
  it('按住空格时，点画布工具条按钮仍然生效（按钮不被画布吞掉）', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const stageRef: RefObject<HTMLDivElement | null> = createRef<HTMLDivElement>()
    const root = createRoot(host)

    let zoomClicks = 0
    act(() => {
      root.render(
        <InfiniteCanvas
          stageRef={stageRef}
          content={{ minX: 0, minY: 0, maxX: 400, maxY: 300 }}
          tilt={0}
          showToolbar
        >
          <div data-testid="content" />
        </InfiniteCanvas>,
      )
    })
    const stage = host.querySelector('[data-immersive-canvas]') as HTMLElement
    stubRect(stage, SIZE.width, SIZE.height)
    patchPointerCapture(stage)
    releaseRedirect()
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    const gestureLayer = stage.querySelector('[data-canvas-gesture-layer]') as HTMLElement
    patchPointerCapture(gestureLayer)

    /**
     * ⚠️ 这里刻意**放在手势层内部**，复刻真实场景的层级。
     *
     * 画布工具条是手势层的**兄弟**（结构上就不可能被手势层的捕获监听看到），
     * 但 `CompetitorScene` 里的读数条 / 量程按钮 / 协作胶囊都渲染在
     * 手势层**内部的 SVG 子树里** —— 它们才真正依赖 `data-canvas-pan-block` 守卫。
     * 把判据放在这一层，去掉守卫时才会真红。
     */
    const overlay = document.createElement('button')
    overlay.setAttribute('data-canvas-pan-block', '')
    overlay.textContent = '量程 0.6A'
    gestureLayer.appendChild(overlay)
    const button = overlay
    expect(button.closest('[data-canvas-gesture-layer]'), '测试前提：控件必须在手势层内部').not.toBeNull()
    button.addEventListener('click', () => {
      zoomClicks += 1
    })
    patchPointerCapture(button)

    const before = panOf(
      (stage.querySelector('[style*="translate3d"]') as HTMLElement).style.transform,
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    /**
     * 关键判据不是"手动补一个 click 能跑" —— 那测不出守卫被删掉。
     * 真正要钉住的是**画布有没有背着自己把这次按下抢走**：
     *   ① 手势层不得捕获指针（捕获了就会把后续 click 重定向掉）；
     *   ② 画布不得平移。
     * 这两条一起，才能把"去掉 `data-canvas-pan-block` 守卫"这个变异打红。
     */
    act(() => {
      button.dispatchEvent(pointerEvent('pointerdown', { clientX: 1100, clientY: 40 }))
    })
    expect(
      gestureLayer.hasPointerCapture(1),
      '按住空格时，在悬浮按钮上按下仍被画布抢走了指针（按钮会被吞掉）',
    ).toBe(false)

    act(() => {
      dispatchPointer('pointermove', { clientX: 1000, clientY: 200 })
    })
    const mid = panOf(
      (stage.querySelector('[style*="translate3d"]') as HTMLElement).style.transform,
    )
    expect(mid, '点在悬浮控件上却平移了画布').toEqual(before)

    act(() => {
      button.dispatchEvent(pointerEvent('pointerup', { clientX: 1000, clientY: 200 }))
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(zoomClicks, '按住空格时点工具条按钮被画布吞掉了').toBe(1)
    const after = panOf(
      (stage.querySelector('[style*="translate3d"]') as HTMLElement).style.transform,
    )
    expect(after, '点在悬浮控件上却平移了画布').toEqual(before)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    })
    releaseRedirect()
    act(() => root.unmount())
  })
})

describe('空格按住不放可以连续拖动（审查必修 2）', () => {
  /**
   * 用户原话：「空格键 = 按住长按鼠标左键不松开，可以任意拖动无限画布的位置」。
   *
   * 旧实现在 `pointerup` 里清掉 `panReady`，于是"按住空格不放"只能拖**一次**，
   * 第二次完全失效（真实 Chromium 实测 `dx=0`）。
   * 复位时机只能是 `keyup` / `blur` / `pointercancel`。
   */
  it('空格按住不放，连续拖两次画布都要跟手', () => {
    const harness = mount()
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    Object.assign(svg.style, { position: 'absolute', inset: '0' })
    harness.stage.appendChild(svg)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })

    // 第一次拖动
    const start1 = panOf(harness.worldTransform())
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
      dispatchPointer('pointermove', { clientX: 300, clientY: 100 })
      svg.dispatchEvent(pointerEvent('pointerup', { clientX: 300, clientY: 100 }))
    })
    releaseRedirect()
    const afterFirst = panOf(harness.worldTransform())
    expect(afterFirst.x - start1.x, '第一次拖动没有平移').toBeCloseTo(200, 3)

    // 空格**没有松开**，第二次拖动必须照常跟手
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 300, clientY: 100 }))
      dispatchPointer('pointermove', { clientX: 420, clientY: 160 })
      svg.dispatchEvent(pointerEvent('pointerup', { clientX: 420, clientY: 160 }))
    })
    releaseRedirect()
    const afterSecond = panOf(harness.worldTransform())
    expect(
      afterSecond.x - afterFirst.x,
      '按住空格不放时第二次拖动失效（pointerup 把空格状态清掉了）',
    ).toBeCloseTo(120, 3)
    expect(afterSecond.y - afterFirst.y, '第二次拖动的纵向位移丢了').toBeCloseTo(60, 3)

    // 真的松开空格之后，才应该不再跟着走
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    })
    const settled = panOf(harness.worldTransform())
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
      svg.dispatchEvent(pointerEvent('pointermove', { clientX: 500, clientY: 500 }))
    })
    expect(panOf(harness.worldTransform()), '松开空格后画布仍然在跟着指针走').toEqual(settled)

    harness.unmount()
  })
})

describe('指针捕获语义按真实浏览器复刻（审查必修 3）', () => {
  /**
   * 这一组是"测试自身可信度"的判据：如果 happy-dom 桩没做真重定向，
   * 下面这条会绿得毫无意义。
   *
   * 复刻点：捕获后 `pointermove` 的 `event.target` 必须**是捕获元素**，
   * 而不再是鼠标下的元素。
   */
  it('指针被捕获后，pointermove 的目标变成捕获元素（重定向真的生效）', () => {
    const harness = mount()
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    let svgMoves = 0
    svg.addEventListener('pointermove', () => {
      svgMoves += 1
    })
    harness.stage.appendChild(svg)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    })
    // 画布认领后在**舞台**上捕获：目标必须变成舞台，SVG 收不到
    expect(harness.stage.hasPointerCapture(1), '画布认领手势后没有在舞台上捕获指针').toBe(true)
    act(() => {
      dispatchPointer('pointermove', { clientX: 200, clientY: 150 })
    })
    expect(svgMoves, 'SVG 仍然收到了 pointermove —— 说明测试桩没有复刻捕获重定向').toBe(0)

    const moved = panOf(harness.worldTransform())
    expect(moved.x).toBeCloseTo(100, 3)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    })
    releaseRedirect()
    harness.unmount()
  })
})

describe('相机不得被"每帧都变的新对象"打回初始构图（滚轮/平移的真正杀手）', () => {
  /**
   * 这是"滚轮缩放一放大就自己弹回去""按住空格平移推不动"的**真正根因**，
   * 而且它在真实浏览器里才会显形 —— 单测里 `padding` 传常量，压根测不出来。
   *
   * 机制：调用方几乎都写成 `padding={fitPaddingWithinSafeArea(w, h)}`，
   * 那是**每次渲染都新建的对象字面量**。只要"重新聚焦"effect 的依赖里挂着
   * `padding` 这个对象，effect 就会在**每次渲染**重跑 → `setCamera(focus(...))`
   * 把相机打回初始构图 —— 于是滚轮刚改完 scale 就被抹掉。
   *
   * 判据用"每次渲染都新建一个 padding 对象"来复刻真实调用方。
   */
  function mountWithVolatilePadding(onRerender?: () => void): {
    stage: HTMLElement
    gestureLayer: HTMLElement
    camera(): { x: number; y: number; scale: number }
    rerender(): void
    unmount(): void
  } {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const stageRef: RefObject<HTMLDivElement | null> = createRef<HTMLDivElement>()
    const root = createRoot(host)
    const render = () => {
      root.render(
        <InfiniteCanvas
          stageRef={stageRef}
          content={{ minX: 0, minY: 0, maxX: 400, maxY: 300 }}
          tilt={0}
          showToolbar={false}
          // ⚠️ 每次渲染都是**新对象**，与真实调用方 `fitPaddingWithinSafeArea(...)` 同构
          padding={{ top: 56, bottom: 60, left: 28, right: 28 }}
        >
          <div data-testid="content" />
        </InfiniteCanvas>,
      )
      onRerender?.()
    }
    act(() => render())

    const stage = host.querySelector('[data-immersive-canvas]') as HTMLElement
    stubRect(stage, SIZE.width, SIZE.height)
    patchPointerCapture(stage)
    releaseRedirect()
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    const gestureLayer = stage.querySelector('[data-canvas-gesture-layer]') as HTMLElement
    patchPointerCapture(gestureLayer)

    const read = () => {
      const t = (stage.querySelector('[style*="translate3d"]') as HTMLElement).style.transform
      const p = panOf(t)
      const s = Number(t.match(/scale\(([-\d.]+)\)/)?.[1] ?? Number.NaN)
      return { ...p, scale: s }
    }

    return {
      stage,
      gestureLayer,
      camera: read,
      rerender: () => act(() => render()),
      unmount: () => act(() => root.unmount()),
    }
  }

  /**
   * ⚠️ 说明一个**测试能力的边界**（诚实交底，不假装覆盖到了）：
   *
   * 下面两条在 happy-dom 里其实**打不到真实根因** —— happy-dom 没有
   * `ResizeObserver`，舞台尺寸恒为 0，"重新聚焦" effect 会提前 `return`，
   * 于是"padding 每次都是新对象 → effect 每次重跑"这条链在单测里**根本不发生**。
   *
   * 真正能钉住它的是下面那条**源码契约**用例（直接检查依赖数组）。
   * 保留这两条行为用例是因为它们仍然守住了"相机不被无谓重置"这个**语义**，
   * 将来如果测试环境补上 ResizeObserver，它们会自动变成真覆盖。
   */
  it('滚轮缩放之后，即使因为别的原因重渲染（padding 是新对象），缩放也不会被打回', () => {
    const h = mountWithVolatilePadding()

    const before = h.camera()
    act(() => {
      h.stage.dispatchEvent(wheelEvent({ clientX: 600, clientY: 400, deltaY: -400 }))
    })
    const zoomed = h.camera()
    expect(zoomed.scale, '滚轮没有放大').toBeGreaterThan(before.scale)

    // 模拟"因为别的原因（相机回调 / 父组件状态）重渲染了一次"
    h.rerender()
    h.rerender()

    const after = h.camera()
    expect(
      after.scale,
      '重渲染后缩放被打回初始构图（padding 每次都是新对象 → 聚焦 effect 每次重跑）',
    ).toBeCloseTo(zoomed.scale, 3)
    expect(after.x, '重渲染后相机 x 被重置').toBeCloseTo(zoomed.x, 3)
    expect(after.y, '重渲染后相机 y 被重置').toBeCloseTo(zoomed.y, 3)
    h.unmount()
  })

  it('空格平移之后，重渲染同样不许把画布拉回原位', () => {
    const h = mountWithVolatilePadding()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    })
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    h.gestureLayer.appendChild(svg)

    act(() => {
      svg.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
      dispatchPointer('pointermove', { clientX: 260, clientY: 160 })
      svg.dispatchEvent(pointerEvent('pointerup', { clientX: 260, clientY: 160 }))
    })
    releaseRedirect()
    const panned = h.camera()
    expect(panned.x, '平移没有生效').toBeCloseTo(160, 3)

    h.rerender()
    const after = h.camera()
    expect(after.x, '重渲染后平移被打回原位（表现为"推不动"）').toBeCloseTo(panned.x, 3)
    expect(after.y, '重渲染后平移被打回原位').toBeCloseTo(panned.y, 3)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    })
    h.unmount()
  })
})

describe('源码契约：「重新聚焦」effect 不得把 padding 的对象身份当依赖', () => {
  /**
   * 这是"滚轮放大一松手就弹回初始大小""按住空格平移推不动"的**真正根因**，
   * 而它只在真实浏览器里显形（happy-dom 没有 ResizeObserver，尺寸恒为 0，
   * effect 会提前 return，行为用例打不到）。
   *
   * 所以这里直接钉**源码契约**：依赖数组里必须是 `paddingKey` 这样的**值表达**，
   * 不能是 `padding` 这个**每帧都新建**的对象。
   */
  it('聚焦 effect 依赖 paddingKey（值），不得依赖 padding（对象身份）', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/physics/runtime/immersive/useInfiniteCanvas.ts'),
      'utf8',
    )
    const index = source.indexOf('// 尺寸或内容变化 → 重新聚焦')
    expect(index, '找不到「重新聚焦」effect').toBeGreaterThan(-1)
    const block = source.slice(index, index + 900)

    // 必须存在一个由四个边距数值拼出来的稳定 key
    expect(block, '没有把 padding 折成稳定的值表达（paddingKey）').toContain('paddingKey')
    expect(block, 'paddingKey 没有参与依赖数组').toMatch(/\[contentKey,\s*size\.width,\s*size\.height,\s*paddingKey/)

    // 依赖数组里**不许**出现裸的 `padding` —— 它每次渲染都是新引用
    const depsLine = block.slice(block.indexOf('}, ['))
    expect(
      depsLine,
      '依赖数组里又挂了 padding 对象（调用方的 fitPaddingWithinSafeArea(...) 每次都是新对象，'
        + '会让 effect 每次渲染都重跑、把相机打回初始构图）',
    ).not.toMatch(/\[contentKey[^\]]*\bpadding\b(?!Key)/)
  })

  it('聚焦 effect 用的是 paddingRef 里的**最新值**，而不是闭包里那份可能过期的', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/physics/runtime/immersive/useInfiniteCanvas.ts'),
      'utf8',
    )
    const index = source.indexOf('// 尺寸或内容变化 → 重新聚焦')
    const block = source.slice(index, index + 900)
    expect(block, '聚焦时读了闭包里的 padding（值可能过期）').toContain('paddingRef.current')
  })
})
