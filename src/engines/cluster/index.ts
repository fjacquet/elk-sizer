import type { ClusterResult, StorageResult } from '@/types/results'
import type { NodeSizing } from '@/types/sizing'
import { SIZING } from '@/types/sizing'
import { calculateTierNodes } from './helpers/nodeCalculator'

export interface ClusterEngineInput {
  storageResult: StorageResult
  serverMemoryGB: number
  jvmHeapOverride: number | null
}

export function calculateCluster(input: ClusterEngineInput): ClusterResult {
  const { storageResult, serverMemoryGB } = input

  const tiers = storageResult.perTier.map((tierStorage) =>
    calculateTierNodes(tierStorage, serverMemoryGB),
  )

  // Apply JVM heap override if specified
  if (input.jvmHeapOverride !== null) {
    for (const tier of tiers) {
      if (tier.nodeCount > 0) {
        tier.jvmHeapGB = Math.min(input.jvmHeapOverride, SIZING.JVM_HEAP_MAX_GB)
      }
    }
  }

  const totalDataNodes = tiers.reduce((sum, t) => sum + t.nodeCount, 0)

  // Master nodes: 3 for small clusters, 5 for large
  const masterNodeCount =
    totalDataNodes >= SIZING.LARGE_CLUSTER_THRESHOLD
      ? SIZING.MASTER_NODE_COUNT_LARGE
      : SIZING.MASTER_NODE_COUNT_SMALL

  const masterNodes: NodeSizing = {
    role: 'master',
    nodeCount: masterNodeCount,
    memoryPerNodeGB: 16,
    cpuCoresPerNode: 4,
    jvmHeapGB: 8,
    serverModel: '',
  }

  // Ingest nodes: 2 minimum, scale with data volume
  const ingestNodeCount = Math.max(2, Math.ceil(totalDataNodes / 10))
  const ingestNodes: NodeSizing = {
    role: 'ingest',
    nodeCount: ingestNodeCount,
    memoryPerNodeGB: 32,
    cpuCoresPerNode: 8,
    jvmHeapGB: 16,
    serverModel: '',
  }

  // Coordinating nodes: 2 minimum
  const coordinatingNodeCount = Math.max(2, Math.ceil(totalDataNodes / 15))
  const coordinatingNodes: NodeSizing = {
    role: 'coordinating',
    nodeCount: coordinatingNodeCount,
    memoryPerNodeGB: 32,
    cpuCoresPerNode: 8,
    jvmHeapGB: 16,
    serverModel: '',
  }

  const totalNodes = totalDataNodes + masterNodeCount + ingestNodeCount + coordinatingNodeCount

  const totalStorageTB = tiers.reduce((sum, t) => sum + t.storageGB, 0) / 1024

  const totalMemoryTB =
    (tiers.reduce((sum, t) => sum + t.memoryPerNodeGB * t.nodeCount, 0) +
      masterNodes.memoryPerNodeGB * masterNodes.nodeCount +
      ingestNodes.memoryPerNodeGB * ingestNodes.nodeCount +
      coordinatingNodes.memoryPerNodeGB * coordinatingNodes.nodeCount) /
    1024

  // Shard capacity check
  const totalShards = tiers.reduce((sum, t) => sum + t.shardCount, 0)
  const totalHeapGB = tiers.reduce((sum, t) => sum + t.jvmHeapGB * t.nodeCount, 0)
  const maxShardsCapacity = totalHeapGB * SIZING.MAX_SHARDS_PER_GB_HEAP
  const shardUtilization = maxShardsCapacity > 0 ? totalShards / maxShardsCapacity : 0

  return {
    tiers,
    masterNodes,
    ingestNodes,
    coordinatingNodes,
    totalNodes,
    totalStorageTB,
    totalMemoryTB,
    totalShards,
    maxShardsCapacity,
    shardUtilization,
  }
}
