import { useMemo } from 'react'
import { calculateCluster } from '@/engines/cluster'
import { useConfigStore } from '@/store'
import type { ClusterResult, StorageResult } from '@/types/results'

export function useClusterCalc(storageResult: StorageResult): ClusterResult {
  const memoryPerNode = useConfigStore((s) => s.memoryPerNode)
  const jvmHeapOverride = useConfigStore((s) => s.jvmHeapOverride)

  return useMemo(() => {
    return calculateCluster({
      storageResult,
      serverMemoryGB: memoryPerNode,
      jvmHeapOverride,
    })
  }, [storageResult, memoryPerNode, jvmHeapOverride])
}
