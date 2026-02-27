import type { StateCreator } from 'zustand'
import type { CarbonRegion, UnitSystem } from '@/types/sizing'

export interface AdvancedSlice {
  pue: number
  carbonRegion: CarbonRegion
  jvmHeapOverride: number | null
  shardsPerIndex: number
  unitSystem: UnitSystem
  electricityCostPerKwh: number
  projectYears: number
  setPue: (v: number) => void
  setCarbonRegion: (v: CarbonRegion) => void
  setJvmHeapOverride: (v: number | null) => void
  setShardsPerIndex: (v: number) => void
  setUnitSystem: (v: UnitSystem) => void
  setElectricityCostPerKwh: (v: number) => void
  setProjectYears: (v: number) => void
}

export const createAdvancedSlice: StateCreator<AdvancedSlice, [], [], AdvancedSlice> = (set) => ({
  pue: 1.4,
  carbonRegion: 'switzerland',
  jvmHeapOverride: null,
  shardsPerIndex: 1,
  unitSystem: 'binary',
  electricityCostPerKwh: 0.12,
  projectYears: 5,
  setPue: (v) => set({ pue: v }),
  setCarbonRegion: (v) => set({ carbonRegion: v }),
  setJvmHeapOverride: (v) => set({ jvmHeapOverride: v }),
  setShardsPerIndex: (v) => set({ shardsPerIndex: v }),
  setUnitSystem: (v) => set({ unitSystem: v }),
  setElectricityCostPerKwh: (v) => set({ electricityCostPerKwh: v }),
  setProjectYears: (v) => set({ projectYears: v }),
})
