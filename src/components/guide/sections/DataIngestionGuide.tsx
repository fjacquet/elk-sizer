import { useTranslation } from 'react-i18next'

export function DataIngestionGuide() {
  const { t } = useTranslation('guide')

  return (
    <div className="space-y-3">
      <p>{t('dataIngestion.intro')}</p>

      <h4 className="font-semibold text-slate-200">{t('dataIngestion.compressionTitle')}</h4>
      <ul className="list-disc list-inside space-y-1 text-slate-400">
        <li>
          <span className="text-primary-400">best_compression</span> —{' '}
          {t('dataIngestion.bestCompression')}
        </li>
        <li>
          <span className="text-primary-400">default (LZ4)</span> —{' '}
          {t('dataIngestion.defaultCompression')}
        </li>
        <li>
          <span className="text-primary-400">none</span> — {t('dataIngestion.noCompression')}
        </li>
      </ul>

      <h4 className="font-semibold text-slate-200">{t('dataIngestion.overheadTitle')}</h4>
      <p>{t('dataIngestion.overheadDesc')}</p>

      <div className="bg-surface-800 rounded p-3 border border-surface-700">
        <p className="text-primary-400 text-xs font-semibold">{t('dataIngestion.keyPoint')}</p>
        <p className="text-slate-400 text-xs mt-1">{t('dataIngestion.keyPointDesc')}</p>
      </div>
    </div>
  )
}
