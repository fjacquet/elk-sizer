import { useTranslation } from 'react-i18next'
import type { Severity } from '@/hooks/useArchitectureAdvice'
import { useArchitectureAdvice } from '@/hooks/useArchitectureAdvice'
import { useCalculations } from '@/hooks/useCalculations'

const SEVERITY_STYLES: Record<Severity, { border: string; badge: string; title: string }> = {
  error: {
    border: 'border-red-500/40 bg-red-950/20',
    badge: 'bg-red-500/20 text-red-400',
    title: 'text-red-400',
  },
  warning: {
    border: 'border-yellow-500/40 bg-yellow-950/20',
    badge: 'bg-yellow-500/20 text-yellow-400',
    title: 'text-yellow-400',
  },
  info: {
    border: 'border-blue-500/40 bg-blue-950/20',
    badge: 'bg-blue-500/20 text-blue-400',
    title: 'text-blue-400',
  },
}

const IMPACT_STYLES = {
  high: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-primary-500/20 text-primary-400',
  low: 'bg-slate-500/20 text-slate-400',
}

const TIER_COLORS: Record<string, string> = {
  hot: 'bg-red-500/20 text-red-300 border border-red-500/30',
  warm: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  cold: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  frozen: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
}

function ScoreRing({ score }: { score: number }) {
  const { t } = useTranslation('advisor')
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const label =
    score >= 80 ? t('scoreGood') : score >= 60 ? t('scoreFair') : t('scoreNeedsAttention')
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-4xl font-bold font-mono ${color}`}>{score}</div>
      <div className={`text-xs font-semibold ${color}`}>{label}</div>
      <div className="text-xs text-slate-500">{t('architectureScore')}</div>
    </div>
  )
}

export function AdvisorView() {
  const { t } = useTranslation('advisor')
  const results = useCalculations()
  const advice = useArchitectureAdvice(results)
  const { pattern, warnings, optimizations, advisorScore } = advice

  const errors = warnings.filter((w) => w.severity === 'error')
  const warningsList = warnings.filter((w) => w.severity === 'warning')
  const infoList = warnings.filter((w) => w.severity === 'info')

  const referenceArchitectures = [
    {
      key: 'small',
      name: t('reference.small.name'),
      desc: t('reference.small.desc'),
      patternName: t('reference.small.pattern'),
      nodes: t('reference.small.nodes'),
      cost: '$',
    },
    {
      key: 'medium',
      name: t('reference.medium.name'),
      desc: t('reference.medium.desc'),
      patternName: t('reference.medium.pattern'),
      nodes: t('reference.medium.nodes'),
      cost: '$$',
    },
    {
      key: 'large',
      name: t('reference.large.name'),
      desc: t('reference.large.desc'),
      patternName: t('reference.large.pattern'),
      nodes: t('reference.large.nodes'),
      cost: '$$$',
    },
    {
      key: 'enterprise',
      name: t('reference.enterprise.name'),
      desc: t('reference.enterprise.desc'),
      patternName: t('reference.enterprise.pattern'),
      nodes: t('reference.enterprise.nodes'),
      cost: '$$$$',
    },
  ]

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-200">{t('title')}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Pattern + Score */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 flex gap-6 items-start">
        <ScoreRing score={advisorScore} />
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-slate-100 mb-1">
            {pattern.icon} {pattern.name}
          </div>
          <p className="text-sm text-slate-400 mb-3">{pattern.description}</p>
          <div className="flex flex-wrap gap-2">
            {pattern.tiers.map((tier) => (
              <span
                key={tier}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TIER_COLORS[tier] ?? 'bg-surface-700 text-slate-300'}`}
              >
                {tier}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('metricTotalNodes'), value: results.cluster.totalNodes },
          {
            label: t('metricTotalShards'),
            value: results.cluster.totalShards.toLocaleString(),
          },
          {
            label: t('metricShardUtilization'),
            value: `${Math.round(results.cluster.shardUtilization * 100)}%`,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-surface-800 border border-surface-700 rounded-lg p-3 text-center"
          >
            <div className="text-xl font-bold text-primary-400">{m.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
            ✕ {t('sectionCritical', { count: errors.length })}
          </h3>
          {errors.map((w) => {
            const s = SEVERITY_STYLES[w.severity]
            return (
              <div key={w.title} className={`border rounded-lg p-3 ${s.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.badge}`}>
                    {t('badgeCritical')}
                  </span>
                  <span className={`text-sm font-semibold ${s.title}`}>{w.title}</span>
                </div>
                <p className="text-xs text-slate-400">{w.message}</p>
              </div>
            )
          })}
        </section>
      )}

      {/* Warnings */}
      {warningsList.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">
            ⚠ {t('sectionWarnings', { count: warningsList.length })}
          </h3>
          {warningsList.map((w) => {
            const s = SEVERITY_STYLES[w.severity]
            return (
              <div key={w.title} className={`border rounded-lg p-3 ${s.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.badge}`}>
                    {t('badgeWarning')}
                  </span>
                  <span className={`text-sm font-semibold ${s.title}`}>{w.title}</span>
                </div>
                <p className="text-xs text-slate-400">{w.message}</p>
              </div>
            )
          })}
        </section>
      )}

      {/* Optimizations */}
      {optimizations.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
            ↑ {t('sectionOptimizations', { count: optimizations.length })}
          </h3>
          {optimizations.map((o) => (
            <div
              key={o.title}
              className="border border-emerald-500/20 bg-emerald-950/10 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${IMPACT_STYLES[o.impact]}`}
                >
                  {t('impactLabel', { impact: o.impact })}
                </span>
                <span className="text-sm font-semibold text-emerald-400">{o.title}</span>
              </div>
              <p className="text-xs text-slate-400">{o.message}</p>
            </div>
          ))}
        </section>
      )}

      {/* Info / Best Practices */}
      {infoList.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
            ℹ {t('sectionBestPractices', { count: infoList.length })}
          </h3>
          {infoList.map((w) => {
            const s = SEVERITY_STYLES[w.severity]
            return (
              <div key={w.title} className={`border rounded-lg p-3 ${s.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.badge}`}>
                    {t('badgeInfo')}
                  </span>
                  <span className={`text-sm font-semibold ${s.title}`}>{w.title}</span>
                </div>
                <p className="text-xs text-slate-400">{w.message}</p>
              </div>
            )
          })}
        </section>
      )}

      {/* All-clear */}
      {warnings.length === 0 && optimizations.length === 0 && (
        <div className="border border-emerald-500/30 bg-emerald-950/10 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✓</div>
          <div className="text-emerald-400 font-semibold">{t('allClear')}</div>
          <p className="text-sm text-slate-400 mt-1">{t('allClearDesc')}</p>
        </div>
      )}

      {/* Reference Architectures */}
      <section aria-label={t('sectionReferenceArchitectures')}>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          {t('sectionReferenceArchitectures')}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {referenceArchitectures.map((ref) => (
            <div
              key={ref.key}
              className={`border rounded-lg p-3 flex items-start gap-3 ${
                ref.patternName === pattern.name
                  ? 'border-primary-500/50 bg-primary-950/20'
                  : 'border-surface-700 bg-surface-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{ref.name}</span>
                  <span className="text-xs text-slate-500">{ref.patternName}</span>
                  {ref.patternName === pattern.name && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-semibold">
                      {t('yourConfig')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{ref.desc}</div>
                <div className="text-xs text-slate-500 mt-1">{ref.nodes}</div>
              </div>
              <div className="text-slate-400 font-mono text-sm shrink-0">{ref.cost}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Documentation links */}
      <div className="border-t border-surface-700 pt-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {t('sectionDocumentation')}
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: t('docUserGuide'),
              href: 'https://github.com/fjacquet/elk-sizer/blob/maincd/docs/user-guide.md',
            },
            {
              label: t('docSizingMethodology'),
              href: 'https://github.com/fjacquet/elk-sizer/blob/maincd/docs/sizing-methodology.md',
            },
            {
              label: t('docHardwareReference'),
              href: 'https://github.com/fjacquet/elk-sizer/blob/maincd/docs/hardware-reference.md',
            },
          ].map((link) => (
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
    </div>
  )
}
