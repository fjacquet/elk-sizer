import { useTranslation } from 'react-i18next'

export function ShardManagementGuide() {
  const { t } = useTranslation('guide')

  return (
    <div className="space-y-3">
      <p>{t('shardManagement.intro')}</p>

      <h4 className="font-semibold text-slate-200">{t('shardManagement.sizingTitle')}</h4>
      <ul className="list-disc list-inside space-y-1 text-slate-400">
        <li>{t('shardManagement.targetSize')}</li>
        <li>{t('shardManagement.maxPerHeap')}</li>
        <li>{t('shardManagement.replicaImpact')}</li>
      </ul>

      <h4 className="font-semibold text-slate-200">{t('shardManagement.calculationTitle')}</h4>
      <p>{t('shardManagement.calculationDesc')}</p>

      <div className="bg-surface-800 rounded p-3 border border-surface-700 font-mono text-xs text-slate-400">
        shards = ceil(index_size_GB / 50) * (1 + replicas)
      </div>

      <div className="bg-surface-800 rounded p-3 border border-surface-700">
        <p className="text-primary-400 text-xs font-semibold">{t('shardManagement.keyPoint')}</p>
        <p className="text-slate-400 text-xs mt-1">{t('shardManagement.keyPointDesc')}</p>
      </div>
    </div>
  )
}
