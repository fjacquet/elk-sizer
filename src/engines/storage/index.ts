import type { StorageResult } from '@/types/results'
import type { CompressionCodec, ElasticTier } from '@/types/sizing'
import { calculateTierStorage } from './helpers/tierStorage'

export interface StorageEngineInput {
  dailyIngestGB: number
  compressionCodec: CompressionCodec
  replicaCount: number
  hotDays: number
  warmDays: number
  coldDays: number
  frozenDays: number
}

export function calculateStorage(input: StorageEngineInput): StorageResult {
  const tierConfigs: { tier: ElasticTier; days: number }[] = [
    { tier: 'hot', days: input.hotDays },
    { tier: 'warm', days: input.warmDays },
    { tier: 'cold', days: input.coldDays },
    { tier: 'frozen', days: input.frozenDays },
  ]

  const perTier = tierConfigs.map(({ tier, days }) =>
    calculateTierStorage({
      tier,
      dailyIngestGB: input.dailyIngestGB,
      retentionDays: days,
      compressionCodec: input.compressionCodec,
      replicaCount: tier === 'frozen' ? 0 : input.replicaCount,
    }),
  )

  const totalRawTB = perTier.reduce((sum, t) => sum + t.rawStorageGB, 0) / 1024
  const totalEffectiveTB = perTier.reduce((sum, t) => sum + t.watermarkBufferedGB, 0) / 1024

  return { perTier, totalRawTB, totalEffectiveTB }
}
