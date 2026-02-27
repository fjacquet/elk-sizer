import type { TierStorageResult } from '@/types/results'
import type { ElasticTier, TierSizing } from '@/types/sizing'
import { SIZING } from '@/types/sizing'

export function calculateTierNodes(
  tierStorage: TierStorageResult,
  serverMemoryGB: number,
): TierSizing {
  const { tier, watermarkBufferedGB } = tierStorage

  if (watermarkBufferedGB <= 0) {
    return {
      tier,
      storageGB: 0,
      nodeCount: 0,
      memoryPerNodeGB: 0,
      jvmHeapGB: 0,
      cpuCoresPerNode: 0,
      shardCount: 0,
      serverModel: '',
    }
  }

  const memoryRatio = SIZING.MEMORY_STORAGE_RATIO[tier]
  const requiredMemoryGB = watermarkBufferedGB * memoryRatio

  // Node count based on memory requirement vs per-node memory
  const rawNodeCount = Math.ceil(requiredMemoryGB / serverMemoryGB)
  const nodeCount = Math.max(rawNodeCount, SIZING.MIN_NODES_PER_TIER)

  const memoryPerNodeGB = serverMemoryGB

  // JVM heap: 50% of RAM, max 31GB
  const jvmHeapGB = Math.min(
    Math.floor(memoryPerNodeGB * SIZING.JVM_HEAP_RATIO),
    SIZING.JVM_HEAP_MAX_GB,
  )

  // Shard count: storage / target shard size
  const targetShardSize = SIZING.SHARD_SIZE_TARGET_GB[tier]
  const shardCount = Math.max(
    Math.ceil(watermarkBufferedGB / targetShardSize),
    nodeCount, // at least 1 shard per node
  )

  // CPU cores based on tier
  const cpuCoresPerNode = getCoresForTier(tier)

  return {
    tier,
    storageGB: watermarkBufferedGB,
    nodeCount,
    memoryPerNodeGB,
    jvmHeapGB,
    cpuCoresPerNode,
    shardCount,
    serverModel: '',
  }
}

function getCoresForTier(tier: ElasticTier): number {
  switch (tier) {
    case 'hot':
      return 16
    case 'warm':
      return 8
    case 'cold':
      return 4
    case 'frozen':
      return 4
  }
}
