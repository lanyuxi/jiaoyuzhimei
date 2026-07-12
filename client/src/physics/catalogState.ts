import { textbookPhysicsExperiments } from './curriculum/catalog'
import type { CurriculumFilters, TextbookPhysicsExperiment, TextbookVolume } from './curriculum/types'

export type PhysicsCatalogMode = 'textbook' | 'extended'

export function parsePhysicsCatalogMode(searchParams: Pick<URLSearchParams, 'get'>): PhysicsCatalogMode {
  return searchParams.get('catalog') === 'extended' ? 'extended' : 'textbook'
}

export function serializePhysicsCatalogMode(mode: PhysicsCatalogMode): URLSearchParams {
  return new URLSearchParams(mode === 'extended' ? [['catalog', 'extended']] : [])
}

export function getTextbookChapters(volume: TextbookVolume | 'ALL'): readonly string[] {
  return [...new Set(
    textbookPhysicsExperiments
      .filter((item) => volume === 'ALL' || item.volume === volume)
      .map((item) => item.chapter),
  )]
}

export function selectTextbookVolume(
  filters: CurriculumFilters,
  volume: TextbookVolume | 'ALL',
): CurriculumFilters {
  return { ...filters, volume, chapter: 'ALL' }
}

export function getTextbookExperimentTarget(
  item: Pick<TextbookPhysicsExperiment, 'availability' | 'id'>,
): string | undefined {
  return item.availability === 'available' ? `/physics/labs/${item.id}` : undefined
}
