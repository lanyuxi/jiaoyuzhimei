import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listChemistrySessions, type ChemistrySession } from './sessionStore'

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChemistrySessionsPage() {
  const [sessions, setSessions] = useState<ChemistrySession[]>([])

  useEffect(() => {
    setSessions(listChemistrySessions())
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-8">
        <Link to="/chemistry" className="text-sm font-semibold text-[#165DFF]">
          返回化学之美
        </Link>
        <h1 className="mt-5 text-4xl font-bold text-[#242424]">实验会话</h1>
        <p className="mt-3 text-sm leading-7 text-[#8a867f]">查看本机保存的化学实验步骤、读数和报告。</p>
      </section>

      {sessions.length === 0 ? (
        <section className="rounded-[8px] bg-white p-8 text-center shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <h2 className="text-xl font-bold text-[#242424]">还没有实验会话</h2>
          <p className="mt-2 text-sm text-[#8a867f]">从任意化学实验详情页进入实验台，即可自动创建会话。</p>
          <Link
            to="/chemistry"
            className="mt-5 inline-flex rounded-[8px] bg-[#165DFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
          >
            浏览实验目录
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {sessions.map((session) => (
            <article key={session.id} className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      session.status === 'COMPLETED' ? 'bg-[#eef4ff] text-[#165DFF]' : 'bg-[#f7f7f5] text-[#6f6a62]'
                    }`}
                  >
                    {session.status === 'COMPLETED' ? '已完成' : '进行中'}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-[#242424]">{session.experimentTitle}</h2>
                </div>
                <span className="text-xs text-[#9a958c]">{formatTime(session.updatedAt)}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
                  <p className="text-xs text-[#9a958c]">步骤</p>
                  <p className="mt-1 text-2xl font-semibold text-[#242424]">{session.steps.length}</p>
                </div>
                <div className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
                  <p className="text-xs text-[#9a958c]">读数</p>
                  <p className="mt-1 text-2xl font-semibold text-[#242424]">{session.measurements.length}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={`/chemistry/${session.experimentSlug}/lab`}
                  className="rounded-[8px] border border-[#ece8df] px-4 py-2 text-sm font-semibold text-[#6f6a62] hover:border-[#165DFF] hover:text-[#165DFF]"
                >
                  继续实验
                </Link>
                <Link
                  to={`/chemistry/sessions/${session.id}/report`}
                  className="rounded-[8px] bg-[#165DFF] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  查看报告
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

