export type ElasticTier = 'hot' | 'warm' | 'cold' | 'frozen'
export type DeploymentType = 'vm' | 'baremetal' | 'ece'
export type WorkloadProfile = 'logging' | 'observability' | 'siem' | 'search' | 'mixed'
export type FrozenBackend = 'powerscale' | 'ecs'
export type CompressionCodec = 'lz4' | 'deflate' | 'best_compression'
export type NodeRole =
  | 'data_hot'
  | 'data_warm'
  | 'data_cold'
  | 'data_frozen'
  | 'master'
  | 'ingest'
  | 'coordinating'
  | 'ml'
export type UnitSystem = 'binary' | 'decimal'
export type CarbonRegion = 'switzerland' | 'france' | 'germany' | 'italy' | 'us_avg' | 'uk'
export type NetworkSpeed = '10GbE' | '25GbE' | '100GbE'

export const ELASTIC_TIERS: readonly ElasticTier[] = ['hot', 'warm', 'cold', 'frozen'] as const

export interface TierSizing {
  tier: ElasticTier
  storageGB: number
  nodeCount: number
  memoryPerNodeGB: number
  jvmHeapGB: number
  cpuCoresPerNode: number
  shardCount: number
  serverModel: string
}

export interface NodeSizing {
  role: NodeRole
  nodeCount: number
  memoryPerNodeGB: number
  cpuCoresPerNode: number
  jvmHeapGB: number
  serverModel: string
}

export interface ClusterSizing {
  tiers: TierSizing[]
  masterNodes: NodeSizing
  ingestNodes: NodeSizing
  coordinatingNodes: NodeSizing
  totalNodes: number
  totalStorageTB: number
  totalMemoryTB: number
}

export const SIZING = {
  MEMORY_STORAGE_RATIO: {
    hot: 1 / 30,
    warm: 1 / 160,
    cold: 1 / 500,
    frozen: 1 / 1600,
  } as Record<ElasticTier, number>,
  INDEXING_RATIO: {
    lz4: 1.1,
    deflate: 0.85,
    best_compression: 0.7,
  } as Record<CompressionCodec, number>,
  WATERMARK_BUFFER: 1.25,
  JVM_HEAP_MAX_GB: 31,
  JVM_HEAP_RATIO: 0.5,
  MAX_SHARDS_PER_GB_HEAP: 20,
  VM_PERF_FACTOR: 0.78,
  VM_STORAGE_FACTOR: 0.86,
  SHARD_SIZE_TARGET_GB: {
    hot: 50,
    warm: 50,
    cold: 50,
    frozen: 50,
  } as Record<ElasticTier, number>,
  FILESYSTEM_OVERHEAD: 0.05,
  MIN_NODES_PER_TIER: 2,
  MASTER_NODE_COUNT_SMALL: 3,
  MASTER_NODE_COUNT_LARGE: 5,
  LARGE_CLUSTER_THRESHOLD: 20,
  IOPS_WRITE_AMPLIFICATION: 4,
  IOPS_PER_SEARCH_SHARD: 20,
  AVG_DOC_SIZE_KB: 1,
  IOPS_HEADROOM: 1.3,
  HOT_SEARCH_FRACTION: 0.75,
  WARM_SEARCH_FRACTION: 0.2,
  IOPS_WARNING_THRESHOLD: 0.6,
  IOPS_CRITICAL_THRESHOLD: 0.8,
  ECE_PERF_FACTOR: 0.72,
  ECE_STORAGE_FACTOR: 0.82,
  ILM_ROLLOVER_IOPS_PER_INDEX: 50,
  SEGMENT_MERGE_FACTOR: 0.15,
  SNAPSHOT_IOPS_PER_TB: 500,
  CACHE_HIT_RATIO: 0.3,
  DASHBOARD_QUERIES_PER_REFRESH: 5,
  DASHBOARD_REFRESH_SEC: 30,
  FC_PORT_SPEED_GBPS: 32,
} as const

export interface WorkloadProfileConfig {
  searchFractionHot: number
  searchFractionWarm: number
  avgDocSizeKB: number
  writeAmplification: number
  dashboardMultiplier: number
}

export const WORKLOAD_PROFILES: Record<WorkloadProfile, WorkloadProfileConfig> = {
  logging: {
    searchFractionHot: 0.6,
    searchFractionWarm: 0.15,
    avgDocSizeKB: 1,
    writeAmplification: 4,
    dashboardMultiplier: 1.0,
  },
  observability: {
    searchFractionHot: 0.8,
    searchFractionWarm: 0.25,
    avgDocSizeKB: 0.5,
    writeAmplification: 4,
    dashboardMultiplier: 1.5,
  },
  siem: {
    searchFractionHot: 0.9,
    searchFractionWarm: 0.3,
    avgDocSizeKB: 2,
    writeAmplification: 6,
    dashboardMultiplier: 2.0,
  },
  search: {
    searchFractionHot: 0.95,
    searchFractionWarm: 0.4,
    avgDocSizeKB: 3,
    writeAmplification: 3,
    dashboardMultiplier: 0.5,
  },
  mixed: {
    searchFractionHot: 0.75,
    searchFractionWarm: 0.2,
    avgDocSizeKB: 1,
    writeAmplification: 4,
    dashboardMultiplier: 1.2,
  },
}
