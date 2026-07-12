import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('physics catalog navigation', () => {
  it('separates textbook and extended experiments', () => {
    const root = process.cwd()
    const home = readFileSync(join(root, 'src/physics/PhysicsHome.tsx'), 'utf8')
    const textbook = readFileSync(join(root, 'src/physics/TextbookPhysicsCatalog.tsx'), 'utf8')
    const legacy = readFileSync(join(root, 'src/physics/LegacyPhysicsCatalog.tsx'), 'utf8')
    expect(home).toContain('教材实验')
    expect(home).toContain('拓展实验')
    expect(textbook).toContain('/physics/labs/')
    expect(legacy).toContain('/physics/')
  })
})
