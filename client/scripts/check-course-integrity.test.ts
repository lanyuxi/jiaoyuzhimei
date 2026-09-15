import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const RENDERERS_DIR = path.join(ROOT, 'src/components/NarrationPresenter/scenes')

const toCamelCase = (str: string) => str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
const toPascalCase = (str: string) => {
  const camel = toCamelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/** 与 scripts/check-course-integrity.ts 中 checkRendererExists 保持同一判定逻辑 */
function checkRendererExists(courseId: string): boolean {
  const pascalCase = toPascalCase(courseId)
  const shortPascalCase = pascalCase.replace(/Sections$/, '').replace(/Function$/, '')

  const normalize = (value: string) => value.toLowerCase()
  const candidates = new Set([
    normalize(pascalCase),
    normalize(shortPascalCase),
    normalize(`${pascalCase}SceneRenderer.tsx`),
    normalize(`${shortPascalCase}SceneRenderer.tsx`),
  ])

  if (!fs.existsSync(RENDERERS_DIR)) return false

  for (const entry of fs.readdirSync(RENDERERS_DIR)) {
    if (candidates.has(normalize(entry))) return true
    const entryPath = path.join(RENDERERS_DIR, entry)
    if (!fs.statSync(entryPath).isDirectory()) continue
    if (candidates.has(normalize(entry)) && fs.readdirSync(entryPath).some((f) => f.endsWith('.tsx'))) return true
  }

  return false
}

describe('课程完整性检查 · 渲染器探测', () => {
  it('识别大写目录形式的渲染器（pde -> PDE/PDESceneRenderer.tsx）', () => {
    // 回归：toPascalCase('pde') 得到 'Pde'，而实际目录是 'PDE'。
    // 大小写敏感比对会误判为「缺少场景渲染器」，导致 prebuild 失败、构建被阻断。
    expect(toPascalCase('pde')).toBe('Pde')
    expect(fs.existsSync(path.join(RENDERERS_DIR, 'PDE/PDESceneRenderer.tsx'))).toBe(true)
    expect(checkRendererExists('pde')).toBe(true)
  })

  it('仍然能识别常规小写驼峰目录与文件形式', () => {
    expect(checkRendererExists('laplace')).toBe(true)
    expect(checkRendererExists('euler-identity')).toBe(true)
    expect(checkRendererExists('conic-sections')).toBe(true)
    expect(checkRendererExists('quadratic-function')).toBe(true)
  })

  it('对确实不存在的课程返回 false', () => {
    expect(checkRendererExists('definitely-not-a-course-xyz')).toBe(false)
  })

  it('所有讲解稿件课程都能通过渲染器探测', () => {
    const NARRATIONS_DIR = path.join(ROOT, 'src/narrations/scripts')
    const courseIds = fs.readdirSync(NARRATIONS_DIR)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => f.replace('.ts', ''))

    // fourier 使用默认傅里叶渲染器，无需专属渲染器
    const usingDefaultRenderer = new Set(['fourier'])
    const missing = courseIds.filter((id) => !usingDefaultRenderer.has(id) && !checkRendererExists(id))

    expect(missing).toEqual([])
  })
})
