import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allExperiments, ExperimentCategory, type ExperimentSeed } from './data/experiments'
import { buildChemistryLesson, type ChemistryLessonStep } from './lesson'
import {
  appendChemistryMeasurement,
  appendChemistryStep,
  completeChemistrySession,
  createChemistrySession,
  generateChemistryReport,
  saveChemistryReport,
  type ChemistrySession,
} from './sessionStore'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from './labels'

function matchesProbeReagent(selected: string[], probeKey: string) {
  return selected.some((reagent) => reagent.includes(probeKey) || probeKey.includes(reagent))
}

function isProbeReady(experiment: ExperimentSeed, selected: string[]) {
  if (!experiment.probe) return selected.length >= 2
  return experiment.probe.reagentKeys.every((key) => matchesProbeReagent(selected, key))
}

function describeObservation(experiment: ExperimentSeed, selected: string[]) {
  if (selected.length < 2) return '先加入至少两种试剂，再混合观察反应。'
  if (!isProbeReady(experiment, selected)) return '当前组合未触发核心反应，请继续选择与实验目标相关的试剂。'

  const expect = experiment.probe?.expect
  if (!expect || !expect.reacted) return '体系变化不明显，重点记录 pH、温度或导电性读数。'

  const effects: string[] = []
  if (expect.colorChange) effects.push('溶液颜色变化')
  if (expect.precipitate) effects.push('出现沉淀')
  if (expect.gas) effects.push('产生气泡')
  if (expect.thermal === 'exothermic') effects.push('温度升高')
  if (expect.thermal === 'endothermic') effects.push('温度降低')
  return effects.length > 0 ? effects.join('，') : '反应发生，读数出现变化'
}

function deriveReadings(experiment: ExperimentSeed, selected: string[]) {
  const joined = selected.join(' ')
  const hasAcid = /酸|HCl|H2SO4|HNO3|CH3COOH/.test(joined)
  const hasBase = /碱|NaOH|KOH|氨水|OH/.test(joined)
  const ready = isProbeReady(experiment, selected)

  let ph = 7
  if (hasAcid && hasBase) ph = 7.1
  else if (hasAcid) ph = 2.4
  else if (hasBase) ph = 11.8
  else if (experiment.category === ExperimentCategory.ACID_BASE) ph = ready ? 7.2 : 6.8

  let temperature = 25
  if (ready && experiment.probe?.expect.thermal === 'exothermic') temperature = 38
  if (ready && experiment.probe?.expect.thermal === 'endothermic') temperature = 18
  if (ready && experiment.category === ExperimentCategory.THERMODYNAMICS) temperature += 8

  return { ph, temperature }
}

