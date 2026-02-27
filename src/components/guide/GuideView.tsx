import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccordionItem } from '@/components/common/AccordionItem'
import {
  ClusterSizingGuide,
  DataIngestionGuide,
  DellHardwareGuide,
  ShardManagementGuide,
  SustainabilityGuide,
  TierArchitectureGuide,
} from './sections'

const SECTION_KEYS = [
  'dataIngestion',
  'tierArchitecture',
  'clusterSizing',
  'shardManagement',
  'dellHardware',
  'sustainability',
] as const

type SectionKey = (typeof SECTION_KEYS)[number]

const SECTION_COMPONENTS: Record<SectionKey, React.FC> = {
  dataIngestion: DataIngestionGuide,
  tierArchitecture: TierArchitectureGuide,
  clusterSizing: ClusterSizingGuide,
  shardManagement: ShardManagementGuide,
  dellHardware: DellHardwareGuide,
  sustainability: SustainabilityGuide,
}

export function GuideView() {
  const { t } = useTranslation('guide')
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set())

  const toggleSection = useCallback((key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  return (
    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
      <h2 className="text-lg font-bold text-slate-200">{t('title')}</h2>
      <p className="text-sm text-slate-400">{t('subtitle')}</p>

      <div className="space-y-2">
        {SECTION_KEYS.map((key) => {
          const Component = SECTION_COMPONENTS[key]
          return (
            <AccordionItem
              key={key}
              title={t(`${key}.title`)}
              isOpen={openSections.has(key)}
              onToggle={() => toggleSection(key)}
            >
              <Component />
            </AccordionItem>
          )
        })}
      </div>
    </div>
  )
}
