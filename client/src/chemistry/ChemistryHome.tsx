import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  allExperiments,
  ExperimentCategory,
  ExperimentDifficulty,
  type ExperimentSeed,
} from './data/experiments'
import type { ExperimentCategory as Category, ExperimentDifficulty as Difficulty } from './data/experiments/types'
import {
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

type ChemistryCoverKind =
  | 'acidBase'
  | 'organic'
  | 'thermo'
  | 'redox'
  | 'precipitation'
  | 'gas'
  | 'electrochem'
  | 'metal'
  | 'analysis'
  | 'coordination'

const chemistryAccent: Record<Category, string> = {
  [ExperimentCategory.ACID_BASE]: '#2563eb',
  [ExperimentCategory.ORGANIC]: '#16a34a',
  [ExperimentCategory.THERMODYNAMICS]: '#f97316',
  [ExperimentCategory.REDOX]: '#ef4444',
  [ExperimentCategory.PRECIPITATION]: '#7c3aed',
  [ExperimentCategory.GAS]: '#06b6d4',
  [ExperimentCategory.ELECTROCHEM]: '#2563eb',
  [ExperimentCategory.METAL]: '#64748b',
  [ExperimentCategory.ANALYSIS]: '#0f766e',
  [ExperimentCategory.COORDINATION]: '#8b5cf6',
}

function getChemistryCoverKind(category: Category): ChemistryCoverKind {
  switch (category) {
    case ExperimentCategory.ACID_BASE:
      return 'acidBase'
    case ExperimentCategory.ORGANIC:
      return 'organic'
    case ExperimentCategory.THERMODYNAMICS:
      return 'thermo'
    case ExperimentCategory.REDOX:
      return 'redox'
    case ExperimentCategory.PRECIPITATION:
      return 'precipitation'
    case ExperimentCategory.GAS:
      return 'gas'
    case ExperimentCategory.ELECTROCHEM:
      return 'electrochem'
    case ExperimentCategory.METAL:
      return 'metal'
    case ExperimentCategory.ANALYSIS:
      return 'analysis'
    case ExperimentCategory.COORDINATION:
      return 'coordination'
    default:
      return 'analysis'
  }
}

function chemistryCurvePath(amplitude = 34, frequency = 2, phase = 0) {
  return Array.from({ length: 80 }, (_, index) => {
    const x = 44 + index * 5.4
    const y = 116 - Math.sin((index / 79) * Math.PI * frequency + phase) * amplitude
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function ChemistryCoverArtwork({
  coverId,
  kind,
  accent,
}: {
  coverId: string
  kind: ChemistryCoverKind
  accent: string
}) {
  const gridId = `${coverId}-grid`

  return (
    <svg viewBox="0 0 520 240" className="h-full w-full" role="img" aria-hidden="true">
      <defs>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e9eef5" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="520" height="240" rx="10" fill="#ffffff" />
      <rect width="520" height="240" fill={`url(#${gridId})`} />
      <path d="M 44 120 H 478" stroke="#9ca3af" strokeWidth="1.4" />
      <path d="M 260 26 V 216" stroke="#9ca3af" strokeWidth="1.4" />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((tick) => (
        <text key={`x-${tick}`} x={260 + tick * 46} y="222" textAnchor="middle" fill="#64748b" fontSize="12">
          {tick}
        </text>
      ))}
      {[-2, -1, 0, 1, 2].map((tick) => (
        <text key={`y-${tick}`} x="28" y={124 - tick * 44} textAnchor="middle" fill="#64748b" fontSize="12">
          {tick}
        </text>
      ))}

      {kind === 'acidBase' && (
        <>
          <path d="M 82 176 C 148 176 190 166 216 150 C 250 130 258 72 288 58 C 318 44 374 56 438 56" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M 268 52 V 188" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="7 7" />
          <circle cx="268" cy="112" r="8" fill="#ef4444" />
        </>
      )}

      {kind === 'organic' && (
        <>
          <polygon points="260,58 324,94 324,166 260,202 196,166 196,94" fill="none" stroke={accent} strokeWidth="4" />
          <circle cx="260" cy="58" r="8" fill="#ef4444" />
          <circle cx="324" cy="166" r="8" fill="#f97316" />
          <path d="M 196 94 L 116 72 M 324 94 L 406 72 M 260 202 V 224" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {kind === 'thermo' && (
        <>
          {Array.from({ length: 10 }, (_, index) => {
            const h = 22 + index * 13
            return <rect key={index} x={106 + index * 32} y={188 - h} width="24" height={h} rx="5" fill={index < 4 ? '#60a5fa' : index < 7 ? accent : '#ef4444'} opacity="0.72" />
          })}
          <path d={chemistryCurvePath(28, 2.2, 0.8)} fill="none" stroke="#ef4444" strokeWidth="3" />
        </>
      )}

      {kind === 'redox' && (
        <>
          <path d="M 108 154 C 166 66 242 66 296 154 C 344 206 398 174 440 108" fill="none" stroke={accent} strokeWidth="4" />
          <circle cx="162" cy="118" r="16" fill="#7c3aed" opacity="0.85" />
          <circle cx="292" cy="154" r="16" fill="#ef4444" opacity="0.85" />
          <path d="M 180 118 H 270" stroke="#64748b" strokeWidth="3" strokeDasharray="6 6" />
        </>
      )}

      {kind === 'precipitation' && (
        <>
          <path d="M 152 58 H 368 L 340 190 H 180 Z" fill="#f8fafc" stroke={accent} strokeWidth="4" />
          <path d="M 178 142 C 220 126 286 154 342 138 L 330 184 H 190 Z" fill={accent} opacity="0.18" />
          {Array.from({ length: 18 }, (_, index) => (
            <circle key={index} cx={188 + (index % 6) * 28} cy={148 + Math.floor(index / 6) * 14} r={5 + (index % 3)} fill={accent} opacity="0.65" />
          ))}
        </>
      )}

      {kind === 'gas' && (
        <>
          <path d="M 238 70 H 282 L 292 116 C 324 130 350 160 350 190 H 170 C 170 160 196 130 228 116 Z" fill="#ecfeff" stroke={accent} strokeWidth="4" />
          <path d="M 196 172 C 232 152 286 184 324 164" fill="none" stroke="#06b6d4" strokeWidth="4" />
          {[206, 242, 286, 318, 228, 302].map((x, index) => (
            <circle key={x} cx={x} cy={[118, 96, 112, 82, 62, 58][index]} r={7 + (index % 3)} fill={accent} opacity="0.55" />
          ))}
        </>
      )}

      {kind === 'electrochem' && (
        <>
          <rect x="130" y="76" width="260" height="110" rx="12" fill="#f8fafc" stroke={accent} strokeWidth="4" />
          <path d="M 198 58 V 168 M 322 58 V 168" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <path d="M 198 58 C 230 34 292 34 322 58" fill="none" stroke="#ef4444" strokeWidth="3" />
          <path d="M 226 104 H 294" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 6" />
          <circle cx="240" cy="104" r="6" fill="#ef4444" />
          <circle cx="276" cy="104" r="6" fill="#ef4444" />
        </>
      )}

      {kind === 'metal' && (
        <>
          <path d="M 132 164 H 388" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
          <rect x="204" y="76" width="44" height="88" rx="8" fill={accent} opacity="0.78" />
          <path d="M 248 116 C 286 86 326 94 360 72" fill="none" stroke="#f97316" strokeWidth="4" />
          {[286, 326, 356].map((x, index) => (
            <circle key={x} cx={x} cy={[98, 82, 60][index]} r="8" fill="#06b6d4" opacity="0.7" />
          ))}
        </>
      )}

      {kind === 'analysis' && (
        <>
          <path d="M 92 174 C 144 88 190 88 226 152 C 254 204 302 192 330 124 C 352 72 386 62 430 82" fill="none" stroke={accent} strokeWidth="4" />
          <path d="M 96 180 L 432 60" stroke="#f97316" strokeWidth="3" strokeDasharray="8 7" />
          {[126, 206, 286, 366].map((x, index) => (
            <circle key={x} cx={x} cy={[124, 142, 172, 88][index]} r="7" fill="#ef4444" />
          ))}
        </>
      )}

      {kind === 'coordination' && (
        <>
          <circle cx="260" cy="120" r="20" fill={accent} />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index / 6) * Math.PI * 2
            const x = 260 + Math.cos(angle) * 86
            const y = 120 + Math.sin(angle) * 70
            return (
              <g key={index}>
                <line x1="260" y1="120" x2={x} y2={y} stroke="#64748b" strokeWidth="3" />
                <circle cx={x} cy={y} r="15" fill={index % 2 ? '#06b6d4' : '#f97316'} opacity="0.82" />
              </g>
            )
          })}
        </>
      )}
    </svg>
  )
}

function ChemistryCover({ experiment }: { experiment: ExperimentSeed }) {
  const accent = chemistryAccent[experiment.category]
  const kind = getChemistryCoverKind(experiment.category)

  return (
    <div className="h-[196px] overflow-hidden bg-white px-4 pt-4">
      <div className="h-full overflow-hidden rounded-[8px] bg-white">
        <ChemistryCoverArtwork coverId={`chemistry-cover-${experiment.slug}`} kind={kind} accent={accent} />
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
      <div className="space-y-3 px-4 pb-4 pt-3">
        <div>
          <h3 className="text-base font-bold leading-6 text-[#242424] transition-colors group-hover:text-[#165DFF]">
            {experiment.title}
          </h3>
          <p className="mt-3 min-h-[44px] overflow-hidden text-sm leading-[22px] text-[#8a867f] line-clamp-2">{experiment.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-[8px] bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#165DFF]">
            {CATEGORY_LABELS[experiment.category]}
          </span>
          <span className="rounded-[8px] bg-[#f7f7f5] px-3 py-1.5 text-xs font-semibold text-[#7f7a72]">
            {DIFFICULTY_LABELS[experiment.difficulty]}
          </span>
          <span className="rounded-[8px] bg-[#f4fbf8] px-3 py-1.5 text-xs font-semibold text-[#3d8c7a]">
            {experiment.estimatedMinutes} 分钟
          </span>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredExperiments.map((experiment) => (
            <ExperimentCard key={experiment.slug} experiment={experiment} />
          ))}
        </div>
      </section>
    </div>
  )
}
