import { useState } from 'react'
import { BookOpen, FlaskConical, LockKeyhole, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getTextbookChapters, getTextbookExperimentTarget, selectTextbookVolume } from './catalogState'
import { filterTextbookExperiments, textbookPhysicsExperiments } from './curriculum/catalog'
import type { CurriculumFilters, ExperimentRequirement, TextbookVolume } from './curriculum/types'

const volumeLabels: readonly TextbookVolume[] = ['八年级上册', '八年级下册', '九年级全一册']

const requirementLabels: Record<ExperimentRequirement, string> = {
  required: '必做',
  optional: '选做',
}

function TextbookExperimentCard({ item }: { item: (typeof textbookPhysicsExperiments)[number] }) {
  const target = getTextbookExperimentTarget(item)
  const isAvailable = target !== undefined
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[#165DFF]">
          <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">{item.chapter}</span>
        </div>
        <span className={`shrink-0 rounded-[6px] px-2 py-1 text-xs font-semibold ${item.requirement === 'required' ? 'bg-[#fff0ef] text-[#c2412d]' : 'bg-[#eef4ff] text-[#165DFF]'}`}>
          {requirementLabels[item.requirement]}
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold leading-6 text-[#242424]">{item.title}</h3>
      <p className="mt-3 min-h-[44px] text-sm leading-[22px] text-[#8a867f] line-clamp-2">{item.purpose[0]}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ece8df] pt-3 text-xs text-[#77716a]">
        <span className="truncate">{item.sourceType}</span>
        {isAvailable ? <span className="font-semibold text-[#165DFF]">进入实验</span> : <span className="inline-flex items-center gap-1 font-semibold text-[#8a867f]"><LockKeyhole className="size-3.5" aria-hidden="true" />制作中</span>}
      </div>
    </>
  )

  if (target) {
    return <Link to={target} className="block rounded-[8px] border border-[#ece8df] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#8FB3FF] hover:shadow-[0_14px_32px_rgba(43,43,43,0.06)]">{cardContent}</Link>
  }

  return <div aria-disabled="true" className="rounded-[8px] border border-[#ece8df] bg-[#f7f7f5] p-4 opacity-75" title="制作中，暂不可进入实验">{cardContent}</div>
}

export default function TextbookPhysicsCatalog() {
  const [filters, setFilters] = useState<CurriculumFilters>({
    volume: '九年级全一册',
    chapter: 'ALL',
    requirement: 'ALL',
    query: '',
  })

  const chapters = getTextbookChapters(filters.volume)
  const results = filterTextbookExperiments(filters)

  function updateFilters(next: Partial<CurriculumFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  function selectVolume(volume: TextbookVolume | 'ALL') {
    setFilters((current) => selectTextbookVolume(current, volume))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[8px] border border-[#ece8df] bg-white p-4 lg:sticky lg:top-6">
        <div className="flex items-center gap-2 text-sm font-bold text-[#242424]"><BookOpen className="size-4 text-[#165DFF]" aria-hidden="true" />课程目录</div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
          <button type="button" onClick={() => selectVolume('ALL')} className={`shrink-0 rounded-[6px] px-3 py-2 text-left text-sm font-semibold lg:block lg:w-full ${filters.volume === 'ALL' ? 'bg-[#eef4ff] text-[#165DFF]' : 'text-[#615c55] hover:bg-[#f7f7f5]'}`}>全部教材</button>
          {volumeLabels.map((volume) => <button key={volume} type="button" onClick={() => selectVolume(volume)} className={`shrink-0 rounded-[6px] px-3 py-2 text-left text-sm font-semibold lg:block lg:w-full ${filters.volume === volume ? 'bg-[#eef4ff] text-[#165DFF]' : 'text-[#615c55] hover:bg-[#f7f7f5]'}`}>{volume}</button>)}
        </div>
        <div className="mt-5 hidden border-t border-[#ece8df] pt-4 lg:block">
          <p className="text-xs font-semibold text-[#9a958c]">章节</p>
          <div className="mt-2 space-y-1">
            <button type="button" onClick={() => updateFilters({ chapter: 'ALL' })} className={`block w-full rounded-[6px] px-3 py-2 text-left text-sm ${filters.chapter === 'ALL' ? 'bg-[#f7f7f5] font-semibold text-[#242424]' : 'text-[#77716a] hover:bg-[#f7f7f5]'}`}>全部章节</button>
            {chapters.map((chapter) => <button key={chapter} type="button" onClick={() => updateFilters({ chapter })} className={`block w-full rounded-[6px] px-3 py-2 text-left text-sm ${filters.chapter === chapter ? 'bg-[#f7f7f5] font-semibold text-[#242424]' : 'text-[#77716a] hover:bg-[#f7f7f5]'}`}>{chapter}</button>)}
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="rounded-[8px] border border-[#ece8df] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px]">
            <label className="relative block"><span className="sr-only">搜索教材实验</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a867f]" aria-hidden="true" /><input value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })} placeholder="搜索实验、章节或原理" className="h-10 w-full rounded-[6px] border border-[#dedad2] bg-[#fdfdfc] pl-10 pr-3 text-sm outline-none focus:border-[#165DFF] focus:ring-2 focus:ring-[#165DFF]/15" /></label>
            <label><span className="sr-only">选择章节</span><select value={filters.chapter} onChange={(event) => updateFilters({ chapter: event.target.value })} className="h-10 w-full rounded-[6px] border border-[#dedad2] bg-[#fdfdfc] px-3 text-sm outline-none focus:border-[#165DFF] focus:ring-2 focus:ring-[#165DFF]/15"><option value="ALL">全部章节</option>{chapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}</select></label>
            <label><span className="sr-only">选择要求</span><select value={filters.requirement} onChange={(event) => updateFilters({ requirement: event.target.value as CurriculumFilters['requirement'] })} className="h-10 w-full rounded-[6px] border border-[#dedad2] bg-[#fdfdfc] px-3 text-sm outline-none focus:border-[#165DFF] focus:ring-2 focus:ring-[#165DFF]/15"><option value="ALL">全部要求</option><option value="required">必做</option><option value="optional">选做</option></select></label>
          </div>
        </div>
        <div className="mb-4 mt-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold text-[#242424]">教材实验</h2><p className="mt-1 text-sm text-[#9a958c]">共 {results.length} 个实验</p></div></div>
        {results.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{results.map((item) => <TextbookExperimentCard key={item.id} item={item} />)}</div> : <div className="rounded-[8px] border border-[#ece8df] bg-white py-16 text-center"><h3 className="font-semibold text-[#242424]">没有找到匹配的教材实验</h3><p className="mt-2 text-sm text-[#9a958c]">调整筛选条件后再试一次。</p></div>}
      </section>
    </div>
  )
}
