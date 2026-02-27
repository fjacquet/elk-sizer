import { useMemo } from 'react'
import { calculateHardware } from '@/engines/hardware'
import { useConfigStore } from '@/store'
import type { ClusterResult, HardwareResult } from '@/types/results'

export function useHardwareCalc(clusterResult: ClusterResult): HardwareResult {
  const deploymentType = useConfigStore((s) => s.deploymentType)
  const frozenBackend = useConfigStore((s) => s.frozenBackend)

  return useMemo(
    () =>
      calculateHardware({
        clusterResult,
        deploymentType,
        frozenBackend,
      }),
    [clusterResult, deploymentType, frozenBackend],
  )
}
