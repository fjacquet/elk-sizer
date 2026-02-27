import { useMemo } from 'react'
import { useConfigStore } from '@/store'
import type { CalculationResults } from '@/types/results'

export type Severity = 'error' | 'warning' | 'info'

export interface ArchWarning {
  severity: Severity
  title: string
  message: string
}

export interface ArchOptimization {
  title: string
  message: string
  impact: 'high' | 'medium' | 'low'
}

export interface ArchPattern {
  name: string
  description: string
  tiers: string[]
  icon: string
}

export interface ArchitectureAdvice {
  pattern: ArchPattern
  warnings: ArchWarning[]
  optimizations: ArchOptimization[]
  activeTierCount: number
  advisorScore: number // 0-100
}

export function useArchitectureAdvice(results: CalculationResults): ArchitectureAdvice {
  const hotDays = useConfigStore((s) => s.hotDays)
  const warmDays = useConfigStore((s) => s.warmDays)
  const coldDays = useConfigStore((s) => s.coldDays)
  const frozenDays = useConfigStore((s) => s.frozenDays)
  const replicaCount = useConfigStore((s) => s.replicaCount)
  const dailyIngestGB = useConfigStore((s) => s.dailyIngestGB)
  const memoryPerNode = useConfigStore((s) => s.memoryPerNode)
  const deploymentType = useConfigStore((s) => s.deploymentType)

  return useMemo(() => {
    const { cluster } = results
    const activeTiers = cluster.tiers.filter((t) => t.nodeCount > 0)
    const activeTierNames = activeTiers.map((t) => t.tier)
    const activeTierCount = activeTiers.length
    const hasFrozen = activeTierNames.includes('frozen')
    const hasCold = activeTierNames.includes('cold')
    const hasWarm = activeTierNames.includes('warm')

    // Determine architecture pattern
    let pattern: ArchPattern
    if (activeTierCount === 1) {
      pattern = {
        name: 'Hot-Only',
        description:
          'Single hot tier for recent, actively-indexed data. Suitable for short-retention or low-volume workloads with no archival requirements.',
        tiers: ['hot'],
        icon: '🔥',
      }
    } else if (activeTierCount === 2 && hasWarm && !hasCold && !hasFrozen) {
      pattern = {
        name: 'Hot-Warm',
        description:
          'Standard 2-tier pattern. Hot for active indexing, warm for read-only aged data. Best balance of performance and cost for most enterprise workloads.',
        tiers: ['hot', 'warm'],
        icon: '🔥🌡️',
      }
    } else if (activeTierCount === 3 && hasWarm && hasCold && !hasFrozen) {
      pattern = {
        name: 'Hot-Warm-Cold',
        description:
          'Compliance-oriented 3-tier architecture. Hot + warm for active data, cold for rarely-accessed compliance data with minimal resources.',
        tiers: ['hot', 'warm', 'cold'],
        icon: '🔥🌡️❄️',
      }
    } else if (hasFrozen) {
      pattern = {
        name: 'Full 4-Tier (Optimal TCO)',
        description:
          'Maximum cost efficiency using searchable snapshots on object storage for long-retention data. Recommended for retention > 90 days and large data volumes.',
        tiers: ['hot', 'warm', 'cold', 'frozen'],
        icon: '🔥🌡️❄️🧊',
      }
    } else {
      pattern = {
        name: 'Custom',
        description: 'Custom tier configuration based on your specific retention requirements.',
        tiers: activeTierNames,
        icon: '⚙️',
      }
    }

    // Generate warnings
    const warnings: ArchWarning[] = []

    if (replicaCount === 0) {
      warnings.push({
        severity: 'error',
        title: 'No High Availability',
        message:
          'Replica count is 0. Any node failure will cause data loss and cluster downtime. Set replicas ≥ 1 for production clusters.',
      })
    }

    if (cluster.shardUtilization > 0.8) {
      warnings.push({
        severity: 'error',
        title: 'Critical Shard Pressure',
        message: `Shard utilization is ${Math.round(cluster.shardUtilization * 100)}% (limit: 20 shards/GB heap). Reduce index count, increase shard size, or add more nodes to avoid cluster instability.`,
      })
    } else if (cluster.shardUtilization > 0.6) {
      warnings.push({
        severity: 'warning',
        title: 'High Shard Count',
        message: `Shard utilization is ${Math.round(cluster.shardUtilization * 100)}%. Approaching the 20 shards/GB heap limit. Monitor shard count growth.`,
      })
    }

    if (hotDays < 3 && dailyIngestGB > 50) {
      warnings.push({
        severity: 'warning',
        title: 'Very Short Hot Tier',
        message:
          'Hot tier is under 3 days with high ingest volume. This may cause ILM rollover bottlenecks and insufficient time for segment merges. Consider ≥ 7 days.',
      })
    }

    if (deploymentType === 'vm') {
      warnings.push({
        severity: 'warning',
        title: 'VM Overhead Applied',
        message:
          'Running Elasticsearch in VMs adds 22% CPU overhead and 14% storage overhead. Bare metal is strongly recommended for hot-tier data nodes for best latency.',
      })
    }

    if (cluster.totalNodes > 100) {
      warnings.push({
        severity: 'info',
        title: 'Large Cluster — Consider Zones',
        message:
          'Clusters with >100 nodes should use availability zones and shard allocation awareness to prevent correlated failures.',
      })
    }

    if (memoryPerNode < 64 && dailyIngestGB > 500) {
      warnings.push({
        severity: 'warning',
        title: 'Low Memory per Node',
        message:
          `${memoryPerNode} GB per node with ${dailyIngestGB} GB/day ingest may require many nodes. Consider 256–512 GB nodes for better JVM efficiency and fewer network hops.`,
      })
    }

    if (memoryPerNode > 512) {
      warnings.push({
        severity: 'info',
        title: 'Large NUMA Configuration',
        message:
          `${memoryPerNode} GB per node spans multiple NUMA domains. Elasticsearch is NUMA-aware, but verify JVM gc pause times in production. Consider Xeon Platinum CPUs for best NUMA performance.`,
      })
    }

    const totalRetentionDays = hotDays + warmDays + coldDays + frozenDays
    if (totalRetentionDays > 90 && !hasFrozen && !hasCold) {
      warnings.push({
        severity: 'info',
        title: 'Long Retention Without Cold/Frozen',
        message: `${totalRetentionDays} days of retention on hot/warm tiers only. Adding a frozen tier (searchable snapshots) could reduce storage costs by 60–80% for data older than ${hotDays + warmDays} days.`,
      })
    }

    // Generate optimizations
    const optimizations: ArchOptimization[] = []

    if (!hasFrozen && frozenDays === 0 && totalRetentionDays > 60) {
      optimizations.push({
        title: 'Enable Frozen Tier',
        message: `Enable a frozen tier for data older than ${hotDays + warmDays} days. Searchable snapshots on PowerScale/ECS cost ~80% less than SAN storage with only moderate query latency.`,
        impact: 'high',
      })
    }

    if (replicaCount > 1 && activeTierNames.includes('cold')) {
      optimizations.push({
        title: 'Reduce Replicas on Cold Tier',
        message:
          'Cold tier data is rarely queried. Consider 1 replica (instead of ' +
          replicaCount +
          ') for cold indices — Elasticsearch can be configured per-ILM-phase to change replica count.',
        impact: 'medium',
      })
    }

    if (cluster.shardUtilization < 0.3 && cluster.totalShards > 1000) {
      optimizations.push({
        title: 'Increase Shard Size',
        message:
          'Shard utilization is low but shard count is high. Increase target shard size (fewer, larger shards) to reduce per-shard overhead and improve merge efficiency.',
        impact: 'medium',
      })
    }

    if (dailyIngestGB > 200 && !deploymentType.includes('baremetal')) {
      optimizations.push({
        title: 'Use Bare Metal for Hot Nodes',
        message:
          'High ingest rates benefit from bare metal hot nodes. VM overhead reduces effective throughput by ~22%, requiring more hardware to achieve the same performance.',
        impact: 'high',
      })
    }

    // Calculate advisor score (0-100)
    let score = 100
    for (const w of warnings) {
      if (w.severity === 'error') score -= 20
      else if (w.severity === 'warning') score -= 10
      else score -= 5
    }
    score = Math.max(0, score)

    return { pattern, warnings, optimizations, activeTierCount, advisorScore: score }
  }, [
    results,
    hotDays,
    warmDays,
    coldDays,
    frozenDays,
    replicaCount,
    dailyIngestGB,
    memoryPerNode,
    deploymentType,
  ])
}
