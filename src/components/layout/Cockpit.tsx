import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from './Header'
import { InputSidebar } from './InputSidebar'
import { OutputDashboard } from './OutputDashboard'

type CockpitView = 'config' | 'report'

export function Cockpit() {
  const { t } = useTranslation('common')
  const [activeView, setActiveView] = useState<CockpitView>('config')

  return (
    <div className="h-screen flex flex-col bg-surface-900">
      <Header />

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
          } lg:block flex-1 overflow-y-auto`}
        >
          <OutputDashboard />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-surface-700 z-50">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveView('config')}
            className={`flex-1 py-3 min-h-[44px] text-sm font-medium transition-colors ${
              activeView === 'config'
                ? 'text-primary-400 bg-surface-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('nav.configuration')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('report')}
            className={`flex-1 py-3 min-h-[44px] text-sm font-medium transition-colors ${
              activeView === 'report'
                ? 'text-primary-400 bg-surface-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('nav.report')}
          </button>
        </div>
      </nav>
    </div>
  )
}
