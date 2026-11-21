import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Search,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import ConfidenceBar from '../components/ConfidenceBar'
import StatusBadge from '../components/StatusBadge'
import GoogleConnectButton from '../components/GoogleConnectButton'
import { formatDuration } from '../lib/format'
import { getApiError } from '../hooks/useSpotify'
import {
  CandidateKind,
  Preference,
  TrackMatch,
  TrackMatchStatus,
  useConfirmAllMatches,
  useManualMatch,
  useMatchingOverview,
  useRematchTrack,
  useRescoreMatches,
  useRunMatching,
  useSelectCandidate,
  useSkipTrack,
} from '../hooks/useMatching'

type Filter = 'ALL' | TrackMatchStatus

const PAGE_SIZE = 50

const PREFERENCES: { id: Preference; label: string; hint: string }[] = [
  { id: 'VIDEO', label: 'Official music video', hint: 'The original video from the artist.' },
  { id: 'AUDIO', label: 'Audio (YouTube Music song)', hint: 'Official audio, like the songs on YouTube Music.' },
  { id: 'LYRICS', label: 'Lyrics video', hint: 'Lyric videos.' },
]

const KIND_LABEL: Record<CandidateKind, string> = {
  VIDEO: 'Music video',
  AUDIO: 'Audio',
  LYRICS: 'Lyrics',
  OTHER: 'Upload',
}

