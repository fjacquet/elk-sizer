import powerstoreData from '@/data/dell-powerstore.json'
import type { PowerStoreModel } from '@/types/hardware'

const models = powerstoreData as PowerStoreModel[]

export function selectPowerStore(requiredCapacityTB: number): {
  model: PowerStoreModel
  count: number
} {
  // Sort by capacity ascending, pick the smallest that fits
  const sorted = [...models].sort((a, b) => a.maxEffectiveCapacityTB - b.maxEffectiveCapacityTB)

  for (const model of sorted) {
    const count = Math.ceil(requiredCapacityTB / model.maxEffectiveCapacityTB)
    if (count <= 4) {
      return { model, count }
    }
  }

  // Fallback: use the largest model
  const largest = sorted[sorted.length - 1]
  if (!largest) {
    return { model: models[0] as PowerStoreModel, count: 1 }
  }
  return {
    model: largest,
    count: Math.ceil(requiredCapacityTB / largest.maxEffectiveCapacityTB),
  }
}
