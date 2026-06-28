import type { ExperimentSeed } from './data/experiments'
import type { ReactionExpectation } from './data/experiments/types'

export type ChemistryLessonAction =
  | { kind: 'reset' }
  | { kind: 'add'; reagent: string }
  | { kind: 'mix' }
  | { kind: 'observe' }
  | { kind: 'finish' }

export interface ChemistryLessonStep {
  id: string
  phase: string
  title: string
  narration: string
  action?: ChemistryLessonAction
}

function describePhenomena(expect?: ReactionExpectation) {
  if (!expect || !expect.reacted) {
    return '仔细观察体系，记录是否出现颜色、气泡、沉淀或温度变化。'
  }

  const parts: string[] = []
  if (expect.gas) parts.push('有气泡逸出')
  if (expect.precipitate) parts.push('生成沉淀')
  if (expect.colorChange) parts.push('颜色发生变化')
  if (expect.thermal === 'exothermic') parts.push('温度升高')
  if (expect.thermal === 'endothermic') parts.push('温度降低')

  return parts.length > 0 ? `观察到${parts.join('、')}。` : '反应发生，注意记录读数变化。'
}

function pickReagents(experiment: ExperimentSeed) {
  if (experiment.probe?.reagentKeys.length) return experiment.probe.reagentKeys
  return experiment.reagents.slice(0, Math.min(3, experiment.reagents.length))
}

export function buildChemistryLesson(experiment: ExperimentSeed): ChemistryLessonStep[] {
  const reagents = pickReagents(experiment)
  const steps: ChemistryLessonStep[] = [
    {
      id: 'intro',
      phase: '原理',
      title: '理解实验目标',
      narration: experiment.description,
      action: { kind: 'reset' },
    },
    ...reagents.map((reagent, index) => ({
      id: `add-${index}`,
      phase: '准备',
      title: `加入${reagent}`,
      narration: `取用${reagent}，加入可视化实验容器中。`,
      action: { kind: 'add' as const, reagent },
    })),
    {
      id: 'mix',
      phase: '操作',
      title: '混合反应',
      narration: '充分混合已加入的试剂，观察反应是否发生。',
      action: { kind: 'mix' },
    },
    {
      id: 'observe',
      phase: '现象',
      title: '记录实验现象',
      narration: describePhenomena(experiment.probe?.expect),
      action: { kind: 'observe' },
    },
    {
      id: 'summary',
      phase: '总结',
      title: '形成实验结论',
      narration:
        experiment.objectives.length > 0
          ? `本实验需要你${experiment.objectives.join('、')}。`
          : '整理现象与数据，写出实验结论。',
      action: { kind: 'finish' },
    },
  ]

  return steps
}
