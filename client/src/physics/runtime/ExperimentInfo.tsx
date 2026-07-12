import type { TextbookPhysicsExperiment } from '../curriculum/types'

type ExperimentInfoKey = 'purpose' | 'principle' | 'apparatus' | 'steps' | 'conclusion' | 'supplement'

export interface ExperimentInfoProps {
  experiment: TextbookPhysicsExperiment
}

export const experimentInfoSections: readonly { title: string; key: ExperimentInfoKey }[] = [
  { title: '实验目的', key: 'purpose' },
  { title: '实验原理', key: 'principle' },
  { title: '实验器材', key: 'apparatus' },
  { title: '实验步骤', key: 'steps' },
  { title: '实验结论', key: 'conclusion' },
  { title: '实验补充', key: 'supplement' },
]

export default function ExperimentInfo({ experiment }: ExperimentInfoProps) {
  return (
    <div>
      {experimentInfoSections.map((section) => {
        const content = experiment[section.key]
        const headingId = `experiment-${experiment.id}-${section.key}`

        return (
          <section key={section.key} aria-labelledby={headingId} className="border-b border-[#ece8df] py-5 last:border-b-0">
            <h2 id={headingId} className="text-lg font-bold text-[#242424]">{section.title}</h2>
            {section.key === 'steps' ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-[#4b4742] marker:font-semibold marker:text-[#165DFF]">
                {content.map((item) => <li key={item} className="select-text">{item}</li>)}
              </ol>
            ) : section.key === 'apparatus' ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm text-[#4b4742]">
                {content.map((item) => <li key={item} className="rounded-[6px] border border-[#dedad2] bg-[#fdfdfc] px-3 py-1.5 select-text">{item}</li>)}
              </ul>
            ) : (
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[#4b4742]">
                {content.map((item) => <li key={item} className="select-text">{item}</li>)}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
