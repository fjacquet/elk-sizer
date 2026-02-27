import type { ClusterResult, HardwareResult, PerformanceResult } from '@/types/results'
import { SIZING } from '@/types/sizing'
import { computeAvailableIOPS, computeTierIOPS } from './helpers/iopsCalculator'

export interface PerformanceEngineInput {
  searchRate: number
  indexingRate: number
  clusterResult: ClusterResult
  hardwareResult: HardwareResult
}

export function calculatePerformance(input: PerformanceEngineInput): PerformanceResult {
  const { searchRate, indexingRate, clusterResult, hardwareResult } = input

  // Only hot and warm tiers use SAN storage (cold/frozen use object storage)
  const perTier = clusterResult.tiers
    .filter((t) => t.tier === 'hot' || t.tier === 'warm')
    .map((t) => computeTierIOPS(t.tier, t.nodeCount, t.shardCount, searchRate, indexingRate))

  const totalRequiredIOPS = perTier.reduce((sum, t) => sum + t.totalIOPS, 0)

  const totalAvailableIOPS = computeAvailableIOPS(hardwareResult.bom.sanStorage)

  const iopsUtilization =
    totalAvailableIOPS > 0
      ? (totalRequiredIOPS * SIZING.IOPS_HEADROOM) / totalAvailableIOPS
      : 0

  return {
    perTier,
    totalRequiredIOPS,
    totalAvailableIOPS,
    iopsUtilization,
    isIOPSBottleneck: iopsUtilization > SIZING.IOPS_CRITICAL_THRESHOLD,
  }
}
