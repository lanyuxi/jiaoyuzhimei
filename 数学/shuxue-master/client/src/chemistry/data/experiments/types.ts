// 实验目录数据类型
// 从化学之美项目迁移为前端纯数据，供教育之美客户端直接渲染。

export const ExperimentCategory = {
  ACID_BASE: 'ACID_BASE',
  ORGANIC: 'ORGANIC',
  THERMODYNAMICS: 'THERMODYNAMICS',
  REDOX: 'REDOX',
  PRECIPITATION: 'PRECIPITATION',
  GAS: 'GAS',
  ELECTROCHEM: 'ELECTROCHEM',
  METAL: 'METAL',
  ANALYSIS: 'ANALYSIS',
  COORDINATION: 'COORDINATION',
} as const

export type ExperimentCategory =
  (typeof ExperimentCategory)[keyof typeof ExperimentCategory]

export const ExperimentDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const

export type ExperimentDifficulty =
  (typeof ExperimentDifficulty)[keyof typeof ExperimentDifficulty]

export interface ReactionExpectation {
  reacted: boolean
  gas?: boolean
  precipitate?: boolean
  colorChange?: boolean
  thermal?: 'exothermic' | 'endothermic' | 'none'
}

export interface ReactionProbe {
  reagentKeys: string[]
  expect: ReactionExpectation
}

export interface ExperimentSeed {
  slug: string
  title: string
  description: string
  category: ExperimentCategory
  difficulty: ExperimentDifficulty
  reagents: string[]
  apparatus: string[]
  objectives: string[]
  estimatedMinutes: number
  probe?: ReactionProbe
}
