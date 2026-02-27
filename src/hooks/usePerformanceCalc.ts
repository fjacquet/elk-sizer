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

  return useMemo(
    () => calculatePerformance({ searchRate, indexingRate, clusterResult, hardwareResult }),
    [searchRate, indexingRate, clusterResult, hardwareResult],
  )
}
