import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allExperiments, type ExperimentSeed } from './data/experiments'
import { CATEGORY_FORMULAS, CATEGORY_LABELS, DIFFICULTY_LABELS } from './labels'

function formulaFor(experiment: ExperimentSeed) {
  if (experiment.probe?.reagentKeys.length) {
    return experiment.probe.reagentKeys.join(' + ')
  }
  return CATEGORY_FORMULAS[experiment.category]
}

function describeProbe(experiment: ExperimentSeed) {
  if (!experiment.probe) {
    return '本实验以观察、测量或步骤训练为主，重点记录变量变化与结论。'
  }

  const effects = []
  if (experiment.probe.expect.gas) effects.push('产生气体')
  if (experiment.probe.expect.precipitate) effects.push('生成沉淀')
  if (experiment.probe.expect.colorChange) effects.push('出现颜色变化')
  if (experiment.probe.expect.thermal === 'exothermic') effects.push('放热')
  if (experiment.probe.expect.thermal === 'endothermic') effects.push('吸热')
  if (effects.length === 0 && experiment.probe.expect.reacted) effects.push('发生反应')
  if (effects.length === 0) effects.push('未观察到明显反应')
  return effects.join('、')
}

function matchesProbeReagent(selected: string[], probeKey: string) {
  return selected.some((reagent) => reagent.includes(probeKey) || probeKey.includes(reagent))
}

function LabPreview({ experiment }: { experiment: ExperimentSeed }) {
  const [selected, setSelected] = useState<string[]>([])
  const expectedReady = useMemo(() => {
    if (!experiment.probe) return selected.length > 0
    return experiment.probe.reagentKeys.every((key) => matchesProbeReagent(selected, key))
  }, [experiment, selected])

  function toggleReagent(reagent: string) {
    setSelected((current) =>
      current.includes(reagent) ? current.filter((item) => item !== reagent) : [...current, reagent],
    )
  }

  return (
    <section className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">可视化实验台</h2>
          <p className="mt-2 text-sm leading-6 text-[#8a867f]">选择试剂，观察核心反应现象。</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {experiment.reagents.map((reagent) => (
              <button
                key={reagent}
                type="button"
                onClick={() => toggleReagent(reagent)}
                className={`rounded-[8px] px-3 py-2 text-sm font-semibold transition-all ${
                  selected.includes(reagent)
                    ? 'bg-[#165DFF] text-white shadow-lg shadow-blue-500/20'
                    : 'bg-[#f7f7f5] text-[#6f6a62] hover:bg-[#eef4ff] hover:text-[#165DFF]'
                }`}
              >
                {reagent}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
            <p className="text-sm font-bold text-[#242424]">实验现象</p>
            <p className="mt-2 text-sm leading-6 text-[#8a867f]">
              {expectedReady ? describeProbe(experiment) : '请选择与核心反应相关的试剂组合。'}
            </p>
          </div>
        </div>

        <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-[8px] bg-[#eaf2ff]">
          <div className="absolute top-8 h-10 w-36 rounded-full border border-[#9bbcff] bg-white/70" />
          <div className="absolute bottom-10 h-32 w-40 rounded-b-[32px] border-x border-b border-[#9bbcff] bg-white/45" />
          <div
            className={`absolute bottom-10 h-20 w-40 rounded-b-[32px] transition-colors ${
              expectedReady ? 'bg-[#165DFF]/35' : 'bg-[#88b8ff]/25'
            }`}
          />
          <div className="relative rounded-[8px] border border-[#d9e4ff] bg-white/85 px-5 py-3 text-center shadow-sm">
            <div className="font-serif text-xl font-bold text-[#165DFF]">{formulaFor(experiment)}</div>
          </div>
          {expectedReady && (
            <div className="absolute right-12 top-10 flex flex-col gap-2">
              <span className="h-3 w-3 rounded-full bg-[#165DFF]/35" />
              <span className="h-2 w-2 rounded-full bg-[#165DFF]/25" />
              <span className="h-4 w-4 rounded-full bg-[#165DFF]/20" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DetailList({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? 'ol' : 'ul'
  return (
    <section className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
      <h2 className="flex items-center gap-2 text-xl font-bold text-[#242424]">
        <span className="h-5 w-1 rounded-full bg-[#165DFF]" />
        {title}
      </h2>
      <ListTag className={`mt-4 space-y-2 pl-5 text-sm leading-6 text-[#6f6a62] ${ordered ? 'list-decimal' : 'list-disc'}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </section>
  )
}

export default function ChemistryExperimentPage() {
  const { slug } = useParams()
  const experiment = allExperiments.find((item) => item.slug === slug)

  if (!experiment) {
    return (
      <div className="rounded-[8px] bg-white p-8 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <h1 className="text-2xl font-bold text-[#242424]">未找到实验</h1>
        <Link to="/chemistry" className="mt-4 inline-flex text-sm font-semibold text-[#165DFF]">
          返回化学之美
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/chemistry" className="inline-flex text-sm font-semibold text-[#165DFF]">
        返回化学之美
      </Link>

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#165DFF]">
              {CATEGORY_LABELS[experiment.category]}
            </span>
            <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-[#7f7a72]">
              {DIFFICULTY_LABELS[experiment.difficulty]}
            </span>
            <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-[#7f7a72]">
              {experiment.estimatedMinutes} 分钟
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-[#242424]">{experiment.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8a867f]">{experiment.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/chemistry/${experiment.slug}/lab`}
              className="rounded-[8px] bg-[#165DFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
            >
              进入实验台
            </Link>
            <Link
              to="/chemistry/sessions"
              className="rounded-[8px] border border-[#ece8df] px-5 py-3 text-sm font-semibold text-[#6f6a62] hover:border-[#165DFF] hover:text-[#165DFF]"
            >
              实验会话
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-[8px] bg-[#eaf2ff] shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <div className="absolute left-7 top-8 h-14 w-14 rounded-full border border-[#9bbcff] bg-white/55" />
          <div className="absolute bottom-7 right-7 h-20 w-20 rounded-full bg-[#165DFF]/10" />
          <div className="relative rounded-[8px] border border-[#d9e4ff] bg-white/85 px-6 py-4 text-center shadow-sm">
            <div className="font-serif text-2xl font-bold text-[#165DFF]">{formulaFor(experiment)}</div>
            <div className="mt-2 h-1 w-24 rounded-full bg-[#165DFF]" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <DetailList title="实验目标" items={experiment.objectives} ordered />
        <DetailList title="所需试剂" items={experiment.reagents} />
        <DetailList title="所需仪器" items={experiment.apparatus} />
      </div>

      <LabPreview experiment={experiment} />
    </div>
  )
}
