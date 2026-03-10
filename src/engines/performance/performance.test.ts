import type { ClusterResult, HardwareResult } from '@/types/results'
import type { WorkloadProfile } from '@/types/sizing'
import { SIZING } from '@/types/sizing'
import { calculatePerformance } from './index'

const baseCluster: ClusterResult = {
  tiers: [
    {
      tier: 'hot',
      storageGB: 2048,
      nodeCount: 3,
      memoryPerNodeGB: 256,
      jvmHeapGB: 31,
      cpuCoresPerNode: 16,
      shardCount: 30,
      serverModel: 'r760',
    },
    {
      tier: 'warm',
      storageGB: 8192,
      nodeCount: 2,
      memoryPerNodeGB: 128,
      jvmHeapGB: 31,
      cpuCoresPerNode: 8,
      shardCount: 20,
      serverModel: 'r760',
    },
    {
      tier: 'cold',
      storageGB: 50000,
      nodeCount: 4,
      memoryPerNodeGB: 64,
      jvmHeapGB: 31,
      cpuCoresPerNode: 4,
      shardCount: 100,
      serverModel: 'r760',
    },
  ],
  masterNodes: {
    role: 'master',
    nodeCount: 3,
    memoryPerNodeGB: 64,
    cpuCoresPerNode: 8,
    jvmHeapGB: 31,
    serverModel: 'r660',
  },
  ingestNodes: {
    role: 'ingest',
    nodeCount: 2,
    memoryPerNodeGB: 64,
    cpuCoresPerNode: 8,
    jvmHeapGB: 31,
    serverModel: 'r660',
  },
  coordinatingNodes: {
    role: 'coordinating',
    nodeCount: 0,
    memoryPerNodeGB: 64,
    cpuCoresPerNode: 8,
    jvmHeapGB: 31,
    serverModel: 'r660',
  },
  totalNodes: 14,
  totalStorageTB: 60,
  totalMemoryTB: 2,
  totalShards: 150,
  maxShardsCapacity: 620,
  shardUtilization: 0.24,
}

const baseHardware: HardwareResult = {
  bom: {
    servers: [],
    sanStorage: [
      { model: 'PowerStore 1200T', count: 2, capacityTB: 768, tier: 'hot/warm', powerWatts: 1200 },
    ],
    objectStorage: { backend: 'powerscale', capacityTB: 50, nodeCount: 3, powerWatts: 2400 },
    networking: {
      switchCount: 2,
      fcPortCount: 8,
      ethPortCount: 20,
      fcSpeed: '32Gb',
      ethSpeed: '25GbE',
    },
  },
  totalRackUnits: 30,
  estimatedCostUSD: 500000,
}

const defaultInput = () => ({
  searchRate: 50,
  indexingRate: 10000,
  concurrentUsers: 10,
  dashboardCount: 5,
  workloadProfile: 'mixed' as WorkloadProfile,
  indexCount: 10,
  ilmEnabled: true,
  clusterResult: baseCluster,
  hardwareResult: baseHardware,
})

