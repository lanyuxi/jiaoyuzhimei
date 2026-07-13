import { describe, expect, it } from 'vitest'
import {
  getTextbookChapters,
  getTextbookExperimentTarget,
  parsePhysicsCatalogMode,
  selectTextbookVolume,
  serializePhysicsCatalogMode,
} from './physics/catalogState'
import { textbookPhysicsExperiments } from './physics/curriculum/catalog'
import type { CurriculumFilters } from './physics/curriculum/types'

describe('physics catalog state', () => {
  it('defaults to the textbook catalog and serializes the extended catalog URL', () => {
    expect(parsePhysicsCatalogMode(new URLSearchParams())).toBe('textbook')
    expect(parsePhysicsCatalogMode(new URLSearchParams('catalog=extended'))).toBe('extended')
    expect(serializePhysicsCatalogMode('textbook').toString()).toBe('')
    expect(serializePhysicsCatalogMode('extended').toString()).toBe('catalog=extended')
  })

  it('exposes the three benchmark cards as the available labs', () => {
    expect(textbookPhysicsExperiments).toHaveLength(65)
    expect(textbookPhysicsExperiments.filter((item) => item.availability === 'available').map((item) => item.id)).toEqual([
      'heat-capacity-comparison',
      'series-parallel-circuit',
      'electromagnetic-induction',
    ])
    expect(textbookPhysicsExperiments.map(getTextbookExperimentTarget)).toEqual(
      textbookPhysicsExperiments.map((item) => item.id === 'heat-capacity-comparison' || item.id === 'series-parallel-circuit' || item.id === 'electromagnetic-induction'
        ? `/physics/labs/${item.id}`
        : undefined),
    )
  })

  it('reserves the future available-card destination for the Task 3 lab route', () => {
    const scheduledItem = textbookPhysicsExperiments[0]
    const availableItem = { ...scheduledItem, availability: 'available' as const }

    expect(getTextbookExperimentTarget(availableItem)).toBe(`/physics/labs/${scheduledItem.id}`)
  })

  it('resets chapter selection and derives chapter options from the selected volume', () => {
    const filters: CurriculumFilters = {
      volume: '九年级全一册',
      chapter: '第22章 能源与可持续发展',
      requirement: 'required',
      query: '核能',
    }
    const nextFilters = selectTextbookVolume(filters, '八年级上册')
    const expectedChapters = [...new Set(
      textbookPhysicsExperiments
        .filter((item) => item.volume === '八年级上册')
        .map((item) => item.chapter),
    )]

    expect(nextFilters).toEqual({ ...filters, volume: '八年级上册', chapter: 'ALL' })
    expect(getTextbookChapters(nextFilters.volume)).toEqual(expectedChapters)
    expect(getTextbookChapters(nextFilters.volume)).not.toContain(filters.chapter)
  })
})
