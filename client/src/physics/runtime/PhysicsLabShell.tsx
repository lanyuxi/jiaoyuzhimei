import { useEffect, useRef, useState, type ComponentType } from 'react'
import { FileText, Redo2, RotateCcw, TableProperties, Undo2 } from 'lucide-react'
import type { TextbookPhysicsExperiment } from '../curriculum/types'
import { browserPhysicsSessionRepository, type PhysicsSessionRepository } from '../sessions/repository'
import type { PhysicsExperimentalCondition, PhysicsSession } from '../sessions/types'
import { useLabRuntime } from './useLabRuntime'
import type { LabAction, LabController } from './types'
import ExperimentReportDialog from './ExperimentReportDialog'
import MeasurementTable from './MeasurementTable'
import {
  completeLabSession,
  createLabSessionCoordinator,
  recordDerivedMeasurements,
  recordLabFeedback,
  recoveryPrompt,
} from './sessionLifecycle'

export interface PhysicsLabSceneProps<TState> {
  state: TState
  dispatch(action: LabAction, detail?: string): void
}

export interface PhysicsLabShellProps<TState> {
  experiment: TextbookPhysicsExperiment
  controller: LabController<TState>
  Scene: ComponentType<PhysicsLabSceneProps<TState>>
  conditions(state: TState): readonly PhysicsExperimentalCondition[]
  repository?: PhysicsSessionRepository
}

export const LAB_DESKTOP_LAYOUT = {
  breakpoint: '2xl',
  apparatusWidth: 240,
  sceneMinWidth: 853,
  stepsWidth: 300,
  gap: 16,
} as const

function TooltipButton({
  label,
  onClick,
  children,
  disabled = false,
}: {
  label: string
  onClick(): void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="group relative grid size-10 place-items-center rounded-[6px] border border-[#dedad2] bg-white text-[#4b4742] hover:border-[#165DFF] hover:text-[#165DFF] disabled:cursor-not-allowed disabled:opacity-40">
      {children}
      <span className="pointer-events-none absolute top-full z-10 mt-2 hidden whitespace-nowrap rounded-[4px] bg-[#242424] px-2 py-1 text-xs font-medium text-white group-hover:block group-focus-visible:block">{label}</span>
    </button>
  )
}

