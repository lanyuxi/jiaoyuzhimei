import { describe, expect, it } from 'vitest'
import {
  CANVAS_MAX_SCALE,
  CANVAS_MIN_SCALE,
  canvasToScreen,
  fitContent,
  panBy,
  screenToCanvas,
  zoomAt,
  zoomFromWheel,
  type Camera,
} from './canvas'

const stage = { width: 1280, height: 720 }
const content = { minX: 0, minY: 0, maxX: 960, maxY: 540 }

describe('无限画布相机', () => {
  it('聚焦内容后器材铺满视口而不是缩在中间一小块', () => {
    const camera = fitContent(content, stage, 48)
    // 960×540 的内容在 1280×720 视口上应被放大（受 maxScale 限制）
    expect(camera.scale).toBeGreaterThan(1)
    // 内容中心映射到视口中心
    const center = canvasToScreen({ x: 480, y: 270 }, camera)
    expect(center.x).toBeCloseTo(stage.width / 2, 6)
    expect(center.y).toBeCloseTo(stage.height / 2, 6)
    // 内容四角都落在视口内（完整可见、无裁切）
    for (const point of [
      { x: content.minX, y: content.minY },
      { x: content.maxX, y: content.maxY },
    ]) {
      const screen = canvasToScreen(point, camera)
      expect(screen.x).toBeGreaterThanOrEqual(0)
      expect(screen.x).toBeLessThanOrEqual(stage.width)
      expect(screen.y).toBeGreaterThanOrEqual(0)
      expect(screen.y).toBeLessThanOrEqual(stage.height)
    }
  })

  it('滚轮缩放以指针为锚点，指针下的内容不移动', () => {
    const camera: Camera = { scale: 1, x: 0, y: 0 }
    const anchor = { x: 400, y: 300 }
    const before = screenToCanvas(anchor, camera)
    const zoomed = zoomFromWheel(camera, -120, anchor, stage)
    expect(zoomed.scale).toBeGreaterThan(1)
    const after = screenToCanvas(anchor, zoomed)
    expect(after.x).toBeCloseTo(before.x, 6)
    expect(after.y).toBeCloseTo(before.y, 6)
  })

  it('缩放被钳制在允许区间内，可以无限缩放但不会失控', () => {
    let camera: Camera = { scale: 1, x: 0, y: 0 }
    for (let index = 0; index < 200; index += 1) {
      camera = zoomAt(camera, 1.2, { x: 0, y: 0 }, stage)
    }
    expect(camera.scale).toBeCloseTo(CANVAS_MAX_SCALE, 6)

    for (let index = 0; index < 400; index += 1) {
      camera = zoomAt(camera, 0.8, { x: 0, y: 0 }, stage)
    }
    expect(camera.scale).toBeCloseTo(CANVAS_MIN_SCALE, 6)
  })

  it('平移是**无限**的：没有任何屏幕/画布边界会把它挡住', () => {
    /**
     * 需求原话：「现在我的实验器材无法自由的拖动到任意位置，
     * 比如拖动靠近边沿就无法拖动了，并不是无限画布」。
     *
     * 旧实现在这里会命中 `CANVAS_OFFSET_MARGIN`（1375 宽视口下 8250px），
     * 也就是"往一个方向最多推 6 屏"—— 手感就是"拖到边沿拖不动了"。
     * 现在平移量不许被任何常数夹住（只有远在人类操作之外的浮点护栏）。
     */
    let camera: Camera = { scale: 1, x: 0, y: 0 }
    for (let i = 0; i < 50; i += 1) camera = panBy(camera, 5000, -5000, stage)
    expect(camera.x).toBe(250000)
    expect(camera.y).toBe(-250000)
    // 再往里推 100 万像素仍然照走不误
    const further = panBy(camera, 1_000_000, 1_000_000, stage)
    expect(further.x).toBe(1_250_000)
    expect(further.y).toBe(750_000)
    // 而且可以精确还原回原点（往返不丢位移）
    const home = panBy(camera, -250000, 250000, stage)
    expect(home.x).toBe(0)
    expect(home.y).toBe(0)
  })

  it('平移量只受浮点护栏保护：非有限值归零，超精度上限停在护栏上', () => {
    // `camera.x + dx === camera.x` 会让平移在数值上卡死；护栏远在任何人类操作之外
    expect(panBy({ scale: 1, x: 0, y: 0 }, Number.POSITIVE_INFINITY, 10, stage).x).toBe(0)
    expect(panBy({ scale: 1, x: 0, y: 0 }, 10, Number.NaN, stage).y).toBe(0)
    expect(panBy({ scale: 1, x: 0, y: 0 }, 1e12, 0, stage).x).toBe(1e9)
  })

  it('缩放后仍然可以无限平移（缩放不会重新把平移夹住）', () => {
    const zoomed = zoomAt({ scale: 1, x: 0, y: 0 }, 6, { x: 100, y: 100 }, stage)
    const moved = panBy(zoomed, 400000, -400000, stage)
    expect(moved.x).toBeCloseTo(zoomed.x + 400000, 6)
    expect(moved.y).toBeCloseTo(zoomed.y - 400000, 6)
  })

  it('画布坐标与屏幕坐标可互相还原', () => {
    const camera: Camera = { scale: 2.4, x: -318, y: 96 }
    const point = { x: 512, y: 288 }
    const roundTrip = screenToCanvas(canvasToScreen(point, camera), camera)
    expect(roundTrip.x).toBeCloseTo(point.x, 6)
    expect(roundTrip.y).toBeCloseTo(point.y, 6)
  })
})
