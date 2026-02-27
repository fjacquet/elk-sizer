import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function ErrorFallback({ error: _error, resetErrorBoundary }: ErrorFallbackProps) {
  const { t } = useTranslation('common')

  return (
    <div role="alert" className="min-h-screen flex items-center justify-center bg-surface-900">
      <div className="max-w-md w-full bg-surface-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-hot mb-4">{t('errors.calculationError.title')}</h2>
        <p className="text-slate-300 mb-6">{t('errors.calculationError.message')}</p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded"
        >
          {t('errors.calculationError.resetButton')}
        </button>
      </div>
    </div>
  )
}

export interface AppErrorBoundaryProps {
  children: React.ReactNode
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error('Calculation engine error:', error, info.componentStack)
      }}
      onReset={() => {
        window.location.hash = ''
        window.location.reload()
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
