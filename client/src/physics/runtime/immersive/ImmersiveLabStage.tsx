/**
 * 沉浸式实验外壳（实验详情页专用）。
 *
 * 与普通教学页的区别（对应需求）：
 *   · 实验占据整个屏幕（fixed 全视口 + 100dvh），不再缩在页面中间一小块
 *   · 实验详情页去掉四周的实验器材清单、实验步骤清单、主标题、副标题
 *   · 列表点进来直接全屏、沉浸式操作
 *
 * 数据表格、读数记录、实验报告、撤销/重做、完成实验等
 * 「操作型」能力仍然保留，但收敛为悬浮在画布之上的一层浮层，
 * 不占用画布空间。
 */
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, FileSpreadsheet, FileText, Redo2, RotateCcw, Undo2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { LabFeedback } from '../types'

export interface ImmersiveLabAction {
  id: string
  label: string
  icon: ReactNode
  onClick(): void
  disabled?: boolean
  active?: boolean
}

export interface ImmersiveLabStageProps {
  /** 实验名称：仅在悬浮标题条上显示，不占布局空间 */
  title: string
  /** 返回列表的路由 */
  backTo: string
  /** 画布（无限画布 + 3D 场景） */
  children: ReactNode
  /** 当前读数 / 提示信息 */
  feedback?: LabFeedback | null
  /** 收起画布后要展示的浮层（数据表格、实验报告等） */
  panels?: readonly ImmersiveLabPanel[]
  /** 悬浮工具条上的操作 */
  actions?: readonly ImmersiveLabAction[]
  /** 底部主操作区 */
  footer?: ReactNode
  /** 画布下层（数据表格等） */
  overlay?: ReactNode
}

export interface ImmersiveLabPanel {
  id: string
  label: string
  content: ReactNode
}

/**
 * 通用悬浮操作按钮：撤销 / 重做 / 重置 / 数据表格 / 实验报告。
 * 这些能力原先挂在 PhysicsLabShell 的页面级工具栏上，
 * 在沉浸式模式里改为浮在画布上方，避免出现页面级布局。
 */
export function ImmersiveToolbarButton({
  label,
  onClick,
  disabled = false,
  active = false,
  children,
}: {
  label: string
  onClick(): void
  disabled?: boolean
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      data-canvas-pan-block
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`group relative grid size-9 place-items-center rounded-[7px] transition ${
        active ? 'bg-white/15 text-white' : 'text-[#9aa4b2] hover:bg-white/10 hover:text-white'
      } disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
    </button>
  )
}

export function UndoIcon() {
  return <Undo2 className="size-4" aria-hidden="true" />
}
export function RedoIcon() {
  return <Redo2 className="size-4" aria-hidden="true" />
}
export function ResetIcon() {
  return <RotateCcw className="size-4" aria-hidden="true" />
}
export function TableIcon() {
  return <FileSpreadsheet className="size-4" aria-hidden="true" />
}
export function ReportIcon() {
  return <FileText className="size-4" aria-hidden="true" />
}

export default function ImmersiveLabStage({
  title,
  backTo,
  children,
  feedback = null,
  panels = [],
  actions = [],
  footer = null,
  overlay = null,
}: ImmersiveLabStageProps) {
  const navigate = useNavigate()
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [hintVisible, setHintVisible] = useState(true)

  // 沉浸式：实验详情页占满整个视口，并锁定宿主页面滚动
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('immersive-lab')
    const timer = window.setTimeout(() => setHintVisible(false), 5200)
    return () => {
      document.body.style.overflow = previousOverflow
      document.documentElement.classList.remove('immersive-lab')
      window.clearTimeout(timer)
    }
  }, [])

  const activePanel = panels.find((panel) => panel.id === openPanel) ?? null

  return (
    <div
      data-immersive-lab
      className="fixed inset-0 z-[60] flex select-none flex-col overflow-hidden bg-[#181b20] text-[#e6ebf1]"
      style={{ height: '100dvh' }}
    >
      {/* 沉浸式画布：占据整个屏幕 */}
      <div className="relative min-h-0 flex-1">
        {children}

        {/* 悬浮标题条：返回 + 实验名，不占用画布空间 */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between gap-3 p-3">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              data-canvas-pan-block
              aria-label="返回实验列表"
              title="返回实验列表"
              onClick={() => navigate(backTo)}
              className="grid size-9 place-items-center rounded-[7px] border border-white/10 bg-[#22262c]/85 text-[#9aa4b2] backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="inline-flex h-9 items-center rounded-[7px] border border-white/10 bg-[#22262c]/85 px-3 text-[13px] font-semibold text-[#e6ebf1] backdrop-blur">
              {title}
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 rounded-[9px] border border-white/10 bg-[#22262c]/85 p-1 backdrop-blur">
            {actions.map((action) => (
              <ImmersiveToolbarButton
                key={action.id}
                label={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                active={action.active}
              >
                {action.icon}
              </ImmersiveToolbarButton>
            ))}
            {panels.map((panel) => (
              <ImmersiveToolbarButton
                key={panel.id}
                label={panel.label}
                active={openPanel === panel.id}
                onClick={() => setOpenPanel((current) => (current === panel.id ? null : panel.id))}
              >
                <TableIcon />
              </ImmersiveToolbarButton>
            ))}
          </div>
        </div>

        {/* 浮层：数据表格 / 实验报告 / 会话提示 */}
        {activePanel !== null && (
          <aside
            data-canvas-pan-block
            data-selectable-content
            aria-label={activePanel.label}
            className="absolute bottom-20 right-3 top-16 z-30 flex w-[min(420px,92vw)] flex-col overflow-hidden rounded-[12px] border border-white/10 bg-[#fbfaf7] text-[#242424] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#e2ddd3] px-4 py-3">
              <h2 className="text-sm font-bold">{activePanel.label}</h2>
              <button
                type="button"
                aria-label="收起"
                onClick={() => setOpenPanel(null)}
                className="grid size-7 place-items-center rounded-[6px] text-[#6f6a62] hover:bg-[#f0ece4]"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-4">{activePanel.content}</div>
          </aside>
        )}

        {overlay}

        {/* 读数提示：悬浮在画布底部，不占布局 */}
        {feedback !== null && (
          <div className="pointer-events-none absolute bottom-[76px] left-1/2 z-20 -translate-x-1/2">
            <span
              role="status"
              className={`inline-flex max-w-[min(680px,88vw)] items-center rounded-full border px-4 py-1.5 text-[13px] font-semibold backdrop-blur ${
                feedback.outcome === 'accepted'
                  ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-200'
                  : 'border-amber-400/35 bg-amber-500/12 text-amber-200'
              }`}
            >
              {feedback.message}
            </span>
          </div>
        )}

        {hintVisible && (
          <div className="pointer-events-none absolute bottom-[76px] right-4 z-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#22262c]/80 px-3 py-1.5 text-[12px] text-[#9aa4b2] backdrop-blur">
              无限画布已开启：滚轮缩放 / 拖动平移
            </span>
          </div>
        )}
      </div>

      {footer !== null && (
        <div className="relative z-30 flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 bg-[#22262c] px-3 py-2.5">
          {footer}
        </div>
      )}
    </div>
  )
}