export default function PhysicsLabShell<TState>({
  experiment,
  controller,
  Scene,
  conditions,
  repository = browserPhysicsSessionRepository,
}: PhysicsLabShellProps<TState>) {
  const runtime = useLabRuntime(controller)
  const coordinatorRef = useRef<ReturnType<typeof createLabSessionCoordinator> | null>(null)
  const coordinatorExperimentRef = useRef<string | null>(null)
  const [session, setSession] = useState<PhysicsSession>()
  const [reportOpen, setReportOpen] = useState(false)
  const [recordedMeasurements, setRecordedMeasurements] = useState<PhysicsSession['measurements']>([])

  if (coordinatorRef.current === null || coordinatorExperimentRef.current !== experiment.id) {
    coordinatorRef.current = createLabSessionCoordinator(repository, experiment.id, experiment.title)
    coordinatorExperimentRef.current = experiment.id
  }

  const coordinator = coordinatorRef.current
  const prompt = recoveryPrompt(repository.recovery)
  const isCompleted = session?.status === 'COMPLETED'

  useEffect(() => {
    const nextSession = coordinator.ensureSession()
    setSession(nextSession)
    setRecordedMeasurements(nextSession.measurements)
  }, [coordinator])

  function dispatchSemantic(action: LabAction, detail = action.type) {
    if (isCompleted) return
    const transition = runtime.dispatch(action)
    if (session && transition.feedback) recordLabFeedback(repository, session.id, detail, transition.feedback)
  }

  function recordCurrentMeasurements() {
    if (!session || isCompleted) return
    const records = recordDerivedMeasurements(repository, session.id, runtime.measurements, conditions(runtime.state))
    recordLabFeedback(repository, session.id, 'record-measurement', { outcome: 'accepted', message: '已记录当前读数' })
    setRecordedMeasurements((current) => [...current, ...records])
  }

  function completeExperiment() {
    if (!session || isCompleted) return
    if (!runtime.completion.complete) {
      recordLabFeedback(repository, session.id, 'complete-lab', { outcome: 'rejected', message: runtime.completion.message })
      return
    }
    const completed = completeLabSession(repository, session.id, { outcome: 'accepted', message: runtime.completion.message })
    if (!completed) return
    setSession(completed)
    setReportOpen(true)
  }

  function createNewSession() {
    const nextSession = coordinator.createNewSession()
    setSession(nextSession)
    setRecordedMeasurements([])
    setReportOpen(false)
  }

  const apparatus = (
    <section aria-labelledby="lab-apparatus-heading" className="border-b border-[#ece8df] pb-4 2xl:border-b-0 2xl:border-r 2xl:pr-4">
      <h2 id="lab-apparatus-heading" className="text-sm font-bold text-[#242424]">实验器材</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4b4742]">
        {experiment.apparatus.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )

  const steps = (
    <section aria-labelledby="lab-steps-heading" className="border-t border-[#ece8df] pt-4 2xl:border-t-0 2xl:border-l 2xl:pl-4">
      <h2 id="lab-steps-heading" className="text-sm font-bold text-[#242424]">实验步骤</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#4b4742] marker:text-[#165DFF]">
        {experiment.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </section>
  )

  return (
    <div className="space-y-4">
      {prompt && (
        <section role="status" className="flex flex-wrap items-center justify-between gap-3 border border-[#f0c66a] bg-[#fff8e6] px-4 py-3 text-sm text-[#725620]">
          <span>{prompt.title}</span>
          <button type="button" onClick={createNewSession} className="rounded-[6px] border border-[#d6a53e] bg-white px-3 py-1.5 text-sm font-semibold text-[#6f531b]">{prompt.actionLabel}</button>
        </section>
      )}

      <div className="grid gap-4 2xl:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="hidden 2xl:block">{apparatus}</aside>
        <details className="border-b border-[#ece8df] pb-3 2xl:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-[#242424]">实验器材</summary>
          <div className="mt-3">{apparatus}</div>
        </details>

        <section className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece8df] pb-3">
            <div>
              <p className="text-xs font-semibold text-[#77716a]">当前读数</p>
              <p className="mt-1 text-sm text-[#4b4742]">{runtime.feedback?.message ?? '调整器材后记录读数。'}</p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipButton label="撤销" onClick={runtime.undo} disabled={isCompleted}><Undo2 className="size-4" aria-hidden="true" /></TooltipButton>
              <TooltipButton label="重做" onClick={runtime.redo} disabled={isCompleted}><Redo2 className="size-4" aria-hidden="true" /></TooltipButton>
              <TooltipButton label="重置" onClick={runtime.reset} disabled={isCompleted}><RotateCcw className="size-4" aria-hidden="true" /></TooltipButton>
              <TooltipButton label="数据表格" onClick={recordCurrentMeasurements} disabled={isCompleted}><TableProperties className="size-4" aria-hidden="true" /></TooltipButton>
              <TooltipButton label="实验报告" onClick={() => setReportOpen(true)}><FileText className="size-4" aria-hidden="true" /></TooltipButton>
            </div>
          </div>
          <div className="mt-4 flex min-h-[300px] items-stretch overflow-hidden border border-[#dedad2] bg-[#fdfdfc] md:aspect-[16/9] 2xl:min-h-[480px]">
            <div className="min-w-0 flex-1">
              <Scene state={runtime.state} dispatch={dispatchSemantic} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ece8df] pt-4">
            <button type="button" onClick={recordCurrentMeasurements} disabled={isCompleted} className="rounded-[6px] border border-[#165DFF] px-4 py-2 text-sm font-semibold text-[#165DFF] disabled:cursor-not-allowed disabled:opacity-40">记录当前读数</button>
            <button type="button" onClick={completeExperiment} disabled={isCompleted} className="rounded-[6px] bg-[#165DFF] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">完成实验</button>
          </div>
        </section>

        <aside className="hidden 2xl:block">{steps}</aside>
        <details className="border-t border-[#ece8df] pt-3 2xl:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-[#242424]">实验步骤</summary>
          <div className="mt-3">{steps}</div>
        </details>
      </div>

      <section aria-labelledby="lab-measurements-heading" className="border-t border-[#ece8df] pt-5">
        <h2 id="lab-measurements-heading" className="text-lg font-bold text-[#242424]">数据表格</h2>
        <div className="mt-4"><MeasurementTable measurements={recordedMeasurements} /></div>
      </section>

      <ExperimentReportDialog open={reportOpen} onClose={() => setReportOpen(false)} session={session} />
    </div>
  )
}
