import { useTranslation } from 'react-i18next'

export function TierArchitectureGuide() {
  const { t } = useTranslation('guide')

  return (
    <div className="space-y-3">
      <p>{t('tierArchitecture.intro')}</p>

      <div className="space-y-2">
        {(['hot', 'warm', 'cold', 'frozen'] as const).map((tier) => (
          <div key={tier} className="flex gap-3 items-start">
            <span
              className={`inline-block w-2 h-2 mt-1.5 rounded-full ${
                tier === 'hot'
                  ? 'bg-red-400'
                  : tier === 'warm'
                    ? 'bg-yellow-400'
                    : tier === 'cold'
                      ? 'bg-blue-400'
                      : 'bg-cyan-400'
              }`}
            />
            <div>
              <span className="font-semibold text-slate-200">
                {t(`tierArchitecture.${tier}.name`)}
              </span>
              <p className="text-slate-400">{t(`tierArchitecture.${tier}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>

      <h4 className="font-semibold text-slate-200">{t('tierArchitecture.ilmTitle')}</h4>
      <p>{t('tierArchitecture.ilmDesc')}</p>

      <div className="bg-surface-800 rounded p-3 border border-surface-700">
        <p className="text-primary-400 text-xs font-semibold">{t('tierArchitecture.keyPoint')}</p>
        <p className="text-slate-400 text-xs mt-1">{t('tierArchitecture.keyPointDesc')}</p>
      </div>
    </div>
  )
}
