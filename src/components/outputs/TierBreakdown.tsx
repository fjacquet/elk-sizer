import { useTranslation } from 'react-i18next'
import { useConfigStore } from '@/store'
import type { CalculationResults } from '@/types/results'
import { formatNumber, formatStorageGB } from '@/utils/units'

interface Props {
  results: CalculationResults
}

const TIER_COLORS: Record<string, string> = {
  hot: 'text-hot',
  warm: 'text-warm',
  cold: 'text-cold',
  frozen: 'text-frozen',
}

export function TierBreakdown({ results }: Props) {
  const { t } = useTranslation('output')
  const unitSystem = useConfigStore((s) => s.unitSystem)

  const activeTiers = results.cluster.tiers.filter((tier) => tier.nodeCount > 0)

  return (
    <div className="panel">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {t('tierBreakdown.title')}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700">
              <th className="text-left py-2 text-slate-400">{t('tierBreakdown.tier')}</th>
              <th className="text-right py-2 text-slate-400">{t('tierBreakdown.nodes')}</th>
              <th className="text-right py-2 text-slate-400">{t('tierBreakdown.storage')}</th>
              <th className="text-right py-2 text-slate-400">{t('tierBreakdown.memory')}</th>
              <th className="text-right py-2 text-slate-400">{t('tierBreakdown.jvmHeap')}</th>
              <th className="text-right py-2 text-slate-400">{t('tierBreakdown.shards')}</th>
            </tr>
          </thead>
          <tbody>
            {activeTiers.map((tier) => (
              <tr key={tier.tier} className="border-b border-surface-700/50">
                <td className={`py-2 font-medium capitalize ${TIER_COLORS[tier.tier] ?? ''}`}>
                  {tier.tier}
                </td>
                <td className="text-right py-2">{tier.nodeCount}</td>
                <td className="text-right py-2">{formatStorageGB(tier.storageGB, unitSystem)}</td>
                <td className="text-right py-2">{tier.memoryPerNodeGB} GB/node</td>
                <td className="text-right py-2">{tier.jvmHeapGB} GB</td>
                <td className="text-right py-2">{formatNumber(tier.shardCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Non-data nodes */}
      <div className="mt-4 pt-3 border-t border-surface-700">
        <h4 className="text-xs text-slate-500 uppercase mb-2">{t('tierBreakdown.otherNodes')}</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-slate-400">{t('tierBreakdown.master')}:</span>{' '}
            {results.cluster.masterNodes.nodeCount}
          </div>
          <div>
            <span className="text-slate-400">{t('tierBreakdown.ingest')}:</span>{' '}
            {results.cluster.ingestNodes.nodeCount}
          </div>
          <div>
            <span className="text-slate-400">{t('tierBreakdown.coordinating')}:</span>{' '}
            {results.cluster.coordinatingNodes.nodeCount}
          </div>
        </div>
      </div>

      {/* Shard health */}
      <div className="mt-3 pt-3 border-t border-surface-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">{t('tierBreakdown.shardUtilization')}</span>
          <span
            className={
              results.cluster.shardUtilization > 0.8
                ? 'text-hot'
                : results.cluster.shardUtilization > 0.6
                  ? 'text-warm'
                  : 'text-safe'
            }
          >
            {(results.cluster.shardUtilization * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}
