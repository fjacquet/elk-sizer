import dellServers from '@/data/dell-servers.json'
import type { DellServer, ServerConfig } from '@/types/hardware'
import type { NodeSizing, TierSizing } from '@/types/sizing'

const servers = dellServers as DellServer[]

export function selectServerForTier(tier: TierSizing): {
  server: DellServer
  config: ServerConfig
} {
  // Find server that matches tier requirements
  const candidates = servers.filter(
    (s) =>
      s.recommendedTier.includes(tier.tier) ||
      (tier.tier === 'cold' && s.recommendedTier.includes('warm')) ||
      (tier.tier === 'frozen' && s.recommendedTier.includes('warm')),
  )

  const server = candidates[0] ?? servers[0]
  if (!server) {
    throw new Error('No server models available')
  }

  // Select CPU that meets core requirements
  const cpu = server.cpuOptions.find((c) => c.cores >= tier.cpuCoresPerNode) ?? server.cpuOptions[0]
  if (!cpu) {
    throw new Error(`No CPU options for ${server.model}`)
  }

  // Memory: round up to nearest DIMM configuration
  const memoryGB = Math.min(tier.memoryPerNodeGB, server.maxMemoryGB)

  // Storage per node
  const storagePerNodeTB = tier.storageGB / tier.nodeCount / 1024
  const driveCapacityTB = Math.ceil(storagePerNodeTB / Math.min(server.maxDrives, 8))
  const driveCount = Math.ceil(storagePerNodeTB / Math.max(driveCapacityTB, 1))

  return {
    server,
    config: {
      cpu,
      memoryGB,
      driveCount: Math.min(driveCount, server.maxDrives),
      driveCapacityTB: Math.max(driveCapacityTB, 1),
    },
  }
}

export function selectServerForRole(node: NodeSizing): {
  server: DellServer
  config: ServerConfig
} {
  // Non-data roles use R660 (1U, efficient)
  const server = servers.find((s) => s.id === 'r660') ?? servers[0]
  if (!server) {
    throw new Error('No server models available')
  }

  const cpu = server.cpuOptions.find((c) => c.cores >= node.cpuCoresPerNode) ?? server.cpuOptions[0]
  if (!cpu) {
    throw new Error(`No CPU options for ${server.model}`)
  }

  return {
    server,
    config: {
      cpu,
      memoryGB: Math.min(node.memoryPerNodeGB, server.maxMemoryGB),
      driveCount: 2,
      driveCapacityTB: 0.48,
    },
  }
}
