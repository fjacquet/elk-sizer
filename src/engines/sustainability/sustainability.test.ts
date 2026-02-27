import { describe, expect, it } from 'vitest'
import { calculateSustainability } from './index'
import { getCarbonFactor } from './helpers/carbonFactors'
import type { HardwareResult } from '@/types/results'

describe('Sustainability Engine', () => {
  const mockHardwareResult: HardwareResult = {
    bom: {
      servers: [
        {
          model: 'R760',
          role: 'data_hot',
          count: 4,
          config: {
            cpu: { model: 'Xeon Gold 6430', cores: 32, threads: 64, baseClockGHz: 2.1, tdpWatts: 270 },
            memoryGB: 64,
            driveCount: 8,
            driveCapacityTB: 2,
          },
          powerWatts: 1200,
        },
      ],
      sanStorage: [{ model: 'PS-1200T', count: 1, capacityTB: 384, tier: 'hot/warm', powerWatts: 1200 }],
      objectStorage: { backend: 'powerscale', capacityTB: 100, nodeCount: 3, powerWatts: 2250 },
      networking: { switchCount: 2, fcPortCount: 8, ethPortCount: 12, fcSpeed: '32Gb', ethSpeed: '25GbE' },
    },
    totalRackUnits: 20,
    estimatedCostUSD: 200000,
  }

  it('calculates power consumption correctly', () => {
    const result = calculateSustainability({
      hardwareResult: mockHardwareResult,
      pue: 1.4,
      carbonRegion: 'switzerland',
      electricityCostPerKwh: 0.12,
      projectYears: 5,
      totalNodes: 10,
    })

    // Server power: 1200 * 4 = 4800
    // Storage power: 1200 * 1 = 1200
    // Object power: 2250
    // Network power: 2 * 500 = 1000
    // Total = 9250
    expect(result.totalPowerWatts).toBe(9250)
    // PUE adjusted: 9250 * 1.4 = 12950
    expect(result.pueAdjustedPowerWatts).toBeCloseTo(12950, 0)
  })

  it('calculates annual energy correctly', () => {
    const result = calculateSustainability({
      hardwareResult: mockHardwareResult,
      pue: 1.0,
      carbonRegion: 'switzerland',
      electricityCostPerKwh: 0.12,
      projectYears: 1,
      totalNodes: 10,
    })

    // 9250 * 8760 / 1000 = 81,030 kWh
    expect(result.annualEnergyKWh).toBeCloseTo(81030, -1)
  })

  it('uses correct carbon factor per region', () => {
    expect(getCarbonFactor('switzerland')).toBe(30)
    expect(getCarbonFactor('germany')).toBe(350)
    expect(getCarbonFactor('france')).toBe(55)
    expect(getCarbonFactor('italy')).toBe(250)
  })

  it('calculates TCO with all components', () => {
    const result = calculateSustainability({
      hardwareResult: mockHardwareResult,
      pue: 1.4,
      carbonRegion: 'switzerland',
      electricityCostPerKwh: 0.12,
      projectYears: 5,
      totalNodes: 10,
    })

    expect(result.totalTCO).toBe(result.hardwareCostUSD + result.energyCostUSD + result.licenseCostUSD)
    expect(result.hardwareCostUSD).toBe(200000)
    expect(result.licenseCostUSD).toBe(10 * 50 * 12 * 5) // 10 nodes * $50/mo * 12 * 5yr
    expect(result.tcoYears).toBe(5)
  })
})
