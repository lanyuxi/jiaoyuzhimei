import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allExperiments } from './data/experiments'
import {
  generateChemistryReport,
  getChemistrySession,
  saveChemistryReport,
  type ChemistrySession,
} from './sessionStore'

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function TextSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
      <h2 className="flex items-center gap-2 text-xl font-bold text-[#242424]">
        <span className="h-5 w-1 rounded-full bg-[#165DFF]" />
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-[#6f6a62]">{body}</p>
    </section>
  )
}

export default function ChemistryReportPage() {
  const { id } = useParams()
  const [session, setSession] = useState<ChemistrySession | null>(null)

  useEffect(() => {
    if (!id) return
    setSession(getChemistrySession(id))
  }, [id])

  const experiment = useMemo(
    () => allExperiments.find((item) => item.slug === session?.experimentSlug),
    [session?.experimentSlug],
  )

  useEffect(() => {
    if (!session || !experiment || session.report) return
    const report = generateChemistryReport(session, experiment)
    setSession(saveChemistryReport(session.id, report))
  }, [experiment, session])

  if (!session || !experiment) {
    return (
      <div className="rounded-[8px] bg-white p-8 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <h1 className="text-2xl font-bold text-[#242424]">未找到实验报告</h1>
        <Link to="/chemistry/sessions" className="mt-4 inline-flex text-sm font-semibold text-[#165DFF]">
          返回实验会话
        </Link>
      </div>
    )
  }

  const report = session.report ?? generateChemistryReport(session, experiment)
  const lastMeasurement = session.measurements[session.measurements.length - 1]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/chemistry/sessions" className="text-sm font-semibold text-[#165DFF]">
          返回实验会话
        </Link>
        <Link to={`/chemistry/${experiment.slug}/lab`} className="text-sm font-semibold text-[#165DFF]">
          继续实验
        </Link>
      </div>

      <section className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-8">
        <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#165DFF]">
          {session.status === 'COMPLETED' ? '已完成' : '进行中'}
        </span>
        <h1 className="mt-5 text-4xl font-bold text-[#242424]">{session.experimentTitle}报告</h1>
        <p className="mt-3 text-sm text-[#8a867f]">生成于 {formatTime(report.generatedAt)}</p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <p className="text-xs text-[#9a958c]">步骤数</p>
          <p className="mt-2 text-3xl font-semibold text-[#242424]">{session.steps.length}</p>
        </div>
        <div className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <p className="text-xs text-[#9a958c]">末次 pH</p>
          <p className="mt-2 text-3xl font-semibold text-[#165DFF]">{lastMeasurement?.ph.toFixed(1) ?? '-'}</p>
        </div>
        <div className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <p className="text-xs text-[#9a958c]">末次温度</p>
          <p className="mt-2 text-3xl font-semibold text-[#165DFF]">
            {lastMeasurement ? `${lastMeasurement.temperature}℃` : '-'}
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <TextSection title="实验结论" body={report.conclusion} />
          <TextSection title="误差分析" body={report.errorAnalysis} />
          <TextSection title="知识点评估" body={report.knowledgeAssessment} />
        </div>

        <aside className="space-y-5">
          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <h2 className="text-xl font-bold text-[#242424]">改进建议</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#6f6a62]">
              {report.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <h2 className="text-xl font-bold text-[#242424]">操作记录</h2>
            <div className="mt-4 space-y-3">
              {session.steps.slice(-5).map((step) => (
                <div key={step.id} className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-3">
                  <p className="text-sm font-semibold text-[#242424]">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#8a867f]">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

