import { useState } from 'react'
import BugReportModal from './BugReportModal'

interface BugReportButtonProps {
  experimentName?: string
  experimentPath?: string
}

export default function BugReportButton({ experimentName, experimentPath }: BugReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[#165DFF] px-3 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-[#0E42D2]"
        title="报告问题"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="hidden sm:inline">报告Bug</span>
      </button>

      {isModalOpen && (
        <BugReportModal
          onClose={() => setIsModalOpen(false)}
          experimentName={experimentName}
          experimentPath={experimentPath}
        />
      )}
    </>
  )
}
