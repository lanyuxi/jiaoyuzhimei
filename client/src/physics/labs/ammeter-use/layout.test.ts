import { describe, expect, it } from 'vitest'
import { COMPETITOR_WIRES } from './competitorScene'
import { COMPETITOR_TO_LAB_TERMINAL as COMPETITOR_TO_LAB } from './competitorGeometry'
import { competitorComponentPoints, competitorTerminalPoints } from './competitorGeometry'
import {
  CANVAS_WORLD_BOUNDS,
  COMPONENT_HIT_RADIUS,
  componentBodyRect,
  LAB_COMPONENT_IDS,
  MAX_WIRE_BEND,
  TERMINAL_OWNER,
  TERMINAL_OFFSETS,
  bendFromPosition,
  clampComponentPosition,
  componentAt,
  createDefaultLayout,
  layoutBounds,
  moveComponent,
  resetLayout,
  setWireBend,
  terminalPosition,
  terminalPositions,
  wireHandleAt,
  wireHandlePosition,
  wireKey,
  wirePathD,
  wirePathPoints,
  type LabComponentId,
  type LabLayout,
} from './layout'
import type { AmmeterTerminalId } from './definition'
import type { Position } from '../../runtime/types'

describe('默认布局 = 竞品原始构图', () => {
  it('全部 11 个接线柱的初始坐标与竞品场景逐点一致', () => {
    const layout = createDefaultLayout()
    const positions = terminalPositions(layout)
    const ids = Object.keys(competitorTerminalPoints.terminals) as AmmeterTerminalId[]
    expect(ids).toHaveLength(11)
    for (const id of ids) {
      const expected = competitorTerminalPoints.terminals[id]!
      const actual = positions[id]
      expect(actual.x, `${id}.x`).toBeCloseTo(expected.x, 6)
      expect(actual.y, `${id}.y`).toBeCloseTo(expected.y, 6)
    }
  })

  it('5 件器材的初始中心与竞品场景逐件一致', () => {
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      const expected = competitorComponentPoints.componentCenters[id]
      expect(layout.components[id].x, `${id}.x`).toBeCloseTo(expected.x, 6)
      expect(layout.components[id].y, `${id}.y`).toBeCloseTo(expected.y, 6)
    }
  })

  it('每件器材初始都落在 960×540 视图内（不会一进页面就被裁掉）', () => {
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      expect(layout.components[id].x).toBeGreaterThan(0)
      expect(layout.components[id].x).toBeLessThan(960)
      expect(layout.components[id].y).toBeGreaterThan(0)
      expect(layout.components[id].y).toBeLessThan(540)
    }
  })

  it('初始导线保持竞品手绘弧度（有非零弯曲量）', () => {
    const layout = createDefaultLayout()
    const bends = Object.values(layout.wires).map((shape) => Math.abs(shape.bend))
    expect(bends).toHaveLength(6)
    // 至少有 4 根导线带明显弧度，其余可为直线
    expect(bends.filter((bend) => bend > 8).length).toBeGreaterThanOrEqual(4)
  })

  it('resetLayout 与 createDefaultLayout 等价（可反复复位）', () => {
    expect(resetLayout()).toEqual(createDefaultLayout())
  })
})

