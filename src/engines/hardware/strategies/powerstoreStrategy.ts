import powerstoreData from '@/data/dell-powerstore.json'
import type { PowerStoreModel } from '@/types/hardware'

const models = powerstoreData as PowerStoreModel[]

export function selectPowerStore(
  requiredCapacityTB: number,
  preferredModelId?: string,
): {
  model: PowerStoreModel
  count: number
} {
  // Use the user-selected model if provided and found
  if (preferredModelId) {
    const preferred = models.find((m) => m.id === preferredModelId)
    if (preferred) {
      return {
        model: preferred,
        count: Math.max(1, Math.ceil(requiredCapacityTB / preferred.maxEffectiveCapacityTB)),
      }
    }
  }

  // Auto-select: sort by capacity ascending, pick the smallest that fits
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
