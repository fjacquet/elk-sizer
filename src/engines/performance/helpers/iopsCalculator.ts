import powerstoreData from '@/data/dell-powerstore.json'
import type { BOMStorageEntry, PowerStoreModel } from '@/types/hardware'
import type { TierIOPSResult } from '@/types/results'
import type { ElasticTier } from '@/types/sizing'
import { SIZING } from '@/types/sizing'

const powerstoreModels = powerstoreData as PowerStoreModel[]

export function lookupPowerStoreMaxIOPS(modelName: string): number {
  const found = powerstoreModels.find((m) => m.model === modelName)
  return found?.maxIOPS ?? 0
}

export function computeAvailableIOPS(sanStorage: BOMStorageEntry[]): number {
  return sanStorage.reduce((sum, entry) => {
    return sum + lookupPowerStoreMaxIOPS(entry.model) * entry.count
  }, 0)
}

export function computeTierIOPS(
  tier: ElasticTier,
  nodeCount: number,
  shardCount: number,
  searchRate: number,
  indexingRate: number,
): TierIOPSResult {
  if (nodeCount <= 0) {
    return { tier, estimatedWriteIOPS: 0, estimatedReadIOPS: 0, totalIOPS: 0 }
  }

  // Write IOPS only apply to hot tier (active indexing)
  let estimatedWriteIOPS = 0
  if (tier === 'hot' && indexingRate > 0) {
    const writeMBs = (indexingRate * SIZING.AVG_DOC_SIZE_KB) / 1024
    const writeIOPS = (writeMBs * 1024) / 4 // 4 KB random write IO size
    estimatedWriteIOPS = writeIOPS * SIZING.IOPS_WRITE_AMPLIFICATION
  }

  const fractionMap: Partial<Record<ElasticTier, number>> = {
    hot: SIZING.HOT_SEARCH_FRACTION,
    warm: SIZING.WARM_SEARCH_FRACTION,
  }
  const fraction = fractionMap[tier] ?? 0
  const shardsHitPerQuery = shardCount / nodeCount
  const estimatedReadIOPS = searchRate * fraction * shardsHitPerQuery * SIZING.IOPS_PER_SEARCH_SHARD

  return {
    tier,
    estimatedWriteIOPS,
    estimatedReadIOPS,
    totalIOPS: estimatedWriteIOPS + estimatedReadIOPS,
  }
}