describe('接线柱坐标由器材位置推导', () => {
  it('每件器材至少拥有一个接线柱', () => {
    const owners = new Set(Object.values(TERMINAL_OWNER))
    for (const id of LAB_COMPONENT_IDS) expect(owners.has(id)).toBe(true)
  })

  it('拖动器材后，只有它自己的接线柱位移，且位移量与器材完全一致', () => {
    const layout = createDefaultLayout()
    const before = terminalPositions(layout)
    const delta = { x: 220, y: -140 }
    const next = moveComponent(layout, 'A1', {
      x: layout.components.A1.x + delta.x,
      y: layout.components.A1.y + delta.y,
    })
    const after = terminalPositions(next)

    for (const id of Object.keys(before) as AmmeterTerminalId[]) {
      if (TERMINAL_OWNER[id] === 'A1') {
        expect(after[id].x).toBeCloseTo(before[id].x + delta.x, 6)
        expect(after[id].y).toBeCloseTo(before[id].y + delta.y, 6)
      } else {
        expect(after[id].x).toBeCloseTo(before[id].x, 6)
        expect(after[id].y).toBeCloseTo(before[id].y, 6)
      }
    }
  })

  it('接线柱偏移量与"接线柱坐标 − 器材中心"严格相等（保证不脱开）', () => {
    const layout = createDefaultLayout()
    for (const id of Object.keys(TERMINAL_OFFSETS) as AmmeterTerminalId[]) {
      const owner = TERMINAL_OWNER[id]
      const center = layout.components[owner]
      const point = terminalPosition(layout, id)
      expect(point.x - center.x).toBeCloseTo(TERMINAL_OFFSETS[id].x, 6)
      expect(point.y - center.y).toBeCloseTo(TERMINAL_OFFSETS[id].y, 6)
    }
  })

  it('器材可被拖到画布世界的四个角，且不会被钳制掉', () => {
    const layout = createDefaultLayout()
    for (const target of [
      { x: CANVAS_WORLD_BOUNDS.minX + 400, y: CANVAS_WORLD_BOUNDS.minY + 300 },
      { x: CANVAS_WORLD_BOUNDS.maxX - 400, y: CANVAS_WORLD_BOUNDS.maxY - 300 },
    ]) {
      const next = moveComponent(layout, 'E1', target)
      expect(next.components.E1.x).toBe(target.x)
      expect(next.components.E1.y).toBe(target.y)
    }
  })

  it('超出画布世界时被钳制回边界（不会把器材拖丢）', () => {
    const clamped = clampComponentPosition('E1', { x: -99999, y: 99999 })
    expect(clamped.x).toBeGreaterThanOrEqual(CANVAS_WORLD_BOUNDS.minX)
    expect(clamped.y).toBeLessThanOrEqual(CANVAS_WORLD_BOUNDS.maxY)
  })

  it('拖动器材不改变电学拓扑（edges 与布局完全解耦）', () => {
    const layout = createDefaultLayout()
    const next = moveComponent(layout, 'L1', { x: 700, y: 420 })
    // 导线的"键"仍由接线柱 id 决定，与坐标无关
    expect(Object.keys(next.wires).sort()).toEqual(Object.keys(layout.wires).sort())
  })
})

