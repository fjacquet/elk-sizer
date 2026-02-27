import { useMemo } from 'react'
import { calculateSustainability } from '@/engines/sustainability'
import { useConfigStore } from '@/store'
import type { HardwareResult, SustainabilityResult } from '@/types/results'

export function useSustainabilityCalc(
  hardwareResult: HardwareResult,
  totalNodes: number,
): SustainabilityResult {
  const pue = useConfigStore((s) => s.pue)
  const carbonRegion = useConfigStore((s) => s.carbonRegion)
  const electricityCostPerKwh = useConfigStore((s) => s.electricityCostPerKwh)
  const projectYears = useConfigStore((s) => s.projectYears)

  return useMemo(
    () =>
      calculateSustainability({
        hardwareResult,
        pue,
        carbonRegion,
        electricityCostPerKwh,
        projectYears,
        totalNodes,
      }),
    [hardwareResult, pue, carbonRegion, electricityCostPerKwh, projectYears, totalNodes],
  )
}
