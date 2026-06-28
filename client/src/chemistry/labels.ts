import {
  ExperimentCategory,
  ExperimentDifficulty,
} from './data/experiments'
import type { ExperimentCategory as Category, ExperimentDifficulty as Difficulty } from './data/experiments/types'

export const CATEGORY_LABELS: Record<Category, string> = {
  [ExperimentCategory.ACID_BASE]: '酸碱反应',
  [ExperimentCategory.ORGANIC]: '有机化学',
  [ExperimentCategory.THERMODYNAMICS]: '热力学',
  [ExperimentCategory.REDOX]: '氧化还原',
  [ExperimentCategory.PRECIPITATION]: '沉淀复分解',
  [ExperimentCategory.GAS]: '气体制备',
  [ExperimentCategory.ELECTROCHEM]: '电化学',
  [ExperimentCategory.METAL]: '金属活动性',
  [ExperimentCategory.ANALYSIS]: '分析检验',
  [ExperimentCategory.COORDINATION]: '配位显色',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [ExperimentDifficulty.EASY]: '入门',
  [ExperimentDifficulty.MEDIUM]: '进阶',
  [ExperimentDifficulty.HARD]: '挑战',
}

export const CATEGORY_OPTIONS = Object.values(ExperimentCategory)
export const DIFFICULTY_OPTIONS = Object.values(ExperimentDifficulty)

export const CATEGORY_FORMULAS: Record<Category, string> = {
  [ExperimentCategory.ACID_BASE]: 'H+ + OH- → H2O',
  [ExperimentCategory.ORGANIC]: 'CH3COOH ⇌ CH3COO-',
  [ExperimentCategory.THERMODYNAMICS]: 'ΔH = qp',
  [ExperimentCategory.REDOX]: 'Zn + Cu2+ → Zn2+ + Cu',
  [ExperimentCategory.PRECIPITATION]: 'Ag+ + Cl- → AgCl↓',
  [ExperimentCategory.GAS]: 'CO3^2- + 2H+ → CO2↑',
  [ExperimentCategory.ELECTROCHEM]: 'Ecell = Ecathode - Eanode',
  [ExperimentCategory.METAL]: 'M → Mn+ + ne-',
  [ExperimentCategory.ANALYSIS]: 'Fe3+ + SCN- ⇌ FeSCN2+',
  [ExperimentCategory.COORDINATION]: '[Cu(NH3)4]2+',
}
