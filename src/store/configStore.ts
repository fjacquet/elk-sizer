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
  deploymentType: 'baremetal' as const,
  serverModel: 'r760',
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
      version: 1,
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
        deploymentType: state.deploymentType,
        serverModel: state.serverModel,
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