describe('导线跟随器材并可任意弯折', () => {
  it('导线端点永远等于接线柱坐标（移动器材后依然如此）', () => {
    const next = moveComponent(createDefaultLayout(), 'E1', { x: 300, y: 200 })
    for (const wire of COMPETITOR_WIRES) {
      const from = COMPETITOR_TO_LAB[wire.from]
      const to = COMPETITOR_TO_LAB[wire.to]
      const points = wirePathPoints(next, from, to)
      expect(points[0]).toEqual(terminalPosition(next, from))
      expect(points[points.length - 1]).toEqual(terminalPosition(next, to))
    }
  })

  it('移动器材后导线端点随之位移（不出现"线停在原地"）', () => {
    const layout = createDefaultLayout()
    const before = terminalPosition(layout, 'battery+')
    const next = moveComponent(layout, 'E1', { x: layout.components.E1.x + 100, y: layout.components.E1.y + 50 })
    const after = terminalPosition(next, 'battery+')
    expect(after.x - before.x).toBeCloseTo(100, 6)
    expect(after.y - before.y).toBeCloseTo(50, 6)
  })

  it('拖动折点只改变弯曲程度，端点不动', () => {
    const layout = createDefaultLayout()
    const bent = setWireBend(layout, 'battery+', 'switch-a', 120)
    const before = wirePathPoints(layout, 'battery+', 'switch-a')
    const after = wirePathPoints(bent, 'battery+', 'switch-a')
    expect(after[0]).toEqual(before[0])
    expect(after[after.length - 1]).toEqual(before[before.length - 1])
    expect(after).not.toEqual(before)
  })

  it('弯曲量被限制在上限内（不会拉出夸张的圆环）', () => {
    const layout = createDefaultLayout()
    const bent = setWireBend(layout, 'battery+', 'switch-a', 99999)
    expect(bent.wires[wireKey('battery+', 'switch-a')].bend).toBe(MAX_WIRE_BEND)
  })

  it('bendFromPosition 只取指针在连线法向上的投影（在连线上弯度为 0）', () => {
    const layout = createDefaultLayout()
    const start = terminalPosition(layout, 'battery+')
    const end = terminalPosition(layout, 'switch-a')
    const onLine = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    expect(Math.abs(bendFromPosition(layout, 'battery+', 'switch-a', onLine))).toBeLessThan(1e-6)
    const offLine = { x: onLine.x, y: onLine.y - 80 }
    expect(Math.abs(bendFromPosition(layout, 'battery+', 'switch-a', offLine))).toBeGreaterThan(10)
  })

  it('导线键与端点顺序无关（无向）', () => {
    expect(wireKey('battery+', 'switch-a')).toBe(wireKey('switch-a', 'battery+'))
  })

  it('未弯曲的导线渲染成直线，弯曲后渲染成二次贝塞尔', () => {
    const layout = createDefaultLayout()
    const straight = setWireBend(layout, 'battery+', 'switch-a', 0)
    expect(wirePathD(straight, 'battery+', 'switch-a')).toContain('L')
    const curved = setWireBend(layout, 'battery+', 'switch-a', 140)
    expect(wirePathD(curved, 'battery+', 'switch-a')).toContain('Q')
  })

  it('生成的 SVG 路径数字全部有效（不会出现 NaN）', () => {
    let layout = createDefaultLayout()
    layout = moveComponent(layout, 'A1', { x: 1400, y: 900 })
    layout = setWireBend(layout, 'battery+', 'switch-a', 180)
    for (const wire of COMPETITOR_WIRES) {
      const path = wirePathD(layout, COMPETITOR_TO_LAB[wire.from], COMPETITOR_TO_LAB[wire.to])
      expect(path).not.toContain('NaN')
      expect(path.length).toBeGreaterThan(0)
    }
  })

  it('导线折点手柄位置与 wirePathPoints 的控制点一致', () => {
    const layout = setWireBend(createDefaultLayout(), 'battery+', 'switch-a', 90)
    const handle = wireHandlePosition(layout, 'battery+', 'switch-a')
    expect(handle).toEqual(wirePathPoints(layout, 'battery+', 'switch-a')[1])
  })

  it('折点手柄命中测试只对已存在的导线生效', () => {
    const layout = setWireBend(createDefaultLayout(), 'battery+', 'switch-a', 90)
    const handle = wireHandlePosition(layout, 'battery+', 'switch-a')
    const edges = [{ from: 'battery+' as AmmeterTerminalId, to: 'switch-a' as AmmeterTerminalId }]
    expect(wireHandleAt(layout, edges, handle)).toEqual(edges[0])
    expect(wireHandleAt(layout, [], handle)).toBeNull()
    expect(wireHandleAt(layout, edges, { x: handle.x + 400, y: handle.y })).toBeNull()
  })
})

describe('器材拖动命中测试', () => {
  it('器材中心必定命中自己', () => {
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      expect(componentAt(layout, layout.components[id])).toBe(id)
    }
  })

  it('器材被移动后，命中区跟着移动', () => {
    const layout = createDefaultLayout()
    const target = { x: 1500, y: 1200 }
    const next = moveComponent(layout, 'S1', target)
    expect(componentAt(next, target)).toBe('S1')
    expect(componentAt(next, layout.components.S1)).not.toBe('S1')
  })

  it('空白处不命中任何器材', () => {
    const layout = createDefaultLayout()
    const far = { x: CANVAS_WORLD_BOUNDS.maxX - 10, y: CANVAS_WORLD_BOUNDS.minY + 10 }
    expect(componentAt(layout, far)).toBeNull()
  })

  it('每件器材的命中区都大于其接线柱偏移（本体可被直接抓住）', () => {
    for (const id of LAB_COMPONENT_IDS) {
      expect(COMPONENT_HIT_RADIUS[id].rx).toBeGreaterThan(40)
      expect(COMPONENT_HIT_RADIUS[id].ry).toBeGreaterThan(30)
    }
  })
})

