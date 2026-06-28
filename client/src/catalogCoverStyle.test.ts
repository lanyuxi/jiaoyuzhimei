import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = join(process.cwd(), 'src')

describe('subject catalog cover style', () => {
  it('keeps math titles and labels below the chart cover', () => {
    const source = readFileSync(join(srcRoot, 'experiments/Home.tsx'), 'utf8')

    expect(source).toContain('<MathCoverPreview experiment={experiment} />')
    expect(source).toContain('h-[196px] overflow-hidden bg-white')
    expect(source).toContain('lg:grid-cols-4 gap-4')
    expect(source).toContain('<h2 className="text-base font-bold')
    expect(source).toContain('text-sm leading-[22px]')
    expect(source).toContain('text-xs font-semibold')
  })

  it('uses the same visual-card structure for physics and chemistry', () => {
    const physicsSource = readFileSync(join(srcRoot, 'physics/PhysicsHome.tsx'), 'utf8')
    const chemistrySource = readFileSync(join(srcRoot, 'chemistry/ChemistryHome.tsx'), 'utf8')

    expect(physicsSource).toContain('function PhysicsCover')
    expect(physicsSource).toContain('function PhysicsCoverArtwork')
    expect(physicsSource).toContain('<PhysicsCover experiment={experiment} />')
    expect(physicsSource).toContain('h-[196px] overflow-hidden bg-white')
    expect(physicsSource).toContain('grid gap-4 sm:grid-cols-2 lg:grid-cols-4')
    expect(physicsSource).toContain('<h3 className="text-base font-bold')
    expect(physicsSource).toContain('text-sm leading-[22px]')
    expect(physicsSource).toContain('text-xs font-semibold')
    expect(physicsSource).not.toContain('line-clamp-2 break-words font-serif text-xl font-bold')

    expect(chemistrySource).toContain('function ChemistryCover')
    expect(chemistrySource).toContain('function ChemistryCoverArtwork')
    expect(chemistrySource).toContain('<ChemistryCover experiment={experiment} />')
    expect(chemistrySource).toContain('h-[196px] overflow-hidden bg-white')
    expect(chemistrySource).toContain('grid gap-4 sm:grid-cols-2 lg:grid-cols-4')
    expect(chemistrySource).toContain('<h3 className="text-base font-bold')
    expect(chemistrySource).toContain('text-sm leading-[22px]')
    expect(chemistrySource).toContain('text-xs font-semibold')
    expect(chemistrySource).not.toContain('font-serif text-2xl font-bold text-[#165DFF]')
  })
})
