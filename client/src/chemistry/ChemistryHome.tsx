import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  allExperiments,
  ExperimentDifficulty,
  type ExperimentSeed,
} from './data/experiments'
import type { ExperimentCategory as Category, ExperimentDifficulty as Difficulty } from './data/experiments/types'
import {
  CATEGORY_FORMULAS,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_OPTIONS,
} from './labels'

const allCategory = 'ALL'
const allDifficulty = 'ALL'

type CategoryFilter = Category | typeof allCategory
type DifficultyFilter = Difficulty | typeof allDifficulty

function countBy<T extends string>(items: ExperimentSeed[], key: (item: ExperimentSeed) => T) {
  return items.reduce<Record<T, number>>((acc, item) => {
    const value = key(item)
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {} as Record<T, number>)
}

function formulaFor(experiment: ExperimentSeed) {
  if (experiment.probe?.reagentKeys.length) {
    return experiment.probe.reagentKeys.join(' + ')
  }
  return CATEGORY_FORMULAS[experiment.category]
}

function ChemistryCover({ experiment }: { experiment: ExperimentSeed }) {
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#eaf2ff]">
      <div className="absolute left-8 top-7 h-14 w-14 rounded-full border border-[#9bbcff] bg-white/55" />
      <div className="absolute bottom-7 right-10 h-20 w-20 rounded-full bg-[#165DFF]/10" />
      <div className="absolute inset-x-8 bottom-8 h-px bg-white" />
      <div className="relative rounded-[8px] border border-[#d9e4ff] bg-white/85 px-6 py-4 text-center shadow-sm">
        <div className="font-serif text-2xl font-bold text-[#165DFF]">{formulaFor(experiment)}</div>
        <div className="mt-2 h-1 w-24 rounded-full bg-[#165DFF]" />
      </div>
    </div>
  )
}

function ExperimentCard({ experiment }: { experiment: ExperimentSeed }) {
  return (
    <Link
      to={`/chemistry/${experiment.slug}`}
      className="group overflow-hidden rounded-[8px] bg-white shadow-[0_14px_32px_rgba(43,43,43,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(43,43,43,0.08)]"
    >
      <ChemistryCover experiment={experiment} />
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#165DFF]">
            {CATEGORY_LABELS[experiment.category]}
          </span>
          <span className="rounded-full bg-[#f7f7f5] px-2.5 py-1 text-xs font-semibold text-[#7f7a72]">
            {DIFFICULTY_LABELS[experiment.difficulty]}
          </span>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#2d2d2d] transition-colors group-hover:text-[#165DFF]">
            {experiment.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8a867f]">{experiment.description}</p>
        </div>
        <div className="flex items-center justify-between border-t border-[#ece8df] pt-3 text-xs text-[#9a958c]">
          <span>{experiment.estimatedMinutes} 分钟</span>
          <span>{experiment.reagents.length} 种试剂</span>
        </div>
      </div>
    </Link>
  )
}

export default function ChemistryHome() {
  const [category, setCategory] = useState<CategoryFilter>(allCategory)
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(allDifficulty)
  const [query, setQuery] = useState('')
  const categoryCounts = useMemo(() => countBy(allExperiments, (item) => item.category), [])
  const difficultyCounts = useMemo(() => countBy(allExperiments, (item) => item.difficulty), [])
  const filteredExperiments = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return allExperiments.filter((experiment) => {
      const matchesCategory = category === allCategory || experiment.category === category
      const matchesDifficulty = difficulty === allDifficulty || experiment.difficulty === difficulty
      const matchesQuery =
        !keyword ||
        experiment.title.toLowerCase().includes(keyword) ||
        experiment.description.toLowerCase().includes(keyword) ||
        experiment.reagents.some((reagent) => reagent.toLowerCase().includes(keyword))
      return matchesCategory && matchesDifficulty && matchesQuery
    })
  }, [category, difficulty, query])

  const stats = [
    { value: allExperiments.length, label: '实验总数' },
    { value: CATEGORY_OPTIONS.length, label: '主题分类' },
    { value: difficultyCounts[ExperimentDifficulty.EASY] ?? 0, label: '入门级' },
    { value: difficultyCounts[ExperimentDifficulty.HARD] ?? 0, label: '挑战级' },
  ]

  return (
    <div className="space-y-6">
      <section>
        <div className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-8">
          <h1 className="text-4xl font-bold leading-tight text-[#242424]">化学之美</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8a867f]">
            从真实实验目录迁移而来，用统一的教育之美界面呈现酸碱、沉淀、氧化还原、气体制备、电化学等核心实验。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/chemistry/sessions"
              className="rounded-[8px] bg-[#165DFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
            >
              实验会话
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
                <div className="text-2xl font-semibold text-[#242424]">{item.value}</div>
                <div className="mt-1 text-xs text-[#9a958c]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <div className="flex flex-wrap gap-6 border-b border-[#ece8df] pb-4">
          <button
            type="button"
            onClick={() => setDifficulty(allDifficulty)}
            className={`pb-2 text-sm font-semibold ${
              difficulty === allDifficulty ? 'border-b-2 border-[#165DFF] text-[#165DFF]' : 'text-[#3f3f3f]'
            }`}
          >
            全部
          </button>
          {DIFFICULTY_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDifficulty(item)}
              className={`pb-2 text-sm font-semibold ${
                difficulty === item ? 'border-b-2 border-[#165DFF] text-[#165DFF]' : 'text-[#3f3f3f]'
              }`}
            >
              {DIFFICULTY_LABELS[item]} · {difficultyCounts[item] ?? 0}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索实验、试剂或现象"
          className="mt-5 h-11 w-full rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] px-4 text-sm outline-none transition-colors focus:border-[#165DFF] focus:ring-2 focus:ring-[#165DFF]/15"
        />

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(allCategory)}
            className={`shrink-0 rounded-[8px] px-3 py-2 text-sm font-semibold ${
              category === allCategory ? 'bg-[#165DFF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f7f7f5] text-[#6f6a62]'
            }`}
          >
            全部
          </button>
          {CATEGORY_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-[8px] px-3 py-2 text-sm font-semibold ${
                category === item ? 'bg-[#165DFF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f7f7f5] text-[#6f6a62]'
              }`}
            >
              {CATEGORY_LABELS[item]} · {categoryCounts[item] ?? 0}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#242424]">实验目录</h2>
            <p className="mt-1 text-sm text-[#9a958c]">已筛选 {filteredExperiments.length} 个实验</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExperiments.map((experiment) => (
            <ExperimentCard key={experiment.slug} experiment={experiment} />
          ))}
        </div>
      </section>
    </div>
  )
}
