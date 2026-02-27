import type { HardwareResult, SustainabilityResult } from '@/types/results'
import type { CarbonRegion } from '@/types/sizing'
import { getCarbonFactor } from './helpers/carbonFactors'

export interface SustainabilityEngineInput {
  hardwareResult: HardwareResult
  pue: number
  carbonRegion: CarbonRegion
  electricityCostPerKwh: number
  projectYears: number
  totalNodes: number
}

export function calculateSustainability(input: SustainabilityEngineInput): SustainabilityResult {
  const { hardwareResult, pue, carbonRegion, electricityCostPerKwh, projectYears } = input

  // Total power from all components
  const serverPower = hardwareResult.bom.servers.reduce((sum, s) => sum + s.powerWatts * s.count, 0)
  const storagePower = hardwareResult.bom.sanStorage.reduce(
    (sum, s) => sum + s.powerWatts * s.count,
    0,
  )
  const objectPower = hardwareResult.bom.objectStorage.powerWatts
  const networkPower = hardwareResult.bom.networking.switchCount * 500

  const totalPowerWatts = serverPower + storagePower + objectPower + networkPower
  const pueAdjustedPowerWatts = totalPowerWatts * pue

  // Annual energy
  const annualEnergyKWh = (pueAdjustedPowerWatts * 8760) / 1000

  // CO2
  const carbonFactor = getCarbonFactor(carbonRegion)
  const annualCO2Kg = (annualEnergyKWh * carbonFactor) / 1000

  // Costs
  const annualEnergyCostUSD = annualEnergyKWh * electricityCostPerKwh
  const energyCostUSD = annualEnergyCostUSD * projectYears
  const hardwareCostUSD = hardwareResult.estimatedCostUSD

  // Elastic license estimate: ~$50/node/month
  const licenseCostUSD = input.totalNodes * 50 * 12 * projectYears

  const totalTCO = hardwareCostUSD + energyCostUSD + licenseCostUSD

  return {
    totalPowerWatts,
    pueAdjustedPowerWatts,
    annualEnergyKWh,
    annualCO2Kg,
    annualEnergyCostUSD,
    tcoYears: projectYears,
    totalTCO,
    hardwareCostUSD,
    energyCostUSD,
    licenseCostUSD,
  }
}
