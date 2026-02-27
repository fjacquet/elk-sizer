import { useTranslation } from 'react-i18next'

export function ClusterSizingGuide() {
  const { t } = useTranslation('guide')

  return (
    <div className="space-y-3">
      <p>{t('clusterSizing.intro')}</p>

      <h4 className="font-semibold text-slate-200">{t('clusterSizing.nodeRolesTitle')}</h4>
      <ul className="list-disc list-inside space-y-1 text-slate-400">
        <li>
          <span className="text-primary-400">Master</span> — {t('clusterSizing.masterRole')}
        </li>
        <li>
          <span className="text-primary-400">Data</span> — {t('clusterSizing.dataRole')}
        </li>
        <li>
          <span className="text-primary-400">Ingest</span> — {t('clusterSizing.ingestRole')}
        </li>
        <li>
          <span className="text-primary-400">Coordinating</span> —{' '}
          {t('clusterSizing.coordinatingRole')}
        </li>
      </ul>

      <h4 className="font-semibold text-slate-200">{t('clusterSizing.jvmTitle')}</h4>
      <p>{t('clusterSizing.jvmDesc')}</p>

      <h4 className="font-semibold text-slate-200">{t('clusterSizing.memoryRatiosTitle')}</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-surface-800 rounded p-2 border border-surface-700">
          <span className="text-red-400">Hot</span>: 1:30
        </div>
        <div className="bg-surface-800 rounded p-2 border border-surface-700">
          <span className="text-yellow-400">Warm</span>: 1:160
        </div>
        <div className="bg-surface-800 rounded p-2 border border-surface-700">
          <span className="text-blue-400">Cold</span>: 1:500
        </div>
        <div className="bg-surface-800 rounded p-2 border border-surface-700">
          <span className="text-cyan-400">Frozen</span>: 1:1600
        </div>
      </div>

      <div className="bg-surface-800 rounded p-3 border border-surface-700">
        <p className="text-primary-400 text-xs font-semibold">{t('clusterSizing.keyPoint')}</p>
        <p className="text-slate-400 text-xs mt-1">{t('clusterSizing.keyPointDesc')}</p>
      </div>
    </div>
  )
}
