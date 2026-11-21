import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface YouTubePlaylist {
  id: string
  title: string
  thumbnail: string | null
  itemCount: number
  privacy: string
  alreadyImported: boolean
  importedPlaylistId: number | null
}

export interface YouTubeImportResult {
  playlistId: number
  name: string
  trackCount: number
  skippedCount: number
  /** tracks whose artist/title were only guessed from the video title */
  lowConfidenceCount: number
  alreadyImported: boolean
}

export function useYouTubePlaylists(enabled: boolean) {
  return useQuery({
    queryKey: ['youtube', 'playlists'],
    queryFn: async () => {
      const { data } = await api.get<YouTubePlaylist[]>('/youtube/playlists')
      return data
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  })
}

export function useImportYouTubePlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (youtubePlaylistId: string) => {
      const { data } = await api.post<YouTubeImportResult>(`/youtube/playlists/${youtubePlaylistId}/import`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] })
      qc.invalidateQueries({ queryKey: ['youtube', 'playlists'] })
    },
  })
}
