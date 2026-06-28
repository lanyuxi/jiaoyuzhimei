import type { ExperimentSeed } from './data/experiments'

export type ChemistrySessionStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface ChemistrySessionStep {
  id: string
  title: string
  detail: string
  at: string
}

export interface ChemistryMeasurement {
  id: string
  label: string
  ph: number
  temperature: number
  observation: string
  at: string
}

export interface ChemistryReport {
  conclusion: string
  errorAnalysis: string
  improvements: string[]
  knowledgeAssessment: string
  generatedAt: string
}

export interface ChemistrySession {
  id: string
  experimentSlug: string
  experimentTitle: string
  status: ChemistrySessionStatus
  createdAt: string
  updatedAt: string
  steps: ChemistrySessionStep[]
  measurements: ChemistryMeasurement[]
  report: ChemistryReport | null
}

const storageKey = 'education-beauty-chemistry-sessions'

function now() {
  return new Date().toISOString()
}

function canStore() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readSessions(): ChemistrySession[] {
  if (!canStore()) return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSessions(sessions: ChemistrySession[]) {
  if (!canStore()) return
  window.localStorage.setItem(storageKey, JSON.stringify(sessions))
}

function updateSession(id: string, updater: (session: ChemistrySession) => ChemistrySession) {
  const sessions = readSessions()
  const next = sessions.map((session) => (session.id === id ? updater(session) : session))
  writeSessions(next)
  return next.find((session) => session.id === id) ?? null
}

export function listChemistrySessions() {
  return readSessions().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getChemistrySession(id: string) {
  return readSessions().find((session) => session.id === id) ?? null
}

export function createChemistrySession(experiment: ExperimentSeed) {
  const timestamp = now()
  const session: ChemistrySession = {
    id: `chem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    experimentSlug: experiment.slug,
    experimentTitle: experiment.title,
    status: 'IN_PROGRESS',
    createdAt: timestamp,
    updatedAt: timestamp,
    steps: [],
    measurements: [],
    report: null,
  }
  writeSessions([session, ...readSessions()])
  return session
}

export function appendChemistryStep(sessionId: string, title: string, detail: string) {
  return updateSession(sessionId, (session) => ({
    ...session,
    updatedAt: now(),
    steps: [
      ...session.steps,
      {
        id: `step-${session.steps.length + 1}`,
        title,
        detail,
        at: now(),
      },
    ],
  }))
}

export function appendChemistryMeasurement(
  sessionId: string,
  measurement: Omit<ChemistryMeasurement, 'id' | 'at'>,
) {
  return updateSession(sessionId, (session) => ({
    ...session,
    updatedAt: now(),
    measurements: [
      ...session.measurements,
      {
        ...measurement,
        id: `measurement-${session.measurements.length + 1}`,
        at: now(),
      },
    ],
  }))
}

export function saveChemistryReport(sessionId: string, report: ChemistryReport) {
  return updateSession(sessionId, (session) => ({
    ...session,
    report,
    updatedAt: now(),
  }))
}

export function completeChemistrySession(sessionId: string) {
  return updateSession(sessionId, (session) => ({
    ...session,
    status: 'COMPLETED',
    updatedAt: now(),
  }))
}

export function generateChemistryReport(session: ChemistrySession, experiment: ExperimentSeed): ChemistryReport {
  const last = session.measurements.at(-1)
  const observation = last?.observation ?? '本次实验尚未记录明显现象。'
  const reading = last ? `末次读数 pH ${last.ph.toFixed(1)}，温度 ${last.temperature} 摄氏度。` : '暂无读数。'

  return {
    conclusion: `${experiment.title}的实验记录显示：${observation}${reading}`,
    errorAnalysis:
      session.measurements.length > 0
        ? '读数来自可视化模拟，适合用于理解趋势；真实实验中仍需考虑试剂浓度、温度控制和读数延迟。'
        : '缺少实验读数，结论可信度有限。建议先完成混合或观察步骤。',
    improvements: [
      '按步骤逐一加入试剂，避免一次性加入导致现象难以归因。',
      '在关键现象出现前后各记录一次 pH 和温度。',
      '对照实验目标复核试剂、仪器和安全注意事项。',
    ],
    knowledgeAssessment:
      experiment.objectives.length > 0
        ? `本次实验覆盖：${experiment.objectives.join('；')}。`
        : '本次实验覆盖了现象观察、数据记录和结论整理。',
    generatedAt: now(),
  }
}

