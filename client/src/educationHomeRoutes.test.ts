import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = join(process.cwd(), 'src')
const comingSoonRoutes = ['chinese', 'english', 'biology', 'history', 'geography', 'sports', 'art']

describe('education home routes', () => {
  it('keeps the root education dashboard separate from the math catalog', () => {
    const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8')

    expect(appSource).toContain("import Home from './experiments/HomeDashboard'")
    expect(appSource).toContain("import MathHome from './experiments/Home'")
    expect(appSource).toContain('<Route index element={<Home />} />')
    expect(appSource).toContain('path="math" element={<MathHome />}')
  })

  it('routes unfinished subjects to a shared coming soon page', () => {
    const appSource = readFileSync(join(srcRoot, 'App.tsx'), 'utf8')
    const comingSoonSource = readFileSync(join(srcRoot, 'pages/ComingSoonPage.tsx'), 'utf8')

    for (const route of comingSoonRoutes) {
      expect(appSource).toContain(`path="${route}" element={<ComingSoonPage />}`)
    }

    expect(comingSoonSource).toContain('敬请期待~')
  })

  it('uses path routes in the top navigation instead of old hash anchors', () => {
    const layoutSource = readFileSync(join(srcRoot, 'components/Layout/Layout.tsx'), 'utf8')

    expect(layoutSource).toContain("to: '/math'")

    for (const route of comingSoonRoutes) {
      expect(layoutSource).toContain(`to: '/${route}'`)
    }

    expect(layoutSource).not.toContain('/#chinese-beauty')
    expect(layoutSource).not.toContain('/#course-map')
    expect(layoutSource).not.toContain('/#english-beauty')
    expect(layoutSource).not.toContain('/#biology-beauty')
    expect(layoutSource).not.toContain('/#history-beauty')
    expect(layoutSource).not.toContain('/#geography-beauty')
    expect(layoutSource).not.toContain('/#sports-beauty')
    expect(layoutSource).not.toContain('/#art-beauty')
  })

  it('renders the requested education dashboard sections on the homepage', () => {
    const homeSource = readFileSync(join(srcRoot, 'experiments/HomeDashboard.tsx'), 'utf8')

    expect(homeSource).toContain('首页工作台')
    expect(homeSource).toContain('学科快速入口')
    expect(homeSource).toContain('最近学习内容')
    expect(homeSource).toContain('待办事项')
    expect(homeSource).toContain('热门学科排行')
    expect(homeSource).toContain('平台数据概览')
  })

  it('uses compact design-matched SVG icons on the dashboard hero modules', () => {
    const homeSource = readFileSync(join(srcRoot, 'experiments/HomeDashboard.tsx'), 'utf8')

    expect(homeSource).toContain('type IconName =')
    expect(homeSource).toContain('function DashboardIcon')
    expect(homeSource).toContain('xl:grid-cols-10')
    expect(homeSource).toContain('h-[76px]')
    expect(homeSource).toContain('<DashboardIcon name={subject.icon}')
    expect(homeSource).toContain('<DashboardIcon name={stat.icon}')
    expect(homeSource).toContain('<DashboardIcon name={item.icon}')

    for (const icon of ['bookOpen', 'cube', 'language', 'atom', 'flask', 'leaf', 'temple', 'globe', 'runner', 'palette']) {
      expect(homeSource).toContain(`icon: '${icon}'`)
    }

    for (const icon of ['clipboard', 'flask', 'pencil', 'send']) {
      expect(homeSource).toContain(`icon: '${icon}'`)
    }
  })
})
