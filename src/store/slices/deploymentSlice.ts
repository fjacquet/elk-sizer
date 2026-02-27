import type { StateCreator } from 'zustand'
import type { DeploymentType, FrozenBackend, NetworkSpeed } from '@/types/sizing'

export interface DeploymentSlice {
  deploymentType: DeploymentType
  serverModel: string
  cpuOption: string
  memoryPerNode: number
  storageModel: string
  frozenBackend: FrozenBackend
  networkSpeed: NetworkSpeed
  setDeploymentType: (v: DeploymentType) => void
  setServerModel: (v: string) => void
  setCpuOption: (v: string) => void
  setMemoryPerNode: (v: number) => void
  setStorageModel: (v: string) => void
  setFrozenBackend: (v: FrozenBackend) => void
  setNetworkSpeed: (v: NetworkSpeed) => void
}

export const createDeploymentSlice: StateCreator<DeploymentSlice, [], [], DeploymentSlice> = (
  set,
) => ({
  deploymentType: 'baremetal',
  serverModel: 'r760',
  cpuOption: 'Intel Xeon Gold 6430',
  memoryPerNode: 256,
  storageModel: 'ps-1200t',
  frozenBackend: 'powerscale',
  networkSpeed: '25GbE',
  setDeploymentType: (v) => set({ deploymentType: v }),
  setServerModel: (v) => set({ serverModel: v }),
  setCpuOption: (v) => set({ cpuOption: v }),
  setMemoryPerNode: (v) => set({ memoryPerNode: v }),
  setStorageModel: (v) => set({ storageModel: v }),
  setFrozenBackend: (v) => set({ frozenBackend: v }),
  setNetworkSpeed: (v) => set({ networkSpeed: v }),
})
