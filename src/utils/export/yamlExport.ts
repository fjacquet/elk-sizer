import { dump } from 'js-yaml'
import { toast } from 'sonner'
import type { CalculationResults } from '@/types/results'

export function exportYAML(results: CalculationResults): void {
  try {
    const data = {
      cluster: {
        totalNodes: results.cluster.totalNodes,
        totalStorageTB: Number(results.cluster.totalStorageTB.toFixed(2)),
        totalMemoryTB: Number(results.cluster.totalMemoryTB.toFixed(2)),
        totalShards: results.cluster.totalShards,
        tiers: results.cluster.tiers
          .filter((t) => t.nodeCount > 0)
          .map((t) => ({
            tier: t.tier,
            nodes: t.nodeCount,
            storageGB: Number(t.storageGB.toFixed(0)),
            memoryPerNodeGB: t.memoryPerNodeGB,
            jvmHeapGB: t.jvmHeapGB,
            shards: t.shardCount,
            serverModel: t.serverModel,
          })),
        infrastructure: {
          masterNodes: results.cluster.masterNodes.nodeCount,
          ingestNodes: results.cluster.ingestNodes.nodeCount,
          coordinatingNodes: results.cluster.coordinatingNodes.nodeCount,
        },
      },
      hardware: {
        servers: results.hardware.bom.servers.map((s) => ({
          model: s.model,
          role: s.role,
          count: s.count,
          cpu: s.config.cpu.model,
          memoryGB: s.config.memoryGB,
        })),
        sanStorage: results.hardware.bom.sanStorage.map((s) => ({
          model: s.model,
          count: s.count,
          capacityTB: s.capacityTB,
        })),
        objectStorage: {
          backend: results.hardware.bom.objectStorage.backend,
          capacityTB: results.hardware.bom.objectStorage.capacityTB,
        },
        totalRackUnits: results.hardware.totalRackUnits,
        estimatedCostUSD: results.hardware.estimatedCostUSD,
      },
      sustainability: {
        totalPowerKW: Number((results.sustainability.pueAdjustedPowerWatts / 1000).toFixed(1)),
        annualEnergyMWh: Number((results.sustainability.annualEnergyKWh / 1000).toFixed(1)),
        annualCO2Tons: Number((results.sustainability.annualCO2Kg / 1000).toFixed(1)),
        tcoUSD: results.sustainability.totalTCO,
      },
    }

    const yamlStr = dump(data, { lineWidth: 120, noRefs: true })
    const blob = new Blob([yamlStr], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'elk-sizer-config.yaml'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('YAML export failed:', error)
    toast.error('YAML export failed', {
      description: 'An error occurred while generating the YAML configuration.',
    })
  }
}
