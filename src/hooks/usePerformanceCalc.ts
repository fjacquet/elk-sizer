import { useMemo } from 'react'
import { calculatePerformance } from '@/engines/performance'
import { useConfigStore } from '@/store'
import type { ClusterResult, HardwareResult, PerformanceResult } from '@/types/results'

export function usePerformanceCalc(
  clusterResult: ClusterResult,
  hardwareResult: HardwareResult,
): PerformanceResult {
  const searchRate = useConfigStore((s) => s.searchRate)
  const indexingRate = useConfigStore((s) => s.indexingRate)
  const concurrentUsers = useConfigStore((s) => s.concurrentUsers)
  const dashboardCount = useConfigStore((s) => s.dashboardCount)
  const workloadProfile = useConfigStore((s) => s.workloadProfile)
  const indexCount = useConfigStore((s) => s.indexCount)
  const ilmEnabled = useConfigStore((s) => s.ilmEnabled)

  return useMemo(
    () =>
      calculatePerformance({
        searchRate,
        indexingRate,
        concurrentUsers,
        dashboardCount,
        workloadProfile,
        indexCount,
        ilmEnabled,
        clusterResult,
        hardwareResult,
      }),
    [
      searchRate,
      indexingRate,
      concurrentUsers,
      dashboardCount,
      workloadProfile,
      indexCount,
      ilmEnabled,
      clusterResult,
      hardwareResult,
    ],
  )
}
