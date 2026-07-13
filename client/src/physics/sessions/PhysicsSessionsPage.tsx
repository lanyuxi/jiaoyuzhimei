import { Link } from 'react-router-dom'
import { textbookExperimentById } from '../curriculum/catalog'
import { browserPhysicsSessionRepository } from './repository'

function formatTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function PhysicsSessionsPage() {
  const sessions = browserPhysicsSessionRepository.list()

  return (
    <div className="space-y-6">
      <section className="border-b border-[#ece8df] pb-5">
        <Link to="/physics" className="text-sm font-semibold text-[#165DFF]">返回物理之美</Link>
        <h1 className="mt-4 text-2xl font-bold text-[#242424]">实验会话</h1>
        <p className="mt-2 text-sm leading-7 text-[#77716a]">查看此设备上的实验过程、读数和报告。</p>
      </section>

      {sessions.length === 0 ? (
        <section className="border-y border-[#ece8df] py-10 text-center">
          <h2 className="text-lg font-bold text-[#242424]">还没有实验会话</h2>
          <Link to="/physics" className="mt-4 inline-flex rounded-[6px] bg-[#165DFF] px-4 py-2 text-sm font-semibold text-white">浏览实验目录</Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => {
            const experiment = textbookExperimentById.get(session.experimentId)
            return (
              <article key={session.id} className="border border-[#ece8df] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#77716a]">{session.status === 'COMPLETED' ? '已完成' : '进行中'}</p>
                    <h2 className="mt-2 text-lg font-bold text-[#242424]">{session.experimentTitle}</h2>
                  </div>
                  <time className="text-xs text-[#8a867f]" dateTime={session.updatedAt}>{formatTime(session.updatedAt)}</time>
                </div>
                <p className="mt-4 text-sm text-[#6f6a62]">{session.events.length} 条操作记录，{session.measurements.length} 条读数</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {experiment ? <Link to={`/physics/labs/${session.experimentId}`} className="rounded-[6px] border border-[#dedad2] px-3 py-2 text-sm font-semibold text-[#4b4742]">继续实验</Link> : <span className="text-sm text-[#8a867f]">实验已从目录中移除</span>}
                  <Link to={`/physics/sessions/${session.id}/report`} className="rounded-[6px] bg-[#165DFF] px-3 py-2 text-sm font-semibold text-white">查看报告</Link>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
