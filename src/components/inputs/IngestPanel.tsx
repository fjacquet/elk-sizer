import { useTranslation } from 'react-i18next'
import { Card, Select, Slider } from '@/components/common'
import { useConfigStore } from '@/store'

export function IngestPanel() {
  const { t } = useTranslation('ingest')
  const dailyIngestGB = useConfigStore((s) => s.dailyIngestGB)
  const compressionCodec = useConfigStore((s) => s.compressionCodec)
  const replicaCount = useConfigStore((s) => s.replicaCount)
  const indexCount = useConfigStore((s) => s.indexCount)
  const setDailyIngestGB = useConfigStore((s) => s.setDailyIngestGB)
  const setCompressionCodec = useConfigStore((s) => s.setCompressionCodec)
  const setReplicaCount = useConfigStore((s) => s.setReplicaCount)
  const setIndexCount = useConfigStore((s) => s.setIndexCount)

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Slider
          label={t('dailyIngest')}
          value={dailyIngestGB}
          min={1}
          max={10000}
          step={10}
          unit="GB/day"
          onChange={setDailyIngestGB}
        />
        <Select
          label={t('compression')}
          value={compressionCodec}
          options={[
            { value: 'lz4', label: 'LZ4 (fast, ~1.1x)' },
            { value: 'deflate', label: 'DEFLATE (~0.85x)' },
            { value: 'best_compression', label: 'Best Compression (~0.7x)' },
          ]}
          onChange={(v) => setCompressionCodec(v as 'lz4' | 'deflate' | 'best_compression')}
        />
        <Slider
          label={t('replicas')}
          value={replicaCount}
          min={0}
          max={3}
          step={1}
          onChange={setReplicaCount}
        />
        <Slider
          label={t('indexCount')}
          value={indexCount}
          min={1}
          max={500}
          step={1}
          onChange={setIndexCount}
        />
      </div>
    </Card>
  )
}
