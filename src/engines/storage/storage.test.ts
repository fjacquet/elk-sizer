import { describe, expect, it } from 'vitest'
import { calculateTierStorage } from './helpers/tierStorage'
import { calculateStorage } from './index'

describe('Storage Engine', () => {
  describe('calculateTierStorage', () => {
    it('calculates hot tier storage correctly', () => {
      const result = calculateTierStorage({
        tier: 'hot',
        dailyIngestGB: 100,
        retentionDays: 7,
        compressionCodec: 'lz4',
        replicaCount: 1,
      })

      // 100 * 7 * 1.1 = 770 raw
      expect(result.rawStorageGB).toBeCloseTo(770, 0)
      // 770 * 2 = 1540 effective (1 replica)
      expect(result.effectiveStorageGB).toBeCloseTo(1540, 0)
      // 1540 * 1.25 * 1.05 = 2021.25
      expect(result.watermarkBufferedGB).toBeCloseTo(2021.25, 0)
    })

    it('returns zero for zero retention days', () => {
      const result = calculateTierStorage({
        tier: 'warm',
        dailyIngestGB: 100,
        retentionDays: 0,
        compressionCodec: 'lz4',
        replicaCount: 1,
      })

      expect(result.rawStorageGB).toBe(0)
      expect(result.effectiveStorageGB).toBe(0)
      expect(result.watermarkBufferedGB).toBe(0)
    })

    it('applies DEFLATE compression ratio', () => {
      const result = calculateTierStorage({
        tier: 'hot',
        dailyIngestGB: 100,
        retentionDays: 1,
        compressionCodec: 'deflate',
        replicaCount: 0,
      })

      // 100 * 1 * 0.85 = 85
      expect(result.rawStorageGB).toBeCloseTo(85, 0)
    })

    it('applies best_compression ratio', () => {
      const result = calculateTierStorage({
        tier: 'hot',
        dailyIngestGB: 100,
        retentionDays: 1,
        compressionCodec: 'best_compression',
        replicaCount: 0,
      })

      // 100 * 1 * 0.70 = 70
      expect(result.rawStorageGB).toBeCloseTo(70, 0)
    })
  })

  describe('calculateStorage', () => {
    it('calculates total storage across all tiers', () => {
      const result = calculateStorage({
        dailyIngestGB: 100,
        compressionCodec: 'lz4',
        replicaCount: 1,
        hotDays: 7,
        warmDays: 30,
        coldDays: 90,
        frozenDays: 365,
      })

      expect(result.perTier).toHaveLength(4)
      expect(result.totalRawTB).toBeGreaterThan(0)
      expect(result.totalEffectiveTB).toBeGreaterThan(result.totalRawTB)
    })

    it('frozen tier has 0 replicas', () => {
      const result = calculateStorage({
        dailyIngestGB: 100,
        compressionCodec: 'lz4',
        replicaCount: 2,
        hotDays: 7,
        warmDays: 30,
        coldDays: 90,
        frozenDays: 365,
      })

      const frozen = result.perTier.find((t) => t.tier === 'frozen')
      expect(frozen?.replicaOverhead).toBe(1) // No replicas for frozen
    })

    it('handles zero days for some tiers', () => {
      const result = calculateStorage({
        dailyIngestGB: 100,
        compressionCodec: 'lz4',
        replicaCount: 1,
        hotDays: 7,
        warmDays: 0,
        coldDays: 0,
        frozenDays: 0,
      })

      expect(result.perTier[0]?.rawStorageGB).toBeGreaterThan(0)
      expect(result.perTier[1]?.rawStorageGB).toBe(0)
      expect(result.perTier[2]?.rawStorageGB).toBe(0)
      expect(result.perTier[3]?.rawStorageGB).toBe(0)
    })
  })
})
