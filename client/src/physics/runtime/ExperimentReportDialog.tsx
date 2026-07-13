import { FileText, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PhysicsSession } from '../sessions/types'

export interface ExperimentReportDialogProps {
  open: boolean
  onClose(): void
  session: PhysicsSession | undefined
}

export default function ExperimentReportDialog({ open, onClose, session }: ExperimentReportDialogProps) {
  if (!open || !session) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-4 sm:items-center sm:justify-center" role="presentation">
      <section aria-modal="true" aria-labelledby="physics-report-dialog-title" role="dialog" className="w-full max-w-md rounded-[8px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <FileText className="size-5 text-[#165DFF]" aria-hidden="true" />
            <h2 id="physics-report-dialog-title" className="mt-3 text-lg font-bold text-[#242424]">实验报告</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6a62]">{session.status === 'COMPLETED' ? '实验已完成，报告已整理好。' : '报告会随实验记录持续更新。'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭实验报告" title="关闭" className="grid size-9 place-items-center rounded-[6px] text-[#6f6a62] hover:bg-[#f3f5f9]">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <Link to={`/physics/sessions/${session.id}/report`} className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-[#165DFF] px-4 py-2.5 text-sm font-semibold text-white">
          查看报告
        </Link>
      </section>
    </div>
  )
}
