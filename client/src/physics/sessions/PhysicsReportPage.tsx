import { Link, useParams } from 'react-router-dom'
import { textbookExperimentById } from '../curriculum/catalog'
import type { TextbookPhysicsExperiment } from '../curriculum/types'
import MeasurementTable from '../runtime/MeasurementTable'
import { browserPhysicsSessionRepository } from './repository'
import type { PhysicsSession } from './types'

export type PhysicsReportResolution =
  | { kind: 'missing-session' }
  | { kind: 'removed-experiment'; session: PhysicsSession }
  | { kind: 'report'; session: PhysicsSession; experiment: TextbookPhysicsExperiment }

export function resolvePhysicsReport(
  session: PhysicsSession | undefined,
  experiments: ReadonlyMap<string, TextbookPhysicsExperiment>,
): PhysicsReportResolution {
  if (!session) return { kind: 'missing-session' }
  const experiment = experiments.get(session.experimentId)
  return experiment ? { kind: 'report', session, experiment } : { kind: 'removed-experiment', session }
}

export function physicsReportSections(
  session: PhysicsSession,
  experiment: TextbookPhysicsExperiment,
) {
  return session.report ?? {
    purpose: [...experiment.purpose],
    apparatus: [...experiment.apparatus],
    calculationResults: [],
    conclusion: session.status === 'COMPLETED' ? [...experiment.conclusion] : [],
    errorAnalysis: [],
    supplement: [...experiment.supplement],
  }
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN')
}

function TeachingSection({ title, items, emptyLabel }: { title: string; items: readonly string[]; emptyLabel?: string }) {
  return (
    <section className="border-t border-[#ece8df] py-5 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-[#242424]">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-[#4b4742]">
        {items.length === 0
          ? <li className="text-[#8a867f]">{emptyLabel ?? '该部分将在实验记录后生成。'}</li>
          : items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}

export default function PhysicsReportPage() {
  const { id = '' } = useParams()
  const resolution = resolvePhysicsReport(browserPhysicsSessionRepository.get(id), textbookExperimentById)

  if (resolution.kind === 'missing-session' || resolution.kind === 'removed-experiment') {
    return (
      <section className="border-y border-[#ece8df] py-10">
        <h1 className="text-2xl font-bold text-[#242424]">{resolution.kind === 'missing-session' ? '未找到实验报告' : '实验目录已更新'}</h1>
        <p className="mt-3 text-sm leading-7 text-[#77716a]">{resolution.kind === 'missing-session' ? '这个会话不存在，或已在本机清除。' : `“${resolution.session.experimentTitle}”的会话仍在，但对应实验已不再提供。`}</p>
        <Link to="/physics/sessions" className="mt-5 inline-flex text-sm font-semibold text-[#165DFF]">返回实验会话</Link>
      </section>
    )
  }

  const { experiment, session } = resolution
  const sections = physicsReportSections(session, experiment)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece8df] pb-4">
        <Link to="/physics/sessions" className="text-sm font-semibold text-[#165DFF]">返回实验会话</Link>
        <Link to={`/physics/labs/${experiment.id}`} className="text-sm font-semibold text-[#165DFF]">继续实验</Link>
      </div>
      <section className="border-b border-[#ece8df] pb-5">
        <p className="text-xs font-semibold text-[#77716a]">{session.status === 'COMPLETED' ? '已完成' : '进行中'} · 更新于 {formatTime(session.updatedAt)}</p>
        <h1 className="mt-3 text-2xl font-bold text-[#242424]">{session.experimentTitle}报告</h1>
      </section>

      <TeachingSection title="实验目的" items={sections.purpose} />
      <TeachingSection title="实验器材" items={sections.apparatus} />

      <section className="border-t border-[#ece8df] pt-5">
        <h2 className="text-lg font-bold text-[#242424]">操作记录</h2>
        <ol className="mt-4 grid gap-4 lg:grid-cols-2">
          {session.events.length === 0 ? <li className="text-sm text-[#8a867f]">尚无操作记录。</li> : session.events.map((event) => (
            <li key={event.id} className="border-l-2 border-[#dedad2] pl-3 text-sm">
              <p className={event.outcome === 'accepted' ? 'font-semibold text-[#2d6a4f]' : 'font-semibold text-[#a13e35]'}>{event.outcome === 'accepted' ? '已接受' : '未接受'} · {event.action}</p>
              <p className="mt-1 leading-6 text-[#6f6a62]">{event.detail}</p>
              <time className="mt-1 block text-xs text-[#8a867f]" dateTime={event.at}>{formatTime(event.at)}</time>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[#ece8df] pt-5">
        <h2 className="text-lg font-bold text-[#242424]">原始数据</h2>
        <div className="mt-4"><MeasurementTable measurements={session.measurements} emptyLabel="报告中还没有记录读数。" /></div>
      </section>
      <TeachingSection title="计算结果" items={sections.calculationResults} />
      <TeachingSection title="实验结论" items={sections.conclusion} />
      <TeachingSection title="误差分析" items={sections.errorAnalysis} />
      <TeachingSection title="实验补充" items={sections.supplement} />
    </div>
  )
}
