import type { ClusterResult, HardwareResult, PerformanceResult } from '@/types/results'
import type { WorkloadProfile } from '@/types/sizing'
import { SIZING } from '@/types/sizing'
import {
  computeAvailableIOPS,
  computeFCUtilization,
  computeTierIOPS,
  computeTotalFCPorts,
  estimateLatency,
  lookupPowerStoreLatency,
} from './helpers/iopsCalculator'

export interface PerformanceEngineInput {
  searchRate: number
  indexingRate: number
  concurrentUsers: number
  dashboardCount: number
  workloadProfile: WorkloadProfile
  indexCount: number
  ilmEnabled: boolean
  clusterResult: ClusterResult
  hardwareResult: HardwareResult
}

export function calculatePerformance(input: PerformanceEngineInput): PerformanceResult {
  const {
    searchRate,
    indexingRate,
    concurrentUsers,
    dashboardCount,
    workloadProfile,
    indexCount,
    ilmEnabled,
    clusterResult,
    hardwareResult,
  } = input

  // Only hot and warm tiers use SAN storage (cold/frozen use object storage)
  const perTier = clusterResult.tiers
    .filter((t) => t.tier === 'hot' || t.tier === 'warm')
    .map((t) =>
      computeTierIOPS({
        tier: t.tier,
        nodeCount: t.nodeCount,
        shardCount: t.shardCount,
        searchRate,
        indexingRate,
        concurrentUsers,
        dashboardCount,
        workloadProfile,
        storageTierGB: t.storageGB,
        indexCount,
        ilmEnabled,
      }),
    )

  const totalRequiredIOPS = perTier.reduce((sum, t) => sum + t.totalIOPS, 0)
  const totalDashboardIOPS = perTier.reduce((sum, t) => sum + t.dashboardIOPS, 0)
  const totalBackgroundIOPS = perTier.reduce((sum, t) => sum + t.backgroundIOPS, 0)

  // Apply cache hit reduction
  const effectiveIOPS = totalRequiredIOPS * (1 - SIZING.CACHE_HIT_RATIO)

  const totalAvailableIOPS = computeAvailableIOPS(hardwareResult.bom.sanStorage)

  const iopsUtilization =
    totalAvailableIOPS > 0 ? (effectiveIOPS * SIZING.IOPS_HEADROOM) / totalAvailableIOPS : 0

  // Latency estimation from PowerStore model spec + utilization curve
  const firstSanModel = hardwareResult.bom.sanStorage[0]
  const baseLatency = firstSanModel ? lookupPowerStoreLatency(firstSanModel.model) : 0.5
  const estimatedLatencyMs = estimateLatency(baseLatency, Math.min(iopsUtilization, 1))

  // FC bandwidth utilization
  const totalFCPorts = computeTotalFCPorts(hardwareResult.bom.sanStorage)
  const fcUtilization = computeFCUtilization(
    effectiveIOPS,
    4, // 4 KB average IO size
    totalFCPorts,
    SIZING.FC_PORT_SPEED_GBPS,
  )

  return {
    perTier,
    totalRequiredIOPS,
    totalAvailableIOPS,
    iopsUtilization,
    isIOPSBottleneck: iopsUtilization > SIZING.IOPS_CRITICAL_THRESHOLD,
    dashboardIOPS: totalDashboardIOPS,
    backgroundIOPS: totalBackgroundIOPS,
    estimatedLatencyMs,
    fcUtilization,
  }
}
