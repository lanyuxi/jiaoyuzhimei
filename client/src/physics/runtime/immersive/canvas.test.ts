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

  it('平移是自由的（无限画布），但不会把内容整体拖出屏幕', () => {
    const far = panBy({ scale: 1, x: 0, y: 0 }, 100000, 100000, stage)
    expect(far.x).toBeLessThan(100000)
    expect(far.x).toBeGreaterThan(0)
    const back = panBy(far, -100000, -100000, stage)
    expect(back.x).toBe(-7680)
    expect(back.y).toBe(-4320)
    // 反向平移回到原点附近时相机可还原
    const home = panBy({ scale: 1, x: 320, y: -240 }, 0, 0, stage)
    expect(home.x).toBe(320)
    expect(home.y).toBe(-240)
  })

  it('画布坐标与屏幕坐标可互相还原', () => {
    const camera: Camera = { scale: 2.4, x: -318, y: 96 }
    const point = { x: 512, y: 288 }
    const roundTrip = screenToCanvas(canvasToScreen(point, camera), camera)
    expect(roundTrip.x).toBeCloseTo(point.x, 6)
    expect(roundTrip.y).toBeCloseTo(point.y, 6)
  })
})
