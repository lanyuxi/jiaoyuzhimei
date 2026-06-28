import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { difficultyConfig, experiments, type DifficultyLevel, type Experiment } from './Home'

type DifficultyFilter = DifficultyLevel | 'all'

const difficultyOrder: DifficultyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert']

const tabs: Array<{ id: DifficultyFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'beginner', label: '入门级' },
  { id: 'elementary', label: '基础级' },
  { id: 'intermediate', label: '中级' },
  { id: 'advanced', label: '高级' },
  { id: 'expert', label: '专业级' },
]

const topicTabs = [
  { id: 'all', label: '全部' },
  { id: 'geometry', label: '几何' },
  { id: 'algebra', label: '代数' },
  { id: 'calculus', label: '微积分' },
  { id: 'probability', label: '概率统计' },
  { id: 'linear-algebra', label: '线性代数' },
  { id: 'analysis', label: '分析' },
  { id: 'discrete', label: '离散数学' },
  { id: 'applied', label: '应用数学' },
]

const difficultyMeta: Record<DifficultyLevel, { accent: string; soft: string; line: string }> = {
  beginner: { accent: '#165DFF', soft: '#edf5ff', line: '#165DFF' },
  elementary: { accent: '#4d8df7', soft: '#edf4ff', line: '#4d8df7' },
  intermediate: { accent: '#165DFF', soft: '#EAF2FF', line: '#165DFF' },
  advanced: { accent: '#7567dc', soft: '#f1efff', line: '#7567dc' },
  expert: { accent: '#ef6b6b', soft: '#fff0ef', line: '#ef6b6b' },
}

const formulaByTopic: Record<string, string> = {
  geometry: 'A = πr²',
  algebra: 'y = ax + b',
  calculus: '∫ f(x) dx',
  probability: 'P(A|B)',
  'linear-algebra': 'A⃗x = λ⃗x',
  analysis: 'Σ aₙ',
  discrete: 'G = (V,E)',
  applied: 'min f(x)',
}

function groupByDifficulty(list: Experiment[]) {
  return difficultyOrder.reduce<Record<DifficultyLevel, Experiment[]>>((groups, level) => {
    groups[level] = list.filter((item) => item.difficulty === level)
    return groups
  }, {
    beginner: [],
    elementary: [],
    intermediate: [],
    advanced: [],
    expert: [],
  })
}

function getCoverKind(experiment: Experiment) {
  if (experiment.topics.includes('probability')) return 'bars'
  if (experiment.topics.includes('calculus') || experiment.topics.includes('analysis')) return 'curve'
  if (experiment.topics.includes('linear-algebra')) return 'matrix'
  if (experiment.topics.includes('geometry')) return 'geometry'
  return 'formula'
}

function getFormula(experiment: Experiment) {
  const topic = experiment.topics.find((item) => formulaByTopic[item])
  return topic ? formulaByTopic[topic] : 'f(x)'
}

