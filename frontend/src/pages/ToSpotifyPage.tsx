import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  Globe,
  Music,
  RefreshCw,
  Search,
  SkipForward,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import ConfidenceBar from '../components/ConfidenceBar'
import StatusBadge from '../components/StatusBadge'
import { formatDuration } from '../lib/format'
import { getApiError, useConnectSpotify, useSpotifyStatus } from '../hooks/useSpotify'
import {
  SpotifyTrackMatch,
  SpotifyTrackStatus,
  SpotifyTransferResult,
  useConfirmAllSpotify,
  useCreateSpotifyPlaylist,
  useRunSpotifyMatching,
  useSelectSpotifyCandidate,
  useSkipSpotifyTrack,
  useSpotifyMatchingOverview,
} from '../hooks/useSpotifyMatching'

type Filter = 'ALL' | SpotifyTrackStatus
const PAGE_SIZE = 50

export default function ToSpotifyPage() {
  const { id } = useParams<{ id: string }>()
  const playlistId = Number(id)
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useSpotifyMatchingOverview(playlistId)
  const { data: spotify } = useSpotifyStatus()
  const connectSpotify = useConnectSpotify()
  const run = useRunSpotifyMatching(playlistId)
  const confirmAll = useConfirmAllSpotify(playlistId)
  const select = useSelectSpotifyCandidate(playlistId)
  const skip = useSkipSpotifyTrack(playlistId)
  const create = useCreateSpotifyPlaylist()

  const [filter, setFilter] = useState<Filter>('ALL')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [makePublic, setMakePublic] = useState(false)
  const [result, setResult] = useState<SpotifyTransferResult | null>(null)

  const filtered = useMemo(() => {
    const all = data?.tracks ?? []
    return filter === 'ALL' ? all : all.filter((t) => t.status === filter)
  }, [data, filter])

  const onError = (fallback: string) => (err: unknown) => toast.error(getApiError(err, fallback).message, { duration: 7000 })
  const startConnect = () => connectSpotify.mutate(undefined, { onError: onError('Could not start Spotify login') })

  if (isLoading) {
    return <div className="max-w-5xl mx-auto h-40 rounded-xl bg-bg-elevated animate-pulse-soft" />
  }
  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto card space-y-4">
        <div className="flex gap-3 text-sm text-text-secondary">
          <AlertCircle size={18} className="text-accent-red shrink-0 mt-0.5" />
          <span>{getApiError(error, 'Could not load this playlist').message}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-xs px-4 py-2">Try again</button>
          <button onClick={() => navigate('/app/playlists')} className="btn-ghost text-xs">Back to playlists</button>
        </div>
      </div>
    )
  }

  const defaultName = `${data.playlistName} (YouListen)`
  const shownName = nameTouched ? name : defaultName
  const searched = data.totalTracks - data.pending
  const pct = (n: number) => (data.totalTracks === 0 ? 0 : Math.round((n / data.totalTracks) * 100))
  const runPercent = data.runTotal === 0 ? 0 : Math.round((data.runProcessed / data.runTotal) * 100)

  const spotifyReady = !!spotify?.connected && spotify.canCreatePlaylists
  const connectNote =
    spotify && !spotify.configured ? 'Spotify login isn\'t set up on this server yet.'
    : spotify && !spotify.connected ? 'Connect Spotify so YouListen can search it and create the playlist.'
    : spotify && spotify.connected && !spotify.canCreatePlaylists
      ? 'Your Spotify connection can only read playlists. Reconnect to allow creating playlists.'
      : null

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: data.totalTracks },
    { id: 'REVIEW', label: 'Needs review', count: data.needsReview },
    { id: 'UNMATCHED', label: 'Unmatched', count: data.unmatched },
    { id: 'CONFIRMED', label: 'Confirmed', count: data.confirmed },
    { id: 'PENDING', label: 'Not searched', count: data.pending },
  ]

  const handleCreate = () => {
    if (!shownName.trim()) {
      toast.error('Give the Spotify playlist a name')
      return
    }
    create.mutate(
      { playlistId, name: shownName.trim(), makePublic },
      {
        onSuccess: (r) => {
          setResult(r)
          toast.success(`${r.added} tracks added to Spotify`)
        },
        onError: onError('Could not create the Spotify playlist'),
      }
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="Transfer to Spotify"
        description={`Finding "${data.playlistName}" on Spotify.`}
        actions={
          <button onClick={() => navigate(-1)} className="btn-ghost text-xs flex items-center gap-1.5">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        }
      />

      {connectNote && (
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-accent-yellow/30">
          <div className="flex gap-3 text-xs text-text-secondary">
            <AlertCircle size={16} className="text-accent-yellow shrink-0 mt-0.5" />
            <span>{connectNote}</span>
          </div>
          {spotify?.configured && (
            <button onClick={startConnect} disabled={connectSpotify.isPending} className="btn-primary text-xs py-2 px-4 shrink-0">
              {connectSpotify.isPending ? 'Redirecting...' : spotify.connected ? 'Reconnect Spotify' : 'Connect Spotify'}
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">Tracks Searched</div>
          <div className="text-2xl font-bold text-white">{searched} / {data.totalTracks}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">Confirmed</div>
          <div className="text-2xl font-bold text-accent-green">{data.confirmed} ({pct(data.confirmed)}%)</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">Needs Review</div>
          <div className="text-2xl font-bold text-accent-yellow">{data.needsReview} ({pct(data.needsReview)}%)</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">No Good Match</div>
          <div className="text-2xl font-bold text-accent-red">{data.unmatched} ({pct(data.unmatched)}%)</div>
        </div>
      </div>

      {/* Run controls */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-text-secondary">
            {data.pending > 0
              ? `${data.pending} track${data.pending === 1 ? '' : 's'} not searched yet.`
              : 'All tracks searched. Check the suggestions, then create the playlist.'}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {data.pending > 0 && (
              <button
                onClick={() => run.mutate(false, { onError: onError('Could not start matching') })}
                disabled={data.running || run.isPending || !spotify?.connected}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
              >
                <Search size={14} />
                <span>{data.running ? 'Searching...' : `Find matches on Spotify (${data.pending})`}</span>
              </button>
            )}
            {data.unmatched > 0 && !data.running && (
              <button
                onClick={() => run.mutate(true, { onError: onError('Could not start matching') })}
                disabled={run.isPending || !spotify?.connected}
                className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Retry unmatched</span>
              </button>
            )}
            {data.needsReview > 0 && (
              <button
                onClick={() =>
                  confirmAll.mutate(undefined, {
                    onSuccess: () => toast.success('Suggested matches approved'),
                    onError: onError('Could not approve matches'),
                  })
                }
                disabled={confirmAll.isPending}
                className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
              >
                <CheckCircle2 size={14} />
                <span>Approve all suggestions</span>
              </button>
            )}
          </div>
        </div>

        {data.running && (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>Searching Spotify...</span>
              <span>{data.runProcessed} / {data.runTotal}</span>
            </div>
            <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden border border-bg-border/60">
              <div className="bg-accent-green h-full rounded-full transition-all duration-500" style={{ width: `${runPercent}%` }} />
            </div>
          </div>
        )}

        {data.runError && (
          <div className="p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary flex gap-2">
            <AlertCircle size={14} className="text-accent-yellow shrink-0 mt-0.5" />
            <span>{data.runError}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-bg-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setFilter(t.id)
              setVisibleCount(PAGE_SIZE)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === t.id ? 'bg-brand/15 text-brand-light border border-brand/30' : 'text-text-muted hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Tracks */}
      <div className="space-y-4">
        {filtered.length === 0 && <p className="text-xs text-text-muted text-center py-8">Nothing in this view.</p>}
        {filtered.slice(0, visibleCount).map((track) => (
          <TrackCard
            key={track.playlistTrackId}
            track={track}
            busy={select.isPending || skip.isPending}
            onSelect={(matchId) => select.mutate(matchId, { onError: onError('Could not select that match') })}
            onSkip={() =>
              skip.mutate(track.playlistTrackId, {
                onSuccess: () => toast.success('Track will be skipped'),
                onError: onError('Could not skip this track'),
              })
            }
          />
        ))}
        {filtered.length > visibleCount && (
          <div className="text-center">
            <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="btn-secondary text-xs px-5 py-2">
              Show more ({filtered.length - visibleCount} left)
            </button>
          </div>
        )}
      </div>

      {/* Create the Spotify playlist */}
      <div className="card space-y-5 border-brand/30">
        {result ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 size={36} className="text-accent-green mx-auto" />
            <div>
              <h3 className="text-xl font-black text-white">Spotify playlist created!</h3>
              <p className="text-xs text-text-secondary mt-1">
                {result.added} tracks were added to &quot;{result.name}&quot;
                {result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={result.spotifyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-5 py-2.5 inline-flex items-center justify-center gap-2">
                <ExternalLink size={14} />
                <span>Open in Spotify</span>
              </a>
              <button onClick={() => navigate('/app/transfers')} className="btn-secondary text-xs px-5 py-2.5">
                View Transfer History
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Create the Spotify playlist</h3>
              <p className="text-xs text-text-secondary mt-1">
                Only confirmed matches ({data.confirmed}) are added, in the original order.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Playlist name</label>
              <input
                type="text"
                value={shownName}
                maxLength={100}
                onChange={(e) => {
                  setNameTouched(true)
                  setName(e.target.value)
                }}
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: false, label: 'Private', icon: Lock },
                { value: true, label: 'Public', icon: Globe },
              ].map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setMakePublic(opt.value)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      makePublic === opt.value
                        ? 'bg-brand/15 border-brand text-white'
                        : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-bg-border">
              <span className="text-xs text-text-muted">
                {!spotifyReady ? 'Connect Spotify (with playlist permissions) first.' : data.confirmed === 0 ? 'Confirm at least one match first.' : ''}
              </span>
              <button
                onClick={handleCreate}
                disabled={!spotifyReady || data.confirmed === 0 || create.isPending}
                className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
              >
                <span>{create.isPending ? 'Creating...' : `Create Spotify playlist (${data.confirmed})`}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ───────────────────────── one track ─────────────────────────

function TrackCard({
  track,
  busy,
  onSelect,
  onSkip,
}: {
  track: SpotifyTrackMatch
  busy: boolean
  onSelect: (matchId: number) => void
  onSkip: () => void
}) {
  const [showOthers, setShowOthers] = useState(false)
  const selected = track.candidates.find((c) => c.selected)
  const shown = selected ?? track.candidates[0]
  const others = track.candidates.filter((c) => c !== shown)

  const badge =
    track.status === 'CONFIRMED' ? <StatusBadge status="matched" label="Confirmed" />
    : track.status === 'REVIEW' ? <StatusBadge status="warning" label="Needs review" />
    : track.status === 'UNMATCHED' ? <StatusBadge status="unmatched" label="No good match" />
    : <StatusBadge status="pending" label="Not searched" />

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border/60 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-text-muted w-8 shrink-0">#{track.position}</span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-text-muted truncate">
              {track.artist ?? 'Unknown artist'} ({formatDuration(track.durationMs)})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {shown && <div className="w-32"><ConfidenceBar score={Math.round(shown.confidence)} /></div>}
          {badge}
        </div>
      </div>

      {shown ? (
        <div className="bg-bg-elevated/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-bg-border/60">
          <div className="flex items-center gap-3 min-w-0">
            {shown.coverUrl ? (
              <img src={shown.coverUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center shrink-0"><Music size={16} /></div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <span className="truncate">{shown.title}</span>
                <a href={`https://open.spotify.com/track/${shown.spotifyTrackId}`} target="_blank" rel="noopener noreferrer" title="Open on Spotify" className="text-text-muted hover:text-white shrink-0">
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="text-[11px] text-text-muted truncate">
                {shown.artist ?? '-'} &bull; {shown.album ?? '-'} &bull; {formatDuration(shown.durationMs)}
              </div>
            </div>
          </div>
          <div className="self-end sm:self-auto shrink-0">
            {track.status === 'CONFIRMED' ? (
              <span className="badge bg-accent-green/20 text-accent-green text-[11px] flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Confirmed</span>
              </span>
            ) : (
              <button onClick={() => onSelect(shown.matchId)} disabled={busy} className="btn-primary text-xs py-1 px-3">
                {track.status === 'UNMATCHED' ? 'Use this anyway' : 'Confirm Match'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">{track.status === 'PENDING' ? 'Not searched yet.' : 'Spotify returned no results for this track.'}</p>
      )}

      {(others.length > 0 || track.status === 'CONFIRMED' || track.status === 'REVIEW') && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {others.length > 0 && (
            <button onClick={() => setShowOthers((v) => !v)} className="btn-ghost text-[11px] px-2 py-1 flex items-center gap-1">
              {showOthers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{others.length} other result{others.length === 1 ? '' : 's'}</span>
            </button>
          )}
          {(track.status === 'CONFIRMED' || track.status === 'REVIEW') && (
            <button onClick={onSkip} disabled={busy} className="btn-ghost text-[11px] px-2 py-1 flex items-center gap-1 text-accent-red">
              <SkipForward size={12} />
              <span>Skip this track</span>
            </button>
          )}
        </div>
      )}

      {showOthers && (
        <div className="space-y-2">
          {others.map((c) => (
            <div key={c.matchId} className="flex items-center justify-between gap-3 rounded-lg border border-bg-border/60 p-3 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-text-primary truncate">{c.title}</div>
                <div className="text-[11px] text-text-muted truncate">
                  {c.artist ?? '-'} &bull; {c.album ?? '-'} &bull; {formatDuration(c.durationMs)} &bull; {Math.round(c.confidence)}%
                </div>
              </div>
              <button onClick={() => onSelect(c.matchId)} disabled={busy} className="btn-secondary text-[11px] px-3 py-1 shrink-0">
                Use this
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
