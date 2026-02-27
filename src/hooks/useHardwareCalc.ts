import { useMemo } from 'react'
import { calculateHardware } from '@/engines/hardware'
import { useConfigStore } from '@/store'
import type { ClusterResult, HardwareResult } from '@/types/results'

export function useHardwareCalc(clusterResult: ClusterResult): HardwareResult {
  const deploymentType = useConfigStore((s) => s.deploymentType)
  const frozenBackend = useConfigStore((s) => s.frozenBackend)
  const serverModel = useConfigStore((s) => s.serverModel)
  const cpuOption = useConfigStore((s) => s.cpuOption)
  const storageModel = useConfigStore((s) => s.storageModel)

  return useMemo(
    () =>
      calculateHardware({
        clusterResult,
        deploymentType,
        frozenBackend,
        serverModel,
        cpuOption,
        storageModel,
      }),
    [clusterResult, deploymentType, frozenBackend, serverModel, cpuOption, storageModel],
  )
}
