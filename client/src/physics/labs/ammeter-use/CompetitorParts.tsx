/**
 * 竞品同款实物器材绘制（NB 物理实验视觉）。
 *
 * 器材外形按竞品截图还原：金属底座的电池座、灯泡连灯座、单刀开关（刀片抬起/合下）、
 * 圆形表盘电流表（0～0.6A / 0～3A 双排刻度），配合红色实物导线。
 * 坐标全部使用 competitorScene.ts 中由竞品真实场景反算出的世界坐标。
 */
import { NEEDLE_LIMIT_ANGLE, RANGE_SPEC, needleAngle, type AmmeterRangeId } from './definition'

const metalLight = '#e6e8ea'
const metalMid = '#b9bec4'
const metalDark = '#7b828a'
const metalEdge = '#5b6169'
const redTerminal = '#c0392b'
const blackTerminal = '#2b2f36'

function terminalColor(polarity: '+' | '-') {
  return polarity === '+' ? redTerminal : blackTerminal
}

/** 接线柱：立柱 + 旋帽，红/黑区分正负（竞品同款） */
export function TerminalPost({ x, y, polarity, connected }: { x: number; y: number; polarity: '+' | '-'; connected: boolean }) {
  const color = terminalColor(polarity)
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <ellipse cx="0" cy="4" rx="9" ry="3.4" fill="#000000" opacity="0.22" />
      <rect x="-4.4" y="-9" width="8.8" height="13" rx="2" fill={metalMid} stroke={metalEdge} strokeWidth="0.8" />
      <circle cx="0" cy="-12" r="7.6" fill={color} stroke="#00000022" strokeWidth="0.8" />
      <circle cx="0" cy="-12.8" r="4.4" fill="#ffffff" opacity={connected ? 0.42 : 0.22} />
    </g>
  )
}

/**
 * 电池座 E1：单节细长圆柱干电池（深灰壳体 + 橙色色环 + 金属正极铜帽）
 * 安放在银色长条底座上，两端为黑色（－）与红色（+）接线柱 —— 与竞品截图一致。
 */
export function BatteryHolderE1({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="20" rx="124" ry="10" fill="#000000" opacity="0.2" />
      {/* 银色底座 */}
      <rect x="-120" y="0" width="240" height="18" rx="3" fill={metalMid} stroke={metalEdge} strokeWidth="1.1" />
      <rect x="-120" y="-3" width="240" height="7" rx="3" fill={metalLight} opacity="0.7" />
      {/* 电池托架 */}
      <rect x="-84" y="-26" width="172" height="28" rx="4" fill={metalMid} stroke={metalEdge} strokeWidth="1" />
      <rect x="-84" y="-30" width="8" height="34" rx="2" fill={metalDark} />
      <rect x="80" y="-30" width="8" height="34" rx="2" fill={metalDark} />
      {/* 电池本体：深灰壳体 + 橙色色环 */}
      <rect x="-78" y="-31" width="160" height="30" rx="13" fill="#4a4d52" stroke="#2f3237" strokeWidth="1" />
      <rect x="-78" y="-31" width="160" height="12" rx="6" fill="#5c6066" opacity="0.55" />
      <rect x="-46" y="-31" width="18" height="30" fill="#c0762f" />
      <rect x="14" y="-31" width="22" height="30" fill="#c0762f" />
      <rect x="-78" y="-31" width="8" height="30" rx="4" fill="#33363a" />
      {/* 正极铜帽 */}
      <rect x="80" y="-26" width="12" height="20" rx="4" fill="#d8b26a" stroke="#a8863f" strokeWidth="0.8" />
      {/* 极性标记 */}
      <text x="66" y="-11" fill="#f2f4f7" fontSize="13" fontWeight="700" textAnchor="middle">+</text>
      <text x="-70" y="-11" fill="#f2f4f7" fontSize="13" fontWeight="700" textAnchor="middle">－</text>
      <text x="0" y="44" fill="#d8dde3" fontSize="17" fontWeight="600" textAnchor="middle">E1</text>
    </g>
  )
}