export default function SongMatchingPage() {
  const { id } = useParams<{ id: string }>()
  const playlistId = Number(id)
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useMatchingOverview(playlistId)
  const run = useRunMatching(playlistId)
  const confirmAll = useConfirmAllMatches(playlistId)
  const select = useSelectCandidate(playlistId)
  const skip = useSkipTrack(playlistId)
  const rematch = useRematchTrack(playlistId)
  const rescore = useRescoreMatches(playlistId)
  const manual = useManualMatch(playlistId)

  const [filter, setFilter] = useState<Filter>('ALL')
  const [chosenPref, setChosenPref] = useState<Preference | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const activePref: Preference = chosenPref ?? data?.preference ?? 'VIDEO'

  const filtered = useMemo(() => {
    const all = data?.tracks ?? []
    return filter === 'ALL' ? all : all.filter((t) => t.status === filter)
  }, [data, filter])

  const onError = (fallback: string) => (err: unknown) => toast.error(getApiError(err, fallback).message, { duration: 7000 })

  const handleRun = (retryUnmatched: boolean) => {
    run.mutate({ retryUnmatched, preference: activePref }, {
      onSuccess: (d) => {
        if (!d.running && d.pending === 0 && !retryUnmatched) toast.success('Everything has already been searched')
      },
      onError: onError('Could not start matching'),
    })
  }

  if (isLoading) {
    return <div className="max-w-5xl mx-auto h-40 rounded-xl bg-bg-elevated animate-pulse-soft" />
  }

  if (error || !data) {
    const info = getApiError(error, 'Could not load this playlist')
    return (
      <div className="max-w-3xl mx-auto card space-y-4">
        <div className="flex gap-3 text-sm text-text-secondary">
          <AlertCircle size={18} className="text-accent-red shrink-0 mt-0.5" />
          <span>{info.message}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-xs px-4 py-2">Try again</button>
          <button onClick={() => navigate('/app/playlists')} className="btn-ghost text-xs">Back to playlists</button>
        </div>
      </div>
    )
  }

  const searched = data.totalTracks - data.pending
  const prefChanged = activePref !== data.preference && searched > 0
  const pct = (n: number) => (data.totalTracks === 0 ? 0 : Math.round((n / data.totalTracks) * 100))
  const runPercent = data.runTotal === 0 ? 0 : Math.round((data.runProcessed / data.runTotal) * 100)
  const canTransfer = data.confirmed > 0

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: data.totalTracks },
    { id: 'REVIEW', label: 'Needs review', count: data.needsReview },
    { id: 'UNMATCHED', label: 'Unmatched', count: data.unmatched },
    { id: 'CONFIRMED', label: 'Confirmed', count: data.confirmed },
    { id: 'PENDING', label: 'Not searched', count: data.pending },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="Match songs"
        description={`Finding YouTube videos for "${data.playlistName}".`}
        actions={
          <button
            onClick={() => navigate(`/app/transfer/${playlistId}`)}
            disabled={!canTransfer}
            title={canTransfer ? '' : 'Confirm at least one match first'}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <span>Proceed to Transfer</span>
            <ArrowRight size={14} />
          </button>
        }
      />

      {/* No way to search YouTube yet */}
      {data.searchMode === 'none' && (
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-accent-yellow/30">
          <div className="flex gap-3 text-xs text-text-secondary">
            <AlertCircle size={16} className="text-accent-yellow shrink-0 mt-0.5" />
            <span>
              Connect your Google account so YouListen can search YouTube.
            </span>
          </div>
          <GoogleConnectButton />
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

      {/* Preference: what kind of YouTube upload to prefer */}
      <div className="card space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Prefer this kind of upload</label>
          <p className="text-xs text-text-secondary mt-1">
            If there&apos;s none of this kind, the next best is used and marked for review.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PREFERENCES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setChosenPref(opt.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                activePref === opt.id
                  ? 'bg-brand/15 border-brand text-white'
                  : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold">{opt.label}</div>
              <div className="text-[11px] text-text-muted mt-1">{opt.hint}</div>
            </button>
          ))}
        </div>
        {prefChanged && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-brand/10 border border-brand/30 text-xs text-text-secondary">
            <span>
              Re-rank {searched} searched track{searched === 1 ? '' : 's'} for this choice. No YouTube quota is used, and
              tracks you picked by hand stay as they are.
            </span>
            <button
              onClick={() =>
                rescore.mutate(activePref, {
                  onSuccess: () => {
                    setChosenPref(null)
                    toast.success('Matches re-ranked')
                  },
                  onError: onError('Could not re-rank'),
                })
              }
              disabled={rescore.isPending}
              className="btn-primary text-xs px-4 py-2 shrink-0"
            >
              {rescore.isPending ? 'Re-ranking...' : 'Re-rank now'}
            </button>
          </div>
        )}
      </div>

      {/* Run controls */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-text-secondary">
            {data.pending > 0 ? (
              <>
                <span className="font-semibold text-text-primary">{data.pending} track{data.pending === 1 ? '' : 's'}</span> not
                searched yet. That uses about{' '}
                <span className="font-semibold text-text-primary">{data.estimatedQuotaUnits.toLocaleString()}</span> of YouTube&apos;s
                10,000 free daily quota units.
              </>
            ) : (
              'All tracks searched. Check the suggestions, then continue.'
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {data.pending > 0 && (
              <button
                onClick={() => handleRun(false)}
                disabled={data.running || run.isPending || data.searchMode === 'none'}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
              >
                <Search size={14} />
                <span>{data.running ? 'Searching...' : `Find matches (${data.pending})`}</span>
              </button>
            )}
            {data.unmatched > 0 && !data.running && (
              <button
                onClick={() => handleRun(true)}
                disabled={run.isPending || data.searchMode === 'none'}
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
              <span>Searching YouTube...</span>
              <span>{data.runProcessed} / {data.runTotal}</span>
            </div>
            <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden border border-bg-border/60">
              <div
                className="bg-accent-green h-full rounded-full transition-all duration-500"
                style={{ width: `${runPercent}%` }}
              />
            </div>
          </div>
        )}

        {data.runError && (
          <div className="p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary flex gap-2">
            <AlertCircle size={14} className="text-accent-yellow shrink-0 mt-0.5" />
            <span>{data.runError} Tracks already searched are saved, so you can continue later.</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-bg-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setFilter(t.id)
              setVisibleCount(PAGE_SIZE)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === t.id
                ? 'bg-brand/15 text-brand-light border border-brand/30'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Tracks */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-xs text-text-muted text-center py-8">Nothing in this view.</p>
        )}

        {filtered.slice(0, visibleCount).map((track) => (
          <TrackCard
            key={track.playlistTrackId}
            track={track}
            busy={select.isPending || skip.isPending || rematch.isPending || manual.isPending}
            onSelect={(matchId) =>
              select.mutate(matchId, { onError: onError('Could not select that match') })
            }
            onSkip={() =>
              skip.mutate(track.playlistTrackId, {
                onSuccess: () => toast.success('Track will be skipped in the transfer'),
                onError: onError('Could not skip this track'),
              })
            }
            onManual={(url, done) =>
              manual.mutate({ playlistTrackId: track.playlistTrackId, url, preference: activePref }, {
                onSuccess: () => {
                  toast.success('Using that video')
                  done()
                },
                onError: onError('Could not use that link'),
              })
            }
            onRematch={() =>
              rematch.mutate({ playlistTrackId: track.playlistTrackId, preference: activePref }, {
                onSuccess: () => toast.success('Searched again'),
                onError: onError('Could not search again'),
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
    </div>
  )
}

// ───────────────────────── one track ─────────────────────────

interface TrackCardProps {
  track: TrackMatch
  busy: boolean
  onSelect: (matchId: number) => void
  onSkip: () => void
  onRematch: () => void
  onManual: (url: string, done: () => void) => void
}

function TrackCard({ track, busy, onSelect, onSkip, onRematch, onManual }: TrackCardProps) {
  const [showOthers, setShowOthers] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [link, setLink] = useState('')

  const selected = track.candidates.find((c) => c.selected)
  const shown = selected ?? track.candidates[0]          // best suggestion, even if below the review threshold
  const others = track.candidates.filter((c) => c !== shown)

  const badge =
    track.status === 'CONFIRMED' ? <StatusBadge status="matched" label="Confirmed" />
    : track.status === 'REVIEW' ? <StatusBadge status="warning" label="Needs review" />
    : track.status === 'UNMATCHED' ? <StatusBadge status="unmatched" label="No good match" />
    : <StatusBadge status="pending" label="Not searched" />

  return (
    <div className="card p-5 space-y-4 hover:border-bg-border/90 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border/60 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-text-muted w-8 shrink-0">#{track.position}</span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-text-muted truncate">
              {track.artist ?? 'Unknown artist'}
              {track.album ? ` \u2022 ${track.album}` : ''} ({formatDuration(track.durationMs)})
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
            <div className="w-8 h-8 rounded-lg bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <span className="truncate">{shown.title ?? shown.videoId}</span>
                <span className="badge bg-bg-border/60 text-text-muted text-[10px] shrink-0">{KIND_LABEL[shown.kind]}</span>
                <a
                  href={`https://www.youtube.com/watch?v=${shown.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on YouTube"
                  className="text-text-muted hover:text-white shrink-0"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="text-[11px] text-text-muted truncate">
                Channel: {shown.channel ?? '-'} &bull; Duration: {formatDuration(shown.durationMs)}
                {shown.method === 'cache' ? ' \u2022 reused from an earlier match' : ''}
                {shown.method === 'manual' ? ' \u2022 picked by you' : ''}
              </div>
              <div className="text-[11px] text-text-muted/80 truncate" title={shown.explanation}>{shown.explanation}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {track.status === 'CONFIRMED' ? (
              <span className="badge bg-accent-green/20 text-accent-green text-[11px] flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Confirmed</span>
              </span>
            ) : (
              <button onClick={() => onSelect(shown.matchId)} disabled={busy} className="btn-primary text-xs py-1 px-3">
                {track.status === 'UNMATCHED' ? 'Use this anyway' : 'Confirm Candidate'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">
          {track.status === 'PENDING'
            ? 'Not searched yet.'
            : 'YouTube returned no results for this track.'}
        </p>
      )}

      {(others.length > 0 || track.status !== 'PENDING') && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button onClick={() => setShowLink((v) => !v)} className="btn-ghost text-[11px] px-2 py-1 flex items-center gap-1">
            <ExternalLink size={12} />
            <span>Paste a YouTube link</span>
          </button>
          {others.length > 0 && (
            <button onClick={() => setShowOthers((v) => !v)} className="btn-ghost text-[11px] px-2 py-1 flex items-center gap-1">
              {showOthers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{others.length} other candidate{others.length === 1 ? '' : 's'}</span>
            </button>
          )}
          {track.status !== 'PENDING' && (
            <>
              <button onClick={onRematch} disabled={busy} className="btn-ghost text-[11px] px-2 py-1 flex items-center gap-1" title="Search again (about 101 quota units)">
                <RefreshCw size={12} />
                <span>Search again</span>
              </button>
              {(track.status === 'CONFIRMED' || track.status === 'REVIEW') && (
                <button onClick={onSkip} disabled={busy} className="btn-ghost text-[11px] px-2 py-1 flex items-center gap-1 text-accent-red">
                  <SkipForward size={12} />
                  <span>Skip this track</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {showLink && (
        <div className="flex flex-col sm:flex-row gap-2 rounded-lg border border-bg-border/60 p-3">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input-field text-xs flex-1"
          />
          <button
            onClick={() => onManual(link.trim(), () => { setLink(''); setShowLink(false) })}
            disabled={busy || link.trim().length === 0}
            className="btn-primary text-xs px-4 py-2 shrink-0"
          >
            Use this video
          </button>
        </div>
      )}

      {showOthers && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {others.map((c) => (
            <div key={c.matchId} className="flex items-center justify-between gap-3 rounded-lg border border-bg-border/60 p-3 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-text-primary truncate">{c.title ?? c.videoId}</div>
                <div className="text-[11px] text-text-muted truncate">
                  {KIND_LABEL[c.kind]} &bull; {c.channel ?? '-'} &bull; {formatDuration(c.durationMs)} &bull; {Math.round(c.confidence)}%
                </div>
                <div className="text-[11px] text-text-muted/80 truncate" title={c.explanation}>{c.explanation}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.youtube.com/watch?v=${c.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-white"
                  title="Open on YouTube"
                >
                  <ExternalLink size={12} />
                </a>
                <button onClick={() => onSelect(c.matchId)} disabled={busy} className="btn-secondary text-[11px] px-3 py-1">
                  Use this
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
