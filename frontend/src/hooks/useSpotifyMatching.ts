import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface SpotifyCandidate {
  matchId: number
  spotifyTrackId: string
  title: string | null
  artist: string | null
  album: string | null
  durationMs: number | null
  coverUrl: string | null
  confidence: number
  selected: boolean
  confirmed: boolean
}

export type SpotifyTrackStatus = 'PENDING' | 'CONFIRMED' | 'REVIEW' | 'UNMATCHED'

export interface SpotifyTrackMatch {
  playlistTrackId: number
  position: number
  title: string
  artist: string | null
  durationMs: number | null
  status: SpotifyTrackStatus
  candidates: SpotifyCandidate[]
}

export interface SpotifyOverview {
  playlistId: number
  playlistName: string
  totalTracks: number
  pending: number
  confirmed: number
  needsReview: number
  unmatched: number
  running: boolean
  runProcessed: number
  runTotal: number
  runError: string | null
  tracks: SpotifyTrackMatch[]
}

export interface SpotifyTransferResult {
  jobId: number
  spotifyPlaylistId: string
  spotifyUrl: string
  name: string
  added: number
  skipped: number
}

const key = (playlistId: number) => ['spotify-matching', playlistId]

/** Polls every 2 seconds while a matching run is in progress. */
export function useSpotifyMatchingOverview(playlistId: number) {
  return useQuery({
    queryKey: key(playlistId),
    queryFn: async () => {
      const { data } = await api.get<SpotifyOverview>(`/spotify/matching/playlists/${playlistId}`)
      return data
    },
    enabled: !!playlistId,
    retry: false,
    refetchInterval: (query) => (query.state.data?.running ? 2000 : false),
  })
}

function useOverviewMutation<TVars>(playlistId: number, fn: (vars: TVars) => Promise<SpotifyOverview>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(key(playlistId), data)
    },
  })
}

export function useRunSpotifyMatching(playlistId: number) {
  return useOverviewMutation(playlistId, async (retryUnmatched: boolean) => {
    const { data } = await api.post<SpotifyOverview>(
      `/spotify/matching/playlists/${playlistId}/run`, null, { params: { retryUnmatched } }
    )
    return data
  })
}

export function useSelectSpotifyCandidate(playlistId: number) {
  return useOverviewMutation(playlistId, async (matchId: number) => {
    const { data } = await api.put<SpotifyOverview>(`/spotify/matching/matches/${matchId}/select`)
    return data
  })
}

export function useConfirmAllSpotify(playlistId: number) {
  return useOverviewMutation(playlistId, async (_: void) => {
    const { data } = await api.post<SpotifyOverview>(`/spotify/matching/playlists/${playlistId}/confirm-all`)
    return data
  })
}

export function useSkipSpotifyTrack(playlistId: number) {
  return useOverviewMutation(playlistId, async (playlistTrackId: number) => {
    const { data } = await api.delete<SpotifyOverview>(`/spotify/matching/tracks/${playlistTrackId}/selection`)
    return data
  })
}

export function useCreateSpotifyPlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { playlistId: number; name: string; makePublic: boolean }) => {
      const { data } = await api.post<SpotifyTransferResult>('/spotify/transfers', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  })
}