function ModuleCover({ experiment }: { experiment: Experiment }) {
  const meta = difficultyMeta[experiment.difficulty]
  const kind = getCoverKind(experiment)
  const formula = getFormula(experiment)

  return (
    <div className="relative h-40 overflow-hidden bg-[#edf5ff]" style={{ backgroundColor: meta.soft }}>
      <div className="absolute left-5 top-5 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#777] shadow-sm">
        {difficultyConfig[experiment.difficulty].label}
      </div>

      <div className="absolute inset-x-6 bottom-6 top-12">
        {kind === 'curve' && (
          <div className="relative h-full">
            <div className="absolute inset-x-0 bottom-3 h-px bg-white/80" />
            <div className="absolute left-0 top-[58%] h-1 w-full rounded-full bg-white/80" />
            <div
              className="absolute left-2 top-9 h-20 w-[92%] rounded-[50%] border-t-4 border-r-4 border-transparent"
              style={{ borderTopColor: meta.line, transform: 'rotate(-7deg)' }}
            />
            <div className="absolute right-6 top-2 font-serif text-2xl font-semibold" style={{ color: meta.accent }}>
              {formula}
            </div>
          </div>
        )}

        {kind === 'bars' && (
          <div className="flex h-full items-end gap-4 px-5">
            {[48, 76, 42, 92, 61].map((height, index) => (
              <div key={height} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md"
                  style={{ height: `${height}%`, backgroundColor: index === 3 ? meta.accent : '#9fc9ff' }}
                />
                <span className="h-1 w-6 rounded-full bg-white/90" />
              </div>
            ))}
            <div className="absolute right-5 top-4 font-serif text-2xl font-semibold" style={{ color: meta.accent }}>
              {formula}
            </div>
          </div>
        )}

        {kind === 'matrix' && (
          <div className="grid h-full grid-cols-4 gap-3 rounded-lg bg-white/55 p-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="rounded"
                style={{ backgroundColor: index % 3 === 0 ? meta.accent : '#b9d8ff' }}
              />
            ))}
            <div className="absolute right-5 top-4 font-serif text-2xl font-semibold" style={{ color: meta.accent }}>
              {formula}
            </div>
          </div>
        )}

        {kind === 'geometry' && (
          <div className="relative h-full">
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full border-[10px] border-white/70" />
            <div className="absolute left-28 top-10 h-24 w-24 rotate-45 rounded-md bg-white/55" />
            <div className="absolute bottom-4 right-8 h-16 w-16 rounded-full" style={{ backgroundColor: meta.accent }} />
            <div className="absolute right-5 top-4 font-serif text-2xl font-semibold" style={{ color: meta.accent }}>
              {formula}
            </div>
          </div>
        )}

        {kind === 'formula' && (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-lg bg-white/70 px-6 py-5 text-center shadow-sm">
              <div className="font-serif text-3xl font-semibold" style={{ color: meta.accent }}>
                {formula}
              </div>
              <div className="mt-2 h-1 w-24 rounded-full" style={{ backgroundColor: meta.accent }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CourseCard({ experiment }: { experiment: Experiment }) {
  const meta = difficultyMeta[experiment.difficulty]

  return (
    <Link
      to={experiment.path}
      className="group overflow-hidden rounded-[8px] bg-white shadow-[0_14px_32px_rgba(43,43,43,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(43,43,43,0.08)]"
    >
      <ModuleCover experiment={experiment} />
      <div className="border-t border-[#f1eee6] px-5 py-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="line-clamp-1 text-base font-semibold text-[#333] group-hover:text-[#165DFF]">
            {experiment.title}
          </h2>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: meta.soft, color: meta.accent }}
          >
            {difficultyConfig[experiment.difficulty].label}
          </span>
        </div>
        <p className="mb-4 line-clamp-2 min-h-10 text-sm leading-5 text-[#8a867f]">
          {experiment.description}
        </p>
      </div>
    </Link>
  )
}

export default function HomeDashboard() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredExperiments = useMemo(() => {
    return experiments.filter((experiment) => {
      const matchesDifficulty = selectedDifficulty === 'all' || experiment.difficulty === selectedDifficulty
      const matchesTopic = selectedTopic === 'all' || experiment.topics.includes(selectedTopic)
      const matchesSearch =
        searchQuery.trim() === '' ||
        experiment.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        experiment.description.toLowerCase().includes(searchQuery.trim().toLowerCase())

      return matchesDifficulty && matchesTopic && matchesSearch
    })
  }, [searchQuery, selectedDifficulty, selectedTopic])

  const groupedExperiments = useMemo(() => groupByDifficulty(filteredExperiments), [filteredExperiments])

  return (
    <div className="space-y-6">
      <section id="course-map">
        <div className="rounded-[8px] bg-white p-6 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#242424] md:text-4xl">数学之美</h1>
          <p className="max-w-2xl text-sm leading-6 text-[#8a867f]">
            通过交互式可视化，探索数学的奥秘与美感。
          </p>
          <div id="learning-tools" className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className="rounded-[8px] border border-[#f0eadf] bg-[#fbfaf7] px-4 py-4 text-left transition hover:border-[#8FB3FF]"
            >
              <div className="text-2xl font-semibold text-[#242424]">{experiments.length}</div>
              <div className="mt-1 text-xs text-[#9a958c]">实验总数</div>
            </button>
            {difficultyOrder.slice(0, 4).map((level) => (
              <button
                key={level}
                onClick={() => setSelectedDifficulty(level)}
                className="rounded-[8px] border border-[#f0eadf] bg-[#fbfaf7] px-4 py-4 text-left transition hover:border-[#8FB3FF]"
              >
                <div className="text-2xl font-semibold text-[#242424]">
                  {experiments.filter((item) => item.difficulty === level).length}
                </div>
                <div className="mt-1 text-xs text-[#9a958c]">{difficultyConfig[level].label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="visual-lab" className="rounded-[8px] bg-white px-5 pt-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <div className="flex flex-col gap-5 border-b border-[#eee9df] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedDifficulty(tab.id)}
                className={`relative whitespace-nowrap pb-3 text-sm font-semibold transition ${
                  selectedDifficulty === tab.id ? 'text-[#165DFF]' : 'text-[#555] hover:text-[#165DFF]'
                }`}
              >
                {tab.label}
                {selectedDifficulty === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#165DFF]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索实验"
              className="h-9 w-full rounded-[8px] border border-[#eee9df] bg-[#fbfaf7] px-3 text-sm outline-none transition focus:border-[#165DFF] lg:w-56"
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto py-4">
          {topicTabs.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`shrink-0 rounded-[8px] px-3 py-2 text-xs font-semibold transition ${
                selectedTopic === topic.id
                  ? 'bg-[#165DFF] text-white shadow-[0_8px_16px_rgba(22,93,255,0.25)]'
                  : 'bg-[#fbfaf7] text-[#777] hover:bg-[#EAF2FF] hover:text-[#165DFF]'
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </section>

      {selectedDifficulty === 'all' ? (
        difficultyOrder.map((level) => {
          const list = groupedExperiments[level]
          if (list.length === 0) return null

          return (
            <section key={level} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#242424]">{difficultyConfig[level].label}</h2>
                  <p className="text-xs text-[#9a958c]">{difficultyConfig[level].ageRange} · {list.length} 个实验</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {list.map((experiment) => (
                  <CourseCard key={experiment.path} experiment={experiment} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredExperiments.map((experiment) => (
            <CourseCard key={experiment.path} experiment={experiment} />
          ))}
        </section>
      )}

      {filteredExperiments.length === 0 && (
        <div className="rounded-[8px] bg-white py-16 text-center shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
          <h3 className="text-base font-semibold text-[#242424]">没有找到匹配的实验</h3>
          <p className="mt-2 text-sm text-[#9a958c]">试试调整分类或搜索关键词。</p>
        </div>
      )}
    </div>
  )
}
