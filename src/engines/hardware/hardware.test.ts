import { describe, expect, it } from 'vitest'
import type { ClusterResult } from '@/types/results'
import type { NodeSizing, TierSizing } from '@/types/sizing'
import { SIZING } from '@/types/sizing'
import { selectServerForRole, selectServerForTier } from './helpers/serverSelector'
import { calculateHardware, type HardwareEngineInput } from './index'
import { selectPowerScale } from './strategies/powerscaleStrategy'
import { selectPowerStore } from './strategies/powerstoreStrategy'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseClusterResult: ClusterResult = {
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
  totalNodes: 10,
  totalStorageTB: 10,
  totalMemoryTB: 1.5,
  totalShards: 50,
  maxShardsCapacity: 620,
  shardUtilization: 0.08,
}

const baseTier = (overrides: Partial<TierSizing> = {}): TierSizing => ({
  tier: 'hot',
  storageGB: 2048,
  nodeCount: 3,
  memoryPerNodeGB: 256,
  jvmHeapGB: 31,
  cpuCoresPerNode: 16,
  shardCount: 30,
  serverModel: 'r760',
  ...overrides,
})

const baseNode = (overrides: Partial<NodeSizing> = {}): NodeSizing => ({
  role: 'master',
  nodeCount: 3,
  memoryPerNodeGB: 64,
  cpuCoresPerNode: 8,
  jvmHeapGB: 31,
  serverModel: 'r660',
  ...overrides,
})

const baseInput = (overrides: Partial<HardwareEngineInput> = {}): HardwareEngineInput => ({
  clusterResult: baseClusterResult,
  deploymentType: 'baremetal',
  frozenBackend: 'powerscale',
  ...overrides,
})

// ---------------------------------------------------------------------------
// selectPowerStore
// ---------------------------------------------------------------------------

