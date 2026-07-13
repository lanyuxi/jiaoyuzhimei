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

function formatTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN')
}

function TeachingSection({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <section className="border-t border-[#ece8df] py-5 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-[#242424]">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-[#4b4742]">
        {items.map((item) => <li key={item}>{item}</li>)}
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
  const teachingSections = [
    ['实验目的', experiment.purpose],
    ['实验原理', experiment.principle],
    ['实验器材', experiment.apparatus],
    ['实验步骤', experiment.steps],
    ['实验结论', experiment.conclusion],
    ['实验补充', experiment.supplement],
  ] as const

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

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>{teachingSections.map(([title, items]) => <TeachingSection key={title} title={title} items={items} />)}</div>
        <aside className="border-t border-[#ece8df] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="text-lg font-bold text-[#242424]">操作时间线</h2>
          <ol className="mt-4 space-y-4">
            {session.events.length === 0 ? <li className="text-sm text-[#8a867f]">尚无操作记录。</li> : session.events.map((event) => (
              <li key={event.id} className="border-l-2 border-[#dedad2] pl-3 text-sm">
                <p className={event.outcome === 'accepted' ? 'font-semibold text-[#2d6a4f]' : 'font-semibold text-[#a13e35]'}>{event.outcome === 'accepted' ? '已接受' : '未接受'} · {event.action}</p>
                <p className="mt-1 leading-6 text-[#6f6a62]">{event.detail}</p>
                <time className="mt-1 block text-xs text-[#8a867f]" dateTime={event.at}>{formatTime(event.at)}</time>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="border-t border-[#ece8df] pt-5">
        <h2 className="text-lg font-bold text-[#242424]">数据表格</h2>
        <div className="mt-4"><MeasurementTable measurements={session.measurements} emptyLabel="报告中还没有记录读数。" /></div>
      </section>
      <section className="border-t border-[#ece8df] py-5">
        <h2 className="text-lg font-bold text-[#242424]">完成结论</h2>
        <p className="mt-3 text-sm leading-7 text-[#4b4742]">{session.status === 'COMPLETED' ? experiment.conclusion.join(' ') : '实验尚未完成；完成后可结合实验结论检查自己的操作和读数。'}</p>
        <h2 className="mt-5 text-lg font-bold text-[#242424]">实验补充</h2>
        <p className="mt-3 text-sm leading-7 text-[#4b4742]">{experiment.supplement.join(' ')}</p>
      </section>
    </div>
  )
}
