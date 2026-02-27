import type { TierStorageResult } from '@/types/results'
import type { CompressionCodec, ElasticTier } from '@/types/sizing'
import { SIZING } from '@/types/sizing'

export function calculateTierStorage(params: {
  tier: ElasticTier
  dailyIngestGB: number
  retentionDays: number
  compressionCodec: CompressionCodec
  replicaCount: number
}): TierStorageResult {
  const { tier, dailyIngestGB, retentionDays, compressionCodec, replicaCount } = params

  if (retentionDays <= 0) {
    return {
      tier,
      dailyIngestGB,
      retentionDays: 0,
      compressionRatio: SIZING.INDEXING_RATIO[compressionCodec],
      replicaOverhead: 1 + replicaCount,
      rawStorageGB: 0,
      effectiveStorageGB: 0,
      watermarkBufferedGB: 0,
    }
  }

  const compressionRatio = SIZING.INDEXING_RATIO[compressionCodec]
  const replicaMultiplier = 1 + replicaCount

  // Raw storage = daily * days * indexing_ratio
  const rawStorageGB = dailyIngestGB * retentionDays * compressionRatio

  // Effective = raw * replica multiplier
  const effectiveStorageGB = rawStorageGB * replicaMultiplier

  // Watermark buffered = effective * watermark buffer * filesystem overhead
  const watermarkBufferedGB =
    effectiveStorageGB * SIZING.WATERMARK_BUFFER * (1 + SIZING.FILESYSTEM_OVERHEAD)

  return {
    tier,
    dailyIngestGB,
    retentionDays,
    compressionRatio,
    replicaOverhead: replicaMultiplier,
    rawStorageGB,
    effectiveStorageGB,
    watermarkBufferedGB,
  }
}
