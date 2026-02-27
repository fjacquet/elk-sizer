import { useMemo } from 'react'
import { calculateStorage } from '@/engines/storage'
import { useConfigStore } from '@/store'
import type { StorageResult } from '@/types/results'

export function useStorageCalc(): StorageResult {
  const dailyIngestGB = useConfigStore((s) => s.dailyIngestGB)
  const compressionCodec = useConfigStore((s) => s.compressionCodec)
  const replicaCount = useConfigStore((s) => s.replicaCount)
  const hotDays = useConfigStore((s) => s.hotDays)
  const warmDays = useConfigStore((s) => s.warmDays)
  const coldDays = useConfigStore((s) => s.coldDays)
  const frozenDays = useConfigStore((s) => s.frozenDays)

  return useMemo(
    () =>
      calculateStorage({
        dailyIngestGB,
        compressionCodec,
        replicaCount,
        hotDays,
        warmDays,
        coldDays,
        frozenDays,
      }),
    [dailyIngestGB, compressionCodec, replicaCount, hotDays, warmDays, coldDays, frozenDays],
  )
}
