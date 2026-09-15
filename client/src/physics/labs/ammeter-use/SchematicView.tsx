/**
 * 「转电路图」原理图视图：按人教版标准电路符号绘制。
 * 对应竞品左上角「转电路图」按钮切换后的画面 —— 符号 + 电流方向 + 实时读数。
 */
import { RANGE_SPEC } from './definition'
import type { AmmeterLabState } from './controller'

const ink = '#e8edf3'
const accent = '#e8756a'

function SchematicBulb({ x, y, lit, label }: { x: number; y: number; lit: boolean; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="20" fill={lit ? '#ffe9a8' : 'none'} stroke={lit ? '#f0c86a' : ink} strokeWidth="3" />
      <line x1={x - 12} y1={y - 12} x2={x + 12} y2={y + 12} stroke={lit ? '#f0c86a' : ink} strokeWidth="2.5" />
      <line x1={x + 12} y1={y - 12} x2={x - 12} y2={y + 12} stroke={lit ? '#f0c86a' : ink} strokeWidth="2.5" />
      <text x={x} y={y + 42} fill={ink} fontSize="15" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
}

function SchematicSwitch({ x, y, closed, label }: { x: number; y: number; closed: boolean; label: string }) {
  return (
    <g>
      <line x1={x - 34} y1={y} x2={x - 8} y2={y} stroke={ink} strokeWidth="3" />
      <line x1={x + 34} y1={y} x2={x + 8} y2={y} stroke={ink} strokeWidth="3" />
      <line x1={x - 8} y1={y} x2={closed ? x + 8 : x + 4} y2={closed ? y : y - 26} stroke={ink} strokeWidth="3" />
      <circle cx={x - 8} cy={y} r="4" fill={ink} />
      <circle cx={x + 8} cy={y} r="4" fill={ink} />
      <text x={x} y={y + 34} fill={ink} fontSize="15" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
}

export function AmmeterSchematic({ state, reading }: { state: AmmeterLabState; reading: number }) {
  const lit = state.switchClosed && reading > 0
  const rangeLabel = state.activeRange === null ? '未接入电流表' : `${RANGE_SPEC[state.activeRange].label}`

  return (
    <g>
      <text x="60" y="60" fill={ink} fontSize="17" fontWeight="700">练习使用电流表 · 电路图</text>
      <text x="60" y="86" fill="#9aa4b2" fontSize="13">电流表串联在待测电路中，电流从“+”接线柱流入</text>

      {/* 主回路 */}
      <path d="M 200 360 L 200 440 L 800 440 L 800 200 L 200 200 L 200 250" fill="none" stroke={ink} strokeWidth="3" />

      {/* 电源 E1 */}
      <g>
        <line x1="186" y1="250" x2="214" y2="250" stroke={ink} strokeWidth="3" />
        <line x1="176" y1="268" x2="224" y2="268" stroke={ink} strokeWidth="3" />
        <line x1="186" y1="286" x2="214" y2="286" stroke={ink} strokeWidth="3" />
        <line x1="176" y1="304" x2="224" y2="304" stroke={ink} strokeWidth="3" />
        <text x="146" y="282" fill={ink} fontSize="16" fontWeight="700" textAnchor="middle">E1</text>
        <text x="238" y="244" fill={accent} fontSize="14" fontWeight="700">+</text>
        <text x="238" y="320" fill={ink} fontSize="14" fontWeight="700">－</text>
      </g>

      {/* 开关 S1（干路） */}
      <SchematicSwitch x={330} y={440} closed={state.switchClosed} label="S1" />
      {/* 开关 S2（支路侧） */}
      <SchematicSwitch x={330} y={200} closed={state.switchClosed} label="S2" />

      {/* 灯泡 L1 */}
      <SchematicBulb x={560} y={200} lit={lit} label="L1" />

      {/* 电流表 A1 */}
      <g transform="translate(760 320)">
        <circle cx="0" cy="0" r="32" fill="#3b4048" stroke={ink} strokeWidth="3" />
        <text x="0" y="9" fill={ink} fontSize="22" fontWeight="700" textAnchor="middle">A</text>
        <text x="46" y="9" fill={ink} fontSize="15" fontWeight="700" textAnchor="middle">A1</text>
        <text x="-22" y="-40" fill={accent} fontSize="14" fontWeight="700">+</text>
        <text x="-22" y="50" fill={ink} fontSize="14" fontWeight="700">－</text>
      </g>

      {/* 读数 */}
      <rect x="560" y="104" width="240" height="34" rx="6" fill="#3b4048" stroke="#5a616a" />
      <text x="680" y="127" fill="#f0c86a" fontSize="14" fontWeight="700" textAnchor="middle">{rangeLabel} · {reading.toFixed(2)} A</text>

      {/* 电流方向 */}
      <g fill={accent}>
        <path d="M 262 440 l 14 6 l -14 6 z" />
        <path d="M 740 260 l 6 -12 l 6 12 z" />
      </g>
      <text x="252" y="424" fill={accent} fontSize="13" fontWeight="700">电流 I</text>
    </g>
  )
}
