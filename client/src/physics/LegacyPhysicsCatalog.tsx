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

function getDescription(experiment: PhysicsExperiment) {
  return experiment.subtitle || experiment.objectives[0] || experiment.sections[0]?.lines[0]?.text || ''
}

type PhysicsCoverKind =
  | 'projectile'
  | 'pendulum'
  | 'spring'
  | 'collision'
  | 'orbit'
  | 'field'
  | 'wave'
  | 'optics'
  | 'heat'
  | 'fluid'
  | 'quantum'
  | 'relativity'

function getPhysicsCoverKind(experiment: PhysicsExperiment): PhysicsCoverKind {
  const slug = experiment.slug.toLowerCase()
  const text = `${experiment.slug} ${experiment.title} ${experiment.subtitle}`.toLowerCase()

  if (/projectile|inclined|pulley/.test(slug)) return 'projectile'
  if (/pendulum|gyroscope|coriolis/.test(slug)) return 'pendulum'
  if (/spring|oscillation|resonance|forced/.test(slug)) return 'spring'
  if (/collision|momentum/.test(slug)) return 'collision'
  if (/circular|orbit|planet|kepler|gravity|satellite|black-hole|celestial/.test(slug)) return 'orbit'
  if (/electric|magnetic|coulomb|lorentz|capacitor|transformer|induction|ampere|circuit|electron/.test(slug)) return 'field'
  if (/interference|standing-wave|doppler|lissajous|beat|air-column|mach|velocity|huygens|wave/.test(slug)) return 'wave'
  if (/lens|mirror|optics|light|diffraction|photoelectric|laser|polarization|refraction/.test(slug)) return 'optics'
  if (/heat|thermal|entropy|gas|carnot|boltzmann|temperature/.test(slug)) return 'heat'
  if (/fluid|bernoulli|viscosity|buoyancy|sound/.test(slug)) return 'fluid'
  if (/quantum|schrodinger|spin|tunnel|entanglement|uncertainty|bohr|nuclear|atomic|photon/.test(slug)) return 'quantum'
  if (/relativity|spacetime|time|lorentz|mass-energy/.test(text)) return 'relativity'
  return 'wave'
}

