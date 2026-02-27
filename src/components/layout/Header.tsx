import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/i18n/config'
import { copyShareableUrl, useConfigStore } from '@/store'

interface HeaderProps {
  onGuideToggle?: () => void
  onAdvisorToggle?: () => void
}

export function Header({ onGuideToggle, onAdvisorToggle }: HeaderProps) {
  const { t, i18n } = useTranslation('common')
  const resetToDefaults = useConfigStore((s) => s.resetToDefaults)

  const handleShare = async () => {
    const success = await copyShareableUrl()
    if (success) {
      toast.success(t('share.copied'))
    } else {
      toast.error(t('share.failed'))
    }
  }

  const handleShareGuide = async () => {
    const guideUrl = `${window.location.origin}${window.location.pathname}#guide`
    try {
      await navigator.clipboard.writeText(guideUrl)
      toast.success(t('share.guideCopied'))
    } catch {
      toast.error(t('share.failed'))
    }
  }

  return (
    <header className="bg-surface-800 border-b border-surface-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gradient">ELK Sizer</h1>
        <span className="text-xs text-slate-500">{t('subtitle')}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Language selector */}
        <select
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="bg-surface-700 border border-surface-700 rounded px-2 py-1 text-xs text-slate-300"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>

        {/* Advisor button */}
        {onAdvisorToggle && (
          <button
            type="button"
            onClick={onAdvisorToggle}
            className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-2.5 py-1.5 rounded transition-colors hidden lg:block"
            title={t('nav.advisor')}
          >
            {t('nav.advisor')}
          </button>
        )}

        {/* Guide button */}
        {onGuideToggle && (
          <button
            type="button"
            onClick={handleShareGuide}
            className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-2.5 py-1.5 rounded transition-colors hidden lg:block"
            title={t('share.guideLink')}
          >
            {t('share.guideLink')}
          </button>
        )}

        {onGuideToggle && (
          <button
            type="button"
            onClick={onGuideToggle}
            className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs w-7 h-7 rounded-full transition-colors font-bold"
            title={t('nav.guide')}
          >
            ?
          </button>
        )}

        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="bg-primary-600 hover:bg-primary-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
        >
          {t('share.button')}
        </button>

        {/* Reset button */}
        <button
          type="button"
          onClick={resetToDefaults}
          className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-3 py-1.5 rounded transition-colors"
        >
          {t('reset')}
        </button>
      </div>
    </header>
  )
}
