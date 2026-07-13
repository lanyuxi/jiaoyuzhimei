import type { PhysicsExperimentalCondition, PhysicsMeasurementRecord } from '../sessions/types'

export interface MeasurementGroup {
  trialId: string
  conditions: readonly PhysicsExperimentalCondition[]
  measurements: readonly PhysicsMeasurementRecord[]
}

export function groupMeasurementsByTrial(measurements: readonly PhysicsMeasurementRecord[]): MeasurementGroup[] {
  const groups = new Map<string, {
    trialId: string
    conditions: readonly PhysicsExperimentalCondition[]
    measurements: PhysicsMeasurementRecord[]
  }>()

  for (const measurement of measurements) {
    const current = groups.get(measurement.trialId)
    if (current) {
      current.measurements.push(measurement)
      continue
    }

    groups.set(measurement.trialId, {
      trialId: measurement.trialId,
      conditions: measurement.conditions,
      measurements: [measurement],
    })
  }

  return [...groups.values()]
}

export interface MeasurementTableProps {
  measurements: readonly PhysicsMeasurementRecord[]
  emptyLabel?: string
}

export default function MeasurementTable({
  measurements,
  emptyLabel = '尚未记录读数。',
}: MeasurementTableProps) {
  const groups = groupMeasurementsByTrial(measurements)

  if (groups.length === 0) {
    return <p className="text-sm leading-6 text-[#8a867f]">{emptyLabel}</p>
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.trialId} className="border-t border-[#ece8df] pt-4 first:border-t-0 first:pt-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#242424]">第 {group.trialId} 组</h3>
            <p className="text-xs text-[#8a867f]">
              {group.conditions.map((condition) => `${condition.label}: ${condition.value}`).join('；')}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left text-sm">
              <thead className="border-y border-[#ece8df] text-xs text-[#77716a]">
                <tr>
                  <th className="px-2 py-2 font-semibold">读数</th>
                  <th className="px-2 py-2 font-semibold">数值</th>
                  <th className="px-2 py-2 font-semibold">类型</th>
                </tr>
              </thead>
              <tbody>
                {group.measurements.map((measurement) => (
                  <tr key={`${measurement.trialId}-${measurement.key}-${measurement.at}`} className="border-b border-[#f0ede7] text-[#4b4742]">
                    <td className="px-2 py-2.5 font-medium">{measurement.label}</td>
                    <td className="px-2 py-2.5">{measurement.value} {measurement.unit}</td>
                    <td className="px-2 py-2.5">{measurement.kind === 'derived' ? '计算值' : measurement.kind === 'observation' ? '现象' : '原始读数'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