describe('画布包围盒', () => {
  it('包围盒按**本体真实外接矩形**取，并且必须包住每一件器材', () => {
    /**
     * 这里记录一次真实事故（"加载即被裁"的根因）：
     * 旧实现是 `center ± (本体边距 − 64)` —— **故意把包围盒缩小 64px**，
     * 指望"聚焦时反正还有 120px 留白"兜住。但留白是均分的，
     * 而这块屏幕上下各压着一条悬浮控件，结果是 E1 / S1 / S2 的上缘
     * 一进页面就被顶部工具栏切掉（1688×841 / 1920×1080 / 1440×800 都能复现）。
     */
    const bounds = layoutBounds(createDefaultLayout())
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    expect(width).toBeGreaterThan(400)
    // 不再有"缩 64px"的说法，因此尺寸必须与本体并集一致（略大于 960×540 的参考线）
    expect(width).toBeLessThan(960)
    expect(height).toBeGreaterThan(350)
    expect(height).toBeLessThanOrEqual(600)
    // 每一件器材的本体外接矩形都必须完整落在包围盒内
    for (const id of LAB_COMPONENT_IDS) {
      const rect = componentBodyRect(id, createDefaultLayout().components[id])
      expect(rect.left, `${id} 左缘超出包围盒`).toBeGreaterThanOrEqual(bounds.minX - 1e-9)
      expect(rect.right, `${id} 右缘超出包围盒`).toBeLessThanOrEqual(bounds.maxX + 1e-9)
      expect(rect.top, `${id} 上缘超出包围盒`).toBeGreaterThanOrEqual(bounds.minY - 1e-9)
      expect(rect.bottom, `${id} 下缘超出包围盒`).toBeLessThanOrEqual(bounds.maxY + 1e-9)
    }
  })

  it('把器材拖远后包围盒变大（内容不会被相机裁掉）', () => {
    const layout = createDefaultLayout()
    const before = layoutBounds(layout)
    const after = layoutBounds(moveComponent(layout, 'A1', { x: before.maxX + 500, y: before.maxY + 300 }))
    expect(after.maxX).toBeGreaterThan(before.maxX)
    expect(after.maxY).toBeGreaterThan(before.maxY)
  })

  it('包围盒包含所有器材与导线折点', () => {
    const layout = setWireBend(createDefaultLayout(), 'battery+', 'switch-a', 200)
    const bounds = layoutBounds(layout)
    for (const id of LAB_COMPONENT_IDS) {
      const center = layout.components[id] as { x: number; y: number }
      expect(center.x).toBeGreaterThanOrEqual(bounds.minX)
      expect(center.x).toBeLessThanOrEqual(bounds.maxX)
      expect(center.y).toBeGreaterThanOrEqual(bounds.minY)
      expect(center.y).toBeLessThanOrEqual(bounds.maxY)
    }
  })

  it('包围盒随器材移动而移动', () => {
    const layout = createDefaultLayout()
    const stable = layoutBounds(createDefaultLayout())
    const moved = layoutBounds(moveComponent(layout, 'L1', { x: 1800, y: 300 }))
    expect(moved).not.toEqual(stable)
    expect(moved.maxX).toBeGreaterThan(stable.maxX)
  })

  it('重复调用对同一布局返回完全相同的包围盒（相机聚焦值稳定，拖动时不会抖动）', () => {
    const layout = createDefaultLayout()
    expect(layoutBounds(layout)).toEqual(layoutBounds(layout))
    expect(layoutBounds(createDefaultLayout())).toEqual(layoutBounds(layout))
  })
})

describe('布局不可变性', () => {
  it('moveComponent 不修改原布局', () => {
    const layout = createDefaultLayout()
    const snapshot = JSON.parse(JSON.stringify(layout))
    moveComponent(layout, 'A1', { x: 1, y: 1 })
    expect(JSON.parse(JSON.stringify(layout))).toEqual(snapshot)
  })

  it('setWireBend 不修改原布局', () => {
    const layout = createDefaultLayout()
    const snapshot = JSON.parse(JSON.stringify(layout))
    setWireBend(layout, 'battery+', 'switch-a', 100)
    expect(JSON.parse(JSON.stringify(layout))).toEqual(snapshot)
  })

  it('可以连续拖动多件器材并保持互不干扰', () => {
    let layout = createDefaultLayout()
    const moves: Array<[LabComponentId, number, number]> = [
      ['E1', 200, 120],
      ['S1', -160, 240],
      ['L1', 320, -80],
      ['A1', -90, -150],
      ['S2', 60, 60],
    ]
    for (const [id, dx, dy] of moves) {
      layout = moveComponent(layout, id, { x: layout.components[id].x + dx, y: layout.components[id].y + dy })
    }
    for (const [id, dx, dy] of moves) {
      const expected = competitorComponentPoints.componentCenters[id]
      expect(layout.components[id].x).toBeCloseTo(expected.x + dx, 6)
      expect(layout.components[id].y).toBeCloseTo(expected.y + dy, 6)
    }
  })
})

