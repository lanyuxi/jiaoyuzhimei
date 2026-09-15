/**
 * 无限画布 + 3D 透视舞台。
 *
 * 语义（对应「沉浸式实验详情页」的要求）：
 *   · 无限画布：滚轮/双指缩放，拖拽或空格+拖拽平移，器材可放到任意位置不丢失
 *   · 3D 效果：整个画布以 perspective 做倾斜，配合地平线网格/阴影/高光，
 *     进入时做一次入景动画，让学生有"走进实验台"的感觉
 *   · 进入即铺满整屏：相机初始按内容包围盒聚焦（fitContent）
 *
 * 组件只负责渲染与手势，相机数学在 canvas.ts（纯函数、已单测）。
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react'
import { useInfiniteCanvas } from './useInfiniteCanvas'
import { isIdentityCamera, type ContentBounds } from './canvas'

export interface InfiniteCanvasProps {
  /** 画布内容包围盒（画布坐标） */
  content: ContentBounds
  /** 画布内容；渲染在 960×540 基准坐标系中 */
  children: ReactNode
  /** 舞台外层引用（用于把指针事件换算成屏幕坐标） */
  stageRef: RefObject<HTMLDivElement | null>
  /** 画布基准尺寸 */
  viewWidth?: number
  viewHeight?: number
  /** 3D 倾斜角度（度） */
  tilt?: number
  /** 是否显示右上角画布工具条 */
  showToolbar?: boolean
  className?: string
  /** 相机变化回调（供场景把指针坐标反算回场景坐标） */
  onCameraChange?(camera: { scale: number; x: number; y: number }): void
}

export default function InfiniteCanvas({
  content,
  children,
  stageRef,
  viewWidth = 960,
  viewHeight = 540,
  tilt = 13,
  showToolbar = true,
  className = '',
  onCameraChange,
}: InfiniteCanvasProps) {
  const canvas = useInfiniteCanvas({ stageRef, content })
  const [entered, setEntered] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)

  // 入景动画：先贴近再回正，形成 3D 入景
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 30)
    return () => window.clearTimeout(timer)
  }, [])

  const { camera } = canvas

  useEffect(() => {
    onCameraChange?.(camera)
  }, [camera.scale, camera.x, camera.y, onCameraChange])

  const stageStyle: CSSProperties = {
    perspective: '1600px',
    perspectiveOrigin: '50% 58%',
  }
  const worldStyle: CSSProperties = {
    width: `${viewWidth}px`,
    height: `${viewHeight}px`,
    transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale}) rotateX(${entered ? tilt : 0}deg)`,
    transformOrigin: '0 0',
    transition: entered ? 'transform 120ms linear' : 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform',
  }

  return (
    <div
      ref={stageRef}
      data-immersive-canvas
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={stageStyle}
    >
      {/* 3D 地平线网格：给无限画布提供空间参照 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [perspective:900px]">
        <div
          className="absolute left-1/2 top-[58%] h-[220%] w-[220%] -translate-x-1/2"
          style={{
            backgroundImage:
              'linear-gradient(rgba(122,162,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(122,162,255,0.16) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            transform: `rotateX(${entered ? 68 : 20}deg)`,
            transformOrigin: '50% 0',
            transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
            maskImage: 'radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.95), transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.95), transparent 72%)',
          }}
        />
      </div>

      <div
        {...canvas.handlers}
        className={`absolute inset-0 touch-none ${canvas.panReady ? 'cursor-grab' : 'cursor-default'}`}
      >
        <div ref={innerRef} style={worldStyle} className="absolute left-0 top-0">
          {children}
        </div>
      </div>

      {showToolbar && (
        <div className="absolute right-4 top-4 z-30 flex flex-col items-stretch gap-1 rounded-[10px] border border-white/10 bg-[#22262c]/85 p-1 backdrop-blur">
          <CanvasButton label="放大" onClick={() => canvas.zoomBy(1.2)}>
            <Plus className="size-4" aria-hidden="true" />
          </CanvasButton>
          <CanvasButton label="缩小" onClick={() => canvas.zoomBy(1 / 1.2)}>
            <Minus className="size-4" aria-hidden="true" />
          </CanvasButton>
          <CanvasButton label="复位视角" onClick={canvas.resetView}>
            <RotateCcw className="size-4" aria-hidden="true" />
          </CanvasButton>
          <CanvasButton label="铺满画布" onClick={() => canvas.fitToContent(content)}>
            <Maximize2 className="size-4" aria-hidden="true" />
          </CanvasButton>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#22262c]/80 px-3 py-1.5 text-[12px] text-[#9aa4b2] backdrop-blur">
          <Move className="size-3.5" aria-hidden="true" />
          滚轮缩放 · 拖动平移 · 空格加拖动自由移动 · {Math.round(camera.scale * 100)}%
          {isIdentityCamera(camera) ? '' : ''}
        </span>
      </div>
    </div>
  )
}

function CanvasButton({ label, onClick, children }: { label: string; onClick(): void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-canvas-pan-block
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-[6px] text-[#9aa4b2] transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}