function StepCard({
  step,
  active,
  done,
  onRun,
}: {
  step: ChemistryLessonStep
  active: boolean
  done: boolean
  onRun: () => void
}) {
  return (
    <div
      className={`rounded-[8px] border p-4 transition-colors ${
        active
          ? 'border-[#165DFF] bg-[#eef4ff]'
          : done
            ? 'border-[#d9e4ff] bg-white'
            : 'border-[#ece8df] bg-[#fdfdfc]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#165DFF]">{step.phase}</p>
          <h3 className="mt-1 text-sm font-bold text-[#242424]">{step.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6a62]">{step.narration}</p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={!active}
          className="shrink-0 rounded-[8px] bg-[#165DFF] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:bg-[#d9e4ff]"
        >
          执行
        </button>
      </div>
    </div>
  )
}

export default function ChemistryLabPage() {
  const { slug } = useParams()
  const experiment = allExperiments.find((item) => item.slug === slug)
  const [session, setSession] = useState<ChemistrySession | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [mixed, setMixed] = useState(false)
  const [completed, setCompleted] = useState(false)

  const lesson = useMemo(() => (experiment ? buildChemistryLesson(experiment) : []), [experiment])
  const readings = useMemo(() => (experiment ? deriveReadings(experiment, selected) : { ph: 7, temperature: 25 }), [
    experiment,
    selected,
  ])
  const observation = experiment ? describeObservation(experiment, selected) : ''
  const ready = experiment ? isProbeReady(experiment, selected) : false

  useEffect(() => {
    if (!experiment) return
    const next = createChemistrySession(experiment)
    setSession(next)
    appendChemistryStep(next.id, '进入实验台', `开始${experiment.title}实验。`)
  }, [experiment])

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

  function recordStep(title: string, detail: string) {
    if (!session) return
    const next = appendChemistryStep(session.id, title, detail)
    if (next) setSession(next)
  }

  function addReagent(reagent: string) {
    setSelected((current) => (current.includes(reagent) ? current : [...current, reagent]))
    recordStep('加入试剂', `加入${reagent}。`)
  }

  function resetLab() {
    setSelected([])
    setMixed(false)
    setCompleted(false)
    setCurrentStep(0)
    recordStep('清空实验台', '重新开始本次实验操作。')
  }

  function mixReaction() {
    if (!session || selected.length < 2) return
    setMixed(true)
    recordStep('混合反应', observation)
    const next = appendChemistryMeasurement(session.id, {
      label: '混合后读数',
      ph: readings.ph,
      temperature: readings.temperature,
      observation,
    })
    if (next) setSession(next)
  }

  function finishLab() {
    if (!session || !experiment) return
    if (!mixed) mixReaction()
    const completedSession = completeChemistrySession(session.id)
    const baseSession = completedSession ?? session
    const report = generateChemistryReport(baseSession, experiment)
    const next = saveChemistryReport(baseSession.id, report) ?? baseSession
    setSession(next)
    setCompleted(true)
  }

  function runStep(step: ChemistryLessonStep) {
    if (step.action?.kind === 'reset') resetLab()
    if (step.action?.kind === 'add') addReagent(step.action.reagent)
    if (step.action?.kind === 'mix') mixReaction()
    if (step.action?.kind === 'finish') finishLab()
    if (step.action?.kind === 'observe') recordStep('观察现象', observation)
    setCurrentStep((value) => Math.min(value + 1, lesson.length - 1))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/chemistry/${experiment.slug}`} className="text-sm font-semibold text-[#165DFF]">
          返回实验详情
        </Link>
        <Link to="/chemistry/sessions" className="text-sm font-semibold text-[#165DFF]">
          查看实验会话
        </Link>
      </div>

      <section className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#165DFF]">
            {CATEGORY_LABELS[experiment.category]}
          </span>
          <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-[#7f7a72]">
            {DIFFICULTY_LABELS[experiment.difficulty]}
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-bold text-[#242424]">{experiment.title}实验台</h1>
        <p className="mt-3 text-sm leading-7 text-[#8a867f]">
          按步骤加入试剂、混合反应并记录读数，完成后可生成本地实验报告。
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr_300px]">
        <aside className="space-y-4">
          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <h2 className="text-lg font-bold text-[#242424]">学习步骤</h2>
            <div className="mt-4 space-y-3">
              {lesson.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  active={index === currentStep}
                  done={index < currentStep}
                  onRun={() => runStep(step)}
                />
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-5">
          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#242424]">可视化实验台</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={mixReaction}
                  disabled={selected.length < 2}
                  className="rounded-[8px] bg-[#165DFF] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:bg-[#d9e4ff]"
                >
                  混合反应
                </button>
                <button
                  type="button"
                  onClick={resetLab}
                  className="rounded-[8px] border border-[#ece8df] px-4 py-2 text-sm font-semibold text-[#6f6a62] hover:border-[#165DFF] hover:text-[#165DFF]"
                >
                  清空
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
              <div>
                <p className="text-sm font-semibold text-[#6f6a62]">试剂架</p>
                <div className="mt-3 space-y-2">
                  {experiment.reagents.map((reagent) => (
                    <button
                      key={reagent}
                      type="button"
                      onClick={() => addReagent(reagent)}
                      className={`flex w-full items-center justify-between rounded-[8px] border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        selected.includes(reagent)
                          ? 'border-[#165DFF] bg-[#eef4ff] text-[#165DFF]'
                          : 'border-[#ece8df] bg-[#fdfdfc] text-[#6f6a62] hover:border-[#165DFF] hover:text-[#165DFF]'
                      }`}
                    >
                      <span>{reagent}</span>
                      <span>{selected.includes(reagent) ? '已加' : '+'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[8px] bg-[#eaf2ff]">
                <div className="absolute bottom-16 h-5 w-56 rounded-full bg-[#165DFF]/10 blur-md" />
                <div className="relative flex h-72 w-64 flex-col items-center justify-end">
                  <div className="absolute bottom-8 h-48 w-44 rounded-b-[48px] border-x-2 border-b-2 border-[#8bb5ff] bg-white/40" />
                  <div
                    className={`absolute bottom-8 w-44 rounded-b-[48px] transition-all ${
                      ready ? 'bg-[#165DFF]/35' : 'bg-[#88b8ff]/25'
                    }`}
                    style={{ height: `${Math.min(150, 48 + selected.length * 24)}px` }}
                  />
                  <div className="absolute bottom-56 h-12 w-48 rounded-full border-2 border-[#8bb5ff] bg-white/55" />
                  <div className="absolute bottom-20 max-w-52 rounded-[8px] border border-[#d9e4ff] bg-white/90 px-4 py-3 text-center shadow-sm">
                    <p className="font-serif text-xl font-bold text-[#165DFF]">
                      {selected.length ? selected.slice(0, 2).join(' + ') : '加入试剂'}
                    </p>
                  </div>
                  {ready && (
                    <div className="absolute right-4 top-16 flex flex-col gap-2">
                      <span className="h-4 w-4 rounded-full bg-[#165DFF]/35" />
                      <span className="h-3 w-3 rounded-full bg-[#165DFF]/25" />
                      <span className="h-5 w-5 rounded-full bg-[#165DFF]/20" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <h2 className="text-lg font-bold text-[#242424]">实验现象</h2>
            <p className="mt-3 rounded-[8px] bg-[#fdfdfc] p-4 text-sm leading-6 text-[#6f6a62]">{observation}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {selected.map((reagent) => (
                <span key={reagent} className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#165DFF]">
                  {reagent}
                </span>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <h2 className="text-lg font-bold text-[#242424]">实时读数</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
                <p className="text-xs text-[#9a958c]">pH</p>
                <p className="mt-1 text-2xl font-semibold text-[#165DFF]">{readings.ph.toFixed(1)}</p>
              </div>
              <div className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
                <p className="text-xs text-[#9a958c]">温度</p>
                <p className="mt-1 text-2xl font-semibold text-[#165DFF]">{readings.temperature}℃</p>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
            <h2 className="text-lg font-bold text-[#242424]">实验会话</h2>
            <p className="mt-2 text-sm leading-6 text-[#8a867f]">
              已记录 {session?.steps.length ?? 0} 个步骤，{session?.measurements.length ?? 0} 条读数。
            </p>
            <button
              type="button"
              onClick={finishLab}
              className="mt-4 w-full rounded-[8px] bg-[#165DFF] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
            >
              完成并生成报告
            </button>
            {completed && session?.report && (
              <Link
                to={`/chemistry/sessions/${session.id}/report`}
                className="mt-3 inline-flex w-full justify-center rounded-[8px] border border-[#165DFF] px-4 py-3 text-sm font-semibold text-[#165DFF]"
              >
                查看报告
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
