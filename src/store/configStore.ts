import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  type AdvancedSlice,
  createAdvancedSlice,
  createDeploymentSlice,
  createIngestSlice,
  createPerformanceSlice,
  createRetentionSlice,
  type DeploymentSlice,
  type IngestSlice,
  type PerformanceSlice,
  type RetentionSlice,
} from './slices'
import { urlHashStorage } from './urlStorage'

export type ConfigStore = IngestSlice &
  RetentionSlice &
  PerformanceSlice &
  DeploymentSlice &
  AdvancedSlice & {
    resetToDefaults: () => void
  }

const getDefaultState = () => ({
  dailyIngestGB: 100,
  compressionCodec: 'lz4' as const,
  replicaCount: 1,
  indexCount: 10,
  hotDays: 7,
  warmDays: 30,
  coldDays: 90,
  frozenDays: 365,
  ilmEnabled: true,
  searchRate: 50,
  indexingRate: 10000,
  concurrentSearches: 10,
  concurrentUsers: 10,
  dashboardCount: 0,
  logSourceCount: 1,
  workloadProfile: 'mixed' as const,
  deploymentType: 'baremetal' as const,
  serverModel: 'r760',
  cpuOption: 'Intel Xeon Gold 6430',
  memoryPerNode: 256,
  storageModel: 'ps-1200t',
  frozenBackend: 'powerscale' as const,
  networkSpeed: '25GbE' as const,
  pue: 1.4,
  carbonRegion: 'switzerland' as const,
  jvmHeapOverride: null,
  shardsPerIndex: 1,
  unitSystem: 'binary' as const,
  electricityCostPerKwh: 0.12,
  projectYears: 5,
})

export const useConfigStore = create<ConfigStore>()(
  persist(
    (...args) => ({
      ...createIngestSlice(...args),
      ...createRetentionSlice(...args),
      ...createPerformanceSlice(...args),
      ...createDeploymentSlice(...args),
      ...createAdvancedSlice(...args),
      resetToDefaults: () => args[0](getDefaultState()),
    }),
    {
      name: 'elk-sizer',
      storage: createJSONStorage(() => urlHashStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          state.concurrentUsers ??= 10
          state.dashboardCount ??= 0
          state.logSourceCount ??= 1
          state.workloadProfile ??= 'mixed'
        }
        return state
      },
      partialize: (state) => ({
        dailyIngestGB: state.dailyIngestGB,
        compressionCodec: state.compressionCodec,
        replicaCount: state.replicaCount,
        indexCount: state.indexCount,
        hotDays: state.hotDays,
        warmDays: state.warmDays,
        coldDays: state.coldDays,
        frozenDays: state.frozenDays,
        ilmEnabled: state.ilmEnabled,
        searchRate: state.searchRate,
        indexingRate: state.indexingRate,
        concurrentSearches: state.concurrentSearches,
        concurrentUsers: state.concurrentUsers,
        dashboardCount: state.dashboardCount,
        logSourceCount: state.logSourceCount,
        workloadProfile: state.workloadProfile,
        deploymentType: state.deploymentType,
        serverModel: state.serverModel,
        cpuOption: state.cpuOption,
        memoryPerNode: state.memoryPerNode,
        storageModel: state.storageModel,
        frozenBackend: state.frozenBackend,
        networkSpeed: state.networkSpeed,
        pue: state.pue,
        carbonRegion: state.carbonRegion,
        jvmHeapOverride: state.jvmHeapOverride,
        shardsPerIndex: state.shardsPerIndex,
        unitSystem: state.unitSystem,
        electricityCostPerKwh: state.electricityCostPerKwh,
        projectYears: state.projectYears,
      }),
    },
  ),
)
