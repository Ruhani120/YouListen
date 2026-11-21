import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ParsedTrack {
  position: number
  title: string | null
  artist: string | null
  album: string | null
  durationMs: number | null
  isrc: string | null
  spotifyId: string | null
  valid: boolean
  issue: string | null
}

export interface ImportPreview {
  fileName: string
  format: 'csv' | 'json'
  totalRows: number
  validCount: number
  invalidCount: number
  isrcCount: number
  tracks: ParsedTrack[]
}

export interface ImportConfirmResult {
  playlistId: number
  name: string
  trackCount: number
  skippedCount: number
}

/** Step 1: upload the file, the backend parses it and returns what it found. Nothing is saved. */
export function usePreviewImport() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ImportPreview>('/imports/preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
  })
}

/** Step 2: save the previewed (valid) tracks as a playlist. */
export function useConfirmImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; fileName: string; format: string; tracks: ParsedTrack[] }) => {
      const body = {
        name: payload.name,
        fileName: payload.fileName,
        format: payload.format,
        tracks: payload.tracks
          .filter((t) => t.valid)
          .map((t) => ({
            title: t.title,
            artist: t.artist,
            album: t.album,
            durationMs: t.durationMs,
            isrc: t.isrc,
            spotifyId: t.spotifyId,
          })),
      }
      const { data } = await api.post<ImportConfirmResult>('/imports/confirm', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] })
    },
  })
}
