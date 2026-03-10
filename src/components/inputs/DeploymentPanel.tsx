import { useTranslation } from 'react-i18next'
import { Card, Select } from '@/components/common'
import dellServers from '@/data/dell-servers.json'
import { useConfigStore } from '@/store'
import type { DellServer } from '@/types/hardware'
import type { DeploymentType, FrozenBackend, NetworkSpeed } from '@/types/sizing'

const servers = dellServers as DellServer[]

const MEMORY_STEPS = [64, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096]

export function DeploymentPanel() {
  const { t } = useTranslation('deployment')
  const deploymentType = useConfigStore((s) => s.deploymentType)
  const serverModel = useConfigStore((s) => s.serverModel)
  const cpuOption = useConfigStore((s) => s.cpuOption)
  const memoryPerNode = useConfigStore((s) => s.memoryPerNode)
  const storageModel = useConfigStore((s) => s.storageModel)
  const frozenBackend = useConfigStore((s) => s.frozenBackend)
  const networkSpeed = useConfigStore((s) => s.networkSpeed)
  const setDeploymentType = useConfigStore((s) => s.setDeploymentType)
  const setServerModel = useConfigStore((s) => s.setServerModel)
  const setCpuOption = useConfigStore((s) => s.setCpuOption)
  const setMemoryPerNode = useConfigStore((s) => s.setMemoryPerNode)
  const setStorageModel = useConfigStore((s) => s.setStorageModel)
  const setFrozenBackend = useConfigStore((s) => s.setFrozenBackend)
  const setNetworkSpeed = useConfigStore((s) => s.setNetworkSpeed)

  const selectedServer = servers.find((s) => s.id === serverModel)

  const cpuOptions = selectedServer
    ? selectedServer.cpuOptions.map((cpu) => ({
        value: cpu.model,
        label: `${cpu.model} (${cpu.cores}c / ${cpu.tdpWatts}W)`,
      }))
    : []

  const memoryOptions = MEMORY_STEPS.filter((v) => v <= (selectedServer?.maxMemoryGB ?? 256)).map(
    (v) => ({
      value: String(v),
      label: `${v} GB`,
    }),
  )

  function handleServerChange(newModel: string) {
    setServerModel(newModel)
    const newServer = servers.find((s) => s.id === newModel)
    if (newServer) {
      // Reset CPU to first option of new server
      setCpuOption(newServer.cpuOptions[0]?.model ?? '')
      // Cap memory to new server's max
      if (memoryPerNode > newServer.maxMemoryGB) {
        setMemoryPerNode(newServer.maxMemoryGB)
      }
    }
  }

  return (
    <Card title={t('title')}>
      <div className="space-y-4">
        <Select
          label={t('deploymentType')}
          tooltip={t('deploymentType_tooltip')}
          value={deploymentType}
          options={[
            { value: 'baremetal', label: t('baremetal') },
            { value: 'vm', label: t('vm') },
            { value: 'ece', label: t('ece') },
          ]}
          onChange={(v) => setDeploymentType(v as DeploymentType)}
        />
        <Select
          label={t('serverModel')}
          tooltip={t('serverModel_tooltip')}
          value={serverModel}
          options={[
            { value: 'r760', label: 'PowerEdge R760' },
            { value: 'r660', label: 'PowerEdge R660' },
            { value: 'r7725', label: 'PowerEdge R7725' },
          ]}
          onChange={handleServerChange}
        />
        {cpuOptions.length > 0 && (
          <Select
            label={t('cpuOption')}
            tooltip={t('cpuOption_tooltip')}
            value={cpuOption}
            options={cpuOptions}
            onChange={setCpuOption}
          />
        )}
        {memoryOptions.length > 0 && (
          <Select
            label={t('memoryPerNode')}
            tooltip={t('memoryPerNode_tooltip')}
            value={String(memoryPerNode)}
            options={memoryOptions}
            onChange={(v) => setMemoryPerNode(Number(v))}
          />
        )}
        <Select
          label={t('storageModel')}
          tooltip={t('storageModel_tooltip')}
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
          tooltip={t('frozenBackend_tooltip')}
          value={frozenBackend}
          options={[
            { value: 'powerscale', label: 'Dell PowerScale (S3)' },
            { value: 'ecs', label: 'Dell ECS (S3)' },
          ]}
          onChange={(v) => setFrozenBackend(v as FrozenBackend)}
        />
        <Select
          label={t('networkSpeed')}
          tooltip={t('networkSpeed_tooltip')}
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
