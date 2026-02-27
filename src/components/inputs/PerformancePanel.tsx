import { useTranslation } from 'react-i18next'
import { Card, Slider } from '@/components/common'
import { useConfigStore } from '@/store'

export function PerformancePanel() {
  const { t } = useTranslation('performance')
  const searchRate = useConfigStore((s) => s.searchRate)
  const indexingRate = useConfigStore((s) => s.indexingRate)
  const concurrentSearches = useConfigStore((s) => s.concurrentSearches)
  const setSearchRate = useConfigStore((s) => s.setSearchRate)
  const setIndexingRate = useConfigStore((s) => s.setIndexingRate)
  const setConcurrentSearches = useConfigStore((s) => s.setConcurrentSearches)

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Slider
          label={t('searchRate')}
          value={searchRate}
          min={1}
          max={500}
          unit="q/s"
          onChange={setSearchRate}
        />
        <Slider
          label={t('indexingRate')}
          value={indexingRate}
          min={100}
          max={100000}
          step={100}
          unit="docs/s"
          onChange={setIndexingRate}
        />
        <Slider
          label={t('concurrentSearches')}
          value={concurrentSearches}
          min={1}
          max={100}
          onChange={setConcurrentSearches}
        />
      </div>
    </Card>
  )
}
