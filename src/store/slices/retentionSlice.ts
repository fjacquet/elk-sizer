import type { StateCreator } from 'zustand'

export interface RetentionSlice {
  hotDays: number
  warmDays: number
  coldDays: number
  frozenDays: number
  ilmEnabled: boolean
  setHotDays: (v: number) => void
  setWarmDays: (v: number) => void
  setColdDays: (v: number) => void
  setFrozenDays: (v: number) => void
  setIlmEnabled: (v: boolean) => void
}

export const createRetentionSlice: StateCreator<RetentionSlice, [], [], RetentionSlice> = (
  set,
) => ({
  hotDays: 7,
  warmDays: 30,
  coldDays: 90,
  frozenDays: 365,
  ilmEnabled: true,
  setHotDays: (v) => set({ hotDays: v }),
  setWarmDays: (v) => set({ warmDays: v }),
  setColdDays: (v) => set({ coldDays: v }),
  setFrozenDays: (v) => set({ frozenDays: v }),
  setIlmEnabled: (v) => set({ ilmEnabled: v }),
})
