import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { physicsDifficultyLabels, physicsExperimentBySlug } from './data'

const minimumFrameHeight = 760

function getPrimaryFormula(slug: string) {
  const experiment = physicsExperimentBySlug.get(slug)
  if (!experiment) return null

  for (const section of experiment.sections) {
    const formulaLine = section.lines.find((line) => line.formula)
    if (formulaLine?.formula) return { section: section.title, formula: formulaLine.formula }
  }

  return null
}

export default function PhysicsExperimentFrame() {
  const { slug = '' } = useParams()
  const experiment = physicsExperimentBySlug.get(slug)
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const frameObserverRef = useRef<ResizeObserver | null>(null)
  const frameWindowRef = useRef<Window | null>(null)
  const [frameHeight, setFrameHeight] = useState(minimumFrameHeight)

  const resizeFrame = useCallback(() => {
    const iframe = frameRef.current
    const doc = iframe?.contentDocument
    if (!doc?.body) return

    const measurableElements = [doc.documentElement, doc.body, doc.getElementById('root')].filter(Boolean) as HTMLElement[]
    const nextHeight = Math.ceil(
      Math.max(
        minimumFrameHeight,
        ...measurableElements.flatMap((element) => [
          element.scrollHeight,
          element.offsetHeight,
          element.getBoundingClientRect().height,
        ]),
      ),
    )

    setFrameHeight((currentHeight) => (Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight))
  }, [])

  const handleFrameLoad = useCallback(() => {
    frameObserverRef.current?.disconnect()
    frameWindowRef.current?.removeEventListener('resize', resizeFrame)

    const iframe = frameRef.current
    const doc = iframe?.contentDocument
    if (!iframe || !doc?.body) return

    doc.documentElement.style.overflow = 'hidden'
    doc.body.style.overflow = 'hidden'

    resizeFrame()
    iframe.contentWindow?.requestAnimationFrame(resizeFrame)
    iframe.contentWindow?.setTimeout(resizeFrame, 150)
    iframe.contentWindow?.setTimeout(resizeFrame, 500)

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resizeFrame)
      observer.observe(doc.documentElement)
      observer.observe(doc.body)
      frameObserverRef.current = observer
    }

    iframe.contentWindow?.addEventListener('resize', resizeFrame)
    frameWindowRef.current = iframe.contentWindow
  }, [resizeFrame])

  useEffect(() => {
    setFrameHeight(minimumFrameHeight)
  }, [slug])

  useEffect(
    () => () => {
      frameObserverRef.current?.disconnect()
      frameWindowRef.current?.removeEventListener('resize', resizeFrame)
    },
    [resizeFrame],
  )

  if (!experiment) {
    return (
      <div className="rounded-[8px] bg-white p-8 shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <h1 className="text-2xl font-bold text-[#242424]">没有找到这个物理实验</h1>
        <p className="mt-3 text-sm text-[#8a867f]">请返回物理之美目录重新选择实验。</p>
        <Link to="/physics" className="mt-5 inline-flex rounded-[8px] bg-[#165DFF] px-4 py-2 text-sm font-semibold text-white">
          返回物理之美
        </Link>
      </div>
    )
  }

  const primaryFormula = getPrimaryFormula(experiment.slug)
  const frameSrc = `/physics-original/index.html?route=${encodeURIComponent(`/${experiment.slug}`)}`

  return (
    <div className="space-y-5">
      <section className="rounded-[8px] bg-white p-5 shadow-[0_14px_32px_rgba(43,43,43,0.04)] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/physics" className="text-sm font-semibold text-[#165DFF]">
              返回物理之美
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-[#242424]">{experiment.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#8a867f]">{experiment.subtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#165DFF]">
                {experiment.category}
              </span>
              <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-[#7f7a72]">
                {physicsDifficultyLabels[experiment.difficulty]}
              </span>
              {experiment.targetAge && (
                <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-[#7f7a72]">
                  {experiment.targetAge}
                </span>
              )}
            </div>
          </div>

          <div className="grid min-w-0 gap-3 text-sm sm:grid-cols-2 lg:w-[420px]">
            <div className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
              <div className="text-xs font-semibold text-[#9a958c]">学习目标</div>
              <ul className="mt-2 space-y-1 text-[#3f3f3f]">
                {experiment.objectives.slice(0, 3).map((objective) => (
                  <li key={objective} className="line-clamp-2">
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[8px] border border-[#ece8df] bg-[#fdfdfc] p-4">
              <div className="text-xs font-semibold text-[#9a958c]">前置知识</div>
              <ul className="mt-2 space-y-1 text-[#3f3f3f]">
                {experiment.prerequisites.slice(0, 3).map((item) => (
                  <li key={item} className="line-clamp-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {primaryFormula && (
          <div className="mt-5">
            <div className="max-w-full rounded-[8px] bg-[#f7f7f5] px-4 py-3 sm:max-w-xl">
              <div className="text-xs font-semibold text-[#9a958c]">{primaryFormula.section}</div>
              <div className="mt-1 overflow-x-auto font-serif text-sm font-semibold text-[#165DFF]">
                {primaryFormula.formula}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[8px] bg-white shadow-[0_14px_32px_rgba(43,43,43,0.04)]">
        <iframe
          ref={frameRef}
          key={experiment.slug}
          title={`${experiment.title} - 物理之美`}
          src={frameSrc}
          scrolling="no"
          onLoad={handleFrameLoad}
          style={{ height: `${frameHeight}px` }}
          className="block w-full border-0 bg-white"
        />
      </section>
    </div>
  )
}
