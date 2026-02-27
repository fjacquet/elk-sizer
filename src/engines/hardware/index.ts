import type {
  BOMObjectStorageEntry,
  BOMServerEntry,
  BOMStorageEntry,
  HardwareBOM,
} from '@/types/hardware'
import type { ClusterResult, HardwareResult } from '@/types/results'
import type { DeploymentType, FrozenBackend } from '@/types/sizing'
import { SIZING } from '@/types/sizing'
import { selectServerForRole, selectServerForTier } from './helpers/serverSelector'
import { selectPowerScale } from './strategies/powerscaleStrategy'
import { selectPowerStore } from './strategies/powerstoreStrategy'

export interface HardwareEngineInput {
  clusterResult: ClusterResult
  deploymentType: DeploymentType
  frozenBackend: FrozenBackend
}

export function calculateHardware(input: HardwareEngineInput): HardwareResult {
  const { clusterResult, deploymentType, frozenBackend } = input
  const isVM = deploymentType === 'vm'

  const bomServers: BOMServerEntry[] = []
  const bomStorage: BOMStorageEntry[] = []

  // Data tier servers
  for (const tier of clusterResult.tiers) {
    if (tier.nodeCount <= 0) continue

    const adjustedTier = isVM
      ? {
          ...tier,
          nodeCount: Math.ceil(tier.nodeCount / SIZING.VM_PERF_FACTOR),
          storageGB: tier.storageGB / SIZING.VM_STORAGE_FACTOR,
        }
      : tier

    const { server, config } = selectServerForTier(adjustedTier)
    bomServers.push({
      model: server.model,
      role: `data_${tier.tier}`,
      count: adjustedTier.nodeCount,
      config,
      powerWatts: server.maxPowerWatts,
    })
  }

  // Master, ingest, coordinating servers
  for (const nodeGroup of [
    clusterResult.masterNodes,
    clusterResult.ingestNodes,
    clusterResult.coordinatingNodes,
  ]) {
    if (nodeGroup.nodeCount <= 0) continue
    const { server, config } = selectServerForRole(nodeGroup)
    bomServers.push({
      model: server.model,
      role: nodeGroup.role,
      count: nodeGroup.nodeCount,
      config,
      powerWatts: server.maxPowerWatts,
    })
  }

  // SAN storage for hot/warm tiers
  const hotWarmStorageTB = clusterResult.tiers
    .filter((t) => t.tier === 'hot' || t.tier === 'warm')
    .reduce((sum, t) => sum + t.storageGB / 1024, 0)

  if (hotWarmStorageTB > 0) {
    const { model, count } = selectPowerStore(hotWarmStorageTB)
    bomStorage.push({
      model: model.model,
      count,
      capacityTB: model.maxEffectiveCapacityTB * count,
      tier: 'hot/warm',
      powerWatts: model.powerWatts,
    })
  }

  // Object storage for cold/frozen
  const coldFrozenStorageTB = clusterResult.tiers
    .filter((t) => t.tier === 'cold' || t.tier === 'frozen')
    .reduce((sum, t) => sum + t.storageGB / 1024, 0)

  let objectStorage: BOMObjectStorageEntry = {
    backend: frozenBackend,
    capacityTB: 0,
    nodeCount: 0,
    powerWatts: 0,
  }

  if (coldFrozenStorageTB > 0) {
    if (frozenBackend === 'powerscale') {
      const { model, nodeCount } = selectPowerScale(coldFrozenStorageTB)
      objectStorage = {
        backend: 'powerscale',
        capacityTB: model.nodeCapacityTB * nodeCount,
        nodeCount,
        powerWatts: model.powerWattsPerNode * nodeCount,
      }
    } else {
      // ECS: estimate
      objectStorage = {
        backend: 'ecs',
        capacityTB: coldFrozenStorageTB * 1.2,
        nodeCount: Math.ceil(coldFrozenStorageTB / 500),
        powerWatts: Math.ceil(coldFrozenStorageTB / 500) * 800,
      }
    }
  }

  // Network
  const totalFcPorts = bomStorage.reduce((sum, s) => {
    const psModel = selectPowerStore(s.capacityTB)
    return sum + psModel.model.fcPorts * s.count
  }, 0)

  const totalEthPorts = bomServers.reduce((sum, s) => sum + s.count * 2, 0)

  const networking = {
    switchCount: Math.max(2, Math.ceil(totalEthPorts / 48)),
    fcPortCount: totalFcPorts,
    ethPortCount: totalEthPorts,
    fcSpeed: '32Gb',
    ethSpeed: '25GbE',
  }

  const bom: HardwareBOM = {
    servers: bomServers,
    sanStorage: bomStorage,
    objectStorage,
    networking,
  }

  // Rack units
  const totalRackUnits =
    bomServers.reduce((sum, s) => sum + s.count * 2, 0) +
    bomStorage.reduce((sum, s) => sum + s.count * 4, 0) +
    networking.switchCount * 1

  // Cost estimate (rough)
  const serverCost = bomServers.reduce((sum, s) => sum + s.count * 15000, 0)
  const storageCost = bomStorage.reduce((sum, s) => sum + s.count * 50000, 0)
  const objectCost = objectStorage.nodeCount * 30000
  const networkCost = networking.switchCount * 10000

  return {
    bom,
    totalRackUnits,
    estimatedCostUSD: serverCost + storageCost + objectCost + networkCost,
  }
}
