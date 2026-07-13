import { describe, expect, it } from 'vitest'
import { HEAT_CAPACITY_SNAP_ZONES, isInsideSnapZone } from '../labs/heat-capacity/definition'
import { mapClientPointToSvgViewBox } from './svgCoordinates'

const viewBox = { x: 0, y: 0, width: 960, height: 540 }

describe('mapClientPointToSvgViewBox', () => {
  it('removes horizontal letterboxing before mapping into the viewBox', () => {
    expect(mapClientPointToSvgViewBox(
      { clientX: 480, clientY: 0 },
      { rect: { left: 0, top: 0, width: 1920, height: 540 }, viewBox },
    )).toEqual({ x: 0, y: 0 })

    expect(mapClientPointToSvgViewBox(
      { clientX: 1440, clientY: 540 },
      { rect: { left: 0, top: 0, width: 1920, height: 540 }, viewBox },
    )).toEqual({ x: 960, y: 540 })
  })

  it('removes vertical letterboxing before mapping into the viewBox', () => {
    expect(mapClientPointToSvgViewBox(
      { clientX: 0, clientY: 270 },
      { rect: { left: 0, top: 0, width: 960, height: 1080 }, viewBox },
    )).toEqual({ x: 0, y: 0 })

    expect(mapClientPointToSvgViewBox(
      { clientX: 960, clientY: 810 },
      { rect: { left: 0, top: 0, width: 960, height: 1080 }, viewBox },
    )).toEqual({ x: 960, y: 540 })
  })

  it('maps directly when the SVG has no letterboxing', () => {
    expect(mapClientPointToSvgViewBox(
      { clientX: 960, clientY: 540 },
      { rect: { left: 0, top: 0, width: 1920, height: 1080 }, viewBox },
    )).toEqual({ x: 480, y: 270 })
  })

  it('keeps a visible snap-zone edge inside its zone', () => {
    const zone = HEAT_CAPACITY_SNAP_ZONES.waterHeater
    const position = mapClientPointToSvgViewBox(
      { clientX: (zone.x + zone.width) * 2, clientY: (zone.y + zone.height) * 2 },
      { rect: { left: 0, top: 0, width: 1920, height: 1080 }, viewBox },
    )

    expect(position).toEqual({ x: zone.x + zone.width, y: zone.y + zone.height })
    if (position === null) throw new Error('expected a mapped position')
    expect(isInsideSnapZone(position, zone)).toBe(true)
  })

  it('maps an invisible letterbox margin outside visible snap zones', () => {
    const position = mapClientPointToSvgViewBox(
      { clientX: 479, clientY: HEAT_CAPACITY_SNAP_ZONES.waterHeater.y },
      { rect: { left: 0, top: 0, width: 1920, height: 540 }, viewBox },
    )

    expect(position).toEqual({ x: -1, y: HEAT_CAPACITY_SNAP_ZONES.waterHeater.y })
    if (position === null) throw new Error('expected a mapped position')
    expect(isInsideSnapZone(position, HEAT_CAPACITY_SNAP_ZONES.waterHeater)).toBe(false)
  })
})
