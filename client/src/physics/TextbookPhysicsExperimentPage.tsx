import { ArrowLeft, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { textbookExperimentById } from './curriculum/catalog'
import ExperimentInfo from './runtime/ExperimentInfo'

export function getTextbookExperiment(id: string) {
  return textbookExperimentById.get(id)
}

export default function TextbookPhysicsExperimentPage() {
  const { id = '' } = useParams()
  const experiment = getTextbookExperiment(id)

  if (!experiment) {
    return (
      <section aria-labelledby="textbook-experiment-not-found" className="mx-auto max-w-3xl border-y border-[#ece8df] bg-white px-5 py-10 md:px-7">
        <h1 id="textbook-experiment-not-found" className="text-2xl font-bold text-[#242424]">未找到这个教材实验</h1>
        <p className="mt-3 text-sm leading-7 text-[#77716a]">该实验编号不存在或已不再提供，请返回物理教材目录重新选择。</p>
        <Link to="/physics" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#165DFF] hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          返回物理教材目录
        </Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-[#ece8df] bg-white px-5 py-6 md:px-7 md:py-8">
        <Link to="/physics" className="inline-flex items-center gap-2 text-sm font-semibold text-[#165DFF] hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          返回物理教材目录
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#77716a]">
          <span>{experiment.volume}</span>
          <span aria-hidden="true">/</span>
          <span>{experiment.chapter}</span>
          <span aria-hidden="true">/</span>
          <span>{experiment.sourceType}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-[#242424] md:text-3xl">{experiment.title}</h1>
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8a867f]">
          <Clock3 className="size-4" aria-hidden="true" />
          该实验正在制作中
        </p>
      </header>

      <div className="border-b border-[#ece8df] bg-white px-5 md:px-7">
        <ExperimentInfo experiment={experiment} />
      </div>
    </div>
  )
}
