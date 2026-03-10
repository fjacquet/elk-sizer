import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
  const { t: tc } = useTranslation('common')
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

  const handleShareGuide = async () => {
    const guideUrl = `${window.location.origin}${window.location.pathname}#guide`
    try {
      await navigator.clipboard.writeText(guideUrl)
      toast.success(tc('share.guideCopied'))
    } catch {
      toast.error(tc('share.failed'))
    }
  }

  return (
    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-200">{t('title')}</h2>
          <p className="text-sm text-slate-400">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleShareGuide}
          className="shrink-0 bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-3 py-1.5 rounded transition-colors"
          title={tc('share.guideLink')}
        >
          🔗 {tc('share.guideLink')}
        </button>
      </div>

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

      <DocLinks />
    </div>
  )
}

const REPO = 'https://github.com/fjacquet/elk-sizer/blob/maincd'

const DOC_LINKS = [
  { label: 'User Guide', href: `${REPO}/docs/user-guide.md` },
  { label: 'Sizing Methodology', href: `${REPO}/docs/sizing-methodology.md` },
  { label: 'Hardware Reference', href: `${REPO}/docs/hardware-reference.md` },
  { label: 'Architecture', href: `${REPO}/docs/architecture.md` },
  { label: 'Contributing', href: `${REPO}/docs/contributing.md` },
] as const

const PDF_LINKS = [
  {
    label: 'Elastic Stack On-Premise Dell',
    href: `${REPO}/docs/Infrastructure%20Elastic%20Stack%20On-Premise%20Dell.pdf`,
  },
  {
    label: 'Elasticsearch Sizing & Capacity Planning',
    href: `${REPO}/docs/elasticsearch-sizing-and-capacity-planning.pdf`,
  },
  {
    label: 'Deploying with Searchable Snapshots & Frozen Tier',
    href: `${REPO}/docs/h19217-deploying-the-elastic-stack-with-searchable-snapshots-and-frozen-tier.pdf`,
  },
] as const

function DocLinks() {
  return (
    <div className="border-t border-surface-700 pt-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Further Reading
      </h3>

      <div>
        <p className="text-xs text-slate-500 mb-2">Project documentation</p>
        <div className="flex flex-wrap gap-2">
          {DOC_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 rounded bg-surface-700 hover:bg-surface-600 text-primary-400 hover:text-primary-300 transition-colors"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">Reference documents (PDF)</p>
        <div className="flex flex-col gap-1.5">
          {PDF_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <span className="text-slate-600">↗</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <a
        href="https://github.com/fjacquet/elk-sizer"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub Repository
      </a>
    </div>
  )
}
