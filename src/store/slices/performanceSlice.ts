import type { StateCreator } from 'zustand'
import type { WorkloadProfile } from '@/types/sizing'

export interface PerformanceSlice {
  searchRate: number
  indexingRate: number
  concurrentSearches: number
  concurrentUsers: number
  dashboardCount: number
  logSourceCount: number
  workloadProfile: WorkloadProfile
  setSearchRate: (v: number) => void
  setIndexingRate: (v: number) => void
  setConcurrentSearches: (v: number) => void
  setConcurrentUsers: (v: number) => void
  setDashboardCount: (v: number) => void
  setLogSourceCount: (v: number) => void
  setWorkloadProfile: (v: WorkloadProfile) => void
}

export const createPerformanceSlice: StateCreator<PerformanceSlice, [], [], PerformanceSlice> = (
  set,
) => ({
  searchRate: 50,
  indexingRate: 10000,
  concurrentSearches: 10,
  concurrentUsers: 10,
  dashboardCount: 0,
  logSourceCount: 1,
  workloadProfile: 'mixed',
  setSearchRate: (v) => set({ searchRate: v }),
  setIndexingRate: (v) => set({ indexingRate: v }),
  setConcurrentSearches: (v) => set({ concurrentSearches: v }),
  setConcurrentUsers: (v) => set({ concurrentUsers: v }),
  setDashboardCount: (v) => set({ dashboardCount: v }),
  setLogSourceCount: (v) => set({ logSourceCount: v }),
  setWorkloadProfile: (v) => set({ workloadProfile: v }),
})
