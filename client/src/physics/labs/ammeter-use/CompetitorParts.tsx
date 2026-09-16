/**
 * 实物器材绘制（对标竞品 NB 物理实验的写实风格）。
 *
 * 目标：让画面里的器材"看起来就是实验室里那件东西"，而不是符号化的示意图。
 * 为此每件器材都按真实结构分层绘制，而不是几个圆角矩形拼一拼：
 *
 *   · 电源 E1 —— 单节 1 号干电池：锌壳金属筒身 + 顶部沥青封口 + 正极铜帽，
 *     橙色/黑色环标印刷在筒身上（正负极端压扁、筒身中部高光，做出圆柱体积感）；
 *     电池躺在小小的金属电池座上，两端是红/黑接线柱。
 *   · 开关 S1/S2 —— 单刀开关：胶木底板 + 两只黄铜刀座（夹片式）+ 冲压钢刀片 +
 *     黑色绝缘手柄；合闸时刀片落在刀座上，断开时抬起约 32°。
 *   · 灯泡 L1 —— 小灯泡：玻璃泡（透视出内部灯丝与引线）+ 螺旋灯头（爱迪生螺纹）+
 *     绝缘环 + 金属灯座；发光时灯丝点亮并带光晕。
 *   · 电流表 A1 —— 教学用直流电流表：深色外壳 + 内凹的米白色表盘 + 弧形刻度与
 *     双排数字 + 顶部红色指针 + 下方三只接线柱，刻度按真实量程（0～0.6A / 0～3A）。
 *
 * 写实的关键是**光影**：每件器材都带金属高光渐变、镜面反射带、接触阴影与边缘暗部，
 * 而不是一块纯色。所有坐标仍然只用 <g transform="translate(x y)"> 定位，
 * 器材内部几何以参考点为原点，因此 layout.ts 推导出的接线柱坐标不会受影响。
 */
import { useId } from 'react'
import {
  NEEDLE_LIMIT_ANGLE,
  RANGE_SPEC,
  needleAngle,
  type AmmeterRangeId,
} from './definition'

const METAL_LIGHT = '#f2f4f6'
const METAL_MID = '#c9ced4'
const METAL_DARK = '#8d949c'
const METAL_EDGE = '#5f666e'
const BRASS = '#c9a227'
const BRASS_LIGHT = '#e6cc6a'
const TERMINAL_RED = '#b32d21'
const TERMINAL_BLACK = '#23262b'

function terminalColor(polarity: '+' | '-') {
  return polarity === '+' ? TERMINAL_RED : TERMINAL_BLACK
}

/**
 * 读数兜底：`reading` 一旦是 NaN / Infinity（上游算错、被同步成脏数据等），
 * 直接写进 JSX 会留下 `rotate(NaN ...)` 这种**非法 SVG 属性**，
 * 浏览器会整段忽略该 transform，表现为「指针凭空消失」且 console 静默报错。
 * 所以在绘制边界统一兜底成 0，保证画出来的东西永远合法。
 */
function safeReading(reading: number): number {
  return Number.isFinite(reading) ? reading : 0
}

/** 接触阴影：贴地的椭圆软阴影，让器材"落"在台面上而不是飘着 */
function GroundShadow({ cx = 0, cy = 0, rx, ry, opacity = 0.32 }: { cx?: number; cy?: number; rx: number; ry: number; opacity?: number }) {
  return <ellipse data-part="ground-shadow" cx={cx} cy={cy} rx={rx} ry={ry} fill="#05070a" opacity={opacity} />
}

/* ------------------------------------------------------------------ *
 * 接线柱（红/黑香蕉插座）
 * ------------------------------------------------------------------ */

/**
 * 接线柱：底座法兰 + 六角螺母 + 立柱 + 旋帽，帽顶做金属高光。
 * 已接线时旋帽略微弹起（真实接线柱拧紧螺钉后会压下去，这里用高光变化表达"已接"）。
 */
