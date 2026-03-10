import { describe, expect, it } from 'vitest'
import type { WorkloadProfile } from '@/types/sizing'
import { WORKLOAD_PROFILES } from '@/types/sizing'
import {
  computeAvailableIOPS,
  computeFCUtilization,
  computeTierIOPS,
  computeTotalFCPorts,
  estimateLatency,
  lookupPowerStoreLatency,
  lookupPowerStoreMaxIOPS,
  type TierIOPSInput,
} from './helpers/iopsCalculator'

const baseTierInput = (overrides: Partial<TierIOPSInput> = {}): TierIOPSInput => ({
  tier: 'hot',
  nodeCount: 4,
  shardCount: 20,
  searchRate: 50,
  indexingRate: 10000,
  concurrentUsers: 10,
  dashboardCount: 0,
  workloadProfile: 'mixed',
  storageTierGB: 1000,
  indexCount: 10,
  ilmEnabled: true,
  ...overrides,
})

describe('computeTierIOPS', () => {
  it('returns zero for inactive tier (nodeCount = 0)', () => {
    const result = computeTierIOPS(baseTierInput({ nodeCount: 0 }))
    expect(result.totalIOPS).toBe(0)
    expect(result.estimatedWriteIOPS).toBe(0)
    expect(result.estimatedReadIOPS).toBe(0)
    expect(result.dashboardIOPS).toBe(0)
    expect(result.backgroundIOPS).toBe(0)
  })

  it('computes hot tier write IOPS from indexingRate', () => {
    // With mixed profile: avgDocSizeKB=1, writeAmplification=4
    // writeMBs = (10000 * 1) / 1024 ≈ 9.766
    // writeIOPS = (9.766 / 4) * 1024 * 4 = 10000
    const result = computeTierIOPS(
      baseTierInput({ searchRate: 0, dashboardCount: 0, ilmEnabled: false }),
    )
    expect(result.estimatedWriteIOPS).toBeCloseTo(10000, 0)
  })

  it('computes hot tier read IOPS with mixed profile', () => {
    // mixed: searchFractionHot = 0.75
    // shardsHitPerQuery = 20 / 4 = 5
    // readIOPS = 100 * 0.75 * 5 * 20 = 7500
    const result = computeTierIOPS(
      baseTierInput({ searchRate: 100, indexingRate: 0, ilmEnabled: false }),
    )
    expect(result.estimatedReadIOPS).toBeCloseTo(7500, 0)
  })

  it('computes warm tier read IOPS with mixed profile', () => {
    // mixed: searchFractionWarm = 0.20
    // shardsHitPerQuery = 10 / 2 = 5
    // readIOPS = 100 * 0.20 * 5 * 20 = 2000
    const result = computeTierIOPS(
      baseTierInput({
        tier: 'warm',
        nodeCount: 2,
        shardCount: 10,
        searchRate: 100,
        indexingRate: 0,
        ilmEnabled: false,
      }),
    )
    expect(result.estimatedReadIOPS).toBeCloseTo(2000, 0)
  })

  it('warm tier has no write IOPS', () => {
    const result = computeTierIOPS(baseTierInput({ tier: 'warm' }))
    expect(result.estimatedWriteIOPS).toBe(0)
  })

  it('cold and frozen tiers have zero IOPS (object storage)', () => {
    const cold = computeTierIOPS(baseTierInput({ tier: 'cold' }))
    const frozen = computeTierIOPS(baseTierInput({ tier: 'frozen' }))
    expect(cold.totalIOPS).toBe(0)
    expect(frozen.totalIOPS).toBe(0)
  })

  it('handles indexingRate = 0 gracefully', () => {
    const result = computeTierIOPS(baseTierInput({ indexingRate: 0, ilmEnabled: false }))
    expect(result.estimatedWriteIOPS).toBe(0)
    expect(result.totalIOPS).toBeGreaterThan(0) // read IOPS still exist
  })

  it('handles shardCount = 0 safely', () => {
    const result = computeTierIOPS(baseTierInput({ shardCount: 0, ilmEnabled: false }))
    expect(result.estimatedReadIOPS).toBe(0)
    expect(Number.isNaN(result.estimatedReadIOPS)).toBe(false)
  })

  // Dashboard IOPS tests
  it('computes dashboard IOPS for hot tier', () => {
    // dashboardCount=100, concurrentUsers=50, mixed dashboardMultiplier=1.2
    // shardsHitPerQuery = 20/4 = 5
    // dashboardIOPS = 100 * (5/30) * 50 * 1.2 * 5 * 20 = 100000
    const result = computeTierIOPS(
      baseTierInput({
        dashboardCount: 100,
        concurrentUsers: 50,
        searchRate: 0,
        indexingRate: 0,
        ilmEnabled: false,
      }),
    )
    expect(result.dashboardIOPS).toBeGreaterThan(0)
  })

  it('dashboard IOPS is zero for warm tier', () => {
    const result = computeTierIOPS(
      baseTierInput({ tier: 'warm', dashboardCount: 100, concurrentUsers: 50 }),
    )
    expect(result.dashboardIOPS).toBe(0)
  })

  it('dashboard IOPS is zero when dashboardCount is 0', () => {
    const result = computeTierIOPS(baseTierInput({ dashboardCount: 0, concurrentUsers: 100 }))
    expect(result.dashboardIOPS).toBe(0)
  })

  it('customer scenario: 2707 dashboards, 100 users generates significant IOPS', () => {
    const result = computeTierIOPS(
      baseTierInput({
        dashboardCount: 2707,
        concurrentUsers: 100,
        searchRate: 50,
        indexingRate: 10000,
      }),
    )
    expect(result.dashboardIOPS).toBeGreaterThan(10000)
    expect(result.totalIOPS).toBeGreaterThan(result.estimatedWriteIOPS + result.estimatedReadIOPS)
  })

  // Workload profile tests
  it('SIEM profile produces higher search fractions than logging', () => {
    const siem = computeTierIOPS(
      baseTierInput({ workloadProfile: 'siem', dashboardCount: 0, ilmEnabled: false }),
    )
    const logging = computeTierIOPS(
      baseTierInput({ workloadProfile: 'logging', dashboardCount: 0, ilmEnabled: false }),
    )
    expect(siem.estimatedReadIOPS).toBeGreaterThan(logging.estimatedReadIOPS)
  })

  it('SIEM profile has higher write amplification', () => {
    const siem = computeTierIOPS(
      baseTierInput({
        workloadProfile: 'siem',
        searchRate: 0,
        dashboardCount: 0,
        ilmEnabled: false,
      }),
    )
    const logging = computeTierIOPS(
      baseTierInput({
        workloadProfile: 'logging',
        searchRate: 0,
        dashboardCount: 0,
        ilmEnabled: false,
      }),
    )
    expect(siem.estimatedWriteIOPS).toBeGreaterThan(logging.estimatedWriteIOPS)
  })

  it('each workload profile produces different total IOPS', () => {
    const profiles: WorkloadProfile[] = ['logging', 'observability', 'siem', 'search', 'mixed']
    const results = profiles.map(
      (p) => computeTierIOPS(baseTierInput({ workloadProfile: p, ilmEnabled: false })).totalIOPS,
    )
    const unique = new Set(results)
    expect(unique.size).toBe(profiles.length)
  })

  // Background IOPS tests
  it('computes background IOPS with ILM enabled', () => {
    const result = computeTierIOPS(baseTierInput({ ilmEnabled: true }))
    expect(result.backgroundIOPS).toBeGreaterThan(0)
  })

  it('ILM disabled reduces background IOPS to segment merge only', () => {
    const withIlm = computeTierIOPS(baseTierInput({ ilmEnabled: true }))
    const noIlm = computeTierIOPS(baseTierInput({ ilmEnabled: false }))
    expect(withIlm.backgroundIOPS).toBeGreaterThan(noIlm.backgroundIOPS)
  })

  it('segment merge IOPS scales with write+read IOPS', () => {
    const low = computeTierIOPS(
      baseTierInput({ indexingRate: 1000, searchRate: 10, ilmEnabled: false }),
    )
    const high = computeTierIOPS(
      baseTierInput({ indexingRate: 100000, searchRate: 500, ilmEnabled: false }),
    )
    expect(high.backgroundIOPS).toBeGreaterThan(low.backgroundIOPS)
  })
})

