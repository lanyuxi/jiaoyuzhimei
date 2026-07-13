import type { TextbookPhysicsExperiment } from './curriculum/types'
import { labRegistry, type RegisteredLab } from './labs/registry'

export type LabRegistrationResolution =
  | { kind: 'registered'; registeredLab: RegisteredLab }
  | { kind: 'scheduled' }
  | { kind: 'configuration-error'; experimentId: string }

export function resolveLabRegistration(
  experiment: TextbookPhysicsExperiment,
  registry: ReadonlyMap<string, RegisteredLab> = labRegistry,
): LabRegistrationResolution {
  if (experiment.availability !== 'available') return { kind: 'scheduled' }

  const registeredLab = registry.get(experiment.labId ?? experiment.id)
  return registeredLab
    ? { kind: 'registered', registeredLab }
    : { kind: 'configuration-error', experimentId: experiment.id }
}

export interface PhysicsLabHostProps {
  experiment: TextbookPhysicsExperiment
}

export default function PhysicsLabHost({ experiment }: PhysicsLabHostProps) {
  const resolution = resolveLabRegistration(experiment)

  if (resolution.kind === 'registered') {
    const { Lab } = resolution.registeredLab
    return <Lab experiment={experiment} />
  }

  if (resolution.kind === 'scheduled') {
    return <p className="text-sm text-[#77716a]">该实验正在制作中。</p>
  }

  return (
    <section role="alert" className="border border-[#d66b5f] bg-[#fff5f3] px-5 py-4 text-[#7a3028]">
      <h2 className="text-lg font-bold">实验配置错误</h2>
      <p className="mt-2 text-sm leading-6">该实验已标记为可用，但尚未注册实验台组件（{resolution.experimentId}）。</p>
    </section>
  )
}
