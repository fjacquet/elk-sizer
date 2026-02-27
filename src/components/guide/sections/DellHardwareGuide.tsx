import { useTranslation } from 'react-i18next'

export function DellHardwareGuide() {
  const { t } = useTranslation('guide')

  return (
    <div className="space-y-3">
      <p>{t('dellHardware.intro')}</p>

      <h4 className="font-semibold text-slate-200">{t('dellHardware.computeTitle')}</h4>
      <p>{t('dellHardware.computeDesc')}</p>
      <ul className="list-disc list-inside space-y-1 text-slate-400">
        <li>
          <span className="text-primary-400">R660</span> — {t('dellHardware.r660')}
        </li>
        <li>
          <span className="text-primary-400">R760</span> — {t('dellHardware.r760')}
        </li>
        <li>
          <span className="text-primary-400">R660 + R760</span> — {t('dellHardware.mixed')}
        </li>
      </ul>

      <h4 className="font-semibold text-slate-200">{t('dellHardware.storageTitle')}</h4>
      <p>{t('dellHardware.storageDesc')}</p>
      <ul className="list-disc list-inside space-y-1 text-slate-400">
        <li>
          <span className="text-primary-400">PowerStore FC</span> — {t('dellHardware.powerstore')}
        </li>
        <li>
          <span className="text-primary-400">PowerScale</span> — {t('dellHardware.powerscale')}
        </li>
        <li>
          <span className="text-primary-400">ECS</span> — {t('dellHardware.ecs')}
        </li>
      </ul>

      <div className="bg-surface-800 rounded p-3 border border-surface-700">
        <p className="text-primary-400 text-xs font-semibold">{t('dellHardware.keyPoint')}</p>
        <p className="text-slate-400 text-xs mt-1">{t('dellHardware.keyPointDesc')}</p>
      </div>
    </div>
  )
}
