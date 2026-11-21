import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

/** What kind of YouTube upload the user wants matched */
export type Preference = 'VIDEO' | 'AUDIO' | 'LYRICS'
export type CandidateKind = 'VIDEO' | 'AUDIO' | 'LYRICS' | 'OTHER'

export interface MatchCandidate {
  matchId: number
  videoId: string
  title: string | null
  channel: string | null
  durationMs: number | null
  confidence: number
  kind: CandidateKind
  /** why this score, e.g. "Title 100% · Artist 100% · Length 98% · Music video" */
  explanation: string
  selected: boolean
  confirmed: boolean
  method: string | null
}

export type TrackMatchStatus = 'PENDING' | 'CONFIRMED' | 'REVIEW' | 'UNMATCHED'

export interface TrackMatch {
  playlistTrackId: number
  position: number
  title: string
  artist: string | null
  album: string | null
  durationMs: number | null
  isrc: string | null
  status: TrackMatchStatus
  candidates: MatchCandidate[]
}

export interface MatchingOverview {
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
  /** the preference the stored scores were last computed with */
  preference: Preference | null
  estimatedQuotaUnits: number
  searchMode: 'api_key' | 'account' | 'none'
  tracks: TrackMatch[]
}

const key = (playlistId: number) => ['matching', playlistId]

/** Polls every 2 seconds while a matching run is in progress. */
export function useMatchingOverview(playlistId: number) {
  return useQuery({
    queryKey: key(playlistId),
    queryFn: async () => {
      const { data } = await api.get<MatchingOverview>(`/matching/playlists/${playlistId}`)
      return data
    },
    enabled: !!playlistId,
    retry: false,
    refetchInterval: (query) => (query.state.data?.running ? 2000 : false),
  })
}

function useOverviewMutation<TVars>(playlistId: number, fn: (vars: TVars) => Promise<MatchingOverview>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(key(playlistId), data)
    },
  })
}

export function useRunMatching(playlistId: number) {
  return useOverviewMutation(playlistId, async (vars: { retryUnmatched: boolean; preference: Preference }) => {
    const { data } = await api.post<MatchingOverview>(
      `/matching/playlists/${playlistId}/run`, null, { params: vars }
    )
    return data
  })
}

/** Re-ranks the candidates already found for another preference. Free: no YouTube quota is used. */
export function useRescoreMatches(playlistId: number) {
  return useOverviewMutation(playlistId, async (preference: Preference) => {
    const { data } = await api.post<MatchingOverview>(
      `/matching/playlists/${playlistId}/rescore`, null, { params: { preference } }
    )
    return data
  })
}

export function useSelectCandidate(playlistId: number) {
  return useOverviewMutation(playlistId, async (matchId: number) => {
    const { data } = await api.put<MatchingOverview>(`/matching/matches/${matchId}/select`)
    return data
  })
}

export function useConfirmAllMatches(playlistId: number) {
  return useOverviewMutation(playlistId, async (_: void) => {
    const { data } = await api.post<MatchingOverview>(`/matching/playlists/${playlistId}/confirm-all`)
    return data
  })
}

export function useSkipTrack(playlistId: number) {
  return useOverviewMutation(playlistId, async (playlistTrackId: number) => {
    const { data } = await api.delete<MatchingOverview>(`/matching/tracks/${playlistTrackId}/selection`)
    return data
  })
}

/** Use a specific YouTube video for a track: paste its link (costs 1 quota unit). */
export function useManualMatch(playlistId: number) {
  return useOverviewMutation(playlistId, async (vars: { playlistTrackId: number; url: string; preference: Preference }) => {
    const { data } = await api.post<MatchingOverview>(
      `/matching/tracks/${vars.playlistTrackId}/manual`,
      { url: vars.url },
      { params: { preference: vars.preference } }
    )
    return data
  })
}

export function useRematchTrack(playlistId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { playlistTrackId: number; preference: Preference }) => {
      const { data } = await api.post<TrackMatch>(
        `/matching/tracks/${vars.playlistTrackId}/rematch`, null, { params: { preference: vars.preference } }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(playlistId) })
    },
  })
}