/** 灯泡 + 灯座 L1：玻璃泡（发光时黄色）+ 金属底座 */
export function LampHolderL1({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {lit && <circle cx="0" cy="-52" r="46" fill="#ffd76b" opacity="0.22" />}
      <ellipse cx="0" cy="18" rx="86" ry="10" fill="#000000" opacity="0.18" />
      <rect x="-82" y="0" width="164" height="18" rx="3" fill={metalMid} stroke={metalEdge} strokeWidth="1.1" />
      <rect x="-82" y="-3" width="164" height="7" rx="3" fill={metalLight} opacity="0.7" />
      <rect x="-26" y="-30" width="52" height="30" rx="3" fill={metalMid} stroke={metalEdge} strokeWidth="1" />
      <rect x="-26" y="-34" width="52" height="8" rx="2" fill={metalDark} />
      <path
        d="M -21 -34 L -21 -58 Q 0 -84 21 -58 L 21 -34 Z"
        fill={lit ? '#ffeaa7' : 'rgba(205,220,235,0.35)'}
        stroke={lit ? '#f2ca5c' : '#9fb0c2'}
        strokeWidth="1.8"
      />
      <path d="M -9 -38 Q 0 -62 9 -38" fill="none" stroke={lit ? '#d99b1f' : '#b3c3d4'} strokeWidth="1.8" />
      <text x="0" y="44" fill="#d8dde3" fontSize="17" fontWeight="600" textAnchor="middle">L1</text>
    </g>
  )
}

/** 单刀开关 S：刀片抬起 / 合下两种状态；标签可配 S1 / S2 */
export function KnifeSwitch({ x, y, closed, label }: { x: number; y: number; closed: boolean; label: string }) {
  const knifeAngle = closed ? 0 : -38
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="20" rx="92" ry="10" fill="#000000" opacity="0.18" />
      <rect x="-88" y="2" width="176" height="18" rx="3" fill={metalMid} stroke={metalEdge} strokeWidth="1.1" />
      <rect x="-88" y="-1" width="176" height="7" rx="3" fill={metalLight} opacity="0.7" />
      {/* 左侧刀架与转轴 */}
      <rect x="-62" y="-14" width="12" height="20" rx="2" fill={metalDark} />
      {/* 刀片：以左端为轴旋转 */}
      <g transform={`rotate(${knifeAngle} -56 -4)`}>
        <rect x="-56" y="-8" width="112" height="7" rx="3.5" fill="#d9dde1" stroke="#8b929a" strokeWidth="0.9" />
        <circle cx="52" cy="-4.5" r="5" fill="#c8ccd1" stroke="#8b929a" strokeWidth="0.8" />
      </g>
      <circle cx="-56" cy="-4" r="7" fill={metalDark} />
      <circle cx="-56" cy="-4" r="3" fill="#aab0b6" />
      {/* 右侧触点 */}
      <rect x="44" y="-12" width="13" height="20" rx="2" fill={metalDark} />
      <text x="0" y="44" fill="#d8dde3" fontSize="17" fontWeight="600" textAnchor="middle">{label}</text>
    </g>
  )
}

