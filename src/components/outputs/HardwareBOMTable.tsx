import { useTranslation } from 'react-i18next'
import { lookupPowerStoreMaxIOPS } from '@/engines/performance/helpers/iopsCalculator'
import type { CalculationResults } from '@/types/results'
import { formatNumber } from '@/utils/units'

interface Props {
  results: CalculationResults
}

export function HardwareBOMTable({ results }: Props) {
  const { t } = useTranslation('output')
  const { bom } = results.hardware

  return (
    <div className="panel">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {t('bom.title')}
      </h3>

      {/* Servers */}
      <h4 className="text-xs text-slate-500 uppercase mt-3 mb-2">{t('bom.servers')}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700">
              <th className="text-left py-1 text-slate-400">{t('bom.model')}</th>
              <th className="text-left py-1 text-slate-400">{t('bom.role')}</th>
              <th className="text-right py-1 text-slate-400">{t('bom.qty')}</th>
              <th className="text-right py-1 text-slate-400">{t('bom.cpu')}</th>
              <th className="text-right py-1 text-slate-400">{t('bom.ram')}</th>
            </tr>
          </thead>
          <tbody>
            {bom.servers.map((s, i) => (
              <tr key={`${s.model}-${s.role}-${i}`} className="border-b border-surface-700/50">
                <td className="py-1">{s.model}</td>
                <td className="py-1 text-slate-400">{s.role}</td>
                <td className="text-right py-1">{s.count}</td>
                <td className="text-right py-1 text-xs">{s.config.cpu.model}</td>
                <td className="text-right py-1">{s.config.memoryGB} GB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAN Storage */}
      {bom.sanStorage.length > 0 && (
        <>
          <h4 className="text-xs text-slate-500 uppercase mt-4 mb-2">{t('bom.sanStorage')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700">
                  <th className="text-left py-1 text-slate-400">{t('bom.model')}</th>
                  <th className="text-left py-1 text-slate-400">{t('bom.tier')}</th>
                  <th className="text-right py-1 text-slate-400">{t('bom.qty')}</th>
                  <th className="text-right py-1 text-slate-400">{t('bom.capacity')}</th>
                  <th className="text-right py-1 text-slate-400">{t('bom.maxIOPS')}</th>
                </tr>
              </thead>
              <tbody>
                {bom.sanStorage.map((s, i) => (
                  <tr key={`${s.model}-${i}`} className="border-b border-surface-700/50">
                    <td className="py-1">{s.model}</td>
                    <td className="py-1 text-slate-400">{s.tier}</td>
                    <td className="text-right py-1">{s.count}</td>
                    <td className="text-right py-1">{s.capacityTB.toFixed(1)} TB</td>
                    <td className="text-right py-1 text-slate-300">
                      {formatNumber(lookupPowerStoreMaxIOPS(s.model) * s.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-surface-700 font-medium">
                  <td colSpan={4} className="py-1 text-slate-400">
                    {t('bom.totalIOPS')}
                  </td>
                  <td className="text-right py-1 text-primary-400">
                    {formatNumber(results.performance.totalAvailableIOPS)}
                  </td>
                </tr>
                <tr className="border-t border-surface-700/50 font-medium">
                  <td colSpan={4} className="py-1 text-slate-400">
                    {t('bom.requiredIOPS')}
                  </td>
                  <td className="text-right py-1 text-slate-200">
                    {formatNumber(Math.round(results.performance.totalRequiredIOPS))}
                  </td>
                </tr>
                <tr className="border-t border-surface-700/50 font-medium">
                  <td colSpan={4} className="py-1 text-slate-400">
                    {t('bom.iopsUtilization')}
                  </td>
                  <td
                    className={`text-right py-1 font-semibold ${
                      results.performance.iopsUtilization > 0.8
                        ? 'text-hot'
                        : results.performance.iopsUtilization > 0.6
                          ? 'text-warm'
                          : 'text-safe'
                    }`}
                  >
                    {(results.performance.iopsUtilization * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-t border-surface-700/50">
                  <td colSpan={4} className="py-1 text-slate-400">
                    {t('bom.estimatedLatency')}
                  </td>
                  <td
                    className={`text-right py-1 ${results.performance.estimatedLatencyMs > 2 ? 'text-warm' : 'text-safe'}`}
                  >
                    {results.performance.estimatedLatencyMs.toFixed(1)} ms
                  </td>
                </tr>
                <tr className="border-t border-surface-700/50">
                  <td colSpan={4} className="py-1 text-slate-400">
                    {t('bom.fcUtilization')}
                  </td>
                  <td
                    className={`text-right py-1 ${results.performance.fcUtilization > 0.8 ? 'text-hot' : results.performance.fcUtilization > 0.6 ? 'text-warm' : 'text-safe'}`}
                  >
                    {(results.performance.fcUtilization * 100).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Object Storage */}
      {bom.objectStorage.capacityTB > 0 && (
        <>
          <h4 className="text-xs text-slate-500 uppercase mt-4 mb-2">{t('bom.objectStorage')}</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('bom.backend')}</span>
              <span className="capitalize">{bom.objectStorage.backend}</span>
            </div>
            {bom.objectStorage.model && (
              <div className="flex justify-between">
                <span className="text-slate-400">{t('bom.model')}</span>
                <span>{bom.objectStorage.model}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">{t('bom.capacity')}</span>
              <span>{bom.objectStorage.capacityTB.toFixed(1)} TB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('bom.nodeCount')}</span>
              <span>{bom.objectStorage.nodeCount}</span>
            </div>
            {bom.objectStorage.s3ThroughputGBps != null &&
              bom.objectStorage.s3ThroughputGBps > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('bom.s3Throughput')}</span>
                  <span className="text-primary-400">
                    {bom.objectStorage.s3ThroughputGBps.toFixed(1)} GB/s
                  </span>
                </div>
              )}
          </div>
        </>
      )}

      {/* Networking */}
      <h4 className="text-xs text-slate-500 uppercase mt-4 mb-2">{t('bom.networking')}</h4>
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">{t('bom.switches')}</span>
          <span>{bom.networking.switchCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('bom.fcPorts')}</span>
          <span>
            {bom.networking.fcPortCount} ({bom.networking.fcSpeed})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('bom.ethPorts')}</span>
          <span>
            {bom.networking.ethPortCount} ({bom.networking.ethSpeed})
          </span>
        </div>
      </div>

      {/* Total rack units */}
      <div className="mt-4 pt-3 border-t border-surface-700 flex justify-between text-sm font-medium">
        <span>{t('bom.totalRackUnits')}</span>
        <span className="text-primary-400">{results.hardware.totalRackUnits}U</span>
      </div>
    </div>
  )
}
