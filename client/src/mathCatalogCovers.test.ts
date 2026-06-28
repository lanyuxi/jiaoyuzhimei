import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = join(process.cwd(), 'src')

describe('math catalog covers', () => {
  it('renders chart covers on math experiment cards', () => {
    const homeSource = readFileSync(join(srcRoot, 'experiments/Home.tsx'), 'utf8')

    expect(homeSource).toContain('function MathCoverPreview')
    expect(homeSource).toContain('function PolarPreview')
    expect(homeSource).toContain('<MathCoverPreview experiment={experiment}')
    expect(homeSource).toContain("case 'polar'")
  })

  it('keeps a formula fallback for experiments without a chart preview', () => {
    const homeSource = readFileSync(join(srcRoot, 'experiments/Home.tsx'), 'utf8')

    expect(homeSource).toContain("type: 'formula'")
    expect(homeSource).toContain('FormulaPreview')
    expect(homeSource).toContain('getCoverSpec')
  })

  it('has a cover spec for every math experiment path', () => {
    const homeSource = readFileSync(join(srcRoot, 'experiments/Home.tsx'), 'utf8')
    const experimentPaths = [...homeSource.matchAll(/path: '([^']+)'/g)].map((match) => match[1])
    const coverPaths = new Set([...homeSource.matchAll(/'([^']+)': \{ type:/g)].map((match) => match[1]))

    expect(experimentPaths).toHaveLength(55)
    expect(experimentPaths.filter((path) => !coverPaths.has(path))).toEqual([])
  })
})
