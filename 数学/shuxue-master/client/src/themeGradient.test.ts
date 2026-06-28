import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('blue theme gradient overrides', () => {
  it('uses color-only Tailwind gradient variables so CTA backgrounds render', () => {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')

    expect(css).toContain('--tw-gradient-from: #165DFF !important;')
    expect(css).toContain('--tw-gradient-to: rgb(22 93 255 / 0) !important;')
    expect(css).toContain('--tw-gradient-to: #5EB5FF !important;')
    expect(css).not.toMatch(/--tw-gradient-(?:from|to):[^;]*var\(--tw-gradient-(?:from|to)-position\)/)
  })
})
