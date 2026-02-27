import { useTranslation } from 'react-i18next'
import type { CalculationResults } from '@/types/results'
import { exportPDF } from '@/utils/export/pdfExport'
import { exportPPTX } from '@/utils/export/pptxExport'
import { exportYAML } from '@/utils/export/yamlExport'

interface ExportToolbarProps {
  results: CalculationResults
}

export function ExportToolbar({ results }: ExportToolbarProps) {
  const { t } = useTranslation('output')

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => exportPDF(results, 'ELK Sizer Report')}
        className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          role="img"
        >
          <title>PDF</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {t('export.pdf')}
      </button>

      <button
        type="button"
        onClick={() => exportPPTX(results, 'ELK Sizer Report')}
        className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          role="img"
        >
          <title>PPTX</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        {t('export.pptx')}
      </button>

      <button
        type="button"
        onClick={() => exportYAML(results)}
        className="bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          role="img"
        >
          <title>YAML</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        {t('export.yaml')}
      </button>
    </div>
  )
}
