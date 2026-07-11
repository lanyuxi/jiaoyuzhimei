import { describe, expect, it } from 'vitest'
import * as catalog from './catalog'
import type { CurriculumFilters, TextbookPhysicsExperiment } from './types'

const curriculumCatalog = catalog as typeof catalog & {
  textbookExperimentById?: ReadonlyMap<string, TextbookPhysicsExperiment>
  filterTextbookExperiments?: (filters: CurriculumFilters) => readonly TextbookPhysicsExperiment[]
}

const { textbookPhysicsExperiments } = catalog

describe('textbook physics catalog', () => {
  it('contains the exact 65-item volume split', () => {
    const counts = textbookPhysicsExperiments.reduce<Record<string, number>>((result, item) => {
      result[item.volume] = (result[item.volume] ?? 0) + 1
      return result
    }, {})
    expect(textbookPhysicsExperiments).toHaveLength(65)
    expect(counts['八年级上册']).toBe(21)
    expect(counts['八年级下册']).toBe(18)
    expect(counts['九年级全一册']).toBe(26)
  })

  it('has unique ids and all six teaching sections', () => {
    expect(new Set(textbookPhysicsExperiments.map((item) => item.id)).size).toBe(65)
    for (const item of textbookPhysicsExperiments) {
      expect(item.textbook).toBe('人教版')
      expect(item.purpose.length).toBeGreaterThan(0)
      expect(item.principle.length).toBeGreaterThan(0)
      expect(item.apparatus.length).toBeGreaterThan(0)
      expect(item.steps.length).toBeGreaterThan(0)
      expect(item.conclusion.length).toBeGreaterThan(0)
      expect(item.supplement.length).toBeGreaterThan(0)
    }
  })

  it('indexes by id and filters by curriculum fields and query', () => {
    expect(curriculumCatalog.textbookExperimentById).toBeInstanceOf(Map)
    expect(curriculumCatalog.textbookExperimentById?.get('heat-capacity-comparison')?.title).toBe('比较不同物质的吸热能力')
    expect(curriculumCatalog.filterTextbookExperiments).toBeTypeOf('function')

    const matches = curriculumCatalog.filterTextbookExperiments?.({
      volume: '九年级全一册',
      chapter: '第13章 内能',
      requirement: 'required',
      query: '吸热能力',
    })

    expect(matches?.map((item) => item.id)).toEqual(['heat-capacity-comparison'])
  })
})
