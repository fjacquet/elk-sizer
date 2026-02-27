import { useMemo } from 'react'
import { useConfigStore } from '@/store'
import type { CalculationResults, VMComparisonResult } from '@/types/results'
import { SIZING } from '@/types/sizing'
import { useClusterCalc } from './useClusterCalc'
import { useHardwareCalc } from './useHardwareCalc'
import { usePerformanceCalc } from './usePerformanceCalc'
import { useStorageCalc } from './useStorageCalc'
import { useSustainabilityCalc } from './useSustainabilityCalc'

export function useCalculations(): CalculationResults {
  const deploymentType = useConfigStore((s) => s.deploymentType)

  const storage = useStorageCalc()
  const cluster = useClusterCalc(storage)
  const hardware = useHardwareCalc(cluster)
  const sustainability = useSustainabilityCalc(hardware, cluster.totalNodes)
  const performance = usePerformanceCalc(cluster, hardware)

  const vmComparison = useMemo((): VMComparisonResult | null => {
    if (deploymentType !== 'vm') return null

    const vmOverhead = 1 - SIZING.VM_PERF_FACTOR
    return {
      baremetal: {
        totalNodes: cluster.totalNodes,
        totalStorageTB: cluster.totalStorageTB,
        totalMemoryTB: cluster.totalMemoryTB,
        estimatedCostUSD: hardware.estimatedCostUSD,
      },
      vm: {
        totalNodes: Math.ceil(cluster.totalNodes / SIZING.VM_PERF_FACTOR),
        totalStorageTB: cluster.totalStorageTB / SIZING.VM_STORAGE_FACTOR,
        totalMemoryTB: cluster.totalMemoryTB / SIZING.VM_PERF_FACTOR,
        estimatedCostUSD: hardware.estimatedCostUSD * (1 + vmOverhead),
        overheadPercent: vmOverhead * 100,
      },
    }
  }, [deploymentType, cluster, hardware])

  return {
    storage,
    cluster,
    hardware,
    sustainability,
    vmComparison,
    performance,
  }
}
