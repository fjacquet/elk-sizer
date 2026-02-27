import { useTranslation } from 'react-i18next'
import type { SustainabilityResult } from '@/types/results'
import { formatCO2, formatCurrency, formatPower } from '@/utils/units'

interface Props {
  sustainability: SustainabilityResult
}

export function SustainabilityCards({ sustainability }: Props) {
  const { t } = useTranslation('output')

  const cards = [
    {
      label: t('sustainability.totalPower'),
      value: formatPower(sustainability.pueAdjustedPowerWatts),
      sub: `PUE-adjusted`,
    },
    {
      label: t('sustainability.annualEnergy'),
      value: `${(sustainability.annualEnergyKWh / 1000).toFixed(1)} MWh`,
      sub: t('sustainability.perYear'),
    },
    {
      label: t('sustainability.annualCO2'),
      value: formatCO2(sustainability.annualCO2Kg),
      sub: t('sustainability.perYear'),
    },
    {
      label: t('sustainability.tco'),
      value: formatCurrency(sustainability.totalTCO),
      sub: `${sustainability.tcoYears}yr`,
    },
  ]

  return (
    <div className="panel">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {t('sustainability.title')}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-surface-700/50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="text-lg font-bold text-safe mt-1">{card.value}</p>
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* TCO breakdown */}
      <div className="mt-4 pt-3 border-t border-surface-700 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">{t('sustainability.hardwareCost')}</span>
          <span>{formatCurrency(sustainability.hardwareCostUSD)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('sustainability.energyCost')}</span>
          <span>{formatCurrency(sustainability.energyCostUSD)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('sustainability.licenseCost')}</span>
          <span>{formatCurrency(sustainability.licenseCostUSD)}</span>
        </div>
      </div>
    </div>
  )
}
