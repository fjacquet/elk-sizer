import { describe, expect, it } from 'vitest'
import type { TierStorageResult } from '@/types/results'
import { calculateTierNodes } from './helpers/nodeCalculator'
import { calculateCluster } from './index'

describe('Cluster Engine', () => {
  describe('calculateTierNodes', () => {
    it('calculates correct node count for hot tier', () => {
      const tierStorage: TierStorageResult = {
        tier: 'hot',
        dailyIngestGB: 100,
        retentionDays: 7,
        compressionRatio: 1.1,
        replicaOverhead: 2,
        rawStorageGB: 770,
        effectiveStorageGB: 1540,
        watermarkBufferedGB: 2021,
      }

      const result = calculateTierNodes(tierStorage, 64)
      // Required memory = 2021 * (1/30) = 67.37 GB
      // Nodes = ceil(67.37 / 64) = 2, min 2
      expect(result.nodeCount).toBeGreaterThanOrEqual(2)
      expect(result.jvmHeapGB).toBeLessThanOrEqual(31)
      expect(result.cpuCoresPerNode).toBe(16) // hot tier
    })

    it('returns zero sizing for zero storage', () => {
      const tierStorage: TierStorageResult = {
        tier: 'warm',
        dailyIngestGB: 0,
        retentionDays: 0,
        compressionRatio: 1.1,
        replicaOverhead: 2,
        rawStorageGB: 0,
        effectiveStorageGB: 0,
        watermarkBufferedGB: 0,
      }

      const result = calculateTierNodes(tierStorage, 64)
      expect(result.nodeCount).toBe(0)
      expect(result.storageGB).toBe(0)
    })

    it('respects JVM heap max of 31GB', () => {
      const tierStorage: TierStorageResult = {
        tier: 'hot',
        dailyIngestGB: 100,
        retentionDays: 30,
        compressionRatio: 1.1,
        replicaOverhead: 2,
        rawStorageGB: 3300,
        effectiveStorageGB: 6600,
        watermarkBufferedGB: 8662,
      }

      const result = calculateTierNodes(tierStorage, 128)
      // 128 * 0.5 = 64, capped at 31
      expect(result.jvmHeapGB).toBe(31)
    })
  })

  describe('calculateCluster', () => {
    it('produces valid cluster sizing with default inputs', () => {
      const storageResult = {
        perTier: [
          {
            tier: 'hot' as const,
            dailyIngestGB: 100,
            retentionDays: 7,
            compressionRatio: 1.1,
            replicaOverhead: 2,
            rawStorageGB: 770,
            effectiveStorageGB: 1540,
            watermarkBufferedGB: 2021,
          },
          {
            tier: 'warm' as const,
            dailyIngestGB: 100,
            retentionDays: 30,
            compressionRatio: 1.1,
            replicaOverhead: 2,
            rawStorageGB: 3300,
            effectiveStorageGB: 6600,
            watermarkBufferedGB: 8662,
          },
          {
            tier: 'cold' as const,
            dailyIngestGB: 100,
            retentionDays: 90,
            compressionRatio: 1.1,
            replicaOverhead: 2,
            rawStorageGB: 9900,
            effectiveStorageGB: 19800,
            watermarkBufferedGB: 25987,
          },
          {
            tier: 'frozen' as const,
            dailyIngestGB: 100,
            retentionDays: 365,
            compressionRatio: 1.1,
            replicaOverhead: 1,
            rawStorageGB: 40150,
            effectiveStorageGB: 40150,
            watermarkBufferedGB: 52697,
          },
        ],
        totalRawTB: 52.9,
        totalEffectiveTB: 87.3,
      }

      const result = calculateCluster({
        storageResult,
        serverMemoryGB: 64,
        jvmHeapOverride: null,
      })

      expect(result.totalNodes).toBeGreaterThan(0)
      expect(result.masterNodes.nodeCount).toBe(3) // small cluster
      expect(result.ingestNodes.nodeCount).toBeGreaterThanOrEqual(2)
      expect(result.coordinatingNodes.nodeCount).toBeGreaterThanOrEqual(2)
      expect(result.totalShards).toBeGreaterThan(0)
      expect(result.shardUtilization).toBeGreaterThan(0)
      expect(result.shardUtilization).toBeLessThanOrEqual(1)
    })
  })
})
