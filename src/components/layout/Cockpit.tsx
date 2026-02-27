import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GuideView } from '@/components/guide/GuideView'
import { Header } from './Header'
import { InputSidebar } from './InputSidebar'
import { OutputDashboard } from './OutputDashboard'

type CockpitView = 'config' | 'report' | 'guide'

export function Cockpit() {
  const { t } = useTranslation('common')
  const [activeView, setActiveView] = useState<CockpitView>('config')

  return (
    <div className="h-screen flex flex-col bg-surface-900">
      <Header onGuideToggle={() => setActiveView((v) => (v === 'guide' ? 'report' : 'guide'))} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-14 lg:pb-0">
        <div
          className={`${
            activeView === 'config' ? 'block' : 'hidden'
          } lg:block lg:flex-shrink-0 overflow-y-auto`}
        >
          <InputSidebar />
        </div>

        <div
          className={`${
            activeView === 'report' ? 'block' : 'hidden'
          } ${activeView === 'guide' ? 'hidden' : ''} lg:${activeView === 'guide' ? 'hidden' : 'block'} flex-1 overflow-y-auto`}
        >
          <OutputDashboard />
        </div>

        <div className={`${activeView === 'guide' ? 'block' : 'hidden'} flex-1 overflow-y-auto`}>
          <GuideView />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-surface-700 z-50">
        <div className="flex">
          {(['config', 'report', 'guide'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`flex-1 py-3 min-h-[44px] text-sm font-medium transition-colors ${
                activeView === view
                  ? 'text-primary-400 bg-surface-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(`nav.${view === 'config' ? 'configuration' : view}`)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
