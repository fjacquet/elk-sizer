import {
  AdvancedPanel,
  DeploymentPanel,
  IngestPanel,
  PerformancePanel,
  RetentionPanel,
} from '@/components/inputs'

export function InputSidebar() {
  return (
    <aside className="w-full lg:w-96 p-4 space-y-4 overflow-y-auto">
      <IngestPanel />
      <RetentionPanel />
      <PerformancePanel />
      <DeploymentPanel />
      <AdvancedPanel />
    </aside>
  )
}
