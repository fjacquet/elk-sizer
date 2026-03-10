import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigStore } from '@/store'
import type { CalculationResults } from '@/types/results'
import { SIZING } from '@/types/sizing'

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
  const { t } = useTranslation('advisor')
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
    const activeTiers = cluster.tiers.filter((ti) => ti.nodeCount > 0)
    const activeTierNames = activeTiers.map((ti) => ti.tier)
    const activeTierCount = activeTiers.length
    const hasFrozen = activeTierNames.includes('frozen')
    const hasCold = activeTierNames.includes('cold')
    const hasWarm = activeTierNames.includes('warm')

    // Determine architecture pattern
    let pattern: ArchPattern
    if (activeTierCount === 1) {
      pattern = {
        name: t('pattern.hotOnly.name'),
        description: t('pattern.hotOnly.description'),
        tiers: ['hot'],
        icon: '🔥',
      }
    } else if (activeTierCount === 2 && hasWarm && !hasCold && !hasFrozen) {
      pattern = {
        name: t('pattern.hotWarm.name'),
        description: t('pattern.hotWarm.description'),
        tiers: ['hot', 'warm'],
        icon: '🔥🌡️',
      }
    } else if (activeTierCount === 3 && hasWarm && hasCold && !hasFrozen) {
      pattern = {
        name: t('pattern.hotWarmCold.name'),
        description: t('pattern.hotWarmCold.description'),
        tiers: ['hot', 'warm', 'cold'],
        icon: '🔥🌡️❄️',
      }
    } else if (hasFrozen) {
      pattern = {
        name: t('pattern.full4Tier.name'),
        description: t('pattern.full4Tier.description'),
        tiers: ['hot', 'warm', 'cold', 'frozen'],
        icon: '🔥🌡️❄️🧊',
      }
    } else {
      pattern = {
        name: t('pattern.custom.name'),
        description: t('pattern.custom.description'),
        tiers: activeTierNames,
        icon: '⚙️',
      }
    }

    // Generate warnings
    const warnings: ArchWarning[] = []

    if (replicaCount === 0) {
      warnings.push({
        severity: 'error',
        title: t('warning.noHA.title'),
        message: t('warning.noHA.message'),
      })
    }

    if (cluster.shardUtilization > 0.8) {
      warnings.push({
        severity: 'error',
        title: t('warning.criticalShardPressure.title'),
        message: t('warning.criticalShardPressure.message', {
          pct: Math.round(cluster.shardUtilization * 100),
        }),
      })
    } else if (cluster.shardUtilization > 0.6) {
      warnings.push({
        severity: 'warning',
        title: t('warning.highShardCount.title'),
        message: t('warning.highShardCount.message', {
          pct: Math.round(cluster.shardUtilization * 100),
        }),
      })
    }

    if (hotDays < 3 && dailyIngestGB > 50) {
      warnings.push({
        severity: 'warning',
        title: t('warning.shortHotTier.title'),
        message: t('warning.shortHotTier.message'),
      })
    }

    if (deploymentType === 'vm') {
      warnings.push({
        severity: 'warning',
        title: t('warning.vmOverhead.title'),
        message: t('warning.vmOverhead.message'),
      })
    }

    if (deploymentType === 'ece') {
      warnings.push({
        severity: 'warning',
        title: t('warning.eceOverhead.title'),
        message: t('warning.eceOverhead.message'),
      })
    }

    if (cluster.totalNodes > 100) {
      warnings.push({
        severity: 'info',
        title: t('warning.largeCluster.title'),
        message: t('warning.largeCluster.message'),
      })
    }

    if (memoryPerNode < 64 && dailyIngestGB > 500) {
      warnings.push({
        severity: 'warning',
        title: t('warning.lowMemory.title'),
        message: t('warning.lowMemory.message', { memoryPerNode, dailyIngestGB }),
      })
    }

    if (memoryPerNode > 512) {
      warnings.push({
        severity: 'info',
        title: t('warning.largeNuma.title'),
        message: t('warning.largeNuma.message', { memoryPerNode }),
      })
    }

    const totalRetentionDays = hotDays + warmDays + coldDays + frozenDays
    if (totalRetentionDays > 90 && !hasFrozen && !hasCold) {
      warnings.push({
        severity: 'info',
        title: t('warning.longRetentionNoCold.title'),
        message: t('warning.longRetentionNoCold.message', {
          totalRetentionDays,
          hotWarmDays: hotDays + warmDays,
        }),
      })
    }

    if (results.performance.totalAvailableIOPS > 0) {
      if (results.performance.iopsUtilization > SIZING.IOPS_CRITICAL_THRESHOLD) {
        warnings.push({
          severity: 'error',
          title: t('warning.iopsSaturation.title'),
          message: t('warning.iopsSaturation.message', {
            iops: Math.round(
              results.performance.totalRequiredIOPS * SIZING.IOPS_HEADROOM,
            ).toLocaleString(),
            pct: Math.round(results.performance.iopsUtilization * 100),
          }),
        })
      } else if (results.performance.iopsUtilization > SIZING.IOPS_WARNING_THRESHOLD) {
        warnings.push({
          severity: 'warning',
          title: t('warning.highIops.title'),
          message: t('warning.highIops.message', {
            pct: Math.round(results.performance.iopsUtilization * 100),
          }),
        })
      }
    }

    if (results.performance.fcUtilization > 0.8) {
      warnings.push({
        severity: 'error',
        title: t('warning.fcSaturation.title'),
        message: t('warning.fcSaturation.message', {
          pct: Math.round(results.performance.fcUtilization * 100),
        }),
      })
    } else if (results.performance.fcUtilization > 0.6) {
      warnings.push({
        severity: 'warning',
        title: t('warning.highFc.title'),
        message: t('warning.highFc.message', {
          pct: Math.round(results.performance.fcUtilization * 100),
        }),
      })
    }

    if (results.performance.estimatedLatencyMs > 5) {
      warnings.push({
        severity: 'error',
        title: t('warning.highLatency.title'),
        message: t('warning.highLatency.message', {
          latency: results.performance.estimatedLatencyMs.toFixed(1),
        }),
      })
    } else if (results.performance.estimatedLatencyMs > 2) {
      warnings.push({
        severity: 'warning',
        title: t('warning.elevatedLatency.title'),
        message: t('warning.elevatedLatency.message', {
          latency: results.performance.estimatedLatencyMs.toFixed(1),
        }),
      })
    }

    // Generate optimizations
    const optimizations: ArchOptimization[] = []

    if (!hasFrozen && frozenDays === 0 && totalRetentionDays > 60) {
      optimizations.push({
        title: t('optimization.enableFrozen.title'),
        message: t('optimization.enableFrozen.message', { hotWarmDays: hotDays + warmDays }),
        impact: 'high',
      })
    }

    if (replicaCount > 1 && activeTierNames.includes('cold')) {
      optimizations.push({
        title: t('optimization.reduceColdReplicas.title'),
        message: t('optimization.reduceColdReplicas.message', { replicaCount }),
        impact: 'medium',
      })
    }

    if (cluster.shardUtilization < 0.3 && cluster.totalShards > 1000) {
      optimizations.push({
        title: t('optimization.increaseShardSize.title'),
        message: t('optimization.increaseShardSize.message'),
        impact: 'medium',
      })
    }

    if (dailyIngestGB > 200 && !deploymentType.includes('baremetal')) {
      optimizations.push({
        title: t('optimization.useBareMetal.title'),
        message: t('optimization.useBareMetal.message'),
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
    t,
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
