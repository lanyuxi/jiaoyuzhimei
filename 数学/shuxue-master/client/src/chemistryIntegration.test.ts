import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = join(process.cwd(), 'src')

describe('chemistry project integration', () => {
  it('exposes chemistry as a first-class top navigation route', () => {
    const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8')
    const layoutSource = readFileSync(join(srcRoot, 'components/Layout/Layout.tsx'), 'utf8')

    expect(layoutSource).toContain("to: '/chemistry'")
    expect(appSource).toContain('path="chemistry"')
    expect(appSource).toContain('path="chemistry/:slug"')
    expect(appSource).toContain('path="chemistry/:slug/lab"')
    expect(appSource).toContain('path="chemistry/sessions"')
    expect(appSource).toContain('path="chemistry/sessions/:id/report"')
  })

  it('keeps migrated chemistry experiment data inside the math client app', () => {
    expect(existsSync(join(srcRoot, 'chemistry/data/experiments/index.ts'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/ChemistryHome.tsx'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/ChemistryExperimentPage.tsx'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/ChemistryLabPage.tsx'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/ChemistrySessionsPage.tsx'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/ChemistryReportPage.tsx'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/sessionStore.ts'))).toBe(true)
    expect(existsSync(join(srcRoot, 'chemistry/lesson.ts'))).toBe(true)
  })

  it('links chemistry detail and home pages into the migrated lab workflow', () => {
    const homeSource = readFileSync(join(srcRoot, 'chemistry/ChemistryHome.tsx'), 'utf8')
    const detailSource = readFileSync(join(srcRoot, 'chemistry/ChemistryExperimentPage.tsx'), 'utf8')

    expect(homeSource).toContain('to="/chemistry/sessions"')
    expect(detailSource).toContain('`/chemistry/${experiment.slug}/lab`')
  })

  it('keeps the chemistry home hero free of the reaction map module', () => {
    const homeSource = readFileSync(join(srcRoot, 'chemistry/ChemistryHome.tsx'), 'utf8')

    expect(homeSource).not.toContain('\u53cd\u5e94\u56fe\u8c31')
  })
})
