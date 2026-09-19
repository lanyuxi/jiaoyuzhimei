/**
 * 无限画布 + 3D 透视舞台。
 *
 * 语义（对应「沉浸式实验详情页」的要求）：
 *   · 无限画布：滚轮/双指缩放，拖拽或空格+拖拽平移，器材可放到任意位置不丢失
 *   · 3D 效果：整个画布以 perspective 做倾斜，进入时做一次入景动画，
 *     让学生有"走进实验台"的感觉。
 *     注意：画布本身**不画任何背景方框/地平线网格**——无限画布要看起来
 *     是"无限"的，背景只是一整块纯色，不再有桌面矩形、网格或暗角。
 *   · 进入即铺满整屏：相机初始按内容包围盒聚焦（fitContent）
 *
 * 组件只负责渲染与手势，相机数学在 canvas.ts（纯函数、已单测）。
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react'
import { useInfiniteCanvas } from './useInfiniteCanvas'
import type { ContentBounds, FitPadding } from './canvas'
import type { Position } from '../types'

/**
 * 3D 透视舞台的固定参数（**唯一来源**）。
 *
 * 这些值同时决定两件事：
 *   1. CSS 的 `perspective` / `rotateX`（渲染）；
 *   2. 屏幕↔画布的反投影（`buildVisibleRect` 用到的透视参数）。
 * 两者必须一致 —— 曾经 CSS 写死 `1600px` + `rotateX(13deg)`，
 * 而可见范围反算只做线性 scale+translate，完全忽略透视，
 * 导致"画布坐标合法但屏幕上仍探出 92px"。
 */
export const PERSPECTIVE_DEPTH = 1600
export const PERSPECTIVE_ORIGIN = '50% 58%'
export const STAGE_TILT_DEG = 13

/**
 * 顶部 / 底部悬浮控件占用的安全高度。
 *
 * 定义在这里而不是各自散落：**聚焦边距**与**可见范围**必须用同一对常量，
 * 否则又会退回"算出来合法、画面上仍被控件压住"的两套口径。
 */
export const SAFE_TOP = 56
export const SAFE_BOTTOM = 60

/**
 * 聚焦时左右两侧保留的画布留白。
 *
 * 一开始就贴屏会让画面像"卡在中间一条带子里"，与"整个屏幕都是无限画布"相反。
 */
export const FIT_SIDE_INSET = 28

export interface InfiniteCanvasProps {
  /** 画布内容包围盒（画布坐标） */
  content: ContentBounds
  /** 画布内容；渲染在 960×540 基准坐标系中 */
  children: ReactNode
  /**
   * 聚焦测量的取样点（各件器材本体外接矩形的四角）。
   *
   * 透视是非线性的，"包围盒四边"与"内容真实凸包"投影后不是一回事
   * （实测差 3.96px，足以让器材下缘压在底部读数条上）。
   */
  probes?: readonly Position[]
  /** 舞台外层引用（用于把指针事件换算成屏幕坐标） */
  stageRef: RefObject<HTMLDivElement | null>
  /**
   * 画布基准尺寸。
   *
   * **默认「跟随舞台」**（不传 = 内层世界铺满整个视口）。
   *
   * 为什么必须能跟随：历史上这里写死 960×540，于是内层世界永远只是屏幕上
   * 1086×610 的一小块矩形 —— 它没有背景、看起来"不存在"，
   * 但它**会裁剪**：器材往上一拖就被这条看不见的边切掉，
   * 也就是用户说的「中间有一个隐形的画布」。传尺寸只保留给单测与特殊场景；
   * 真实页面必须让世界 = 视口，这样"看不见的边界"就根本不存在。
   */
  viewWidth?: number
  viewHeight?: number
  /** 3D 倾斜角度（度） */
  tilt?: number
  /** 是否显示右上角画布工具条 */
  showToolbar?: boolean
  /**
   * 聚焦内容时预留的边距（屏幕像素）。
   * 沉浸式实验台上方有实验名胶囊、下方有读数条等悬浮控件，
   * 留白不足会让器材被这些控件压住、点不到（表现为「拖不动 / 接不上」）。
   *
   * 传数字 = 四周同值；传对象 = 四边各自指定。
   * 四边不对称是必需的：本实验台左边只有一条 148px 的工具条，
   * 右边却有 244px 的协作入口胶囊组 —— 用同一个值必然有一边留白不足。
   */
  padding?: FitPadding
  className?: string
  /** 相机变化回调（供场景把指针坐标反算回场景坐标） */
  onCameraChange?(camera: { scale: number; x: number; y: number }): void
}

