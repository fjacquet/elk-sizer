import { useTranslation } from 'react-i18next'
import { Card, Select, Slider } from '@/components/common'
import { useConfigStore } from '@/store'
import type { CarbonRegion, UnitSystem } from '@/types/sizing'

export function AdvancedPanel() {
  const { t } = useTranslation('advanced')
  const pue = useConfigStore((s) => s.pue)
  const carbonRegion = useConfigStore((s) => s.carbonRegion)
  const shardsPerIndex = useConfigStore((s) => s.shardsPerIndex)
  const unitSystem = useConfigStore((s) => s.unitSystem)
  const electricityCostPerKwh = useConfigStore((s) => s.electricityCostPerKwh)
  const projectYears = useConfigStore((s) => s.projectYears)
  const setPue = useConfigStore((s) => s.setPue)
  const setCarbonRegion = useConfigStore((s) => s.setCarbonRegion)
  const setShardsPerIndex = useConfigStore((s) => s.setShardsPerIndex)
  const setUnitSystem = useConfigStore((s) => s.setUnitSystem)
  const setElectricityCostPerKwh = useConfigStore((s) => s.setElectricityCostPerKwh)
  const setProjectYears = useConfigStore((s) => s.setProjectYears)

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Slider
          label={t('pue')}
          tooltip={t('pue_tooltip')}
          value={pue}
          min={1.0}
          max={2.5}
          step={0.1}
          onChange={setPue}
        />
        <Select
          label={t('carbonRegion')}
          tooltip={t('carbonRegion_tooltip')}
          value={carbonRegion}
          options={[
            { value: 'switzerland', label: t('regions.switzerland') },
            { value: 'france', label: t('regions.france') },
            { value: 'germany', label: t('regions.germany') },
            { value: 'italy', label: t('regions.italy') },
            { value: 'us_avg', label: t('regions.us_avg') },
            { value: 'uk', label: t('regions.uk') },
          ]}
          onChange={(v) => setCarbonRegion(v as CarbonRegion)}
        />
        <Slider
          label={t('shardsPerIndex')}
          tooltip={t('shardsPerIndex_tooltip')}
          value={shardsPerIndex}
          min={1}
          max={20}
          onChange={setShardsPerIndex}
        />
        <Select
          label={t('unitSystem')}
          tooltip={t('unitSystem_tooltip')}
          value={unitSystem}
          options={[
            { value: 'binary', label: t('units.binary') },
            { value: 'decimal', label: t('units.decimal') },
          ]}
          onChange={(v) => setUnitSystem(v as UnitSystem)}
        />
        <Slider
          label={t('electricityCost')}
          tooltip={t('electricityCost_tooltip')}
          value={electricityCostPerKwh}
          min={0.01}
          max={0.5}
          step={0.01}
          unit="$/kWh"
          onChange={setElectricityCostPerKwh}
        />
        <Slider
          label={t('projectYears')}
          tooltip={t('projectYears_tooltip')}
          value={projectYears}
          min={1}
          max={10}
          unit="years"
          onChange={setProjectYears}
        />
      </div>
    </Card>
  )
}
