import { Outlet, Link, useLocation } from 'react-router-dom'
import { NarrationProvider, useNarrationOptional } from '../../contexts/NarrationContext'
import { NarrationController } from '../NarrationController'
import { BugReportButton } from '../BugReport'

function LayoutContent() {
  const narration = useNarrationOptional()
  const location = useLocation()
  const isNarrationMode = narration?.playbackState.isNarrationMode || false
  const isPresenterMode = narration?.playbackState.isPresenterMode || false
  const experimentPath = location.pathname
  const isExperimentPage = experimentPath !== '/' && experimentPath.length > 1
  const navItems = [
    { label: '首页', to: '/', active: location.pathname === '/' && !location.hash },
    { label: '语文之美', to: '/#chinese-beauty', active: location.hash === '#chinese-beauty' },
    { label: '数学之美', to: '/#course-map', active: location.hash === '#course-map' },
    { label: '英语之美', to: '/#english-beauty', active: location.hash === '#english-beauty' },
    { label: '物理之美', to: '/physics', active: location.pathname.startsWith('/physics') },
    { label: '化学之美', to: '/chemistry', active: location.pathname.startsWith('/chemistry') },
    { label: '生物之美', to: '/#biology-beauty', active: location.hash === '#biology-beauty' },
    { label: '历史之美', to: '/#history-beauty', active: location.hash === '#history-beauty' },
    { label: '地理之美', to: '/#geography-beauty', active: location.hash === '#geography-beauty' },
    { label: '体育之美', to: '/#sports-beauty', active: location.hash === '#sports-beauty' },
    { label: '艺术之美', to: '/#art-beauty', active: location.hash === '#art-beauty' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#242424]">
      <header className="sticky top-0 z-40 border-b border-[#ece8df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1420px] items-center gap-5 px-5 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="返回首页">
            <img
              src="/education-beauty-logo.png"
              alt="教育之美"
              className="h-11 w-11 rounded-[8px] object-contain"
            />
            <div className="leading-tight">
              <div className="text-base font-bold text-[#2d2d2d]">教育之美</div>
              <div className="hidden text-xs text-[#9a958c] sm:block">为未知而教，为未来而教</div>
            </div>
          </Link>

          <nav className="hidden h-full min-w-0 flex-1 items-center justify-end gap-3 overflow-x-auto whitespace-nowrap md:flex lg:gap-4 xl:gap-5">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`relative flex h-full shrink-0 items-center px-0.5 text-xs font-semibold transition-colors lg:text-sm ${
                  item.active ? 'text-[#165DFF]' : 'text-[#3f3f3f] hover:text-[#165DFF]'
                }`}
              >
                {item.label}
                {item.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#165DFF]" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className={`transition-all duration-300 ${isNarrationMode ? 'pb-20' : ''}`}>
        <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1420px] flex-col px-4 py-5 md:px-8 md:py-7">
          <div className="animate-fade-in flex-1">
            <Outlet />
          </div>
        </div>
      </main>

      {isNarrationMode && !isPresenterMode && <NarrationController />}
      {isExperimentPage && <BugReportButton experimentPath={experimentPath} />}
    </div>
  )
}

export default function Layout() {
  return (
    <NarrationProvider>
      <LayoutContent />
    </NarrationProvider>
  )
}
