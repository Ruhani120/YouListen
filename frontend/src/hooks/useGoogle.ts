import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface GoogleStatus {
  configured: boolean
  connected: boolean
  apiKeyConfigured: boolean
  /** which credentials song matching will use: api_key | account | none */
  searchMode: 'api_key' | 'account' | 'none'
  channelTitle: string | null
  channelId: string | null
  connectedAt: string | null
}

export function useGoogleStatus() {
  return useQuery({
    queryKey: ['google', 'status'],
    queryFn: async () => {
      const { data } = await api.get<GoogleStatus>('/google/status')
      return data
    },
    staleTime: 30_000,
  })
}

export function useConnectGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ authorizeUrl: string }>('/google/connect')
      return data.authorizeUrl
    },
    onSuccess: (url) => {
      // Full-page redirect to Google; it comes back through the backend to /app/connections?google=<result>
      window.location.href = url
    },
  })
}

export function useDisconnectGoogle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete('/google/connection')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['google'] })
    },
  })
}
