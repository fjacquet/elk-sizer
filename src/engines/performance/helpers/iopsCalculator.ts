import powerstoreData from '@/data/dell-powerstore.json'
import type { BOMStorageEntry, PowerStoreModel } from '@/types/hardware'
import type { TierIOPSResult } from '@/types/results'
import type { ElasticTier, WorkloadProfile } from '@/types/sizing'
import { SIZING, WORKLOAD_PROFILES } from '@/types/sizing'

const powerstoreModels = powerstoreData as PowerStoreModel[]

export interface TierIOPSInput {
  tier: ElasticTier
  nodeCount: number
  shardCount: number
  searchRate: number
  indexingRate: number
  concurrentUsers: number
  dashboardCount: number
  workloadProfile: WorkloadProfile
  storageTierGB: number
  indexCount: number
  ilmEnabled: boolean
}

export const lookupPowerStoreMaxIOPS = (modelName: string): number =>
  powerstoreModels.find((m) => m.model === modelName)?.maxIOPS ?? 0

export const lookupPowerStoreLatency = (modelName: string): number =>
  powerstoreModels.find((m) => m.model === modelName)?.latencyMs ?? 0.5

export const lookupPowerStoreFCPorts = (modelName: string): number =>
  powerstoreModels.find((m) => m.model === modelName)?.fcPorts ?? 0

export const computeAvailableIOPS = (sanStorage: BOMStorageEntry[]): number =>
  sanStorage.reduce((sum, entry) => sum + lookupPowerStoreMaxIOPS(entry.model) * entry.count, 0)

export const computeTotalFCPorts = (sanStorage: BOMStorageEntry[]): number =>
  sanStorage.reduce((sum, entry) => sum + lookupPowerStoreFCPorts(entry.model) * entry.count, 0)

export const estimateLatency = (baseLatencyMs: number, utilization: number): number =>
  utilization < 0.5
    ? baseLatencyMs
    : utilization < 0.8
      ? baseLatencyMs * (1 + (utilization - 0.5) * 4)
      : baseLatencyMs * (1 + (utilization - 0.5) * 4 + (utilization - 0.8) ** 2 * 50)

export const computeFCUtilization = (
  totalIOPS: number,
  ioSizeKB: number,
  fcPorts: number,
  fcSpeedGbps: number,
): number => {
  const requiredGbps = (totalIOPS * ioSizeKB * 8) / (1024 * 1024)
  return fcPorts > 0 ? requiredGbps / (fcPorts * fcSpeedGbps) : 0
}

export function computeTierIOPS(input: TierIOPSInput): TierIOPSResult {
  const {
    tier,
    nodeCount,
    shardCount,
    searchRate,
    indexingRate,
    concurrentUsers,
    dashboardCount,
    workloadProfile,
    storageTierGB,
    indexCount,
    ilmEnabled,
  } = input

  const zeroResult = {
    tier,
    estimatedWriteIOPS: 0,
    estimatedReadIOPS: 0,
    dashboardIOPS: 0,
    backgroundIOPS: 0,
    totalIOPS: 0,
  }

  // Cold/frozen tiers use object storage — no SAN IOPS
  if (tier === 'cold' || tier === 'frozen' || nodeCount <= 0) {
    return zeroResult
  }

  const profile = WORKLOAD_PROFILES[workloadProfile]
  const shardsHitPerQuery = shardCount / nodeCount

  // Write IOPS — hot tier only (active indexing)
  const estimatedWriteIOPS =
    tier === 'hot' && indexingRate > 0
      ? ((indexingRate * profile.avgDocSizeKB) / 1024 / 4) * 1024 * profile.writeAmplification
      : 0

  // Read IOPS — profile-driven search fractions
  const fractionMap: Partial<Record<ElasticTier, number>> = {
    hot: profile.searchFractionHot,
    warm: profile.searchFractionWarm,
  }
  const fraction = fractionMap[tier] ?? 0
  const estimatedReadIOPS = searchRate * fraction * shardsHitPerQuery * SIZING.IOPS_PER_SEARCH_SHARD

  // Dashboard IOPS — Kibana dashboards generate background queries (hot tier only)
  const dashboardIOPS =
    tier === 'hot' && dashboardCount > 0
      ? dashboardCount *
        (SIZING.DASHBOARD_QUERIES_PER_REFRESH / SIZING.DASHBOARD_REFRESH_SEC) *
        concurrentUsers *
        profile.dashboardMultiplier *
        shardsHitPerQuery *
        SIZING.IOPS_PER_SEARCH_SHARD
      : 0

  // Background IOPS — ILM, snapshots, segment merges
  const ilmIOPS = ilmEnabled
    ? indexCount * SIZING.ILM_ROLLOVER_IOPS_PER_INDEX +
      (storageTierGB / 1024) * SIZING.SNAPSHOT_IOPS_PER_TB
    : 0
  const segmentMergeIOPS = (estimatedWriteIOPS + estimatedReadIOPS) * SIZING.SEGMENT_MERGE_FACTOR
  const backgroundIOPS = ilmIOPS + segmentMergeIOPS

  return {
    tier,
    estimatedWriteIOPS,
    estimatedReadIOPS,
    dashboardIOPS,
    backgroundIOPS,
    totalIOPS: estimatedWriteIOPS + estimatedReadIOPS + dashboardIOPS + backgroundIOPS,
  }
}
