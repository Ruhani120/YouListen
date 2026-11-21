import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Search, RefreshCw, LogOut, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getApiError,
  useConnectSpotify,
  useDisconnectSpotify,
  useImportSpotifyPlaylist,
  useSpotifyPlaylists,
  useSpotifyStatus,
  SpotifyPlaylist,
} from '../hooks/useSpotify'

export default function SpotifyConnectSection() {
  const navigate = useNavigate()
  const { data: status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useSpotifyStatus()
  const connected = !!status?.connected
  const playlistsQuery = useSpotifyPlaylists(connected)
  const connect = useConnectSpotify()
  const disconnect = useDisconnectSpotify()
  const importPlaylist = useImportSpotifyPlaylist()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const playlists = playlistsQuery.data ?? []
  const filtered = useMemo(
    () => playlists.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [playlists, search]
  )
  const selected: SpotifyPlaylist | undefined = playlists.find((p) => p.id === selectedId)

  const handleConnect = () => {
    connect.mutate(undefined, {
      onError: (err) => toast.error(getApiError(err, 'Could not start Spotify login').message),
    })
  }

  const handleDisconnect = () => {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setSelectedId(null)
        toast.success('Spotify disconnected')
      },
      onError: () => toast.error('Could not disconnect Spotify'),
    })
  }

  const handleImport = () => {
    if (!selected) return
    if (selected.alreadyImported && selected.importedPlaylistId) {
      navigate(`/app/playlists/${selected.importedPlaylistId}/match`)
      return
    }
    importPlaylist.mutate(selected.id, {
      onSuccess: (result) => {
        toast.success(`Imported "${result.name}" (${result.trackCount} tracks)`)
        navigate(`/app/playlists/${result.playlistId}/match`)
      },
      onError: (err) => toast.error(getApiError(err, 'Import failed').message),
    })
  }

  const playlistsError = playlistsQuery.error ? getApiError(playlistsQuery.error, 'Could not load playlists') : null

  return (
    <div className="card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Spotify
          </label>
          <p className="text-xs text-text-secondary mt-1">
            Pick one of your playlists.
          </p>
        </div>

        {connected && (
          <div className="flex items-center gap-2">
            <span className="badge bg-accent-green/20 text-accent-green flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{status?.displayName ? `Connected as ${status.displayName}` : 'Connected'}</span>
            </span>
            <button
              onClick={() => playlistsQuery.refetch()}
              disabled={playlistsQuery.isFetching}
              className="btn-ghost text-xs px-2 py-1.5"
              title="Refresh playlists"
            >
              <RefreshCw size={14} className={playlistsQuery.isFetching ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
              className="btn-ghost text-xs px-2 py-1.5 text-accent-red"
              title="Disconnect Spotify"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {statusLoading && <div className="h-20 rounded-xl bg-bg-elevated animate-pulse-soft" />}

      {/* Could not load Spotify status at all (server down, expired session, ...) */}
      {!statusLoading && statusError && (
        <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/30 text-xs text-text-secondary space-y-3">
          <div className="flex gap-3">
            <AlertCircle size={16} className="text-accent-red shrink-0 mt-0.5" />
            <span>
              Could not load Spotify status
              {(statusError as any)?.response?.status ? ` (HTTP ${(statusError as any).response.status})` : ''}.
              If this keeps happening, log out and log in again.
            </span>
          </div>
          <button onClick={() => refetchStatus()} className="btn-secondary text-xs px-3 py-1.5">
            Try again
          </button>
        </div>
      )}

      {/* Not configured on the server */}
      {!statusLoading && status && !status.configured && (
        <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary flex gap-3">
          <AlertCircle size={16} className="text-accent-yellow shrink-0 mt-0.5" />
          <span>
            Spotify login isn&apos;t set up on this server yet. You can still use a CSV or JSON file below.
          </span>
        </div>
      )}

      {/* Configured but not connected */}
      {!statusLoading && status?.configured && !connected && (
        <button
          onClick={handleConnect}
          disabled={connect.isPending}
          className="btn-primary text-sm px-5 py-2.5 w-full sm:w-auto justify-center"
        >
          <Music size={16} />
          <span>{connect.isPending ? 'Redirecting to Spotify...' : 'Connect Spotify'}</span>
        </button>
      )}

      {/* Connected */}
      {connected && (
        <div className="space-y-4">
          {playlistsQuery.isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-44 rounded-xl bg-bg-elevated animate-pulse-soft" />
              ))}
            </div>
          )}

          {playlistsError && (
            <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/30 text-xs text-text-secondary space-y-3">
              <div className="flex gap-3">
                <AlertCircle size={16} className="text-accent-red shrink-0 mt-0.5" />
                <span>{playlistsError.message}</span>
              </div>
              <div className="flex gap-2">
                {playlistsError.code === 'SPOTIFY_REAUTH_REQUIRED' || playlistsError.code === 'SPOTIFY_NOT_CONNECTED' ? (
                  <button onClick={handleConnect} className="btn-primary text-xs px-3 py-1.5">
                    Reconnect Spotify
                  </button>
                ) : (
                  <button onClick={() => playlistsQuery.refetch()} className="btn-secondary text-xs px-3 py-1.5">
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {playlistsQuery.isSuccess && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${playlists.length} playlists...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>

              {filtered.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">
                  {playlists.length === 0 ? 'No playlists found on this Spotify account.' : 'No playlists match your search.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[28rem] overflow-y-auto pr-1">
                  {filtered.map((p) => {
                    const isSelected = p.id === selectedId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!p.importable}
                        onClick={() => setSelectedId(isSelected ? null : p.id)}
                        title={
                          p.importable
                            ? p.name
                            : 'Spotify only shares tracks for playlists you own or collaborate on'
                        }
                        className={`text-left rounded-xl border overflow-hidden transition-all ${
                          isSelected
                            ? 'border-brand bg-brand/10 ring-1 ring-brand'
                            : 'border-bg-border bg-bg-elevated hover:border-brand/50'
                        } ${!p.importable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="relative aspect-square bg-bg-elevated flex items-center justify-center">
                          {p.coverUrl ? (
                            <img
                              src={p.coverUrl}
                              alt={p.name}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music size={32} className="text-white/60" />
                          )}
                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-brand rounded-full p-1">
                              <CheckCircle2 size={14} className="text-white" />
                            </span>
                          )}
                          {!p.importable && (
                            <span className="absolute top-2 left-2 bg-black/60 rounded-full p-1">
                              <Lock size={12} className="text-white" />
                            </span>
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="text-sm font-semibold text-text-primary truncate">{p.name}</div>
                          <div className="text-xs text-text-muted">
                            {p.trackCount} {p.trackCount === 1 ? 'track' : 'tracks'}
                            {p.ownerName ? ` · ${p.ownerName}` : ''}
                          </div>
                          {p.alreadyImported && (
                            <span className="badge bg-accent-green/20 text-accent-green">Already imported</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-text-muted truncate">
                  {selected ? `Selected: ${selected.name}` : 'Select a playlist to continue'}
                </span>
                <button
                  onClick={handleImport}
                  disabled={!selected || importPlaylist.isPending}
                  className="btn-primary text-xs px-5 py-2.5"
                >
                  <span>
                    {importPlaylist.isPending
                      ? 'Importing tracks...'
                      : selected?.alreadyImported
                        ? 'Open imported playlist'
                        : 'Import & Start Matching'}
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
