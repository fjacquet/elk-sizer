import { useTranslation } from 'react-i18next'
import { Card, Select } from '@/components/common'
import { useConfigStore } from '@/store'
import type { DeploymentType, FrozenBackend, NetworkSpeed } from '@/types/sizing'

export function DeploymentPanel() {
  const { t } = useTranslation('deployment')
  const deploymentType = useConfigStore((s) => s.deploymentType)
  const serverModel = useConfigStore((s) => s.serverModel)
  const storageModel = useConfigStore((s) => s.storageModel)
  const frozenBackend = useConfigStore((s) => s.frozenBackend)
  const networkSpeed = useConfigStore((s) => s.networkSpeed)
  const setDeploymentType = useConfigStore((s) => s.setDeploymentType)
  const setServerModel = useConfigStore((s) => s.setServerModel)
  const setStorageModel = useConfigStore((s) => s.setStorageModel)
  const setFrozenBackend = useConfigStore((s) => s.setFrozenBackend)
  const setNetworkSpeed = useConfigStore((s) => s.setNetworkSpeed)

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Select
          label={t('deploymentType')}
          value={deploymentType}
          options={[
            { value: 'baremetal', label: t('baremetal') },
            { value: 'vm', label: t('vm') },
          ]}
          onChange={(v) => setDeploymentType(v as DeploymentType)}
        />
        <Select
          label={t('serverModel')}
          value={serverModel}
          options={[
            { value: 'r760', label: 'PowerEdge R760' },
            { value: 'r660', label: 'PowerEdge R660' },
            { value: 'r7725', label: 'PowerEdge R7725' },
          ]}
          onChange={setServerModel}
        />
        <Select
          label={t('storageModel')}
          value={storageModel}
          options={[
            { value: 'ps-500t', label: 'PowerStore 500T' },
            { value: 'ps-1200t', label: 'PowerStore 1200T' },
            { value: 'ps-3200t', label: 'PowerStore 3200T' },
            { value: 'ps-5200t', label: 'PowerStore 5200T' },
            { value: 'ps-9200t', label: 'PowerStore 9200T' },
          ]}
          onChange={setStorageModel}
        />
        <Select
          label={t('frozenBackend')}
          value={frozenBackend}
          options={[
            { value: 'powerscale', label: 'Dell PowerScale (S3)' },
            { value: 'ecs', label: 'Dell ECS (S3)' },
          ]}
          onChange={(v) => setFrozenBackend(v as FrozenBackend)}
        />
        <Select
          label={t('networkSpeed')}
          value={networkSpeed}
          options={[
            { value: '10GbE', label: '10 GbE' },
            { value: '25GbE', label: '25 GbE' },
            { value: '100GbE', label: '100 GbE' },
          ]}
          onChange={(v) => setNetworkSpeed(v as NetworkSpeed)}
        />
      </div>
    </Card>
  )
}
