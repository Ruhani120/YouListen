import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface SpotifyStatus {
  configured: boolean
  connected: boolean
  displayName: string | null
  spotifyUserId: string | null
  connectedAt: string | null
  /** false for older connections that only had read access: reconnect to create playlists */
  canCreatePlaylists: boolean
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  trackCount: number
  ownerName: string | null
  importable: boolean
  alreadyImported: boolean
  importedPlaylistId: number | null
}

export interface SpotifyImportResult {
  playlistId: number
  name: string
  trackCount: number
  skippedCount: number
  alreadyImported: boolean
}

export interface ApiErrorInfo {
  message: string
  code: string | null
}

/** Pulls { message, code } out of the backend's error JSON. */
export function getApiError(err: unknown, fallback = 'Something went wrong'): ApiErrorInfo {
  const data = (err as any)?.response?.data
  return {
    message: data?.message || fallback,
    code: data?.code || null,
  }
}

export function useSpotifyStatus() {
  return useQuery({
    queryKey: ['spotify', 'status'],
    queryFn: async () => {
      const { data } = await api.get<SpotifyStatus>('/spotify/status')
      return data
    },
    staleTime: 30_000,
  })
}

export function useSpotifyPlaylists(enabled: boolean) {
  return useQuery({
    queryKey: ['spotify', 'playlists'],
    queryFn: async () => {
      const { data } = await api.get<SpotifyPlaylist[]>('/spotify/playlists')
      return data
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  })
}

export function useConnectSpotify() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ authorizeUrl: string }>('/spotify/connect')
      return data.authorizeUrl
    },
    onSuccess: (url) => {
      // Full-page redirect to Spotify. Spotify sends the browser back through the backend callback,
      // which then redirects to /app/import?spotify=<result>.
      window.location.href = url
    },
  })
}

export function useDisconnectSpotify() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete('/spotify/connection')
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['spotify', 'playlists'] })
      qc.invalidateQueries({ queryKey: ['spotify', 'status'] })
    },
  })
}

export function useImportSpotifyPlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (spotifyPlaylistId: string) => {
      const { data } = await api.post<SpotifyImportResult>(`/spotify/playlists/${spotifyPlaylistId}/import`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] })
      qc.invalidateQueries({ queryKey: ['spotify', 'playlists'] })
    },
  })
}
