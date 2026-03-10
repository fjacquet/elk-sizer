import { useTranslation } from 'react-i18next'
import { Card, Select, Slider } from '@/components/common'
import { useConfigStore } from '@/store'
import type { WorkloadProfile } from '@/types/sizing'

export function PerformancePanel() {
  const { t } = useTranslation('performance')
  const searchRate = useConfigStore((s) => s.searchRate)
  const indexingRate = useConfigStore((s) => s.indexingRate)
  const concurrentSearches = useConfigStore((s) => s.concurrentSearches)
  const concurrentUsers = useConfigStore((s) => s.concurrentUsers)
  const dashboardCount = useConfigStore((s) => s.dashboardCount)
  const logSourceCount = useConfigStore((s) => s.logSourceCount)
  const workloadProfile = useConfigStore((s) => s.workloadProfile)
  const setSearchRate = useConfigStore((s) => s.setSearchRate)
  const setIndexingRate = useConfigStore((s) => s.setIndexingRate)
  const setConcurrentSearches = useConfigStore((s) => s.setConcurrentSearches)
  const setConcurrentUsers = useConfigStore((s) => s.setConcurrentUsers)
  const setDashboardCount = useConfigStore((s) => s.setDashboardCount)
  const setLogSourceCount = useConfigStore((s) => s.setLogSourceCount)
  const setWorkloadProfile = useConfigStore((s) => s.setWorkloadProfile)

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Select
          label={t('workloadProfile')}
          tooltip={t('workloadProfile_tooltip')}
          value={workloadProfile}
          options={[
            { value: 'logging', label: t('profile_logging') },
            { value: 'observability', label: t('profile_observability') },
            { value: 'siem', label: t('profile_siem') },
            { value: 'search', label: t('profile_search') },
            { value: 'mixed', label: t('profile_mixed') },
          ]}
          onChange={(v) => setWorkloadProfile(v as WorkloadProfile)}
        />
        <Slider
          label={t('searchRate')}
          tooltip={t('searchRate_tooltip')}
          value={searchRate}
          min={1}
          max={500}
          unit="q/s"
          onChange={setSearchRate}
        />
        <Slider
          label={t('indexingRate')}
          tooltip={t('indexingRate_tooltip')}
          value={indexingRate}
          min={100}
          max={100000}
          step={100}
          unit="docs/s"
          onChange={setIndexingRate}
        />
        <Slider
          label={t('concurrentSearches')}
          tooltip={t('concurrentSearches_tooltip')}
          value={concurrentSearches}
          min={1}
          max={100}
          onChange={setConcurrentSearches}
        />
        <Slider
          label={t('concurrentUsers')}
          tooltip={t('concurrentUsers_tooltip')}
          value={concurrentUsers}
          min={1}
          max={500}
          unit={t('users_unit')}
          onChange={setConcurrentUsers}
        />
        <Slider
          label={t('dashboardCount')}
          tooltip={t('dashboardCount_tooltip')}
          value={dashboardCount}
          min={0}
          max={5000}
          step={10}
          onChange={setDashboardCount}
        />
        <Slider
          label={t('logSourceCount')}
          tooltip={t('logSourceCount_tooltip')}
          value={logSourceCount}
          min={1}
          max={100}
          onChange={setLogSourceCount}
        />
      </div>
    </Card>
  )
}