function physicsWavePath(amplitude = 34, frequency = 2, phase = 0) {
  return Array.from({ length: 80 }, (_, index) => {
    const x = 44 + index * 5.4
    const y = 116 - Math.sin((index / 79) * Math.PI * frequency + phase) * amplitude
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function PhysicsCoverArtwork({ coverId, kind, accent }: { coverId: string; kind: PhysicsCoverKind; accent: string }) {
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

      {kind === 'projectile' && <><path d="M 74 172 C 164 62 288 46 446 174" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><path d="M 108 172 H 446" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="7 7" /><circle cx="314" cy="76" r="8" fill="#ef4444" /><path d="M 314 76 L 360 76" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" /></>}
      {kind === 'pendulum' && <><path d="M 164 56 H 356" stroke="#64748b" strokeWidth="5" strokeLinecap="round" /><path d="M 260 58 L 326 166" stroke={accent} strokeWidth="4" /><circle cx="326" cy="166" r="20" fill={accent} opacity="0.82" /><path d="M 202 176 A 92 92 0 0 0 318 176" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="7 7" /></>}
      {kind === 'spring' && <><path d="M 92 96 H 160 L 174 72 L 202 120 L 230 72 L 258 120 L 286 72 L 314 120 L 342 72 L 370 96 H 428" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><rect x="392" y="78" width="46" height="42" rx="8" fill="#ef4444" opacity="0.82" /><path d={physicsWavePath(34, 3.2)} fill="none" stroke="#f97316" strokeWidth="3" opacity="0.82" /></>}
      {kind === 'collision' && <><path d="M 112 120 H 210" stroke={accent} strokeWidth="4" strokeLinecap="round" /><path d="M 410 120 H 312" stroke="#f97316" strokeWidth="4" strokeLinecap="round" /><circle cx="222" cy="120" r="24" fill={accent} opacity="0.82" /><circle cx="298" cy="120" r="24" fill="#f97316" opacity="0.82" /><path d="M 178 98 L 210 120 L 178 142" fill="none" stroke={accent} strokeWidth="3" /><path d="M 344 98 L 312 120 L 344 142" fill="none" stroke="#f97316" strokeWidth="3" /></>}
      {kind === 'orbit' && <><ellipse cx="260" cy="120" rx="160" ry="64" fill="none" stroke={accent} strokeWidth="4" /><ellipse cx="260" cy="120" rx="92" ry="38" fill="none" stroke="#f97316" strokeWidth="3" opacity="0.82" /><circle cx="260" cy="120" r="16" fill="#f59e0b" /><circle cx="388" cy="83" r="9" fill="#ef4444" /><circle cx="174" cy="151" r="7" fill="#2563eb" /></>}
      {kind === 'field' && <>{Array.from({ length: 6 }, (_, row) => Array.from({ length: 8 }, (_, col) => { const x = 106 + col * 44; const y = 58 + row * 28; const dx = Math.cos((row + col) * 0.55) * 13; const dy = Math.sin((row - col) * 0.45) * 13; return <path key={`${row}-${col}`} d={`M ${x - dx} ${y - dy} L ${x + dx} ${y + dy}`} stroke={accent} strokeWidth="2.6" strokeLinecap="round" /> }))}<circle cx="194" cy="120" r="16" fill="#ef4444" /><circle cx="326" cy="120" r="16" fill="#2563eb" /></>}
      {kind === 'wave' && <><path d={physicsWavePath(46, 4)} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><path d={physicsWavePath(26, 7, 1.2)} fill="none" stroke="#f97316" strokeWidth="3" opacity="0.78" /></>}
      {kind === 'optics' && <><ellipse cx="260" cy="120" rx="22" ry="88" fill="#dbeafe" stroke={accent} strokeWidth="4" /><path d="M 76 78 L 260 120 L 444 78" fill="none" stroke="#ef4444" strokeWidth="3" /><path d="M 76 120 H 444" fill="none" stroke={accent} strokeWidth="3" /><path d="M 76 162 L 260 120 L 444 162" fill="none" stroke="#f97316" strokeWidth="3" /></>}
      {kind === 'heat' && <>{Array.from({ length: 11 }, (_, col) => Array.from({ length: 5 }, (_, row) => <rect key={`${col}-${row}`} x={88 + col * 32} y={58 + row * 28} width="30" height="26" rx="5" fill={col < 4 ? '#ef4444' : col < 8 ? accent : '#60a5fa'} opacity={0.32 + (10 - Math.abs(col - 3)) * 0.045} />))}</>}
      {kind === 'fluid' && <><path d="M 76 82 C 154 52 224 108 298 78 C 360 54 410 76 452 60" fill="none" stroke={accent} strokeWidth="4" /><path d="M 76 122 C 154 92 224 148 298 118 C 360 94 410 116 452 100" fill="none" stroke="#06b6d4" strokeWidth="4" /><path d="M 76 162 C 154 132 224 188 298 158 C 360 134 410 156 452 140" fill="none" stroke="#f97316" strokeWidth="4" /></>}
      {kind === 'quantum' && <><path d={physicsWavePath(42, 5)} fill="none" stroke={accent} strokeWidth="4" /><path d="M 76 184 C 144 184 152 66 220 66 C 288 66 300 184 376 184 C 414 184 438 156 454 130" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.82" /><circle cx="260" cy="120" r="9" fill="#ef4444" /></>}
      {kind === 'relativity' && <><path d="M 96 62 C 176 102 212 142 260 142 C 312 142 350 100 424 62" fill="none" stroke={accent} strokeWidth="4" /><path d="M 96 178 C 176 138 212 98 260 98 C 312 98 350 140 424 178" fill="none" stroke="#f97316" strokeWidth="4" /><circle cx="260" cy="120" r="28" fill="#111827" opacity="0.85" /></>}
    </svg>
  )
}

function PhysicsCover({ experiment }: { experiment: PhysicsExperiment }) {
  const meta = difficultyMeta[experiment.difficulty]
  const kind = getPhysicsCoverKind(experiment)

  return <div className="h-[196px] overflow-hidden bg-white px-4 pt-4"><div className="h-full overflow-hidden rounded-[8px] bg-white"><PhysicsCoverArtwork coverId={`physics-cover-${experiment.slug}`} kind={kind} accent={meta.accent} /></div></div>
}

function ExperimentCard({ experiment }: { experiment: PhysicsExperiment }) {
  const meta = difficultyMeta[experiment.difficulty]

  return (
    <Link to={`/physics/${experiment.slug}`} className="group overflow-hidden rounded-[8px] bg-white shadow-[0_14px_32px_rgba(43,43,43,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(43,43,43,0.08)]">
      <PhysicsCover experiment={experiment} />
      <div className="space-y-3 px-4 pb-4 pt-3">
        <div><h3 className="text-base font-bold leading-6 text-[#242424] transition-colors group-hover:text-[#165DFF]">{experiment.title}</h3><p className="mt-3 min-h-[44px] overflow-hidden text-sm leading-[22px] text-[#8a867f] line-clamp-2">{getDescription(experiment)}</p></div>
        <div className="flex flex-wrap gap-2"><span className="rounded-[8px] bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#165DFF]">{experiment.category}</span><span className="rounded-[8px] px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: meta.soft, color: meta.accent }}>{physicsDifficultyLabels[experiment.difficulty]}</span></div>
      </div>
    </Link>
  )
}

export default function LegacyPhysicsCatalog() {
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
      const matchesQuery = !keyword || experiment.title.toLowerCase().includes(keyword) || experiment.subtitle.toLowerCase().includes(keyword) || experiment.objectives.some((objective) => objective.toLowerCase().includes(keyword))
      return matchesCategory && matchesDifficulty && matchesQuery
    })
  }, [category, difficulty, query])
  const directoryTitle = category === allCategory ? '实验目录' : category

  return (
    <div className="space-y-6">
      <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <div className="flex flex-wrap gap-6 border-b border-[#ece8df] pb-4">
          <button type="button" onClick={() => setDifficulty(allDifficulty)} className={`pb-2 text-sm font-semibold ${difficulty === allDifficulty ? 'border-b-2 border-[#165DFF] text-[#165DFF]' : 'text-[#3f3f3f]'}`}>全部</button>
          {difficultyOrder.map((item) => <button key={item} type="button" onClick={() => setDifficulty(item)} className={`pb-2 text-sm font-semibold ${difficulty === item ? 'border-b-2 border-[#165DFF] text-[#165DFF]' : 'text-[#3f3f3f]'}`}>{physicsDifficultyLabels[item]} · {difficultyCounts[item] ?? 0}</button>)}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索实验、概念或现象" className="mt-5 h-11 w-full rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] px-4 text-sm outline-none transition-colors focus:border-[#165DFF] focus:ring-2 focus:ring-[#165DFF]/15" />
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          <button type="button" onClick={() => setCategory(allCategory)} className={`shrink-0 rounded-[8px] px-3 py-2 text-sm font-semibold ${category === allCategory ? 'bg-[#165DFF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f7f7f5] text-[#6f6a62]'}`}>全部</button>
          {physicsCategories.map((item) => <button key={item.name} type="button" onClick={() => setCategory(item.name)} className={`shrink-0 rounded-[8px] px-3 py-2 text-sm font-semibold ${category === item.name ? 'bg-[#165DFF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f7f7f5] text-[#6f6a62]'}`}>{item.name} · {categoryCounts[item.name] ?? 0}</button>)}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-2xl font-bold text-[#242424]">{directoryTitle}</h2><p className="mt-1 text-sm text-[#9a958c]">已筛选 {filteredExperiments.length} 个实验</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filteredExperiments.map((experiment) => <ExperimentCard key={experiment.slug} experiment={experiment} />)}</div>
      </section>
      {filteredExperiments.length === 0 && <div className="rounded-[8px] bg-white py-16 text-center shadow-[0_14px_32px_rgba(43,43,43,0.04)]"><h3 className="text-base font-semibold text-[#242424]">没有找到匹配的实验</h3><p className="mt-2 text-sm text-[#9a958c]">调整分类或关键词后再试一次。</p></div>}
    </div>
  )
}
