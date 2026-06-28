import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = join(process.cwd(), 'src')
const startButtonText = '\u5f00\u59cb\u8bb2\u89e3'

function getExperimentRoutes() {
  const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8')
  const experimentImports = new Map<string, string>()

  for (const match of appSource.matchAll(
    /const\s+(\w+)\s*=\s*lazyRetry\(\(\)\s*=>\s*import\('\.\/experiments\/([^']+)'\)\)/g,
  )) {
    experimentImports.set(match[1], match[2])
  }

  return Array.from(
    appSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<([A-Za-z0-9_]+)\s*\/>\}/g),
  )
    .filter((match) => experimentImports.has(match[2]))
    .map((match) => ({
      path: match[1],
      modulePath: experimentImports.get(match[2]) as string,
    }))
}

describe('experiment narration buttons', () => {
  it('keeps every experiment route wired to the narration presenter', () => {
    const routes = getExperimentRoutes()
    const hookSource = readFileSync(join(srcRoot, 'hooks/usePresenterHistory.ts'), 'utf8')
    const hookOpensPresenter =
      hookSource.includes('startNarration()') &&
      hookSource.includes('setPresenterMode(true)') &&
      hookSource.includes('setPresenterMode(false)')

    const issues = routes.flatMap(({ path, modulePath }) => {
      const source = readFileSync(join(srcRoot, 'experiments', `${modulePath}.tsx`), 'utf8')
      const directPresenterFlow =
        source.includes('startNarration()') &&
        source.includes('setPresenterMode(true)') &&
        source.includes('setPresenterMode(false)')
      const sharedHookFlow = source.includes('usePresenterHistory') && hookOpensPresenter
      const buttonBlocks = Array.from(source.matchAll(/<button\b[\s\S]*?<\/button>/g)).map(
        (buttonMatch) => buttonMatch[0],
      )
      const startButtonBlocks = buttonBlocks.filter(
        (buttonBlock) =>
          buttonBlock.includes(startButtonText) &&
          /onClick=\{(?:handleStartNarration|openPresenter)\}/.test(buttonBlock),
      )
      const routeIssues: string[] = []

      if (!source.includes(startButtonText)) routeIssues.push('missing start button text')
      if (!source.includes('NarrationPresenter')) routeIssues.push('missing presenter component')
      if (!source.includes('loadScript(')) routeIssues.push('missing narration script load')
      if (!directPresenterFlow && !sharedHookFlow) routeIssues.push('missing presenter open/exit flow')
      if (!/onClick=\{(?:handleStartNarration|openPresenter)\}/.test(source)) {
        routeIssues.push('missing start button click handler')
      }
      if (startButtonBlocks.length === 0) routeIssues.push('missing start button block')
      if (
        startButtonBlocks.some(
          (buttonBlock) =>
            buttonBlock.includes('from-indigo-500') ||
            buttonBlock.includes('to-purple-500') ||
            buttonBlock.includes('shadow-indigo-500'),
        )
      ) {
        routeIssues.push('start button uses old purple theme')
      }
      if (!startButtonBlocks.some((buttonBlock) => buttonBlock.includes('bg-[#165DFF]'))) {
        routeIssues.push('start button missing blue theme')
      }

      return routeIssues.map((issue) => `${path}: ${issue}`)
    })

    expect(routes).toHaveLength(55)
    expect(issues).toEqual([])
  })
})
