import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { physicsCategories, physicsDifficultyLabels, physicsExperiments } from './physics/data'

const projectRoot = process.cwd()
const srcRoot = join(projectRoot, 'src')
const publicRoot = join(projectRoot, 'public')

describe('physics project integration', () => {
  it('exposes physics as a first-class top navigation route', () => {
    const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8')
    const layoutSource = readFileSync(join(srcRoot, 'components/Layout/Layout.tsx'), 'utf8')
    const physicsFrameSource = readFileSync(join(srcRoot, 'physics/PhysicsExperimentFrame.tsx'), 'utf8')
    const physicsHomeSource = readFileSync(join(srcRoot, 'physics/PhysicsHome.tsx'), 'utf8')

    expect(layoutSource).toContain("to: '/physics'")
    expect(layoutSource).toContain("location.pathname.startsWith('/physics')")
    expect(appSource).toContain("import('./physics/PhysicsHome')")
    expect(appSource).toContain("import('./physics/PhysicsExperimentFrame')")
    expect(appSource).toContain('path="physics"')
    expect(appSource).toContain('path="physics/:slug"')
    expect(physicsFrameSource).toContain('ResizeObserver')
    expect(physicsFrameSource).toContain('scrolling="no"')
    expect(physicsFrameSource).not.toContain('h-[76vh]')
    expect(physicsFrameSource).toContain('function getPrimaryFormula')
    expect(physicsFrameSource).not.toContain('collectFormulas')
    expect(physicsFrameSource).not.toContain('formulas.map')
    expect(physicsHomeSource).not.toContain('experiment.targetAge')
    expect(physicsHomeSource).not.toContain('experiment.sections.length')
    expect(physicsHomeSource).not.toContain('从原物理之美站点迁移而来')
    expect(physicsHomeSource).toContain("const directoryTitle = category === allCategory ? '实验目录' : category")
    expect(physicsHomeSource).toContain('{directoryTitle}</h2>')
  })

  it('keeps all 133 migrated physics experiments in the client app', () => {
    const slugs = new Set(physicsExperiments.map((experiment) => experiment.slug))
    const categoryTotal = physicsCategories.reduce((sum, category) => sum + category.items.length, 0)

    expect(physicsExperiments).toHaveLength(133)
    expect(slugs.size).toBe(133)
    expect(physicsCategories).toHaveLength(14)
    expect(categoryTotal).toBe(133)
    expect(slugs.has('spring-oscillation')).toBe(true)
  })

  it('keeps physics difficulty labels readable', () => {
    expect(physicsDifficultyLabels).toEqual({
      beginner: '入门',
      elementary: '基础',
      intermediate: '中级',
      advanced: '高级',
    })
  })

  it('preserves source content for the spring oscillation page', () => {
    const spring = physicsExperiments.find((experiment) => experiment.slug === 'spring-oscillation')

    expect(spring?.title).toBe('弹簧振子')
    expect(spring?.subtitle).toContain('简谐运动')
    expect(spring?.objectives).toContain('掌握胡克定律和简谐运动方程')
    expect(JSON.stringify(spring?.sections)).toContain('T = 2\\\\pi\\\\sqrt{\\\\frac{m}{k}}')
  })

  it('localizes the source runtime assets for every experiment chunk', () => {
    const runtimeRoot = join(publicRoot, 'physics-original')
    const assetRoot = join(runtimeRoot, 'assets')
    const runtimeIndex = readFileSync(join(runtimeRoot, 'index.html'), 'utf8')
    const overrideCss = readFileSync(join(runtimeRoot, 'embedded-experiment-overrides.css'), 'utf8')
    const fallbackScript = readFileSync(join(runtimeRoot, 'physics-narration-fallback.js'), 'utf8')

    expect(existsSync(join(runtimeRoot, 'index.html'))).toBe(true)
    expect(runtimeIndex).toContain('class="embedded-experiment-runtime"')
    expect(runtimeIndex).toContain('/physics-original/physics-narration-fallback.js')
    expect(runtimeIndex).toContain('/physics-original/embedded-experiment-overrides.css')
    expect(existsSync(join(assetRoot, 'index-B9SOS4Fp.js'))).toBe(true)
    expect(existsSync(join(assetRoot, 'index-CRp6zjtV.css'))).toBe(true)
    expect(existsSync(join(runtimeRoot, 'embedded-experiment-overrides.css'))).toBe(true)
    expect(existsSync(join(runtimeRoot, 'physics-narration-fallback.js'))).toBe(true)
    expect(overrideCss).toContain('> aside')
    expect(overrideCss).toContain('main footer')
    expect(overrideCss).toContain('body.embedded-experiment-runtime')
    expect(overrideCss).toContain('overflow: visible !important')
    expect(fallbackScript).toContain('speechSynthesis')
    expect(fallbackScript).toContain('window.fetch = function patchedFetch')
    expect(fallbackScript).toContain('narration-manifests')
    expect(fallbackScript).toContain('window.Audio = PatchedAudio')

    for (const experiment of physicsExperiments) {
      const manifestPath = join(runtimeRoot, 'narration-manifests', `${experiment.slug}.json`)
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { fallback: string; files: { filename: string }[] }
      const lineTotal = experiment.sections.reduce((sum, section) => sum + section.lines.length, 0)

      expect(existsSync(join(assetRoot, experiment.sourceChunk))).toBe(true)
      expect(existsSync(manifestPath)).toBe(true)
      expect(manifest.fallback).toBe('speechSynthesis')
      expect(manifest.files).toHaveLength(lineTotal)
      expect(manifest.files[0]?.filename).toContain('.speech?text=')
    }
  })
})
