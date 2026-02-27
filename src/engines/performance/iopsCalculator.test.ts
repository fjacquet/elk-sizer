import { describe, expect, it } from 'vitest'
import { computeAvailableIOPS, computeTierIOPS, lookupPowerStoreMaxIOPS } from './helpers/iopsCalculator'

describe('iopsCalculator', () => {
  it('returns zero for inactive tier (nodeCount = 0)', () => {
    const result = computeTierIOPS('hot', 0, 100, 50, 10000)
    expect(result.totalIOPS).toBe(0)
    expect(result.estimatedWriteIOPS).toBe(0)
    expect(result.estimatedReadIOPS).toBe(0)
  })

  it('computes hot tier write IOPS from indexingRate', () => {
    // writeMBs = (10000 * 1) / 1024 ≈ 9.766
    // writeIOPS = (9.766 * 1024) / 4 = 2500
    // amplified = 2500 * 4 = 10000
    const result = computeTierIOPS('hot', 4, 20, 0, 10000)
    expect(result.estimatedWriteIOPS).toBeCloseTo(10000, 0)
  })

  it('computes hot tier read IOPS', () => {
    // shardsHitPerQuery = 20 / 4 = 5
    // readIOPS = 100 * 0.75 * 5 * 20 = 7500
    const result = computeTierIOPS('hot', 4, 20, 100, 0)
    expect(result.estimatedReadIOPS).toBeCloseTo(7500, 0)
  })

  it('computes warm tier read IOPS', () => {
    // shardsHitPerQuery = 10 / 2 = 5
    // readIOPS = 100 * 0.20 * 5 * 20 = 2000
    const result = computeTierIOPS('warm', 2, 10, 100, 0)
    expect(result.estimatedReadIOPS).toBeCloseTo(2000, 0)
  })

  it('warm tier has no write IOPS', () => {
    const result = computeTierIOPS('warm', 2, 10, 100, 10000)
    expect(result.estimatedWriteIOPS).toBe(0)
  })

  it('cold and frozen tiers have zero IOPS (object storage)', () => {
    const cold = computeTierIOPS('cold', 2, 5, 100, 10000)
    const frozen = computeTierIOPS('frozen', 2, 5, 100, 10000)
    expect(cold.totalIOPS).toBe(0)
    expect(frozen.totalIOPS).toBe(0)
  })

  it('handles indexingRate = 0 gracefully', () => {
    const result = computeTierIOPS('hot', 4, 20, 50, 0)
    expect(result.estimatedWriteIOPS).toBe(0)
    expect(result.totalIOPS).toBeGreaterThan(0) // read IOPS still exist
  })

  it('handles shardCount = 0 safely', () => {
    const result = computeTierIOPS('hot', 4, 0, 50, 1000)
    expect(result.estimatedReadIOPS).toBe(0)
    expect(Number.isNaN(result.estimatedReadIOPS)).toBe(false)
  })

  it('looks up PowerStore 500T correctly', () => {
    expect(lookupPowerStoreMaxIOPS('PowerStore 500T')).toBe(150000)
  })

  it('looks up PowerStore 1200T correctly', () => {
    expect(lookupPowerStoreMaxIOPS('PowerStore 1200T')).toBe(350000)
  })

  it('returns 0 for unknown model name', () => {
    expect(lookupPowerStoreMaxIOPS('Unknown Model')).toBe(0)
  })

  it('sums available IOPS across multiple BOM entries', () => {
    const sanStorage = [
      { model: 'PowerStore 1200T', count: 2, capacityTB: 768, tier: 'hot/warm', powerWatts: 1200 },
      { model: 'PowerStore 500T', count: 1, capacityTB: 192, tier: 'hot/warm', powerWatts: 800 },
    ]
    // 350000 * 2 + 150000 * 1 = 850000
    expect(computeAvailableIOPS(sanStorage)).toBe(850000)
  })

  it('returns 0 available IOPS for empty SAN BOM', () => {
    expect(computeAvailableIOPS([])).toBe(0)
  })
})
