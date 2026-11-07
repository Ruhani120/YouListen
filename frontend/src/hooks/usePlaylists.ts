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

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const { data } = await api.get<Playlist[]>('/playlists')
      return data
    },
  })
}

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: ['playlists', id],
    queryFn: async () => {
      const { data } = await api.get<Playlist>(`/playlists/${id}`)
      return data
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
