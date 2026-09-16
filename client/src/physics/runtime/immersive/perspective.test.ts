/**
 * 3D 透视舞台的屏幕 ↔ 画布换算回归测试。
 *
 * 需求背景：「全屏无限画布 + 拖动不被遮挡」。
 *
 * 这里守的是一个**实测踩到的坑**：舞台带 `rotateX(13deg)` 的 3D 倾斜，
 * 而"可见范围反算"当初只做线性的 scale+translate，完全忽略透视。
 * 后果是：器材按线性反算出的"合法画布区间"夹取后，
 * 画布坐标看着合法，**屏幕上却仍然探出 92px**（真实浏览器实测）。
 *
 * 因此断言分三层：
 *   1. 投影/反投影必须互为逆运算（round-trip）；
 *   2. 反投影必须避开透视奇点，绝不发散；
 *   3. 有倾斜时反投影结果必须**不同于**线性近似 ——
 *      这条正是"忘了算透视"的直接探针。
 */
import { describe, expect, it } from 'vitest'
import {
  projectPerspective,
  unprojectPerspective,
  perspectiveSearchLimit,
  type PerspectiveStage,
} from './canvas'

const stage: PerspectiveStage = {
  camera: { scale: 1.41735, x: 134.588, y: 22.3575 },
  tilt: 13,
  perspective: 1600,
  originX: 844,
  originY: 0.58 * 841,
  stage: { width: 1688, height: 841 },
}

/** 舞台不带倾斜（此时投影退化为线性 scale+translate） */
const flatStage: PerspectiveStage = { ...stage, tilt: 0 }

describe('3D 透视投影', () => {
  it('倾斜为 0 时退化为线性 scale+translate', () => {
    const point = { x: 300, y: 400 }
    const projected = projectPerspective(point, flatStage)
    expect(projected.x).toBeCloseTo(point.x * 1.41735 + 134.588, 6)
    expect(projected.y).toBeCloseTo(point.y * 1.41735 + 22.3575, 6)
  })

  it('倾斜不为 0 时，屏幕上下的缩放不一致（这就是"线性近似"会算错的原因）', () => {
    const top = projectPerspective({ x: 480, y: 0 }, stage)
    const middle = projectPerspective({ x: 480, y: 270 }, stage)
    const bottom = projectPerspective({ x: 480, y: 540 }, stage)
    const upperGap = middle.y - top.y
    const lowerGap = bottom.y - middle.y
    // 画布下方被推得更远（屏幕间距更大），这正是"底下内容容易被推出屏幕"的成因
    expect(lowerGap).toBeGreaterThan(upperGap)
  })

  it('投影 → 反投影是恒等变换（覆盖整块可见区域）', () => {
    for (const point of [
      { x: 0, y: 0 },
      { x: 480, y: 270 },
      { x: 960, y: 540 },
      { x: -95, y: 24 },
      { x: 1096, y: 527 },
    ]) {
      const restored = unprojectPerspective(projectPerspective(point, stage), stage)
      expect(restored.x, `x @ ${JSON.stringify(point)}`).toBeCloseTo(point.x, 3)
      expect(restored.y, `y @ ${JSON.stringify(point)}`).toBeCloseTo(point.y, 3)
    }
  })

  it('反投影绝不发散：屏幕四角都解出有限值', () => {
    for (const screenPoint of [
      { x: 0, y: 0 },
      { x: 1688, y: 0 },
      { x: 0, y: 841 },
      { x: 1688, y: 841 },
    ]) {
      const point = unprojectPerspective(screenPoint, stage)
      expect(Number.isFinite(point.x), `x 发散 @ ${JSON.stringify(screenPoint)}`).toBe(true)
      expect(Number.isFinite(point.y), `y 发散 @ ${JSON.stringify(screenPoint)}`).toBe(true)
      // 反投影结果必须落在搜索半径内，而不是跑到极端值
      const limit = perspectiveSearchLimit(stage)
      expect(Math.abs(point.x)).toBeLessThanOrEqual(limit)
      expect(Math.abs(point.y)).toBeLessThanOrEqual(limit)
    }
  })

  it('搜索半径严格小于透视奇点（否则二分法会因非单调而跑飞）', () => {
    const radians = (stage.tilt * Math.PI) / 180
    const singularity = stage.perspective / (Math.sin(radians) * stage.camera.scale)
    const limit = perspectiveSearchLimit(stage)
    expect(limit).toBeLessThan(singularity)
    expect(limit).toBeGreaterThan(1000)
  })

  it('倾斜时反投影结果与线性近似不同（回归：曾经漏算透视导致屏幕溢出 92px）', () => {
    const screenPoint = { x: 844, y: 781 }
    const linear = {
      x: (screenPoint.x - stage.camera.x) / stage.camera.scale,
      y: (screenPoint.y - stage.camera.y) / stage.camera.scale,
    }
    const corrected = unprojectPerspective(screenPoint, stage)
    expect(Math.abs(corrected.y - linear.y), '透视修正量不该为 0').toBeGreaterThan(1)
    // 修正方向：线性近似把可见下界算得**过低**，所以必须往上收
    expect(corrected.y).toBeLessThan(linear.y)
  })

  it('倾斜为 0 时反投影与线性近似完全一致', () => {
    const screenPoint = { x: 844, y: 781 }
    const linear = {
      x: (screenPoint.x - flatStage.camera.x) / flatStage.camera.scale,
      y: (screenPoint.y - flatStage.camera.y) / flatStage.camera.scale,
    }
    const restored = unprojectPerspective(screenPoint, flatStage)
    expect(restored.x).toBeCloseTo(linear.x, 3)
    expect(restored.y).toBeCloseTo(linear.y, 3)
  })

  it('缩放极端时反投影仍然稳定可用', () => {
    for (const scale of [0.18, 1, 2.6, 14]) {
      const variant: PerspectiveStage = { ...stage, camera: { ...stage.camera, scale } }
      const point = unprojectPerspective({ x: 844, y: 500 }, variant)
      expect(Number.isFinite(point.x), `x @ scale=${scale}`).toBe(true)
      expect(Number.isFinite(point.y), `y @ scale=${scale}`).toBe(true)
      const back = projectPerspective(point, variant)
      expect(back.x, `round-trip x @ scale=${scale}`).toBeCloseTo(844, 2)
      expect(back.y, `round-trip y @ scale=${scale}`).toBeCloseTo(500, 2)
    }
  })
})
