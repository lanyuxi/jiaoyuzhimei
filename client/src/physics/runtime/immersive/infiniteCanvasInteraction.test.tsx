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
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createRef, type RefObject } from 'react'
import InfiniteCanvas from './InfiniteCanvas'

/** happy-dom 没有实现指针捕获，这里补一个 no-op，避免事件链被打断 */
function patchPointerCapture(element: Element) {
  const target = element as Element & {
    setPointerCapture?: (id: number) => void
    releasePointerCapture?: (id: number) => void
    hasPointerCapture?: (id: number) => boolean
  }
  target.setPointerCapture ??= () => {}
  target.releasePointerCapture ??= () => {}
  target.hasPointerCapture ??= () => false
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

  const gestureLayer = stage.firstElementChild as HTMLElement
  patchPointerCapture(gestureLayer)

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
    // 捕获后指针事件重定向到捕获元素（见上一条用例的说明），从舞台继续派发
    act(() => {
      harness.stage.dispatchEvent(pointerEvent('pointermove', { clientX: 180, clientY: 160 }))
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
      harness.stage.dispatchEvent(pointerEvent('pointermove', { clientX: 110, clientY: 60 }))
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
      svg.dispatchEvent(pointerEvent('pointermove', { clientX: 90, clientY: 30 }))
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
        svg.dispatchEvent(pointerEvent('pointermove', { clientX: x, clientY: y }))
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
      svg.dispatchEvent(pointerEvent('pointermove', { clientX: 250, clientY: 0 }))
    })
    const after = panOfWorld()
    expect(after.x - before.x).toBeCloseTo(250, 3)
    harness.unmount()
  })
})