export default function InfiniteCanvas({
  content,
  children,
  stageRef,
  viewWidth,
  viewHeight,
  tilt = STAGE_TILT_DEG,
  showToolbar = true,
  padding,
  className = '',
  onCameraChange,
  probes,
}: InfiniteCanvasProps) {
  const innerRef = useRef<HTMLDivElement>(null)

  /**
   * 舞台尺寸必须先测量、再聚焦。
   *
   * 这一条是"加载即被裁"的根因之一：`useInfiniteCanvas` 里
   * 「测量尺寸」与「按尺寸 fitContent」是两个独立的 effect，**都在同一轮 commit 里跑**，
   * 于是聚焦时读到的 `size` 还是 `{0, 0}` —— `fitContent` 退化成默认留白 120px，
   * 而真正能用的区域是「屏幕高度 − 顶部 56px − 底部 60px」。
   * 上下两条悬浮控件因此把器材的上缘切掉一截（1688×841 实测 E1/S1/S2 都被切）。
   *
   * 把带安全区的边距提前算出来传进去：入屏前尺寸必然已就绪，聚焦一次到位，
   * 不会先按 120px 聚焦、再被可见性不变量拉回来（那会看到器材"自己动一下"）。
   */
  /**
   * 聚焦边距：**上/下不对称，且与可见范围同源**。
   *
   * 舞台上下各压着一条悬浮控件（顶部工具栏 / 底部读数条），
   * 原先均匀留白 120px：下面浪费、上面不够，器材上缘因此被工具栏压住。
   *
   * 上下**刻意不额外加余量**，直接取 `SAFE_TOP` / `SAFE_BOTTOM`：
   * 若聚焦边距比可见范围更保守，相机就会把内容摆到一个"判据认为放不下"的位置，
   * 不变量随即把器材拉回来 —— 表现为**一进页面器材自己跳一下**。
   * 两边严格同源之后，入屏即终态。
   */
  const stagePadding = useMemo(
    () => padding ?? { top: SAFE_TOP, bottom: SAFE_BOTTOM, left: FIT_SIDE_INSET, right: FIT_SIDE_INSET },
    [padding],
  )

  /**
   * 世界尺寸（= 内层画布的坐标系尺寸）。
   *
   * 不传 `viewWidth / viewHeight` 时**跟随舞台**：`width = 100%`、`height = 100%`。
   * 这一条是"去掉中间那块隐形画布"的关键：
   *   · 内层世界与视口**同尺寸** → 它的边界正好压在屏幕边上，
   *     不存在"屏幕里还有一条看不见的裁剪线"；
   *   · 器材拖到屏幕任意角落都不会被切（以前 960×540 世界在 1375 宽的屏幕上
   *     只覆盖中间 1086px，往右一拖就被切掉）。
   *
   * 传了尺寸就按像素写死（只给单测/固定画布场景用）。
   */
  const followsStage = viewWidth === undefined && viewHeight === undefined


  /**
   * 透视原点的换算只做一次：`PERSPECTIVE_ORIGIN = '50% 58%'` 是**相对舞台**的百分比，
   * 必须按舞台实际尺寸换算成像素。聚焦（投影）与可见范围（反投影）读的是同一对数值。
   */
  /**
   * 透视参数必须**记忆化**，不能写成内联对象字面量。
   *
   * 内联对象每次渲染都是新引用，会让 `useInfiniteCanvas` 里的
   * `fitProjection` / `measureProjection` / `measureBounds` / `focus`
   * 四个 `useCallback` 全部失效；而聚焦 effect 依赖 `focus` ——
   * 于是"渲染 → focus 变新 → effect 重跑 → setCamera → 再渲染"形成闭环，
   * 浏览器控制台刷屏 "Maximum update depth exceeded"（实测每屏 54～74 条）。
   */
  const perspectiveConfig = useMemo(
    () => ({ tilt, depth: PERSPECTIVE_DEPTH, origin: PERSPECTIVE_ORIGIN }),
    [tilt],
  )

  const canvas = useInfiniteCanvas({
    stageRef,
    content,
    padding: stagePadding,
    perspective: perspectiveConfig,
    probes,
  })
  const [entered, setEntered] = useState(false)

  // 入景动画：先贴近再回正，形成 3D 入景
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 30)
    return () => window.clearTimeout(timer)
  }, [])

  const { camera } = canvas

  /**
   * 相机变化 → 通知场景。
   *
   * `onCameraChange` 必须走 ref，不能进依赖数组：
   * 场景侧的回调会 `setLayout`，而 `setLayout` 会让场景重渲染、
   * 生成**新的内联箭头函数**；依赖里只要挂着它，effect 就会被这个
   * "每帧都变的函数"重新触发 → `setLayout` → 再渲染 → **无限更新循环**
   * （浏览器实测 "Maximum update depth exceeded" 刷屏）。
   * 只依赖三个数值之后，effect 只在相机**真的**动了才跑一次。
   */
  const cameraChangeRef = useRef(onCameraChange)
  useEffect(() => {
    // 在 effect 里写 ref（渲染期写 ref 被 react-hooks 规则明确禁止）
    cameraChangeRef.current = onCameraChange
  }, [onCameraChange])

  const cameraScale = camera.scale
  const cameraX = camera.x
  const cameraY = camera.y
  useEffect(() => {
    cameraChangeRef.current?.({ scale: cameraScale, x: cameraX, y: cameraY })
  }, [cameraScale, cameraX, cameraY])

  const stageStyle: CSSProperties = {
    perspective: `${PERSPECTIVE_DEPTH}px`,
    perspectiveOrigin: PERSPECTIVE_ORIGIN,
  }
  const worldStyle: CSSProperties = {
    width: followsStage ? '100%' : `${viewWidth}px`,
    height: followsStage ? '100%' : `${viewHeight}px`,
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
      <div
        {...canvas.handlers}
        /**
         * 手势层标记：`useInfiniteCanvas` 靠它找到这一层，把**捕获阶段的**
         * 平移监听挂在这里、并把指针捕获在这一层上（理由见该 hook 内的长注释）。
         */
        data-canvas-gesture-layer
        className={`absolute inset-0 touch-none ${canvas.panReady ? 'cursor-grab' : 'cursor-default'}`}
      >
        <div ref={innerRef} style={worldStyle} className="absolute left-0 top-0 select-none">
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
          滚轮缩放 · 空格+拖动平移 · 中键/右键拖动 · {Math.round(camera.scale * 100)}%
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