describe('calculatePerformance', () => {
  it('only hot and warm tiers produce IOPS (cold tier excluded)', () => {
    const result = calculatePerformance(defaultInput())
    const tierNames = result.perTier.map((t) => t.tier)
    expect(tierNames).toContain('hot')
    expect(tierNames).toContain('warm')
    expect(tierNames).not.toContain('cold')
    expect(tierNames).not.toContain('frozen')
    expect(result.perTier).toHaveLength(2)
  })

  it('totalRequiredIOPS is the sum of hot + warm tier IOPS', () => {
    const result = calculatePerformance(defaultInput())
    const sumPerTier = result.perTier.reduce((sum, t) => sum + t.totalIOPS, 0)
    expect(result.totalRequiredIOPS).toBeCloseTo(sumPerTier, 5)
  })

  it('totalAvailableIOPS comes from BOM SAN storage (PowerStore 1200T x 2 = 700000)', () => {
    const result = calculatePerformance(defaultInput())
    // PowerStore 1200T has 350000 maxIOPS, 2 units = 700000
    expect(result.totalAvailableIOPS).toBe(700000)
  })

  it('cache hit ratio reduces effective IOPS by 30%', () => {
    const result = calculatePerformance(defaultInput())
    const effectiveIOPS = result.totalRequiredIOPS * (1 - SIZING.CACHE_HIT_RATIO)
    // iopsUtilization uses effectiveIOPS, so we verify indirectly
    const expectedUtilization = (effectiveIOPS * SIZING.IOPS_HEADROOM) / result.totalAvailableIOPS
    expect(result.iopsUtilization).toBeCloseTo(expectedUtilization, 5)
  })

  it('iopsUtilization = (effectiveIOPS * 1.3) / availableIOPS', () => {
    const result = calculatePerformance(defaultInput())
    const effectiveIOPS = result.totalRequiredIOPS * (1 - SIZING.CACHE_HIT_RATIO)
    const expectedUtilization = (effectiveIOPS * SIZING.IOPS_HEADROOM) / result.totalAvailableIOPS
    expect(result.iopsUtilization).toBeCloseTo(expectedUtilization, 5)
  })

  it('isIOPSBottleneck true when utilization > 0.8', () => {
    // Create a scenario with very high IOPS demand
    const input = defaultInput()
    input.searchRate = 50000
    input.indexingRate = 500000
    input.concurrentUsers = 200
    input.dashboardCount = 500
    const result = calculatePerformance(input)
    if (result.iopsUtilization > SIZING.IOPS_CRITICAL_THRESHOLD) {
      expect(result.isIOPSBottleneck).toBe(true)
    } else {
      expect(result.isIOPSBottleneck).toBe(false)
    }
  })

  it('isIOPSBottleneck false when utilization <= 0.8', () => {
    // Low-demand scenario
    const input = defaultInput()
    input.searchRate = 1
    input.indexingRate = 100
    input.concurrentUsers = 1
    input.dashboardCount = 0
    const result = calculatePerformance(input)
    expect(result.iopsUtilization).toBeLessThanOrEqual(SIZING.IOPS_CRITICAL_THRESHOLD)
    expect(result.isIOPSBottleneck).toBe(false)
  })

  it('estimatedLatencyMs > 0 for non-zero utilization', () => {
    const result = calculatePerformance(defaultInput())
    expect(result.estimatedLatencyMs).toBeGreaterThan(0)
  })

  it('fcUtilization >= 0', () => {
    const result = calculatePerformance(defaultInput())
    expect(result.fcUtilization).toBeGreaterThanOrEqual(0)
  })

  it('with empty SAN storage, iopsUtilization = 0', () => {
    const input = defaultInput()
    input.hardwareResult = {
      ...baseHardware,
      bom: {
        ...baseHardware.bom,
        sanStorage: [],
      },
    }
    const result = calculatePerformance(input)
    expect(result.iopsUtilization).toBe(0)
    expect(result.totalAvailableIOPS).toBe(0)
  })

  it('dashboardIOPS and backgroundIOPS aggregate from per-tier results', () => {
    const result = calculatePerformance(defaultInput())
    const sumDashboard = result.perTier.reduce((sum, t) => sum + t.dashboardIOPS, 0)
    const sumBackground = result.perTier.reduce((sum, t) => sum + t.backgroundIOPS, 0)
    expect(result.dashboardIOPS).toBeCloseTo(sumDashboard, 5)
    expect(result.backgroundIOPS).toBeCloseTo(sumBackground, 5)
  })

  it('different workload profiles produce different IOPS totals', () => {
    const profiles: WorkloadProfile[] = ['logging', 'observability', 'siem', 'search', 'mixed']
    const results = profiles.map((p) => {
      const input = defaultInput()
      input.workloadProfile = p
      return calculatePerformance(input).totalRequiredIOPS
    })
    const unique = new Set(results)
    expect(unique.size).toBe(profiles.length)
  })
})
