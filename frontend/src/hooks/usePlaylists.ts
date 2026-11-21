import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

export interface Playlist {
  id: number
  name: string
  description: string | null
  coverUrl: string | null
  source: 'spotify' | 'youtube' | 'apple_music' | 'deezer' | 'tidal'
  trackCount: number
  duration: string | null
  isPublic: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

const KNOWN_SOURCES = ['spotify', 'youtube', 'apple_music', 'deezer', 'tidal']

function formatDuration(ms?: number | null): string | null {
  if (!ms || ms <= 0) return null
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/**
 * The backend (PlaylistResponse) names some fields differently from this UI
 * (sourcePlatform / coverImageUrl / totalDurationMs, and Lombok serializes isPublic as "public").
 * Map them here so real playlists render, e.g. ones imported from Spotify.
 */
function normalizePlaylist(raw: any): Playlist {
  const rawSource = raw.source ?? raw.sourcePlatform
  return {
    ...raw,
    coverUrl: raw.coverUrl ?? raw.coverImageUrl ?? null,
    source: KNOWN_SOURCES.includes(rawSource) ? rawSource : 'spotify',
    duration: raw.duration ?? formatDuration(raw.totalDurationMs),
    isPublic: raw.isPublic ?? raw.public ?? false,
    isFavorite: raw.isFavorite ?? raw.favorite ?? false,
    trackCount: raw.trackCount ?? 0,
  }
}

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/playlists')
      return data.map(normalizePlaylist)
    },
  })
}

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: ['playlists', id],
    queryFn: async () => {
      const { data } = await api.get<any>(`/playlists/${id}`)
      return normalizePlaylist(data)
    },
    enabled: !!id,
  })
}

export function useCreatePlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Playlist>) => {
      const { data } = await api.post<Playlist>('/playlists', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] })
      toast.success('Playlist created!')
    },
    onError: () => toast.error('Failed to create playlist'),
  })
}

export function useUpdatePlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Playlist> & { id: number }) => {
      const { data } = await api.put<Playlist>(`/playlists/${id}`, payload)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['playlists'] })
      qc.invalidateQueries({ queryKey: ['playlists', data.id] })
      toast.success('Playlist updated!')
    },
    onError: () => toast.error('Failed to update playlist'),
  })
}

export function useDeletePlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/playlists/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] })
      toast.success('Playlist deleted')
    },
    onError: () => toast.error('Failed to delete playlist'),
  })
}