export function TerminalPost({ x, y, polarity, connected }: { x: number; y: number; polarity: '+' | '-'; connected: boolean }) {
  const color = terminalColor(polarity)
  const isRed = polarity === '+'
  const capLight = isRed ? '#f0796a' : '#6f757d'
  const capDark = isRed ? '#7d1b12' : '#101216'
  return (
    <g data-anchor="root" transform={`translate(${x} ${y})`} pointerEvents="none">
      {/* 接触阴影 */}
      <ellipse cx="0" cy="3.5" rx="10" ry="3.6" fill="#04060a" opacity="0.35" />
      {/* 底座法兰 */}
      <ellipse cx="0" cy="1" rx="9.2" ry="3.6" fill={METAL_DARK} />
      <ellipse cx="0" cy="-0.6" rx="9.2" ry="3.6" fill={METAL_MID} />
      <ellipse cx="0" cy="-1.4" rx="6.4" ry="2.4" fill={METAL_LIGHT} opacity="0.65" />
      {/* 立柱 */}
      <path d="M -3.4 -1 L 3.4 -1 L 3 -8 L -3 -8 Z" fill={METAL_MID} />
      <path d="M -3.4 -1 L -1.4 -1 L -1.2 -8 L -3 -8 Z" fill="#eef1f4" opacity="0.5" />
      {/* 旋帽（圆柱 + 顶面） */}
      <path d={`M -6.8 -8 L 6.8 -8 L 6.2 -14.5 L -6.2 -14.5 Z`} fill={color} />
      <ellipse cx="0" cy="-14.5" rx="6.2" ry="2.5" fill={capLight} />
      <ellipse cx="0" cy="-8" rx="6.8" ry="2.7" fill={capDark} />
      {/* 帽身竖向防滑纹 */}
      <g stroke={capDark} strokeWidth="0.5" opacity="0.75">
        {[-4.4, -2.6, -0.9, 0.9, 2.6, 4.4].map((offset) => (
          <line key={offset} x1={offset} y1="-8.4" x2={offset * 0.92} y2="-14.2" />
        ))}
      </g>
      {/* 顶面高光：已接线时更亮（模拟压接痕迹） */}
      <ellipse cx="-1.8" cy="-15.2" rx="2.6" ry="1.1" fill="#ffffff" opacity={connected ? 0.6 : 0.35} />
      <ellipse cx="2.2" cy="-14.2" rx="1.6" ry="0.8" fill="#000000" opacity="0.25" />
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * 电源 E1：单节干电池 + 电池座
 * ------------------------------------------------------------------ */

/** 电池座底板（共用于电池与灯泡）：拉丝金属 + 前后倒角 + 两端螺钉 */
function BasePlate({ halfWidth, y, depth = 20 }: { halfWidth: number; y: number; depth?: number }) {
  const h = depth
  return (
    <g>
      {/* 侧面（圆角金属块） */}
      <rect data-part="baseplate-face" x={-halfWidth} y={y} width={halfWidth * 2} height={h} rx="2.6" fill={METAL_DARK} />
      {/* 顶面：上浅下深，做出圆柱/倒角的高光 */}
      <rect data-part="baseplate-face" x={-halfWidth} y={y - 3.5} width={halfWidth * 2} height={h * 0.62} rx="2.4" fill={METAL_MID} />
      <rect data-part="baseplate-highlight" x={-halfWidth + 2} y={y - 3} width={halfWidth * 2 - 4} height="3.6" rx="1.8" fill={METAL_LIGHT} opacity="0.85" />
      {/* 底边暗部 */}
      <rect data-part="baseplate-face" x={-halfWidth} y={y + h - 4} width={halfWidth * 2} height="4" rx="2" fill="#5a6067" opacity="0.8" />
      {/* 左右端立边 */}
      <rect data-part="baseplate-edge" x={-halfWidth} y={y - 3.5} width="4" height={h + 3.5} rx="1.6" fill="#9aa1a9" />
      <rect data-part="baseplate-edge" x={halfWidth - 4} y={y - 3.5} width="4" height={h + 3.5} rx="1.6" fill="#9aa1a9" />
      {/* 两端十字螺钉 */}
      {[-halfWidth + 11, halfWidth - 11].map((cx) => {
        const cy = y + h * 0.42
        return (
          <g key={cx}>
            <circle data-part="baseplate-screw" cx={cx} cy={cy} r="4" fill={METAL_MID} stroke={METAL_EDGE} strokeWidth="0.6" />
            <circle data-part="baseplate-screw" cx={cx} cy={cy} r="2.6" fill={METAL_LIGHT} opacity="0.7" />
            <path data-part="baseplate-screw-slot" d={`M ${cx - 2.6} ${cy} L ${cx + 2.6} ${cy} M ${cx} ${cy - 2.6} L ${cx} ${cy + 2.6}`} stroke="#6d747c" strokeWidth="0.7" />
          </g>
        )
      })}
    </g>
  )
}

/** 单节 1 号干电池（筒身 + 环标 + 正极铜帽 + 负极锌底） */
export function BatteryCell({ x, y, halfLength = 76, radius = 17, uid }: { x: number; y: number; halfLength?: number; radius?: number; uid: string }) {
  const bodyTop = y - radius
  const bodyHeight = radius * 2
  const left = x - halfLength
  return (
    <g>
      {/* 筒身本体：竖向渐变做出圆柱体积感 */}
      <defs>
        <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a5f66" />
          <stop offset="18%" stopColor="#8d939b" />
          <stop offset="42%" stopColor="#767c84" />
          <stop offset="72%" stopColor="#4d5259" />
          <stop offset="100%" stopColor="#33373d" />
        </linearGradient>
        <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a4a12" />
          <stop offset="20%" stopColor="#e2953a" />
          <stop offset="55%" stopColor="#c9772a" />
          <stop offset="100%" stopColor="#7c3f0d" />
        </linearGradient>
        <linearGradient id={`${uid}-black`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2226" />
          <stop offset="22%" stopColor="#4a4e54" />
          <stop offset="60%" stopColor="#31353a" />
          <stop offset="100%" stopColor="#15181b" />
        </linearGradient>
      </defs>
      {/* 负极（左端）：金属锌底 + 压扁的端面 */}
      <rect data-part="cell-negative" x={left - 7} y={bodyTop + 2} width="10" height={bodyHeight - 4} rx="4" fill="#4b4f55" />
      <rect data-part="cell-negative" x={left - 7} y={bodyTop + 3} width="10" height="4" rx="2" fill="#7b8188" opacity="0.75" />
      <rect data-part="cell-negative" x={left - 7} y={bodyTop + 2} width="10" height={bodyHeight - 4} rx="4" fill="none" stroke="#2b2e32" strokeWidth="0.7" />
      {/* 筒身 */}
      <rect data-part="cell-body" x={left - 2} y={bodyTop} width={halfLength * 2 + 4} height={bodyHeight} rx={radius * 0.72} fill={`url(#${uid}-cyl)`} />
      {/* 黑色环标（负极侧） */}
      <rect data-part="cell-band" x={left + 12} y={bodyTop} width="13" height={bodyHeight} fill={`url(#${uid}-black)`} />
      {/* 橙色环标（电池品牌印刷区，正极侧） */}
      <rect data-part="cell-band" x={left + 40} y={bodyTop} width="58" height={bodyHeight} fill={`url(#${uid}-band)`} />
      <rect data-part="cell-band" x={left + 40} y={bodyTop + 3} width="58" height="3.5" rx="1.8" fill="#f4bd6f" opacity="0.5" />
      {/* 黑色环标（正极侧） */}
      <rect data-part="cell-band" x={left + 112} y={bodyTop} width="13" height={bodyHeight} fill={`url(#${uid}-black)`} />
      {/* 筒身顶部镜面反射带 */}
      <rect data-part="cell-highlight" x={left + 6} y={bodyTop + 3} width={halfLength * 2 - 12} height="5" rx="2.5" fill="#ffffff" opacity="0.26" />
      {/* 筒身底部反光 */}
      <rect data-part="cell-highlight" x={left + 10} y={bodyTop + bodyHeight - 8} width={halfLength * 2 - 20} height="3" rx="1.5" fill="#ffffff" opacity="0.1" />
      {/* 筒身轮廓描边 */}
      <rect data-part="cell-outline" x={left - 2} y={bodyTop} width={halfLength * 2 + 4} height={bodyHeight} rx={radius * 0.72} fill="none" stroke="#22262a" strokeWidth="0.9" opacity="0.85" />
      {/* 正极（右端）：铜帽 */}
      <rect data-part="cell-positive" x={left + halfLength * 2 - 1} y={bodyTop + 3} width="16" height={bodyHeight - 6} rx="4.5" fill="#b9a071" />
      <rect data-part="cell-positive" x={left + halfLength * 2 - 1} y={bodyTop + 4} width="16" height="5" rx="2.5" fill="#e8d5ab" opacity="0.8" />
      <rect data-part="cell-positive" x={left + halfLength * 2 + 9} y={bodyTop + 6} width="7" height={bodyHeight - 12} rx="3" fill="#d9c187" />
      <rect data-part="cell-positive" x={left + halfLength * 2 + 9} y={bodyTop + 7} width="7" height="4" rx="2" fill="#fbeecb" opacity="0.85" />
      {/* 正极凸点 */}
      <rect data-part="cell-positive" x={left + halfLength * 2 + 15} y={bodyTop + 10} width="3.5" height={bodyHeight - 20} rx="1.6" fill="#c6ab74" />
    </g>
  )
}

/**
 * 电池座 E1：银色长条底座 + 单节干电池 + 两端红/黑接线柱。
 * 电池横卧在底座上，正极铜帽在右（+），锌底在左（－）。
 */
export function BatteryHolderE1({ x, y }: { x: number; y: number }) {
  const uid = useId()
  return (
    <g data-anchor="root" transform={`translate(${x} ${y})`}>
      <GroundShadow cy={26} rx={126} ry={9} />
      <g data-part="baseplate"><BasePlate halfWidth={122} y={8} depth={18} /></g>
      {/* 电池托架：两道金属卡箍，把电池"卡"在底座上 */}
      {[-52, 54].map((cx) => (
        <g key={cx}>
          <path data-part="E1-clamp" d={`M ${cx - 5} 8 L ${cx - 5} -14 Q ${cx} -19 ${cx + 5} -14 L ${cx + 5} 8 Z`} fill={METAL_MID} />
          <path data-part="E1-clamp" d={`M ${cx - 5} 8 L ${cx - 5} -14 Q ${cx} -19 ${cx + 5} -14 L ${cx + 5} 8 Z`} fill="none" stroke={METAL_EDGE} strokeWidth="0.8" />
        </g>
      ))}
      {/* 电池本体：躺在托架上（底边略高于底座顶面） */}
      <BatteryCell x={0} y={-24} halfLength={78} radius={18} uid={uid} />
      {/* 底座上的正负极刻印 */}
      <text data-part="E1-polarity" x="-92" y="21" fill="#f0f3f6" fontSize="13" fontWeight="700" textAnchor="middle">－</text>
      <text data-part="E1-polarity" x="92" y="21" fill="#f0f3f6" fontSize="13" fontWeight="700" textAnchor="middle">+</text>
      <text data-part="E1-name" x="0" y="46" fill="#dfe4ea" fontSize="17" fontWeight="600" textAnchor="middle" letterSpacing="0.5">E1</text>
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * 开关 S1/S2：单刀开关
 * ------------------------------------------------------------------ */

/**
 * 单刀开关 S：胶木底板 + 两只黄铜刀座 + 冲压钢刀片 + 黑色绝缘手柄。
 * 合闸时刀片水平落在右侧刀座内；断开时以左端铰链为轴抬起 32°。
 */
export function KnifeSwitch({ x, y, closed, label }: { x: number; y: number; closed: boolean; label: string }) {
  const hingeX = -58
  const contactX = 52
  const pivotY = -6
  const bladeAngle = closed ? 0 : -32
  return (
    <g data-anchor="root" transform={`translate(${x} ${y})`}>
      <GroundShadow cy={24} rx={94} ry={9} />
      {/* 胶木底板（深棕，比金属底座更暗） */}
      <rect data-part="switch-plate" x="-88" y="4" width="176" height="18" rx="2.4" fill="#2a2622" />
      <rect data-part="switch-plate" x="-88" y="0" width="176" height="7" rx="2.2" fill="#3d3730" />
      <rect data-part="switch-plate" x="-86" y="0.6" width="172" height="3" rx="1.5" fill="#57504a" opacity="0.9" />
      <rect data-part="switch-plate" x="-88" y="16" width="176" height="6" rx="2" fill="#1b1815" opacity="0.9" />
      {/* 底板四角螺钉 */}
      {[[-76, 13], [76, 13], [-76, 22], [76, 22]].map(([sx, sy], index) => (
        <g key={index}>
          <circle data-part="switch-screw" cx={sx} cy={sy} r="3.2" fill="#6e767e" />
          <circle data-part="switch-screw" cx={sx - 0.6} cy={sy - 0.6} r="2" fill="#a9b0b7" opacity="0.8" />
        </g>
      ))}
      {/* 左侧铰链刀座（带夹片） */}
      <rect data-part="switch-jaw-hinge" x={hingeX - 8} y={pivotY - 12} width="16" height="20" rx="1.6" fill={BRASS} />
      <rect data-part="switch-jaw-hinge" x={hingeX - 8} y={pivotY - 12} width="16" height="4" rx="1.6" fill={BRASS_LIGHT} />
      <rect data-part="switch-jaw-hinge" x={hingeX - 8} y={pivotY - 12} width="16" height="20" rx="1.6" fill="none" stroke="#8a6f16" strokeWidth="0.7" />
      {/* 右侧触点座（刀片落下时卡进夹口） */}
      <rect data-part="switch-jaw-contact" x={contactX - 8} y={pivotY - 11} width="16" height="19" rx="1.6" fill={BRASS} />
      <rect data-part="switch-jaw-contact" x={contactX - 8} y={pivotY - 11} width="16" height="4" rx="1.6" fill={BRASS_LIGHT} />
      <rect data-part="switch-jaw-contact" x={contactX - 8} y={pivotY - 11} width="16" height="19" rx="1.6" fill="none" stroke="#8a6f16" strokeWidth="0.7" />
      {/* 刀片：以左端铰链为轴旋转 */}
      <g data-anchor="rotate-declared" transform={`rotate(${bladeAngle} ${hingeX} ${pivotY})`}>
        <rect data-part="switch-blade" x={hingeX + 6} y={pivotY - 5.5} width={contactX - hingeX - 4} height="11" rx="2.4" fill={METAL_LIGHT} />
        <rect data-part="switch-blade" x={hingeX + 6} y={pivotY - 5.5} width={contactX - hingeX - 4} height="4" rx="2" fill="#ffffff" opacity="0.8" />
        <rect data-part="switch-blade" x={hingeX + 6} y={pivotY + 2} width={contactX - hingeX - 4} height="3.5" rx="1.75" fill="#868d95" opacity="0.75" />
        <rect data-part="switch-blade" x={hingeX + 6} y={pivotY - 5.5} width={contactX - hingeX - 4} height="11" rx="2.4" fill="none" stroke="#767d85" strokeWidth="0.8" />
        {/* 刀尖（斜切） */}
        <path data-part="switch-blade-tip" d={`M ${contactX - 2} ${pivotY - 4.5} L ${contactX + 2} ${pivotY} L ${contactX - 2} ${pivotY + 4.5} Z`} fill="#c4cad1" />
        {/* 黑色绝缘手柄 */}
        <rect data-part="switch-handle" x={contactX + 1} y={pivotY - 5.5} width="26" height="11" rx="4" fill="#2c2a28" />
        <rect data-part="switch-handle" x={contactX + 1} y={pivotY - 5.5} width="26" height="3.6" rx="1.8" fill="#4c4a47" />
        <rect data-part="switch-handle" x={contactX + 1} y={pivotY - 5.5} width="26" height="11" rx="4" fill="none" stroke="#171513" strokeWidth="0.7" />
        <g stroke="#4a4744" strokeWidth="0.8" opacity="0.8">
          <line data-part="switch-handle-grip" x1={contactX + 8} y1={pivotY - 4} x2={contactX + 8} y2={pivotY + 4} />
          <line data-part="switch-handle-grip" x1={contactX + 14} y1={pivotY - 4} x2={contactX + 14} y2={pivotY + 4} />
          <line data-part="switch-handle-grip" x1={contactX + 20} y1={pivotY - 4} x2={contactX + 20} y2={pivotY + 4} />
        </g>
      </g>
      {/* 铰链轴销 */}
      <circle data-part="switch-hinge" cx={hingeX} cy={pivotY} r="6" fill={METAL_DARK} />
      <circle data-part="switch-hinge" cx={hingeX} cy={pivotY} r="6" fill="none" stroke={METAL_EDGE} strokeWidth="0.7" />
      <circle data-part="switch-hinge-gloss" cx={hingeX - 1.4} cy={pivotY - 1.4} r="2.4" fill="#e3e7eb" opacity="0.8" />
      <text data-part="switch-name" x="0" y="46" fill="#dfe4ea" fontSize="17" fontWeight="600" textAnchor="middle" letterSpacing="0.5">{label}</text>
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * 灯泡 L1：玻璃泡 + 螺旋灯头 + 灯座
 * ------------------------------------------------------------------ */

/** 螺旋灯头（爱迪生螺纹）：一圈圈金属螺纹 + 底部绝缘环与触点 */
function ScrewCap({ top, height, radius }: { top: number; height: number; radius: number }) {
  const turns = 4
  return (
    <g>
      {/* 螺纹主体 */}
      <rect data-part="lamp-thread-body" x={-radius} y={top} width={radius * 2} height={height} fill="#a9afb6" />
      {Array.from({ length: turns }, (_, index) => {
        const y = top + 3 + (index * (height - 7)) / turns
        return <ellipse key={index} data-part="lamp-thread-turn" cx="0" cy={y} rx={radius} ry="2.4" fill={index % 2 === 0 ? '#e7ebef' : '#7f868e'} opacity="0.9" />
      })}
      {/* 左右边缘暗部 */}
      <rect data-part="lamp-thread-shade" x={-radius} y={top} width="2.6" height={height} fill="#5e656c" opacity="0.75" />
      <rect data-part="lamp-thread-shade" x={radius - 2.6} y={top} width="2.6" height={height} fill="#5e656c" opacity="0.75" />
      {/* 中部高光 */}
      <rect data-part="lamp-thread-highlight" x={-radius * 0.35} y={top} width="2.4" height={height} fill="#ffffff" opacity="0.4" />
      {/* 底部绝缘环 + 中央触点（正好塞进灯座口，不留缝） */}
      <rect data-part="lamp-insulator" x={-radius} y={top + height - 1} width={radius * 2} height="6" fill="#25282c" />
      <ellipse data-part="lamp-insulator" cx="0" cy={top + height + 4} rx={radius - 1} ry="2.4" fill="#3a3e43" />
      <ellipse data-part="lamp-contact" cx="0" cy={top + height + 6} rx="3.4" ry="1.8" fill="#c6ab74" />
    </g>
  )
}

/** 玻璃泡（含灯丝、引线、颈部） */
function GlassBulb({ top, bottom, halfWidth, lit, uid }: { top: number; bottom: number; halfWidth: number; lit: boolean; uid: string }) {
  const bulbTop = top
  const centerY = top + (bottom - top) * 0.42
  const glassPath = `M ${-halfWidth} ${bottom - 6}
    C ${-halfWidth} ${centerY}
      ${-halfWidth * 0.82} ${bulbTop}
      0 ${bulbTop}
    C ${halfWidth * 0.82} ${bulbTop}
      ${halfWidth} ${centerY}
      ${halfWidth} ${bottom - 6}
    Z`
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-glass`} cx="0.4" cy="0.34" r="0.8">
          <stop offset="0%" stopColor={lit ? '#fffdf2' : 'rgba(238,245,252,0.8)'} />
          <stop offset="48%" stopColor={lit ? '#fff0b8' : 'rgba(204,219,233,0.42)'} />
          <stop offset="100%" stopColor={lit ? '#f0cf83' : 'rgba(150,170,190,0.3)'} />
        </radialGradient>
      </defs>
      {/* 玻璃体 */}
      <path data-part="lamp-glass" d={glassPath} fill={`url(#${uid}-glass)`} stroke={lit ? '#f0cf7a' : '#b9c7d5'} strokeWidth="1.6" />
      {/* 左侧高光条 */}
      <path data-part="lamp-glass-highlight" d={`M ${-halfWidth * 0.62} ${bottom - 22} C ${-halfWidth * 0.72} ${centerY} ${-halfWidth * 0.6} ${bulbTop + 12} ${-halfWidth * 0.28} ${bulbTop + 6}`} fill="none" stroke="#ffffff" strokeWidth="3.4" opacity="0.5" strokeLinecap="round" />
      {/* 颈缩部：玻璃与灯头过渡（喇叭口收进螺纹灯头） */}
      <path data-part="lamp-neck" d={`M ${-halfWidth} ${bottom - 8} C ${-halfWidth * 0.55} ${bottom - 2} ${-halfWidth * 0.5} ${bottom} ${-halfWidth * 0.48} ${bottom} L ${halfWidth * 0.48} ${bottom} C ${halfWidth * 0.5} ${bottom} ${halfWidth * 0.55} ${bottom - 2} ${halfWidth} ${bottom - 8} Z`} fill={lit ? 'rgba(255,224,150,0.55)' : 'rgba(178,196,214,0.45)'} />
      {/* 内部引线两根 */}
      <path data-part="lamp-lead" d={`M -6 ${bottom - 4} L -6 ${centerY + 4} L -3 ${centerY - 4}`} fill="none" stroke="#8c939b" strokeWidth="1.4" />
      <path data-part="lamp-lead" d={`M 6 ${bottom - 4} L 6 ${centerY + 4} L 3 ${centerY - 4}`} fill="none" stroke="#8c939b" strokeWidth="1.4" />
      {/* 灯丝：M 形钨丝 */}
      <path
        data-part="lamp-filament"
        d={`M -3 ${centerY - 4} L -6 ${centerY - 16} L 0 ${centerY - 6} L 6 ${centerY - 16} L 3 ${centerY - 4}`}
        fill="none"
        stroke={lit ? '#fff3b0' : '#c3ccd6'}
        strokeWidth={lit ? 2.4 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 点亮的灯丝光晕 */}
      {lit && <circle cx="0" cy={centerY - 10} r="9" fill="#fff2a8" opacity="0.7" />}
    </g>
  )
}

/**
 * 灯泡 L1：玻璃泡 + 螺旋灯头 + 金属灯座 + 底座 + 红黑接线柱。
 */
export function LampHolderL1({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  const uid = useId()
  const socketTop = -26
  return (
    <g data-anchor="root" transform={`translate(${x} ${y})`}>
      {lit && <circle cx="0" cy="-58" r="52" fill="#ffd76b" opacity="0.2" />}
      {lit && <circle cx="0" cy="-58" r="30" fill="#ffe9a8" opacity="0.28" />}
      <GroundShadow cy={26} rx={88} ry={9} />
      <g data-part="baseplate"><BasePlate halfWidth={84} y={8} depth={18} /></g>
      {/* 灯座立柱：金属筒 + 上沿内收 */}
      <path data-part="lamp-socket" d="M -22 -26 L 22 -26 L 19 -6 L -19 -6 Z" fill={METAL_MID} />
      <path data-part="lamp-socket" d="M -22 -26 L -22 -22 L 22 -22 L 22 -26 Z" fill="#eef1f4" opacity="0.6" />
      <ellipse data-part="lamp-socket" cx="0" cy="-26" rx="22" ry="6" fill={METAL_DARK} />
      <ellipse data-part="lamp-socket" cx="0" cy="-27" rx="18" ry="4.6" fill="#3a3f45" />
      {/* 灯座左高光 / 右暗部 */}
      <path data-part="lamp-socket" d="M -22 -26 L -19 -6 L -14 -6 L -17 -26 Z" fill="#f0f3f6" opacity="0.45" />
      <path data-part="lamp-socket" d="M 22 -26 L 19 -6 L 15 -6 L 18 -26 Z" fill="#5f666e" opacity="0.5" />
      {/* 底座上的两枚小螺钉（灯座固定） */}
      {[-58, 58].map((sx) => (
        <g key={sx}>
          <circle data-part="lamp-socket-screw" cx={sx} cy="17" r="3.4" fill={METAL_MID} />
          <circle data-part="lamp-socket-screw" cx={sx - 0.7} cy="16.3" r="2.1" fill="#dfe4e9" opacity="0.85" />
        </g>
      ))}
      {/* 螺旋灯头 + 玻璃泡：玻璃颈部直接坐在灯头螺纹上，中间不留缝（否则灯泡像飘着） */}
      <ScrewCap top={socketTop - 13} height={15} radius={11.5} />
      <GlassBulb top={socketTop - 84} bottom={socketTop - 11} halfWidth={25} lit={lit} uid={uid} />
      <text data-part="lamp-name" x="0" y="46" fill="#dfe4ea" fontSize="17" fontWeight="600" textAnchor="middle" letterSpacing="0.5">L1</text>
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * 电流表 A1：教学用直流电流表
 * ------------------------------------------------------------------ */

/** 表盘刻度：外圈 0～3、内圈 0～0.6，中间夹一圈弧线 */
function DialFace({ activeRange, reading, overRange }: { activeRange: AmmeterRangeId; reading: number; overRange: boolean }) {
  // 刻度半径与转轴位置：整个刻度弧必须落在表盘内（局部 y -56…32），
  // 弧心取表盘中上部，让指针从 -60° 到 +60° 有完整行程且不与台肩/刻字相撞。
  const radius = 54
  const pivotY = -62
  const angle = needleAngle(reading, activeRange)
  const polar = (angleDeg: number, distance: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: Math.sin(rad) * distance, y: pivotY - Math.cos(rad) * distance }
  }
  // 外圈 30 小格（每 5 格一根长刻度），内圈同样 30 格但更短
  const ticks = Array.from({ length: 31 }, (_, index) => {
    const a = -NEEDLE_LIMIT_ANGLE + (index / 30) * NEEDLE_LIMIT_ANGLE * 2
    return { a, major: index % 5 === 0 }
  })
  const arcPath = (distance: number) => {
    const from = polar(-NEEDLE_LIMIT_ANGLE, distance)
    const to = polar(NEEDLE_LIMIT_ANGLE, distance)
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${distance} ${distance} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
  }
  return (
    <g>
      {/* 刻度弧线 */}
      <path data-part="ammeter-arc" d={arcPath(radius)} fill="none" stroke="#3a352f" strokeWidth="1.1" opacity="0.85" />
      <path data-part="ammeter-arc" d={arcPath(radius - 22)} fill="none" stroke="#6a645b" strokeWidth="0.7" opacity="0.7" />
      {/* 外圈刻度 0～3 */}
      {ticks.map((tick, index) => {
        const outer = polar(tick.a, radius)
        const inner = polar(tick.a, radius - (tick.major ? 8 : 5))
        return (
          <line
            key={`o${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            data-part="ammeter-scale-outer"
            stroke="#2b2721"
            strokeWidth={tick.major ? 1.6 : 0.85}
            strokeLinecap="round"
          />
        )
      })}
      {/* 内圈刻度 0～0.6 */}
      {ticks.map((tick, index) => {
        const outer = polar(tick.a, radius - 21)
        const inner = polar(tick.a, radius - (tick.major ? 29 : 27))
        return (
          <line
            key={`i${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            data-part="ammeter-scale-inner"
            stroke="#4c473f"
            strokeWidth={tick.major ? 1.2 : 0.7}
            strokeLinecap="round"
          />
        )
      })}
      {/* 外圈数字 0 1 2 3 */}
      {[0, 1, 2, 3].map((value, index) => {
        const point = polar(-NEEDLE_LIMIT_ANGLE + (index / 3) * NEEDLE_LIMIT_ANGLE * 2, radius - 18)
        return (
          <text key={`ov${value}`} data-part="ammeter-number-outer" x={point.x} y={point.y + 3.4} fill="#1d1a16" fontSize="10.5" fontWeight="700" textAnchor="middle">
            {value}
          </text>
        )
      })}
      {/* 内圈数字 0 0.2 0.4 0.6 */}
      {[0, 0.2, 0.4, 0.6].map((value, index) => {
        const point = polar(-NEEDLE_LIMIT_ANGLE + (index / 3) * NEEDLE_LIMIT_ANGLE * 2, radius - 35)
        return (
          <text key={`iv${value}`} data-part="ammeter-number-inner" x={point.x} y={point.y + 3.2} fill="#463f37" fontSize="8.4" textAnchor="middle">
            {value}
          </text>
        )
      })}
      {/* 指针：细长红针 + 尾部配重 */}
      <g data-anchor="rotate-declared" transform={`rotate(${angle} 0 ${pivotY})`}>
        {/* 尾部配重（真实的动圈表头都有一小截反向尾针） */}
        <rect data-part="ammeter-needle-tail" x="-2.6" y={pivotY} width="5.2" height="7" rx="2.4" fill="#7d1c14" />
        {/* 针体：细长、尖端收拢 */}
        <path data-part="ammeter-needle" d={`M -1 ${pivotY} L 1 ${pivotY} L 0.55 ${pivotY - radius + 5} L -0.55 ${pivotY - radius + 5} Z`} fill={overRange ? '#e02b1a' : '#c6281c'} />
        {/* 针体高光 */}
        <path data-part="ammeter-needle-gloss" d={`M -0.4 ${pivotY} L 0.1 ${pivotY} L 0.25 ${pivotY - radius + 8} L -0.15 ${pivotY - radius + 8} Z`} fill="#f4796b" opacity="0.85" />
      </g>
      {/* 指针转轴帽 */}
      <ellipse data-part="ammeter-needle-hub-shadow" cx="0" cy={pivotY + 1} rx="6.8" ry="5.4" fill="#000000" opacity="0.22" />
      <circle data-part="ammeter-needle-hub" cx="0" cy={pivotY} r="6" fill="#5d636a" />
      <circle data-part="ammeter-needle-hub" cx="0" cy={pivotY} r="6" fill="none" stroke="#393e44" strokeWidth="0.8" />
      <path data-part="ammeter-needle-hub-gloss" d="M -4.4 -0.6 A 5 5 0 0 1 3.2 -4.2" fill="none" stroke="#d7dce1" strokeWidth="1.5" opacity="0.85" />
      {/* 中央量程字符 A（真实表盘印在转轴下方，避开指针行程） */}
      <text data-part="ammeter-glyph" x="0" y={pivotY - 4} fill="#232019" fontSize="16" fontWeight="700" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic">A</text>
    </g>
  )
}

/**
 * 电流表 A1：深色外壳 + 内凹米白表盘 + 双量程刻度 + 红色指针 + 三只接线柱。
 */
export function AmmeterA1({
  x,
  y,
  reading,
  range,
  overRange,
  label,
}: {
  x: number
  y: number
  reading: number
  range: AmmeterRangeId | null
  overRange: boolean
  label: string
}) {
  const activeRange = range ?? '3A'
  const spec = RANGE_SPEC[activeRange]
  const displayReading = safeReading(reading)
  const readingText = `${displayReading.toFixed(2)} A`
  return (
    <g data-anchor="root" transform={`translate(${x} ${y})`}>
      <GroundShadow cy={44} rx={86} ry={9} />
      {/*
        真实电流表的结构：表壳正面是**完整的一大块表盘**，接线柱则长在壳体**下沿的接线台肩**上，
        而不是戳在玻璃表盘上。本实验台三只接线柱由 layout.ts 固定在局部 y≈-37…-41，
        旋帽顶端再往上约 15px（y≈-56）。
        所以台肩做成 y[-58,4] 的深色槽，把「底座 + 立柱 + 旋帽」整体包在里面，
        刻字与接线柱同 x 对齐，压在旋帽下方。
      */}
      {/* 外壳：深色仪表壳，顶面受光、底面暗 */}
      <rect data-part="ammeter-shell" x="-84" y="-126" width="168" height="166" rx="6" fill="#25292e" />
      <rect data-part="ammeter-shell-edge" x="-84" y="-126" width="168" height="10" rx="5" fill="#3b4148" />
      <rect data-part="ammeter-shell-edge" x="-84" y="30" width="168" height="10" rx="5" fill="#14171a" />
      <rect data-part="ammeter-shell-outline" x="-84" y="-126" width="168" height="166" rx="6" fill="none" stroke="#101317" strokeWidth="1" />
      {/* 顶面高光条 */}
      <rect data-part="ammeter-shell-highlight" x="-78" y="-124" width="156" height="3" rx="1.5" fill="#ffffff" opacity="0.22" />
      {/* 内凹表盘（带内阴影：上/左深，下/右浅）—— 收在台肩上沿之上 */}
      <rect data-part="ammeter-dial" x="-76" y="-122" width="152" height="66" rx="3" fill="#efe9dc" stroke="#8d8577" strokeWidth="1.2" />
      <rect data-part="ammeter-dial-shadow" x="-76" y="-118" width="152" height="6" rx="3" fill="#000000" opacity="0.22" />
      <rect data-part="ammeter-dial-shadow" x="-76" y="-118" width="5" height="58" rx="2" fill="#000000" opacity="0.16" />
      <rect data-part="ammeter-dial-highlight" x="71" y="-118" width="5" height="58" rx="2" fill="#ffffff" opacity="0.5" />
      <rect data-part="ammeter-dial-highlight" x="-76" y="-66" width="152" height="6" rx="3" fill="#ffffff" opacity="0.45" />
      <DialFace activeRange={activeRange} reading={displayReading} overRange={overRange} />
      {/* 玻璃面反光斜条 */}
      <path data-part="ammeter-glass-reflection" d="M -70 -66 L 18 -114 L 36 -114 L -52 -66 Z" fill="#ffffff" opacity="0.13" />
      {/*
        下沿的接线台肩：把三只接线柱整体包在槽里。
        必须画在**表盘之后**，否则会被表盘盖住；
        刻字也必须画在壳体之后（浏览器实测：先画会被壳体整个遮掉）。
      */}
      <rect data-part="ammeter-terminal-flange" x="-70" y="-58" width="140" height="62" rx="4" fill="#1e2126" />
      <rect data-part="ammeter-flange-highlight" x="-70" y="-58" width="140" height="5" rx="2.5" fill="#3a4048" />
      <rect data-part="ammeter-flange-border" x="-70" y="-22" width="140" height="30" rx="4" fill="none" stroke="#0d1013" strokeWidth="0.9" />
      {/* 接线柱刻字：x 与接线柱局部坐标对齐（-43.8 / -0.7 / 40.8），压在旋帽下方 */}
      <text data-part="ammeter-label-neg" x="-43.8" y="4" fill="#e7ebef" fontSize="9.5" fontWeight="700" textAnchor="middle">－</text>
      <text data-part="ammeter-label-06" x="-0.7" y="4" fill="#e7ebef" fontSize="9.5" fontWeight="700" textAnchor="middle">0.6A</text>
      <text data-part="ammeter-label-3" x="40.8" y="4" fill="#e7ebef" fontSize="9.5" fontWeight="700" textAnchor="middle">3A</text>
      {/* 表盘上方的读数数字（大字，方便投屏） */}
      <text data-part="ammeter-reading" x="0" y="-134" fill="#f2f5f8" fontSize="15" fontWeight="700" textAnchor="middle">{readingText}<tspan fill="#9aa4b2" fontSize="11" fontWeight="600">{`  ${spec.label}`}</tspan></text>
      <text data-part="ammeter-name" x="98" y="-24" fill="#dfe4ea" fontSize="16" fontWeight="600" textAnchor="middle" letterSpacing="0.5">{label}</text>
    </g>
  )
}