describe('lookupPowerStoreMaxIOPS', () => {
  it('looks up PowerStore 500T correctly', () => {
    expect(lookupPowerStoreMaxIOPS('PowerStore 500T')).toBe(150000)
  })

  it('looks up PowerStore 1200T correctly', () => {
    expect(lookupPowerStoreMaxIOPS('PowerStore 1200T')).toBe(350000)
  })

  it('returns 0 for unknown model name', () => {
    expect(lookupPowerStoreMaxIOPS('Unknown Model')).toBe(0)
  })
})

describe('lookupPowerStoreLatency', () => {
  it('returns latency for known model', () => {
    expect(lookupPowerStoreLatency('PowerStore 500T')).toBe(0.5)
    expect(lookupPowerStoreLatency('PowerStore 9200T')).toBe(0.2)
  })

  it('returns 0.5 default for unknown model', () => {
    expect(lookupPowerStoreLatency('Unknown')).toBe(0.5)
  })
})

describe('computeAvailableIOPS', () => {
  it('sums available IOPS across multiple BOM entries', () => {
    const sanStorage = [
      { model: 'PowerStore 1200T', count: 2, capacityTB: 768, tier: 'hot/warm', powerWatts: 1200 },
      { model: 'PowerStore 500T', count: 1, capacityTB: 192, tier: 'hot/warm', powerWatts: 800 },
    ]
    expect(computeAvailableIOPS(sanStorage)).toBe(850000)
  })

  it('returns 0 for empty SAN BOM', () => {
    expect(computeAvailableIOPS([])).toBe(0)
  })
})

