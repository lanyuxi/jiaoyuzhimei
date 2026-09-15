#!/usr/bin/env npx ts-node
/**
 * 课程完整性检查脚本
 *
 * 在构建前运行，确保所有课程都正确注册在各个配置文件中
 * 防止出现"新课程使用傅里叶动画"这类低级错误
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const NARRATIONS_DIR = path.join(ROOT, 'src/narrations/scripts')
const SCENES_DIR = path.join(ROOT, 'src/components/NarrationPresenter')
const RENDERERS_DIR = path.join(ROOT, 'src/components/NarrationPresenter/scenes')

interface CheckResult {
  courseId: string
  hasScript: boolean
  hasSceneConfig: boolean
  hasRenderer: boolean
  registeredInFactory: boolean
  registeredInPresenter: boolean
  registeredInCustomList: boolean
}

// 不需要专属渲染器的课程（使用默认傅里叶渲染）
const COURSES_USING_DEFAULT_RENDERER = ['fourier']

// 有特殊处理逻辑的课程（在 NarrationPresenter 中单独处理，不需要在 experimentsWithCustomRenderer 列表中）
const COURSES_WITH_SPECIAL_HANDLING = ['basic-arithmetic']

// 待完成的课程（已有讲解稿件但尚未完成场景配置，暂时跳过检查）
// TODO: 完成这些课程的配置后从此列表移除
const COURSES_PENDING_COMPLETION: string[] = []

function getAllCourseIds(): string[] {
  // 从讲解稿件目录获取所有课程 ID
  const files = fs.readdirSync(NARRATIONS_DIR)
  return files
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => f.replace('.ts', ''))
}

function checkSceneConfigExists(courseId: string): boolean {
  // 检查场景配置文件是否存在
  const camelCase = toCamelCase(courseId)
  // 处理特殊命名：conic-sections -> conic, quadratic-function -> quadratic 等
  const shortCamelCase = camelCase.replace(/Sections$/, '').replace(/Function$/, '')

  const possibleNames = [
    `${courseId}Scenes.ts`,
    `${camelCase}Scenes.ts`,
    `${shortCamelCase}Scenes.ts`,
  ]
  return possibleNames.some(name =>
    fs.existsSync(path.join(SCENES_DIR, name))
  )
}

function checkRendererExists(courseId: string): boolean {
  // 检查场景渲染器是否存在（目录形式或文件形式）
  const pascalCase = toPascalCase(courseId)
  // 处理特殊命名：conic-sections -> Conic, quadratic-function -> Quadratic 等
  const shortPascalCase = pascalCase.replace(/Sections$/, '').replace(/Function$/, '')

  // 目录名/文件名大小写由作者决定（例如 pde -> PDE/PDESceneRenderer.tsx），
  // 因此这里按大小写不敏感的方式比对，避免把已存在的渲染器误判为缺失。
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
    // 目录形式：只要目录内存在渲染器实现即视为满足
    const entryPath = path.join(RENDERERS_DIR, entry)
    if (!fs.statSync(entryPath).isDirectory()) continue
    if (candidates.has(normalize(entry)) && fs.readdirSync(entryPath).some(f => f.endsWith('.tsx'))) return true
  }

  return false
}

function checkRegisteredInFactory(courseId: string): boolean {
  // 检查是否在 SceneRendererFactory 中注册
  const factoryPath = path.join(RENDERERS_DIR, 'SceneRendererFactory.tsx')
  const content = fs.readFileSync(factoryPath, 'utf-8')
  return content.includes(`'${courseId}'`)
}

function checkRegisteredInPresenter(courseId: string): boolean {
  // 检查是否在 NarrationPresenter 的 sceneConfigMap 中注册
  const presenterPath = path.join(SCENES_DIR, 'NarrationPresenter.tsx')
  const content = fs.readFileSync(presenterPath, 'utf-8')
  // 检查 sceneConfigMap 中是否有该课程
  const sceneConfigMapMatch = content.match(/const sceneConfigMap[\s\S]*?= \{([\s\S]*?)\n\}/m)
  if (!sceneConfigMapMatch) return false
  return sceneConfigMapMatch[1].includes(`'${courseId}'`)
}

function checkRegisteredInCustomList(courseId: string): boolean {
  // 检查是否在 experimentsWithCustomRenderer 列表中
  const presenterPath = path.join(SCENES_DIR, 'NarrationPresenter.tsx')
  const content = fs.readFileSync(presenterPath, 'utf-8')
  const customListMatch = content.match(/experimentsWithCustomRenderer\s*=\s*\[([\s\S]*?)\]/)
  if (!customListMatch) return false
  return customListMatch[1].includes(`'${courseId}'`)
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function checkCourse(courseId: string): CheckResult {
  return {
    courseId,
    hasScript: true, // 已经从脚本目录获取，肯定存在
    hasSceneConfig: checkSceneConfigExists(courseId),
    hasRenderer: checkRendererExists(courseId),
    registeredInFactory: checkRegisteredInFactory(courseId),
    registeredInPresenter: checkRegisteredInPresenter(courseId),
    registeredInCustomList: checkRegisteredInCustomList(courseId),
  }
}

function main() {
  console.log('🔍 检查课程完整性...\n')

  const courseIds = getAllCourseIds()
  const results: CheckResult[] = courseIds.map(checkCourse)

  let hasErrors = false
  const errors: string[] = []
  const warnings: string[] = []

  for (const result of results) {
    const isDefaultRenderer = COURSES_USING_DEFAULT_RENDERER.includes(result.courseId)
    const hasSpecialHandling = COURSES_WITH_SPECIAL_HANDLING.includes(result.courseId)
    const isPendingCompletion = COURSES_PENDING_COMPLETION.includes(result.courseId)

    // 跳过待完成的课程
    if (isPendingCompletion) {
      warnings.push(`⚠️  [${result.courseId}] 待完成配置（已跳过检查）`)
      continue
    }

    // 检查场景配置
    if (!result.hasSceneConfig) {
      errors.push(`❌ [${result.courseId}] 缺少场景配置文件 (xxxScenes.ts)`)
      hasErrors = true
    }

    // 检查 sceneConfigMap 注册
    if (!result.registeredInPresenter) {
      errors.push(`❌ [${result.courseId}] 未在 NarrationPresenter.tsx 的 sceneConfigMap 中注册`)
      hasErrors = true
    }

    // 非默认渲染器的课程需要额外检查
    if (!isDefaultRenderer) {
      if (!result.hasRenderer) {
        errors.push(`❌ [${result.courseId}] 缺少场景渲染器 (XxxSceneRenderer.tsx)`)
        hasErrors = true
      }

      if (!result.registeredInFactory) {
        errors.push(`❌ [${result.courseId}] 未在 SceneRendererFactory.tsx 中注册`)
        hasErrors = true
      }

      // 有特殊处理的课程不需要在 experimentsWithCustomRenderer 列表中
      if (!hasSpecialHandling && !result.registeredInCustomList) {
        errors.push(`❌ [${result.courseId}] 未在 experimentsWithCustomRenderer 列表中注册`)
        hasErrors = true
      }
    }
  }

  if (hasErrors) {
    console.log('发现以下问题：\n')
    errors.forEach(e => console.log(e))
    console.log('\n💡 提示：添加新课程时需要修改以下文件：')
    console.log('   1. src/narrations/scripts/xxx.ts - 讲解稿件')
    console.log('   2. src/components/NarrationPresenter/xxxScenes.ts - 场景配置')
    console.log('   3. src/components/NarrationPresenter/scenes/XxxSceneRenderer.tsx - 场景渲染器')
    console.log('   4. src/components/NarrationPresenter/scenes/SceneRendererFactory.tsx - 注册渲染器')
    console.log('   5. src/components/NarrationPresenter/NarrationPresenter.tsx - 注册场景配置和自定义渲染器列表')
    console.log('')
    process.exit(1)
  }

  // 显示警告（待完成的课程）
  if (warnings.length > 0) {
    console.log('⚠️  待完成的课程：\n')
    warnings.forEach(w => console.log(w))
    console.log('')
  }

  const completedCount = courseIds.length - COURSES_PENDING_COMPLETION.length
  console.log(`✅ ${completedCount} 个课程配置完整！\n`)

  // 打印课程列表
  console.log('课程列表：')
  results.forEach(r => {
    const isDefault = COURSES_USING_DEFAULT_RENDERER.includes(r.courseId)
    console.log(`  • ${r.courseId}${isDefault ? ' (默认渲染器)' : ''}`)
  })
}

main()
