import type { Position } from '../../runtime/types'

export type CircuitMode = 'series' | 'parallel'
export type CircuitTerminalId = 'battery+' | 'battery-' | 'switch-a' | 'switch-b' | 'lamp1-a' | 'lamp1-b' | 'lamp2-a' | 'lamp2-b'

export interface CircuitTerminal extends Position {
  id: CircuitTerminalId
  label: string
}

export const TERMINAL_SNAP_RADIUS = 22

export const CIRCUIT_TERMINALS: Readonly<Record<CircuitTerminalId, CircuitTerminal>> = {
  'battery+': { id: 'battery+', label: '电源正极', x: 118, y: 270 },
  'battery-': { id: 'battery-', label: '电源负极', x: 118, y: 410 },
  'switch-a': { id: 'switch-a', label: '开关 A', x: 315, y: 270 },
  'switch-b': { id: 'switch-b', label: '开关 B', x: 405, y: 270 },
  'lamp1-a': { id: 'lamp1-a', label: '灯泡 1 A', x: 555, y: 205 },
  'lamp1-b': { id: 'lamp1-b', label: '灯泡 1 B', x: 555, y: 325 },
  'lamp2-a': { id: 'lamp2-a', label: '灯泡 2 A', x: 755, y: 205 },
  'lamp2-b': { id: 'lamp2-b', label: '灯泡 2 B', x: 755, y: 325 },
}

export const COMPONENT_INTERNAL_CONNECTIONS = [
  ['switch-a', 'switch-b'],
  ['lamp1-a', 'lamp1-b'],
  ['lamp2-a', 'lamp2-b'],
] as const

export function terminalAtPosition(position: Position): CircuitTerminalId | null {
  for (const terminal of Object.values(CIRCUIT_TERMINALS)) {
    if (Math.hypot(position.x - terminal.x, position.y - terminal.y) <= TERMINAL_SNAP_RADIUS) return terminal.id
  }
  return null
}
