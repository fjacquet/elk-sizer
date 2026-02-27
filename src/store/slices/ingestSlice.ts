import type { StateCreator } from 'zustand'
import type { CompressionCodec } from '@/types/sizing'

export interface IngestSlice {
  dailyIngestGB: number
  compressionCodec: CompressionCodec
  replicaCount: number
  indexCount: number
  setDailyIngestGB: (v: number) => void
  setCompressionCodec: (v: CompressionCodec) => void
  setReplicaCount: (v: number) => void
  setIndexCount: (v: number) => void
}

export const createIngestSlice: StateCreator<IngestSlice, [], [], IngestSlice> = (set) => ({
  dailyIngestGB: 100,
  compressionCodec: 'lz4',
  replicaCount: 1,
  indexCount: 10,
  setDailyIngestGB: (v) => set({ dailyIngestGB: v }),
  setCompressionCodec: (v) => set({ compressionCodec: v }),
  setReplicaCount: (v) => set({ replicaCount: v }),
  setIndexCount: (v) => set({ indexCount: v }),
})
