export interface DellServer {
  id: string
  model: string
  generation: string
  cpuOptions: CpuOption[]
  maxMemoryGB: number
  memorySlots: number
  maxDrives: number
  driveFormFactor: string
  pcieSlots: number
  networkPorts: NetworkPort[]
  powerSupplyWatts: number
  idlePowerWatts: number
  maxPowerWatts: number
  rackUnits: number
  recommendedTier: string[]
}

export interface CpuOption {
  model: string
  cores: number
  threads: number
  baseClockGHz: number
  tdpWatts: number
}

export interface NetworkPort {
  speed: string
  count: number
  type: string
}

export interface PowerStoreModel {
  id: string
  model: string
  maxRawCapacityTB: number
  maxEffectiveCapacityTB: number
  maxIOPS: number
  latencyMs: number
  fcPorts: number
  fcSpeed: string
  maxDrives: number
  controllerCount: number
  powerWatts: number
  rackUnits: number
}

export interface PowerScaleModel {
  id: string
  model: string
  nodeCapacityTB: number
  maxClusterCapacityPB: number
  s3ThroughputGBps: number
  networkPorts: NetworkPort[]
  powerWattsPerNode: number
  minNodes: number
  maxNodes: number
  rackUnitsPerNode: number
}

export interface ElasticNodeRole {
  role: string
  description: string
  minMemoryGB: number
  recommendedMemoryGB: number
  minCores: number
  recommendedCores: number
  storageRequired: boolean
  jvmHeapRequired: boolean
}

export interface ServerConfig {
  cpu: CpuOption
  memoryGB: number
  driveCount: number
  driveCapacityTB: number
}

export interface HardwareBOM {
  servers: BOMServerEntry[]
  sanStorage: BOMStorageEntry[]
  objectStorage: BOMObjectStorageEntry
  networking: BOMNetworkEntry
}

export interface BOMServerEntry {
  model: string
  role: string
  count: number
  config: ServerConfig
  powerWatts: number
}

export interface BOMStorageEntry {
  model: string
  count: number
  capacityTB: number
  tier: string
  powerWatts: number
}

export interface BOMObjectStorageEntry {
  backend: string
  capacityTB: number
  nodeCount: number
  powerWatts: number
}

export interface BOMNetworkEntry {
  switchCount: number
  fcPortCount: number
  ethPortCount: number
  fcSpeed: string
  ethSpeed: string
}
