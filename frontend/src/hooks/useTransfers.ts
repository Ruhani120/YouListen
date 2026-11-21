import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export type TransferStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface TransferJob {
  id: number
  playlistId: number
  playlistName: string
  destinationPlatform: string
  destinationPlaylistId: string | null
  destinationPlaylistName: string | null
  destinationUrl: string | null
  privacy: string
  status: TransferStatus
  totalTracks: number
  readyTracks: number
  skippedTracks: number
  transferredTracks: number
  failedTracks: number
  progressPercent: number
  errorMessage: string | null
  durationSeconds: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface TransferTrackRow {
  id: number
  position: number
  title: string
  artist: string | null
  youtubeVideoId: string | null
  youtubeVideoTitle: string | null
  confidence: number | null
  status: 'PENDING' | 'MATCHED' | 'TRANSFERRED' | 'FAILED' | 'SKIPPED'
  errorMessage: string | null
}

export const isActive = (status?: TransferStatus) => status === 'PENDING' || status === 'IN_PROGRESS'

export function useTransfers() {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data } = await api.get<TransferJob[]>('/transfers')
      return data
    },
    refetchInterval: (query) => (query.state.data?.some((j) => isActive(j.status)) ? 3000 : false),
  })
}

/** Polls every 1.5 seconds while the job is running. */
export function useTransfer(jobId: number) {
  return useQuery({
    queryKey: ['transfers', jobId],
    queryFn: async () => {
      const { data } = await api.get<TransferJob>(`/transfers/${jobId}`)
      return data
    },
    enabled: !!jobId,
    retry: false,
    refetchInterval: (query) => (isActive(query.state.data?.status) ? 1500 : false),
  })
}

export function useTransferTracks(jobId: number, running: boolean) {
  return useQuery({
    queryKey: ['transfers', jobId, 'tracks'],
    queryFn: async () => {
      const { data } = await api.get<TransferTrackRow[]>(`/transfers/${jobId}/tracks`)
      return data
    },
    enabled: !!jobId,
    refetchInterval: running ? 3000 : false,
  })
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { playlistId: number; destinationName: string; privacy: string }) => {
      const { data } = await api.post<TransferJob>('/transfers', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  })
}

function useJobAction(action: 'resume' | 'cancel') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (jobId: number) => {
      const { data } = await api.post<TransferJob>(`/transfers/${jobId}/${action}`)
      return data
    },
    onSuccess: (job) => {
      qc.setQueryData(['transfers', job.id], job)
      qc.invalidateQueries({ queryKey: ['transfers'] })
    },
  })
}

export const useResumeTransfer = () => useJobAction('resume')
export const useCancelTransfer = () => useJobAction('cancel')
