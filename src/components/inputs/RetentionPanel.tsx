import { useTranslation } from 'react-i18next'
import { Card, Slider, Toggle } from '@/components/common'
import { useConfigStore } from '@/store'

export function RetentionPanel() {
  const { t } = useTranslation('retention')
  const hotDays = useConfigStore((s) => s.hotDays)
  const warmDays = useConfigStore((s) => s.warmDays)
  const coldDays = useConfigStore((s) => s.coldDays)
  const frozenDays = useConfigStore((s) => s.frozenDays)
  const ilmEnabled = useConfigStore((s) => s.ilmEnabled)
  const setHotDays = useConfigStore((s) => s.setHotDays)
  const setWarmDays = useConfigStore((s) => s.setWarmDays)
  const setColdDays = useConfigStore((s) => s.setColdDays)
  const setFrozenDays = useConfigStore((s) => s.setFrozenDays)
  const setIlmEnabled = useConfigStore((s) => s.setIlmEnabled)

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Toggle label={t('ilmEnabled')} checked={ilmEnabled} onChange={setIlmEnabled} />
        <Slider
          label={t('hotDays')}
          value={hotDays}
          min={1}
          max={90}
          unit="days"
          onChange={setHotDays}
        />
        <Slider
          label={t('warmDays')}
          value={warmDays}
          min={0}
          max={365}
          unit="days"
          onChange={setWarmDays}
        />
        <Slider
          label={t('coldDays')}
          value={coldDays}
          min={0}
          max={730}
          unit="days"
          onChange={setColdDays}
        />
        <Slider
          label={t('frozenDays')}
          value={frozenDays}
          min={0}
          max={3650}
          step={30}
          unit="days"
          onChange={setFrozenDays}
        />
      </div>
    </Card>
  )
}
