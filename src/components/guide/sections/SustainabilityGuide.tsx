import { useTranslation } from 'react-i18next'

export function SustainabilityGuide() {
  const { t } = useTranslation('guide')

  return (
    <div className="space-y-3">
      <p>{t('sustainability.intro')}</p>

      <h4 className="font-semibold text-slate-200">{t('sustainability.pueTitle')}</h4>
      <p>{t('sustainability.pueDesc')}</p>

      <h4 className="font-semibold text-slate-200">{t('sustainability.co2Title')}</h4>
      <p>{t('sustainability.co2Desc')}</p>

      <h4 className="font-semibold text-slate-200">{t('sustainability.tcoTitle')}</h4>
      <ul className="list-disc list-inside space-y-1 text-slate-400">
        <li>{t('sustainability.tcoHardware')}</li>
        <li>{t('sustainability.tcoEnergy')}</li>
        <li>{t('sustainability.tcoLicensing')}</li>
      </ul>

      <div className="bg-surface-800 rounded p-3 border border-surface-700">
        <p className="text-primary-400 text-xs font-semibold">{t('sustainability.keyPoint')}</p>
        <p className="text-slate-400 text-xs mt-1">{t('sustainability.keyPointDesc')}</p>
      </div>
    </div>
  )
}
