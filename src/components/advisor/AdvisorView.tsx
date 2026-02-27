import { useArchitectureAdvice } from '@/hooks/useArchitectureAdvice'
import { useCalculations } from '@/hooks/useCalculations'
import type { Severity } from '@/hooks/useArchitectureAdvice'

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
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Attention'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-4xl font-bold font-mono ${color}`}>{score}</div>
      <div className={`text-xs font-semibold ${color}`}>{label}</div>
      <div className="text-xs text-slate-500">Architecture Score</div>
    </div>
  )
}

export function AdvisorView() {
  const results = useCalculations()
  const advice = useArchitectureAdvice(results)
  const { pattern, warnings, optimizations, advisorScore } = advice

  const errors = warnings.filter((w) => w.severity === 'error')
  const warningsList = warnings.filter((w) => w.severity === 'warning')
  const infoList = warnings.filter((w) => w.severity === 'info')

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-200">Architecture Advisor</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Real-time recommendations based on your current configuration.
        </p>
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
          { label: 'Total Nodes', value: results.cluster.totalNodes },
          { label: 'Total Shards', value: results.cluster.totalShards.toLocaleString() },
          {
            label: 'Shard Utilization',
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
            ✕ Critical Issues ({errors.length})
          </h3>
          {errors.map((w) => {
            const s = SEVERITY_STYLES[w.severity]
            return (
              <div key={w.title} className={`border rounded-lg p-3 ${s.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.badge}`}>
                    CRITICAL
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
            ⚠ Warnings ({warningsList.length})
          </h3>
          {warningsList.map((w) => {
            const s = SEVERITY_STYLES[w.severity]
            return (
              <div key={w.title} className={`border rounded-lg p-3 ${s.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.badge}`}>
                    WARNING
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
            ↑ Optimizations ({optimizations.length})
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
                  {o.impact} impact
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
            ℹ Best Practices ({infoList.length})
          </h3>
          {infoList.map((w) => {
            const s = SEVERITY_STYLES[w.severity]
            return (
              <div key={w.title} className={`border rounded-lg p-3 ${s.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.badge}`}>
                    INFO
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
          <div className="text-emerald-400 font-semibold">Architecture looks good!</div>
          <p className="text-sm text-slate-400 mt-1">
            No warnings or critical issues detected for your current configuration.
          </p>
        </div>
      )}

      {/* Reference Architectures */}
      <section aria-label="reference architectures">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Reference Architectures
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              name: 'Small',
              desc: '< 10 GB/day · < 30 day retention',
              pattern: 'Hot-Only',
              nodes: '2 hot + 3 master + 2 ingest',
              cost: '$',
            },
            {
              name: 'Medium',
              desc: '10–100 GB/day · 30–90 day retention',
              pattern: 'Hot-Warm',
              nodes: '4–8 hot + 2–4 warm + 3 master + 2 ingest',
              cost: '$$',
            },
            {
              name: 'Large',
              desc: '100–500 GB/day · 90–365 day retention',
              pattern: 'Hot-Warm-Frozen',
              nodes: '8–16 hot + 4–8 warm + 3 master + 4 ingest + PowerScale',
              cost: '$$$',
            },
            {
              name: 'Enterprise',
              desc: '> 500 GB/day · > 1 year retention',
              pattern: 'Full 4-Tier',
              nodes: '16+ hot + 8+ warm + 4+ cold + PowerScale/ECS frozen',
              cost: '$$$$',
            },
          ].map((ref) => (
            <div
              key={ref.name}
              className={`border rounded-lg p-3 flex items-start gap-3 ${
                ref.pattern === pattern.name
                  ? 'border-primary-500/50 bg-primary-950/20'
                  : 'border-surface-700 bg-surface-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{ref.name}</span>
                  <span className="text-xs text-slate-500">{ref.pattern}</span>
                  {ref.pattern === pattern.name && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-semibold">
                      ← your config
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
          Documentation
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: 'User Guide',
              href: 'https://github.com/fjacquet/elk-sizer/blob/maincd/docs/user-guide.md',
            },
            {
              label: 'Sizing Methodology',
              href: 'https://github.com/fjacquet/elk-sizer/blob/maincd/docs/sizing-methodology.md',
            },
            {
              label: 'Hardware Reference',
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
