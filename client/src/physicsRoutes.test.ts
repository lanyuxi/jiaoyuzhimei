import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { textbookExperimentById } from './physics/curriculum/catalog'

const sourceDirectory = join(process.cwd(), 'src')
const textbookPagePath = join(sourceDirectory, 'physics/TextbookPhysicsExperimentPage.tsx')
const experimentInfoPath = join(sourceDirectory, 'physics/runtime/ExperimentInfo.tsx')

describe('textbook physics lab routes', () => {
  it('routes textbook labs before the legacy slug route', () => {
    const app = readFileSync(join(sourceDirectory, 'App.tsx'), 'utf8')

    expect(app.indexOf('path="physics/labs/:id"')).toBeLessThan(app.indexOf('path="physics/:slug"'))
    expect(app).toContain("import('./physics/TextbookPhysicsExperimentPage')")
  })

  it('resolves scheduled textbook experiments and exposes all six teaching sections', async () => {
    const knownId = 'ruler-length-measurement'
    const knownExperiment = textbookExperimentById.get(knownId)

    expect(knownExperiment?.availability).toBe('scheduled')
    expect(textbookExperimentById.get('unknown-textbook-experiment')).toBeUndefined()
    expect(existsSync(textbookPagePath)).toBe(true)
    expect(existsSync(experimentInfoPath)).toBe(true)

    if (!existsSync(textbookPagePath) || !existsSync(experimentInfoPath)) return

    const { getTextbookExperiment } = await import('./physics/TextbookPhysicsExperimentPage')
    const { experimentInfoSections } = await import('./physics/runtime/ExperimentInfo')

    expect(getTextbookExperiment(knownId)).toBe(knownExperiment)
    expect(getTextbookExperiment('unknown-textbook-experiment')).toBeUndefined()
    expect(experimentInfoSections.map((section) => section.key)).toEqual([
      'purpose',
      'principle',
      'apparatus',
      'steps',
      'conclusion',
      'supplement',
    ])
    expect(experimentInfoSections.map((section) => section.title)).toEqual([
      '实验目的',
      '实验原理',
      '实验器材',
      '实验步骤',
      '实验结论',
      '实验补充',
    ])
  })
})
