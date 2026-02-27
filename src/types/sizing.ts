export type ElasticTier = 'hot' | 'warm' | 'cold' | 'frozen'
export type DeploymentType = 'vm' | 'baremetal'
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
  RAID_WRITE_PENALTY: { raid5: 4, raid6: 6, raid10: 2 } as Record<string, number>,
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
  IOPS_HEADROOM: 1.30,
  HOT_SEARCH_FRACTION: 0.75,
  WARM_SEARCH_FRACTION: 0.20,
  IOPS_WARNING_THRESHOLD: 0.60,
  IOPS_CRITICAL_THRESHOLD: 0.80,
} as const