/**
 * 电流表 A1：银色金属表体 + 白色表盘。
 * 表盘按竞品布局：外圈刻度 0～3（0 在左上、3 在右上），内圈刻度 0～0.6，
 * 中央大字「A」，指针自下方圆心向上偏转；底部三只接线柱 － / 0.6A / 3A。
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
  const angle = needleAngle(reading, activeRange)
  const radius = 54

  // 双排刻度：外圈 30 格 / 内圈 30 格
  const ticks: Array<{ angle: number; major: boolean }> = []
  for (let index = 0; index <= 30; index += 1) {
    ticks.push({ angle: -NEEDLE_LIMIT_ANGLE + (index / 30) * NEEDLE_LIMIT_ANGLE * 2, major: index % 5 === 0 })
  }
  const polar = (angleDeg: number, distance: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: Math.sin(rad) * distance, y: -Math.cos(rad) * distance }
  }
  const outerLabels = [0, 1, 2, 3].map((value, index) => ({ value, ratio: index / 3 }))
  const innerLabels = [0, 0.2, 0.4, 0.6].map((value, index) => ({ value, ratio: index / 3 }))

  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="58" rx="84" ry="9" fill="#000000" opacity="0.22" />
      {/* 表体外壳：银灰 */}
      <rect x="-80" y="-58" width="160" height="116" rx="5" fill={metalMid} stroke={metalEdge} strokeWidth="1.4" />
      <rect x="-80" y="-58" width="160" height="9" rx="4" fill="#22252a" />
      <rect x="-80" y="49" width="160" height="9" rx="4" fill="#22252a" />
      {/* 表盘 */}
      <rect x="-70" y="-46" width="140" height="90" rx="3" fill="#fbfbf8" stroke="#9aa0a7" strokeWidth="1" />
      {/* 上排读数显示 */}
      <text x="0" y="-56" fill="#eef2f6" fontSize="15" fontWeight="700" textAnchor="middle">{reading.toFixed(2)} A</text>
      <g transform="translate(0 22)">
        {ticks.map((tick, index) => {
          const outer = polar(tick.angle, tick.major ? radius : radius - 6)
          const inner = polar(tick.angle, radius - (tick.major ? 16 : 11))
          return (
            <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#33302c"
              strokeWidth={tick.major ? 1.7 : 0.9} strokeLinecap="round" />
          )
        })}
        {/* 外圈 0～3 */}
        {outerLabels.map((item) => {
          const point = polar(-NEEDLE_LIMIT_ANGLE + item.ratio * NEEDLE_LIMIT_ANGLE * 2, radius - 24)
          return <text key={`o-${item.value}`} x={point.x} y={point.y + 3} fill="#33302c" fontSize="9" fontWeight="600" textAnchor="middle">{item.value}</text>
        })}
        {/* 内圈 0～0.6 */}
        {innerLabels.map((item) => {
          const point = polar(-NEEDLE_LIMIT_ANGLE + item.ratio * NEEDLE_LIMIT_ANGLE * 2, radius - 37)
          return <text key={`i-${item.value}`} x={point.x} y={point.y + 3} fill="#5a5651" fontSize="8" textAnchor="middle">{item.value}</text>
        })}
        {/* 指针 */}
        <g transform={`rotate(${angle})`}>
          <rect x="-1" y={-(radius - 12)} width="2" height={radius - 12} rx="1" fill={overRange ? '#c0392b' : '#1b1b1b'} />
        </g>
        <circle cx="0" cy="0" r="5" fill="#6b6f74" />
        <circle cx="0" cy="0" r="2" fill="#d9d4cb" />
      </g>
      {/* 中央大字 A */}
      <text x="0" y="30" fill="#33302c" fontSize="26" fontWeight="700" textAnchor="middle">A</text>
      {/* 量程规格 */}
      <text x="-84" y="8" fill="#8f979f" fontSize="9.5" textAnchor="middle">{spec.label}</text>
      {/* 接线柱文字 */}
      <text x="-52" y="70" fill="#12151a" fontSize="11" fontWeight="700" textAnchor="middle">－</text>
      <text x="0" y="70" fill="#12151a" fontSize="11" fontWeight="700" textAnchor="middle">0.6A</text>
      <text x="52" y="70" fill="#12151a" fontSize="11" fontWeight="700" textAnchor="middle">3A</text>
      <text x="90" y="22" fill="#d8dde3" fontSize="15" fontWeight="600" textAnchor="middle">{label}</text>
    </g>
  )
}
