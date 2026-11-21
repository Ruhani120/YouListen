import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Lock, Music } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleConnectButton from './GoogleConnectButton'
import { useGoogleStatus } from '../hooks/useGoogle'
import { useImportYouTubePlaylist, useYouTubePlaylists } from '../hooks/useYouTubeImport'
import { getApiError } from '../hooks/useSpotify'

/** Pick one of your own YouTube / YouTube Music playlists and bring it into YouListen (then send it to Spotify). */
export default function YouTubeImportSection() {
  const navigate = useNavigate()
  const { data: google, isLoading: googleLoading } = useGoogleStatus()
  const connected = !!google?.connected
  const playlistsQuery = useYouTubePlaylists(connected)
  const importPlaylist = useImportYouTubePlaylist()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const playlists = playlistsQuery.data ?? []
  const selected = playlists.find((p) => p.id === selectedId)
  const error = playlistsQuery.error ? getApiError(playlistsQuery.error, 'Could not load your YouTube playlists') : null

  const handleImport = () => {
    if (!selected) return
    if (selected.alreadyImported && selected.importedPlaylistId) {
      navigate(`/app/playlists/${selected.importedPlaylistId}/to-spotify`)
      return
    }
    importPlaylist.mutate(selected.id, {
      onSuccess: (r) => {
        const note = r.lowConfidenceCount > 0 ? ` ${r.lowConfidenceCount} need a closer look.` : ''
        toast.success(`Imported ${r.trackCount} tracks.${note}`, { duration: 6000 })
        navigate(`/app/playlists/${r.playlistId}/to-spotify`)
      },
      onError: (err) => toast.error(getApiError(err, 'Import failed').message, { duration: 7000 }),
    })
  }

  return (
    <div className="card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            YouTube / YouTube Music
          </label>
          <p className="text-xs text-text-secondary mt-1">
            Pick one of your playlists and send it to Spotify.
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2">
            <span className="badge bg-accent-green/20 text-accent-green flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{google?.channelTitle ? `Connected as ${google.channelTitle}` : 'Connected'}</span>
            </span>
            <button
              onClick={() => playlistsQuery.refetch()}
              disabled={playlistsQuery.isFetching}
              className="btn-ghost text-xs px-2 py-1.5"
              title="Refresh playlists"
            >
              <RefreshCw size={14} className={playlistsQuery.isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {googleLoading && <div className="h-16 rounded-xl bg-bg-elevated animate-pulse-soft" />}

      {!googleLoading && google && !google.configured && (
        <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary flex gap-3">
          <AlertCircle size={16} className="text-accent-yellow shrink-0 mt-0.5" />
          <span>Google login isn&apos;t set up on this server yet, so YouTube playlists can&apos;t be read.</span>
        </div>
      )}

      {!googleLoading && google?.configured && !connected && <GoogleConnectButton label="Connect Google to see your playlists" />}

      {connected && (
        <div className="space-y-4">
          {playlistsQuery.isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-44 rounded-xl bg-bg-elevated animate-pulse-soft" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/30 text-xs text-text-secondary space-y-3">
              <div className="flex gap-3">
                <AlertCircle size={16} className="text-accent-red shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
              <button onClick={() => playlistsQuery.refetch()} className="btn-secondary text-xs px-3 py-1.5">Try again</button>
            </div>
          )}

          {playlistsQuery.isSuccess && playlists.length === 0 && (
            <p className="text-xs text-text-muted text-center py-6">No playlists found on this YouTube account.</p>
          )}

          {playlists.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[28rem] overflow-y-auto pr-1">
                {playlists.map((p) => {
                  const isSelected = p.id === selectedId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : p.id)}
                      className={`text-left rounded-xl border overflow-hidden transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/10 ring-1 ring-brand'
                          : 'border-bg-border bg-bg-elevated hover:border-brand/50'
                      }`}
                    >
                      <div className="relative aspect-video bg-bg-elevated flex items-center justify-center">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.title} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <Radio size={28} className="text-white/60" />
                        )}
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-brand rounded-full p-1">
                            <CheckCircle2 size={14} className="text-white" />
                          </span>
                        )}
                        {p.privacy === 'private' && (
                          <span className="absolute top-2 left-2 bg-black/60 rounded-full p-1" title="Private playlist">
                            <Lock size={12} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-sm font-semibold text-text-primary truncate">{p.title}</div>
                        <div className="text-xs text-text-muted">
                          {p.itemCount} {p.itemCount === 1 ? 'video' : 'videos'}
                        </div>
                        {p.alreadyImported && (
                          <span className="badge bg-accent-green/20 text-accent-green">Already imported</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-text-muted truncate flex items-center gap-1.5">
                  <Music size={12} />
                  {selected ? `Selected: ${selected.title}` : 'Select a playlist to continue'}
                </span>
                <button
                  onClick={handleImport}
                  disabled={!selected || importPlaylist.isPending}
                  className="btn-primary text-xs px-5 py-2.5"
                >
                  <span>
                    {importPlaylist.isPending
                      ? 'Reading videos...'
                      : selected?.alreadyImported
                        ? 'Open imported playlist'
                        : 'Import & Send to Spotify'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
