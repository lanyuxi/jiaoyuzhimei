import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  physicsCategories,
  physicsDifficultyLabels,
  physicsExperiments,
  type PhysicsDifficulty,
  type PhysicsExperiment,
} from './data'

const allCategory = 'ALL'
const allDifficulty = 'ALL'

type CategoryFilter = string | typeof allCategory
type DifficultyFilter = PhysicsDifficulty | typeof allDifficulty

const difficultyOrder: PhysicsDifficulty[] = ['beginner', 'elementary', 'intermediate', 'advanced']

const difficultyMeta: Record<PhysicsDifficulty, { accent: string; soft: string }> = {
  beginner: { accent: '#165DFF', soft: '#edf5ff' },
  elementary: { accent: '#3d8c7a', soft: '#eef8f5' },
  intermediate: { accent: '#7567dc', soft: '#f1efff' },
  advanced: { accent: '#ef6b6b', soft: '#fff0ef' },
}

function countBy<T extends string>(items: readonly PhysicsExperiment[], key: (item: PhysicsExperiment) => T) {
  return items.reduce<Record<T, number>>((acc, item) => {
    const value = key(item)
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {} as Record<T, number>)
}

function getFormula(experiment: PhysicsExperiment) {
  for (const section of experiment.sections) {
    const formulaLine = section.lines.find((line) => line.formula)
    if (formulaLine?.formula) return formulaLine.formula
  }
  return experiment.objectives[0] ?? experiment.title
}

function getDescription(experiment: PhysicsExperiment) {
  return experiment.subtitle || experiment.objectives[0] || experiment.sections[0]?.lines[0]?.text || ''
}

function PhysicsCover({ experiment }: { experiment: PhysicsExperiment }) {
  const meta = difficultyMeta[experiment.difficulty]
  const formula = getFormula(experiment)

  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#edf5ff]" style={{ backgroundColor: meta.soft }}>
      <div className="absolute left-7 top-7 h-20 w-20 rounded-full border border-white/80 bg-white/45" />
      <div className="absolute bottom-7 right-8 h-16 w-28 rounded-full bg-white/55" />
      <div className="absolute inset-x-8 bottom-8 h-px bg-white/90" />
      <div className="relative max-w-[82%] rounded-[8px] border border-white/75 bg-white/85 px-5 py-4 text-center shadow-sm">
        <div className="line-clamp-2 break-words font-serif text-xl font-bold leading-snug" style={{ color: meta.accent }}>
          {formula}
        </div>
        <div className="mx-auto mt-2 h-1 w-24 rounded-full" style={{ backgroundColor: meta.accent }} />
      </div>
    </div>
  )
}

function ExperimentCard({ experiment }: { experiment: PhysicsExperiment }) {
  const meta = difficultyMeta[experiment.difficulty]

  return (
    <Link
      to={`/physics/${experiment.slug}`}
      className="group overflow-hidden rounded-[8px] bg-white shadow-[0_14px_32px_rgba(43,43,43,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(43,43,43,0.08)]"
    >
      <PhysicsCover experiment={experiment} />
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#165DFF]">
            {experiment.category}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: meta.soft, color: meta.accent }}
          >
            {physicsDifficultyLabels[experiment.difficulty]}
          </span>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#2d2d2d] transition-colors group-hover:text-[#165DFF]">
            {experiment.title}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#8a867f]">{getDescription(experiment)}</p>
        </div>
      </div>
    </Link>
  )
}

export default function PhysicsHome() {
  const [category, setCategory] = useState<CategoryFilter>(allCategory)
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(allDifficulty)
  const [query, setQuery] = useState('')

  const categoryCounts = useMemo(() => countBy(physicsExperiments, (item) => item.category), [])
  const difficultyCounts = useMemo(() => countBy(physicsExperiments, (item) => item.difficulty), [])

  const filteredExperiments = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return physicsExperiments.filter((experiment) => {
      const matchesCategory = category === allCategory || experiment.category === category
      const matchesDifficulty = difficulty === allDifficulty || experiment.difficulty === difficulty
      const matchesQuery =
        !keyword ||
        experiment.title.toLowerCase().includes(keyword) ||
        experiment.subtitle.toLowerCase().includes(keyword) ||
        experiment.objectives.some((objective) => objective.toLowerCase().includes(keyword))

      return matchesCategory && matchesDifficulty && matchesQuery
    })
  }, [category, difficulty, query])

  const stats = [
    { value: physicsExperiments.length, label: '实验总数' },
    { value: physicsCategories.length, label: '主题分类' },
    { value: difficultyCounts.intermediate ?? 0, label: '中级实验' },
    { value: difficultyCounts.advanced ?? 0, label: '高级实验' },
  ]
  const directoryTitle = category === allCategory ? '实验目录' : category

  return (
    <div className="space-y-6">
      <section>
        <div className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-8">
          <h1 className="text-4xl font-bold leading-tight text-[#242424]">物理之美</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8a867f]">
            覆盖力学、电磁学、波动、光学、热学、近代物理、天体物理、量子信息、相对论等可交互实验。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setDifficulty(allDifficulty)}
                className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4 text-left transition hover:border-[#8FB3FF]"
              >
                <div className="text-2xl font-semibold text-[#242424]">{item.value}</div>
                <div className="mt-1 text-xs text-[#9a958c]">{item.label}</div>
              </button>
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
          {difficultyOrder.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDifficulty(item)}
              className={`pb-2 text-sm font-semibold ${
                difficulty === item ? 'border-b-2 border-[#165DFF] text-[#165DFF]' : 'text-[#3f3f3f]'
              }`}
            >
              {physicsDifficultyLabels[item]} · {difficultyCounts[item] ?? 0}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索实验、概念或现象"
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
          {physicsCategories.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategory(item.name)}
              className={`shrink-0 rounded-[8px] px-3 py-2 text-sm font-semibold ${
                category === item.name ? 'bg-[#165DFF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f7f7f5] text-[#6f6a62]'
              }`}
            >
              {item.name} · {categoryCounts[item.name] ?? 0}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#242424]">{directoryTitle}</h2>
            <p className="mt-1 text-sm text-[#9a958c]">已筛选 {filteredExperiments.length} 个实验</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExperiments.map((experiment) => (
            <ExperimentCard key={experiment.slug} experiment={experiment} />
          ))}
        </div>
      </section>

      {filteredExperiments.length === 0 && (
        <div className="rounded-[8px] bg-white py-16 text-center shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <h3 className="text-base font-semibold text-[#242424]">没有找到匹配的实验</h3>
          <p className="mt-2 text-sm text-[#9a958c]">调整分类或关键词后再试一次。</p>
        </div>
      )}
    </div>
  )
}
