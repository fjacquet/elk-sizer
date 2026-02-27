import powerscaleData from '@/data/dell-powerscale.json'
import type { PowerScaleModel } from '@/types/hardware'

const models = powerscaleData as PowerScaleModel[]

export function selectPowerScale(requiredCapacityTB: number): {
  model: PowerScaleModel
  nodeCount: number
} {
  // Prefer H7000 for large capacity, F710 for smaller
  const sorted = [...models].sort((a, b) => a.nodeCapacityTB - b.nodeCapacityTB)

  for (const model of sorted) {
    const maxClusterTB = model.maxClusterCapacityPB * 1024
    if (requiredCapacityTB <= maxClusterTB) {
      const nodeCount = Math.max(
        model.minNodes,
        Math.ceil(requiredCapacityTB / model.nodeCapacityTB),
      )
      if (nodeCount <= model.maxNodes) {
        return { model, nodeCount }
      }
    }
  }

  // Fallback: largest model
  const largest = sorted[sorted.length - 1]
  if (!largest) {
    return { model: models[0] as PowerScaleModel, nodeCount: 3 }
  }
  return {
    model: largest,
    nodeCount: Math.max(largest.minNodes, Math.ceil(requiredCapacityTB / largest.nodeCapacityTB)),
  }
}