describe('「按接线柱」还是「搬器材」的判定', () => {
  /** 与场景一致的判据：离最近接线柱更近、且足够靠近，才算按在接线柱上 */
  const GRAB_RADIUS = 26
  function shouldGrabTerminal(layout: LabLayout, id: LabComponentId, position: Position): boolean {
    const center = layout.components[id]
    let nearest: { position: Position; distance: number } | null = null
    for (const terminal of Object.keys(TERMINAL_OFFSETS) as AmmeterTerminalId[]) {
      const point = terminalPosition(layout, terminal)
      const distance = Math.hypot(position.x - point.x, position.y - point.y)
      if (nearest === null || distance < nearest.distance) nearest = { position: point, distance }
    }
    if (nearest === null) return false
    const toTerminal = nearest.distance
    const toCenter = Math.hypot(position.x - center.x, position.y - center.y)
    return toTerminal <= GRAB_RADIUS && toTerminal < toCenter
  }

  it('按在器材本体中心时判定为「搬器材」而不是「接线」', () => {
    const layout = createDefaultLayout()
    for (const id of LAB_COMPONENT_IDS) {
      expect(shouldGrabTerminal(layout, id, layout.components[id]), `${id} 本体中心应可拖动`).toBe(false)
    }
  })

  it('按在接线柱正上方时判定为「接线」', () => {
    const layout = createDefaultLayout()
    for (const [id, owner] of Object.entries(TERMINAL_OWNER) as Array<[AmmeterTerminalId, LabComponentId]>) {
      const point = terminalPosition(layout, id)
      expect(shouldGrabTerminal(layout, owner, point), `${id} 应判定为接线`).toBe(true)
    }
  })

  it('电流表三只接线柱长在表体上，但按表体仍可拖动（浏览器实测暴露的缺陷）', () => {
    const layout = createDefaultLayout()
    const center = layout.components.A1
    // 电流表的三只接线柱紧贴表体下沿：离表体中心的距离只有几十像素，
    // 旧实现「附近有接线柱就不拖动」会让整个表体几乎无法拖动。
    const distances = (Object.keys(TERMINAL_OFFSETS) as AmmeterTerminalId[])
      .map((id) => Math.hypot(terminalPosition(layout, id).x - center.x, terminalPosition(layout, id).y - center.y))
      .sort((a, b) => a - b)
    expect(distances[0]).toBeLessThan(60)
    // 修正后：表体中心与表体上半部（表盘区域）都可以拖动，
    // 只有贴近接线柱的那一小圈才算「接线」，两种意图各自都有明确的归属
    const terminal = terminalPosition(layout, 'ammeter-0.6')
    for (const factor of [0, 0.1, 0.3]) {
      const probe = {
        x: center.x + (terminal.x - center.x) * factor,
        y: center.y + (terminal.y - center.y) * factor,
      }
      expect(shouldGrabTerminal(layout, 'A1', probe), `factor=${factor} 处应可拖动`).toBe(false)
    }
    // 而真正按在接线柱上时依然判定为接线
    expect(shouldGrabTerminal(layout, 'A1', terminalPosition(layout, 'ammeter-0.6'))).toBe(true)
  })

  it('器材被拖走后，接线柱判定随之移动（命中区不会留在原处）', () => {
    const layout = createDefaultLayout()
    const target = { x: 1600, y: 1000 }
    const next = moveComponent(layout, 'S1', target)
    const terminal = terminalPosition(next, 'switch-a')
    expect(shouldGrabTerminal(next, 'S1', terminal)).toBe(true)
    // 原先的接线柱位置在新布局中不再判定为 S1 的接线柱
    const oldTerminal = terminalPosition(layout, 'switch-a')
    expect(shouldGrabTerminal(next, 'S1', oldTerminal)).toBe(false)
  })
})
