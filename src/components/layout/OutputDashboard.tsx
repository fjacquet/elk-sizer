import {
  ClusterSummary,
  ExportToolbar,
  HardwareBOMTable,
  SankeyDiagram,
  SustainabilityCards,
  TierBreakdown,
  VMComparison,
} from '@/components/outputs'
import { useCalculations } from '@/hooks/useCalculations'

export function OutputDashboard() {
  const results = useCalculations()

  return (
    <main className="flex-1 p-4 space-y-4 overflow-y-auto">
      <ExportToolbar results={results} />
      <ClusterSummary results={results} />
      <TierBreakdown results={results} />
      <SankeyDiagram results={results} />
      <HardwareBOMTable results={results} />
      {results.vmComparison && <VMComparison comparison={results.vmComparison} />}
      <SustainabilityCards sustainability={results.sustainability} />
    </main>
  )
}
