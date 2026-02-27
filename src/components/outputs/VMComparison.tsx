import { useTranslation } from 'react-i18next'
import { useConfigStore } from '@/store'
import type { VMComparisonResult } from '@/types/results'
import { formatCurrency, formatNumber, formatStorageTB } from '@/utils/units'

interface Props {
  comparison: VMComparisonResult
}

export function VMComparison({ comparison }: Props) {
  const { t } = useTranslation('output')
  const unitSystem = useConfigStore((s) => s.unitSystem)

  const rows = [
    {
      label: t('vmComparison.totalNodes'),
      bm: formatNumber(comparison.baremetal.totalNodes),
      vm: formatNumber(comparison.vm.totalNodes),
    },
    {
      label: t('vmComparison.totalStorage'),
      bm: formatStorageTB(comparison.baremetal.totalStorageTB, unitSystem),
      vm: formatStorageTB(comparison.vm.totalStorageTB, unitSystem),
    },
    {
      label: t('vmComparison.totalMemory'),
      bm: formatStorageTB(comparison.baremetal.totalMemoryTB, unitSystem),
      vm: formatStorageTB(comparison.vm.totalMemoryTB, unitSystem),
    },
    {
      label: t('vmComparison.estimatedCost'),
      bm: formatCurrency(comparison.baremetal.estimatedCostUSD),
      vm: formatCurrency(comparison.vm.estimatedCostUSD),
    },
  ]

  return (
    <div className="panel">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {t('vmComparison.title')}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700">
              <th className="text-left py-2 text-slate-400">{t('vmComparison.metric')}</th>
              <th className="text-right py-2 text-primary-400">{t('vmComparison.baremetal')}</th>
              <th className="text-right py-2 text-warm">{t('vmComparison.vm')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-surface-700/50">
                <td className="py-2 text-slate-300">{row.label}</td>
                <td className="text-right py-2">{row.bm}</td>
                <td className="text-right py-2">{row.vm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {t('vmComparison.overhead')}: +{comparison.vm.overheadPercent.toFixed(0)}%
      </div>
    </div>
  )
}