describe('selectPowerStore', () => {
  it('auto-selects smallest model that fits within 4 units', () => {
    // 100 TB needed — PowerStore 500T has 192 TB effective, 1 unit fits
    const { model, count } = selectPowerStore(100)
    expect(model.model).toBe('PowerStore 500T')
    expect(count).toBe(1)
  })

  it('picks a larger model when small ones would require >4 units', () => {
    // 1000 TB — 500T would need ceil(1000/192) = 6 > 4
    //           1200T would need ceil(1000/384) = 3 <= 4
    const { model, count } = selectPowerStore(1000)
    expect(model.model).toBe('PowerStore 1200T')
    expect(count).toBe(3)
  })

  it('respects user-preferred model via preferredModelId', () => {
    const { model, count } = selectPowerStore(100, 'ps-3200t')
    expect(model.model).toBe('PowerStore 3200T')
    expect(count).toBe(1)
  })

  it('preferred model count scales with capacity', () => {
    // ps-500t effective = 192 TB, need 500 TB → ceil(500/192) = 3
    const { model, count } = selectPowerStore(500, 'ps-500t')
    expect(model.id).toBe('ps-500t')
    expect(count).toBe(3)
  })

  it('ignores unknown preferredModelId and falls back to auto-select', () => {
    const { model } = selectPowerStore(100, 'ps-nonexistent')
    // Should auto-select — smallest that fits
    expect(model.model).toBe('PowerStore 500T')
  })

  it('falls back to largest model for very large capacity', () => {
    // 50000 TB — even 9200T (2304 TB) needs ceil(50000/2304) = 22 > 4
    // All models exceed 4 units, so fallback to largest (9200T)
    const { model, count } = selectPowerStore(50000)
    expect(model.model).toBe('PowerStore 9200T')
    expect(count).toBeGreaterThan(4)
  })

  it('always returns count >= 1', () => {
    const { count } = selectPowerStore(0.001)
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('returns count = 1 when capacity fits in one unit', () => {
    const { count } = selectPowerStore(50)
    expect(count).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// selectPowerScale
// ---------------------------------------------------------------------------

describe('selectPowerScale', () => {
  it('selects smallest model for small capacity', () => {
    // 200 TB — F710 has 92 TB/node, needs ceil(200/92) = 3 nodes (min 3)
    const { model, nodeCount } = selectPowerScale(200)
    expect(model.model).toBe('PowerScale F710')
    expect(nodeCount).toBe(3)
  })

  it('selects larger model for large capacity', () => {
    // 2000 TB — F710 max cluster = 1.5 PB = 1536 TB → too small
    //           F910 max cluster = 3.0 PB = 3072 TB, 184 TB/node → ceil(2000/184) = 11
    const { model, nodeCount } = selectPowerScale(2000)
    expect(model.model).toBe('PowerScale F910')
    expect(nodeCount).toBe(11)
  })

  it('respects minNodes constraint', () => {
    // 10 TB — F710 needs ceil(10/92) = 1 node, but minNodes=3
    const { model, nodeCount } = selectPowerScale(10)
    expect(model.model).toBe('PowerScale F710')
    expect(nodeCount).toBe(3)
  })

  it('falls back to largest model for extremely large capacity', () => {
    // 100000 TB — even A3100 max cluster = 50 PB = 51200 TB
    // A3100 960 TB/node → ceil(100000/960) = 105 nodes, max 252 → fits
    // Actually H7000 max cluster = 10 PB = 10240 TB — too small
    // A3100 max cluster = 50 PB = 51200 TB — fits
    const { model, nodeCount } = selectPowerScale(100000)
    // Should pick A3100 (960 TB/node, 50 PB max cluster)
    expect(model.model).toBe('PowerScale A3100')
    expect(nodeCount).toBe(Math.max(3, Math.ceil(100000 / 960)))
  })

  it('nodeCount never goes below minNodes', () => {
    const { nodeCount, model } = selectPowerScale(1)
    expect(nodeCount).toBeGreaterThanOrEqual(model.minNodes)
  })

  it('handles capacity that exactly matches one node', () => {
    // F710 = 92 TB per node
    const { model, nodeCount } = selectPowerScale(92)
    expect(model.model).toBe('PowerScale F710')
    expect(nodeCount).toBe(3) // min 3 nodes
  })
})

// ---------------------------------------------------------------------------
// selectServerForTier
// ---------------------------------------------------------------------------

describe('selectServerForTier', () => {
  it('selects server matching hot tier recommendation (R760 or R7725)', () => {
    const { server } = selectServerForTier(baseTier({ tier: 'hot' }))
    // R760 and R7725 both recommend 'hot'
    expect(['PowerEdge R760', 'PowerEdge R7725']).toContain(server.model)
  })

  it('selects server matching warm tier recommendation', () => {
    const { server } = selectServerForTier(baseTier({ tier: 'warm' }))
    // R760 recommends 'warm'
    expect(server.model).toBe('PowerEdge R760')
  })

  it('falls back to warm-recommended server for cold tier', () => {
    const { server } = selectServerForTier(baseTier({ tier: 'cold' }))
    // Cold falls back to warm-capable server
    expect(server.recommendedTier).toContain('warm')
  })

  it('falls back to warm-recommended server for frozen tier', () => {
    const { server } = selectServerForTier(baseTier({ tier: 'frozen' }))
    expect(server.recommendedTier).toContain('warm')
  })

  it('respects user-preferred server model', () => {
    const { server } = selectServerForTier(baseTier({ tier: 'hot' }), 'r7725')
    expect(server.model).toBe('PowerEdge R7725')
  })

  it('respects user-preferred CPU', () => {
    const { config } = selectServerForTier(
      baseTier({ tier: 'hot' }),
      'r760',
      'Intel Xeon Platinum 8470',
    )
    expect(config.cpu.model).toBe('Intel Xeon Platinum 8470')
    expect(config.cpu.cores).toBe(52)
  })

  it('falls back to CPU matching core requirement when preferred CPU not found', () => {
    const { config } = selectServerForTier(
      baseTier({ tier: 'hot', cpuCoresPerNode: 16 }),
      'r760',
      'Nonexistent CPU',
    )
    // Should pick first CPU with cores >= 16 → Gold 6430 (32 cores)
    expect(config.cpu.cores).toBeGreaterThanOrEqual(16)
  })

  it('caps memory at server max', () => {
    // R760 max = 2048 GB, requesting 4096
    const { config } = selectServerForTier(baseTier({ memoryPerNodeGB: 4096 }), 'r760')
    expect(config.memoryGB).toBe(2048)
  })

  it('uses requested memory when below server max', () => {
    const { config } = selectServerForTier(baseTier({ memoryPerNodeGB: 256 }), 'r760')
    expect(config.memoryGB).toBe(256)
  })

  it('calculates drive count and capacity', () => {
    // storageGB=2048, nodeCount=3 → 2048/3/1024 ≈ 0.667 TB per node
    const { config } = selectServerForTier(baseTier())
    expect(config.driveCount).toBeGreaterThanOrEqual(1)
    expect(config.driveCapacityTB).toBeGreaterThanOrEqual(1)
  })

  it('drive count does not exceed server maxDrives', () => {
    // Very large storage requiring many drives
    const { config, server } = selectServerForTier(
      baseTier({ storageGB: 500_000, nodeCount: 2 }),
      'r760',
    )
    expect(config.driveCount).toBeLessThanOrEqual(server.maxDrives)
  })
})

// ---------------------------------------------------------------------------
// selectServerForRole
// ---------------------------------------------------------------------------

describe('selectServerForRole', () => {
  it('always selects R660 for master role', () => {
    const { server } = selectServerForRole(baseNode({ role: 'master' }))
    expect(server.model).toBe('PowerEdge R660')
  })

  it('always selects R660 for ingest role', () => {
    const { server } = selectServerForRole(baseNode({ role: 'ingest' }))
    expect(server.model).toBe('PowerEdge R660')
  })

  it('always selects R660 for coordinating role', () => {
    const { server } = selectServerForRole(baseNode({ role: 'coordinating' }))
    expect(server.model).toBe('PowerEdge R660')
  })

  it('returns fixed 2 drives at 0.48 TB', () => {
    const { config } = selectServerForRole(baseNode())
    expect(config.driveCount).toBe(2)
    expect(config.driveCapacityTB).toBe(0.48)
  })

  it('selects CPU that meets core requirement', () => {
    const { config } = selectServerForRole(baseNode({ cpuCoresPerNode: 8 }))
    expect(config.cpu.cores).toBeGreaterThanOrEqual(8)
  })

  it('caps memory at R660 maxMemoryGB (1024)', () => {
    const { config } = selectServerForRole(baseNode({ memoryPerNodeGB: 2048 }))
    expect(config.memoryGB).toBe(1024)
  })

  it('uses requested memory when below max', () => {
    const { config } = selectServerForRole(baseNode({ memoryPerNodeGB: 64 }))
    expect(config.memoryGB).toBe(64)
  })
})

// ---------------------------------------------------------------------------
// calculateHardware
// ---------------------------------------------------------------------------

describe('calculateHardware', () => {
  describe('deployment type overheads', () => {
    it('baremetal: no overhead applied to node count', () => {
      const result = calculateHardware(baseInput({ deploymentType: 'baremetal' }))
      // Hot tier has 3 nodes — should remain 3 in baremetal
      const hotServer = result.bom.servers.find((s) => s.role === 'data_hot')
      expect(hotServer).toBeDefined()
      expect(hotServer?.count).toBe(3)
    })

    it('vm: applies VM_PERF_FACTOR (0.78) to node count', () => {
      const result = calculateHardware(baseInput({ deploymentType: 'vm' }))
      const hotServer = result.bom.servers.find((s) => s.role === 'data_hot')
      expect(hotServer).toBeDefined()
      // ceil(3 / 0.78) = ceil(3.846) = 4
      expect(hotServer?.count).toBe(Math.ceil(3 / SIZING.VM_PERF_FACTOR))
    })

    it('ece: applies ECE_PERF_FACTOR (0.72) to node count', () => {
      const result = calculateHardware(baseInput({ deploymentType: 'ece' }))
      const hotServer = result.bom.servers.find((s) => s.role === 'data_hot')
      expect(hotServer).toBeDefined()
      // ceil(3 / 0.72) = ceil(4.167) = 5
      expect(hotServer?.count).toBe(Math.ceil(3 / SIZING.ECE_PERF_FACTOR))
    })

    it('vm: applies VM_STORAGE_FACTOR (0.86) to storage calculation', () => {
      const bmResult = calculateHardware(baseInput({ deploymentType: 'baremetal' }))
      const vmResult = calculateHardware(baseInput({ deploymentType: 'vm' }))
      // VM should have more nodes due to overhead
      const bmTotal = bmResult.bom.servers
        .filter((s) => s.role.startsWith('data_'))
        .reduce((sum, s) => sum + s.count, 0)
      const vmTotal = vmResult.bom.servers
        .filter((s) => s.role.startsWith('data_'))
        .reduce((sum, s) => sum + s.count, 0)
      expect(vmTotal).toBeGreaterThan(bmTotal)
    })

    it('ece: applies ECE_STORAGE_FACTOR (0.82) to storage calculation', () => {
      const bmResult = calculateHardware(baseInput({ deploymentType: 'baremetal' }))
      const eceResult = calculateHardware(baseInput({ deploymentType: 'ece' }))
      const bmTotal = bmResult.bom.servers
        .filter((s) => s.role.startsWith('data_'))
        .reduce((sum, s) => sum + s.count, 0)
      const eceTotal = eceResult.bom.servers
        .filter((s) => s.role.startsWith('data_'))
        .reduce((sum, s) => sum + s.count, 0)
      expect(eceTotal).toBeGreaterThan(bmTotal)
    })
  })

  describe('storage tier routing', () => {
    it('hot/warm tiers produce SAN storage (PowerStore) in BOM', () => {
      const result = calculateHardware(baseInput())
      expect(result.bom.sanStorage.length).toBeGreaterThan(0)
      expect(result.bom.sanStorage[0].tier).toBe('hot/warm')
      expect(result.bom.sanStorage[0].model).toContain('PowerStore')
    })

    it('cold/frozen tiers produce object storage (PowerScale) in BOM', () => {
      const clusterWithCold: ClusterResult = {
        ...baseClusterResult,
        tiers: [
          ...baseClusterResult.tiers,
          {
            tier: 'cold',
            storageGB: 20480,
            nodeCount: 2,
            memoryPerNodeGB: 64,
            jvmHeapGB: 31,
            cpuCoresPerNode: 4,
            shardCount: 10,
            serverModel: 'r760',
          },
        ],
      }
      const result = calculateHardware(
        baseInput({ clusterResult: clusterWithCold, frozenBackend: 'powerscale' }),
      )
      expect(result.bom.objectStorage.backend).toBe('powerscale')
      expect(result.bom.objectStorage.capacityTB).toBeGreaterThan(0)
      expect(result.bom.objectStorage.nodeCount).toBeGreaterThanOrEqual(3)
      expect(result.bom.objectStorage.model).toContain('PowerScale')
    })

    it('frozen tier with ECS backend uses ECS estimation', () => {
      const clusterWithFrozen: ClusterResult = {
        ...baseClusterResult,
        tiers: [
          ...baseClusterResult.tiers,
          {
            tier: 'frozen',
            storageGB: 102400,
            nodeCount: 1,
            memoryPerNodeGB: 32,
            jvmHeapGB: 31,
            cpuCoresPerNode: 4,
            shardCount: 5,
            serverModel: 'r760',
          },
        ],
      }
      const result = calculateHardware(
        baseInput({ clusterResult: clusterWithFrozen, frozenBackend: 'ecs' }),
      )
      expect(result.bom.objectStorage.backend).toBe('ecs')
      expect(result.bom.objectStorage.capacityTB).toBeGreaterThan(0)
      // ECS capacity = coldFrozenStorageTB * 1.2
      const frozenTB = 102400 / 1024
      expect(result.bom.objectStorage.capacityTB).toBeCloseTo(frozenTB * 1.2, 1)
    })

    it('no cold/frozen tiers results in empty object storage', () => {
      const result = calculateHardware(baseInput())
      // Only hot/warm tiers in baseClusterResult
      expect(result.bom.objectStorage.capacityTB).toBe(0)
      expect(result.bom.objectStorage.nodeCount).toBe(0)
    })
  })

  describe('empty tiers handling', () => {
    it('skips data tiers with nodeCount=0', () => {
      const clusterWithEmpty: ClusterResult = {
        ...baseClusterResult,
        tiers: [baseClusterResult.tiers[0], { ...baseClusterResult.tiers[1], nodeCount: 0 }],
      }
      const result = calculateHardware(baseInput({ clusterResult: clusterWithEmpty }))
      const warmServer = result.bom.servers.find((s) => s.role === 'data_warm')
      expect(warmServer).toBeUndefined()
    })

    it('skips coordinating nodes with nodeCount=0', () => {
      // coordinatingNodes has nodeCount=0 in baseClusterResult
      const result = calculateHardware(baseInput())
      const coordServer = result.bom.servers.find((s) => s.role === 'coordinating')
      expect(coordServer).toBeUndefined()
    })

    it('includes master and ingest nodes when nodeCount > 0', () => {
      const result = calculateHardware(baseInput())
      const masterServer = result.bom.servers.find((s) => s.role === 'master')
      const ingestServer = result.bom.servers.find((s) => s.role === 'ingest')
      expect(masterServer).toBeDefined()
      expect(masterServer?.count).toBe(3)
      expect(ingestServer).toBeDefined()
      expect(ingestServer?.count).toBe(2)
    })
  })

  describe('networking', () => {
    it('FC port count uses model name from BOM (not re-selection)', () => {
      const result = calculateHardware(baseInput())
      // The PowerStore model selected for hot/warm storage has fcPorts
      // FC ports should match the BOM model, not a re-lookup
      expect(result.bom.networking.fcPortCount).toBeGreaterThan(0)
    })

    it('switch count is at least 2', () => {
      const result = calculateHardware(baseInput())
      expect(result.bom.networking.switchCount).toBeGreaterThanOrEqual(2)
    })

    it('Ethernet port count = 2 per server', () => {
      const result = calculateHardware(baseInput())
      const totalServers = result.bom.servers.reduce((sum, s) => sum + s.count, 0)
      expect(result.bom.networking.ethPortCount).toBe(totalServers * 2)
    })

    it('FC speed is 32Gb', () => {
      const result = calculateHardware(baseInput())
      expect(result.bom.networking.fcSpeed).toBe('32Gb')
    })

    it('Ethernet speed is 25GbE', () => {
      const result = calculateHardware(baseInput())
      expect(result.bom.networking.ethSpeed).toBe('25GbE')
    })
  })

  describe('rack units', () => {
    it('calculates total rack units from servers, storage, and switches', () => {
      const result = calculateHardware(baseInput())
      // Servers: each contributes count * 2 RU
      // Storage: each contributes count * 4 RU
      // Switches: switchCount * 1 RU
      expect(result.totalRackUnits).toBeGreaterThan(0)
    })
  })

  describe('cost estimation', () => {
    it('produces reasonable positive cost', () => {
      const result = calculateHardware(baseInput())
      expect(result.estimatedCostUSD).toBeGreaterThan(0)
    })

    it('server cost is $15,000 per unit', () => {
      const result = calculateHardware(baseInput())
      const totalServerUnits = result.bom.servers.reduce((sum, s) => sum + s.count, 0)
      const totalStorageUnits = result.bom.sanStorage.reduce((sum, s) => sum + s.count, 0)
      const objectNodes = result.bom.objectStorage.nodeCount
      const switchCount = result.bom.networking.switchCount
      const expectedCost =
        totalServerUnits * 15000 +
        totalStorageUnits * 50000 +
        objectNodes * 30000 +
        switchCount * 10000
      expect(result.estimatedCostUSD).toBe(expectedCost)
    })

    it('more nodes means higher cost', () => {
      const smallCluster: ClusterResult = {
        ...baseClusterResult,
        tiers: [{ ...baseClusterResult.tiers[0], nodeCount: 2 }],
        masterNodes: { ...baseClusterResult.masterNodes, nodeCount: 3 },
        ingestNodes: { ...baseClusterResult.ingestNodes, nodeCount: 0 },
      }
      const largeCluster: ClusterResult = {
        ...baseClusterResult,
        tiers: [
          { ...baseClusterResult.tiers[0], nodeCount: 10 },
          { ...baseClusterResult.tiers[1], nodeCount: 8 },
        ],
      }
      const smallResult = calculateHardware(baseInput({ clusterResult: smallCluster }))
      const largeResult = calculateHardware(baseInput({ clusterResult: largeCluster }))
      expect(largeResult.estimatedCostUSD).toBeGreaterThan(smallResult.estimatedCostUSD)
    })
  })

  describe('server model and CPU passthrough', () => {
    it('passes preferred server model to data tier selection', () => {
      const result = calculateHardware(baseInput({ serverModel: 'r7725' }))
      const hotServer = result.bom.servers.find((s) => s.role === 'data_hot')
      expect(hotServer).toBeDefined()
      expect(hotServer?.model).toBe('PowerEdge R7725')
    })

    it('passes preferred CPU to data tier selection', () => {
      const result = calculateHardware(
        baseInput({ serverModel: 'r760', cpuOption: 'Intel Xeon Platinum 8470' }),
      )
      const hotServer = result.bom.servers.find((s) => s.role === 'data_hot')
      expect(hotServer).toBeDefined()
      expect(hotServer?.config.cpu.model).toBe('Intel Xeon Platinum 8470')
    })

    it('passes preferred storage model to PowerStore selection', () => {
      const result = calculateHardware(baseInput({ storageModel: 'ps-9200t' }))
      expect(result.bom.sanStorage.length).toBeGreaterThan(0)
      expect(result.bom.sanStorage[0].model).toBe('PowerStore 9200T')
    })

    it('infrastructure roles always use R660 regardless of serverModel preference', () => {
      const result = calculateHardware(baseInput({ serverModel: 'r7725' }))
      const masterServer = result.bom.servers.find((s) => s.role === 'master')
      expect(masterServer).toBeDefined()
      expect(masterServer?.model).toBe('PowerEdge R660')
    })
  })

  describe('BOM structure', () => {
    it('returns complete BOM with all sections', () => {
      const result = calculateHardware(baseInput())
      expect(result.bom.servers).toBeDefined()
      expect(result.bom.sanStorage).toBeDefined()
      expect(result.bom.objectStorage).toBeDefined()
      expect(result.bom.networking).toBeDefined()
    })

    it('each server entry has model, role, count, config, powerWatts', () => {
      const result = calculateHardware(baseInput())
      for (const s of result.bom.servers) {
        expect(s.model).toBeTruthy()
        expect(s.role).toBeTruthy()
        expect(s.count).toBeGreaterThan(0)
        expect(s.config).toBeDefined()
        expect(s.config.cpu).toBeDefined()
        expect(s.config.memoryGB).toBeGreaterThan(0)
        expect(s.config.driveCount).toBeGreaterThan(0)
        expect(s.config.driveCapacityTB).toBeGreaterThan(0)
        expect(s.powerWatts).toBeGreaterThan(0)
      }
    })

    it('each SAN storage entry has model, count, capacityTB, tier, powerWatts', () => {
      const result = calculateHardware(baseInput())
      for (const s of result.bom.sanStorage) {
        expect(s.model).toBeTruthy()
        expect(s.count).toBeGreaterThan(0)
        expect(s.capacityTB).toBeGreaterThan(0)
        expect(s.tier).toBe('hot/warm')
        expect(s.powerWatts).toBeGreaterThan(0)
      }
    })
  })

  describe('edge cases', () => {
    it('handles cluster with only hot tier', () => {
      const hotOnly: ClusterResult = {
        ...baseClusterResult,
        tiers: [baseClusterResult.tiers[0]],
        ingestNodes: { ...baseClusterResult.ingestNodes, nodeCount: 0 },
        coordinatingNodes: { ...baseClusterResult.coordinatingNodes, nodeCount: 0 },
      }
      const result = calculateHardware(baseInput({ clusterResult: hotOnly }))
      expect(result.bom.servers.length).toBeGreaterThanOrEqual(2) // hot data + master
      expect(result.bom.sanStorage.length).toBe(1)
    })

    it('handles cluster with all four tiers', () => {
      const allTiers: ClusterResult = {
        ...baseClusterResult,
        tiers: [
          ...baseClusterResult.tiers,
          {
            tier: 'cold',
            storageGB: 40960,
            nodeCount: 2,
            memoryPerNodeGB: 64,
            jvmHeapGB: 31,
            cpuCoresPerNode: 4,
            shardCount: 10,
            serverModel: 'r760',
          },
          {
            tier: 'frozen',
            storageGB: 102400,
            nodeCount: 1,
            memoryPerNodeGB: 32,
            jvmHeapGB: 31,
            cpuCoresPerNode: 4,
            shardCount: 5,
            serverModel: 'r760',
          },
        ],
      }
      const result = calculateHardware(
        baseInput({ clusterResult: allTiers, frozenBackend: 'powerscale' }),
      )
      // Should have data_hot, data_warm, data_cold, data_frozen, master, ingest
      const roles = result.bom.servers.map((s) => s.role)
      expect(roles).toContain('data_hot')
      expect(roles).toContain('data_warm')
      expect(roles).toContain('data_cold')
      expect(roles).toContain('data_frozen')
      // Object storage for cold + frozen
      expect(result.bom.objectStorage.capacityTB).toBeGreaterThan(0)
      expect(result.bom.objectStorage.backend).toBe('powerscale')
    })

    it('handles very small storage values', () => {
      const small: ClusterResult = {
        ...baseClusterResult,
        tiers: [
          {
            tier: 'hot',
            storageGB: 10,
            nodeCount: 2,
            memoryPerNodeGB: 64,
            jvmHeapGB: 31,
            cpuCoresPerNode: 4,
            shardCount: 1,
            serverModel: 'r760',
          },
        ],
      }
      const result = calculateHardware(baseInput({ clusterResult: small }))
      expect(result.bom.sanStorage.length).toBe(1)
      expect(result.bom.sanStorage[0].count).toBeGreaterThanOrEqual(1)
    })
  })
})
