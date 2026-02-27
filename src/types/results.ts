import type { HardwareBOM } from './hardware'
import type { ClusterSizing, ElasticTier } from './sizing'

export interface StorageResult {
  perTier: TierStorageResult[]
  totalRawTB: number
  totalEffectiveTB: number
}

export interface TierStorageResult {
  tier: ElasticTier
  dailyIngestGB: number
  retentionDays: number
  compressionRatio: number
  replicaOverhead: number
  rawStorageGB: number
  effectiveStorageGB: number
  watermarkBufferedGB: number
}

export interface ClusterResult extends ClusterSizing {
  totalShards: number
  maxShardsCapacity: number
  shardUtilization: number
}

export interface HardwareResult {
  bom: HardwareBOM
  totalRackUnits: number
  estimatedCostUSD: number
}

export interface SustainabilityResult {
  totalPowerWatts: number
  pueAdjustedPowerWatts: number
  annualEnergyKWh: number
  annualCO2Kg: number
  annualEnergyCostUSD: number
  tcoYears: number
  totalTCO: number
  hardwareCostUSD: number
  energyCostUSD: number
  licenseCostUSD: number
}

export interface VMComparisonResult {
  baremetal: {
    totalNodes: number
    totalStorageTB: number
    totalMemoryTB: number
    estimatedCostUSD: number
  }
  vm: {
    totalNodes: number
    totalStorageTB: number
    totalMemoryTB: number
    estimatedCostUSD: number
    overheadPercent: number
  }
}

export interface CalculationResults {
  storage: StorageResult
  cluster: ClusterResult
  hardware: HardwareResult
  sustainability: SustainabilityResult
  vmComparison: VMComparisonResult | null
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export interface SankeyNode {
  id: string
  name: string
  tier?: ElasticTier
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}
