import type { CarbonRegion } from '@/types/sizing'

// gCO2 per kWh by region
export const CARBON_FACTORS: Record<CarbonRegion, number> = {
  switzerland: 30,
  france: 55,
  germany: 350,
  italy: 250,
  us_avg: 400,
  uk: 200,
}

export function getCarbonFactor(region: CarbonRegion): number {
  return CARBON_FACTORS[region]
}
