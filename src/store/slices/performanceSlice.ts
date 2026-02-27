import type { StateCreator } from 'zustand'

export interface PerformanceSlice {
  searchRate: number
  indexingRate: number
  concurrentSearches: number
  setSearchRate: (v: number) => void
  setIndexingRate: (v: number) => void
  setConcurrentSearches: (v: number) => void
}

export const createPerformanceSlice: StateCreator<PerformanceSlice, [], [], PerformanceSlice> = (
  set,
) => ({
  searchRate: 50,
  indexingRate: 10000,
  concurrentSearches: 10,
  setSearchRate: (v) => set({ searchRate: v }),
  setIndexingRate: (v) => set({ indexingRate: v }),
  setConcurrentSearches: (v) => set({ concurrentSearches: v }),
})