describe('computeTotalFCPorts', () => {
  it('sums FC ports across BOM entries', () => {
    const sanStorage = [
      { model: 'PowerStore 1200T', count: 2, capacityTB: 768, tier: 'hot/warm', powerWatts: 1200 },
    ]
    // 1200T has 8 FC ports × 2 units = 16
    expect(computeTotalFCPorts(sanStorage)).toBe(16)
  })

  it('returns 0 for empty BOM', () => {
    expect(computeTotalFCPorts([])).toBe(0)
  })
})

describe('estimateLatency', () => {
  it('returns base latency at low utilization (<50%)', () => {
    expect(estimateLatency(0.4, 0.3)).toBe(0.4)
  })

  it('increases moderately between 50-80% utilization', () => {
    const lat = estimateLatency(0.4, 0.6)
    expect(lat).toBeGreaterThan(0.4)
    expect(lat).toBeLessThan(2)
  })

  it('increases sharply above 80% utilization', () => {
    const at60 = estimateLatency(0.4, 0.6)
    const at95 = estimateLatency(0.4, 0.95)
    expect(at95).toBeGreaterThan(at60 * 2)
  })

  it('handles 0% utilization', () => {
    expect(estimateLatency(0.5, 0)).toBe(0.5)
  })

  it('handles 100% utilization', () => {
    const lat = estimateLatency(0.5, 1.0)
    expect(lat).toBeGreaterThan(2)
  })

  it('lower base latency model produces lower result', () => {
    const fast = estimateLatency(0.2, 0.7)
    const slow = estimateLatency(0.5, 0.7)
    expect(fast).toBeLessThan(slow)
  })
})

describe('computeFCUtilization', () => {
  it('returns low utilization for moderate IOPS', () => {
    // 100000 IOPS × 4KB × 8 / (1024^2) ≈ 3.05 Gbps
    // 8 ports × 32 Gbps = 256 Gbps → 3.05/256 ≈ 1.2%
    const util = computeFCUtilization(100000, 4, 8, 32)
    expect(util).toBeLessThan(0.05)
  })

  it('detects high utilization with few ports and high IOPS', () => {
    // Very high IOPS with only 4 ports
    const util = computeFCUtilization(5000000, 16, 4, 32)
    expect(util).toBeGreaterThan(0.5)
  })

  it('returns 0 for 0 ports', () => {
    expect(computeFCUtilization(100000, 4, 0, 32)).toBe(0)
  })

  it('returns 0 for 0 IOPS', () => {
    expect(computeFCUtilization(0, 4, 8, 32)).toBe(0)
  })
})

describe('WORKLOAD_PROFILES', () => {
  const profiles: WorkloadProfile[] = ['logging', 'observability', 'siem', 'search', 'mixed']

  it('all 5 profiles are defined', () => {
    expect(Object.keys(WORKLOAD_PROFILES)).toHaveLength(5)
    for (const p of profiles) {
      expect(WORKLOAD_PROFILES[p]).toBeDefined()
    }
  })

  it('all profiles have valid search fractions (0-1)', () => {
    for (const p of profiles) {
      const profile = WORKLOAD_PROFILES[p]
      expect(profile.searchFractionHot).toBeGreaterThanOrEqual(0)
      expect(profile.searchFractionHot).toBeLessThanOrEqual(1)
      expect(profile.searchFractionWarm).toBeGreaterThanOrEqual(0)
      expect(profile.searchFractionWarm).toBeLessThanOrEqual(1)
    }
  })

  it('all profiles have positive avgDocSizeKB and writeAmplification', () => {
    for (const p of profiles) {
      expect(WORKLOAD_PROFILES[p].avgDocSizeKB).toBeGreaterThan(0)
      expect(WORKLOAD_PROFILES[p].writeAmplification).toBeGreaterThan(0)
    }
  })
})
