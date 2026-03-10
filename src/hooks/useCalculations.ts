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
    if (deploymentType === 'baremetal') return null

    const perfFactor = deploymentType === 'ece' ? SIZING.ECE_PERF_FACTOR : SIZING.VM_PERF_FACTOR
    const storageFactor =
      deploymentType === 'ece' ? SIZING.ECE_STORAGE_FACTOR : SIZING.VM_STORAGE_FACTOR
    const overhead = 1 - perfFactor

    return {
      baremetal: {
        totalNodes: cluster.totalNodes,
        totalStorageTB: cluster.totalStorageTB,
        totalMemoryTB: cluster.totalMemoryTB,
        estimatedCostUSD: hardware.estimatedCostUSD,
      },
      vm: {
        totalNodes: Math.ceil(cluster.totalNodes / perfFactor),
        totalStorageTB: cluster.totalStorageTB / storageFactor,
        totalMemoryTB: cluster.totalMemoryTB / perfFactor,
        estimatedCostUSD: hardware.estimatedCostUSD * (1 + overhead),
        overheadPercent: overhead * 100,
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
