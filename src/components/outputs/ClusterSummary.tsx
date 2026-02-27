import { useTranslation } from 'react-i18next'
import { useConfigStore } from '@/store'
import type { CalculationResults } from '@/types/results'
import { formatCurrency, formatNumber, formatStorageTB } from '@/utils/units'

interface Props {
  results: CalculationResults
}

export function ClusterSummary({ results }: Props) {
  const { t } = useTranslation('output')
  const unitSystem = useConfigStore((s) => s.unitSystem)

  const cards = [
    {
      label: t('summary.totalNodes'),
      value: formatNumber(results.cluster.totalNodes),
      color: 'text-primary-400',
    },
    {
      label: t('summary.totalStorage'),
      value: formatStorageTB(results.cluster.totalStorageTB, unitSystem),
      color: 'text-elastic',
    },
    {
      label: t('summary.totalMemory'),
      value: formatStorageTB(results.cluster.totalMemoryTB, unitSystem),
      color: 'text-warm',
    },
    {
      label: t('summary.estimatedCost'),
      value: formatCurrency(results.hardware.estimatedCostUSD),
      color: 'text-hot',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="panel text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
