import { useMemo } from 'react'
import dellServers from '@/data/dell-servers.json'
import { calculateCluster } from '@/engines/cluster'
import { useConfigStore } from '@/store'
import type { DellServer } from '@/types/hardware'
import type { ClusterResult, StorageResult } from '@/types/results'

const servers = dellServers as DellServer[]

export function useClusterCalc(storageResult: StorageResult): ClusterResult {
  const serverModel = useConfigStore((s) => s.serverModel)
  const jvmHeapOverride = useConfigStore((s) => s.jvmHeapOverride)

  return useMemo(() => {
    const server = servers.find((s) => s.id === serverModel)
    const serverMemoryGB = server ? Math.min(server.maxMemoryGB, 256) : 64

    return calculateCluster({
      storageResult,
      serverMemoryGB,
      jvmHeapOverride,
    })
  }, [storageResult, serverModel, jvmHeapOverride])
}
