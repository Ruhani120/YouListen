import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, ArrowRight, AlertCircle, ExternalLink, RotateCcw, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'
import {
  isActive,
  TransferStatus,
  useCancelTransfer,
  useResumeTransfer,
  useTransfer,
  useTransferTracks,
} from '../hooks/useTransfers'
import { getApiError } from '../hooks/useSpotify'

type StepState = 'done' | 'in_progress' | 'pending' | 'stopped'

export default function TransferProgressPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)
  const navigate = useNavigate()

  const { data: job, error } = useTransfer(id)
  const running = isActive(job?.status)
  const { data: tracks } = useTransferTracks(id, running)
  const cancel = useCancelTransfer()
  const resume = useResumeTransfer()
  const [showTracks, setShowTracks] = useState(false)

  // Toast once when the job finishes while this page is open
  const previous = useRef<TransferStatus | undefined>(undefined)
  useEffect(() => {
    if (!job) return
    if (isActive(previous.current) && job.status === 'COMPLETED') {
      toast.success('Playlist transfer completed successfully!')
    }
    previous.current = job.status
  }, [job])

  if (error) {
    return (
      <div className="max-w-2xl mx-auto card flex gap-3 text-sm text-text-secondary">
        <AlertCircle size={18} className="text-accent-red shrink-0 mt-0.5" />
        <span>{getApiError(error, 'Could not load this transfer').message}</span>
      </div>
    )
  }
  if (!job) {
    return <div className="max-w-2xl mx-auto h-40 rounded-xl bg-bg-elevated animate-pulse-soft" />
  }

  const finished = job.status === 'COMPLETED'
  const stopped = job.status === 'FAILED' || job.status === 'CANCELLED'
  const attempted = job.transferredTracks + job.failedTracks
  const remaining = Math.max(0, job.readyTracks - attempted)
  const canResume = job.status === 'FAILED' && remaining > 0

  const addState: StepState = finished ? 'done' : running ? (job.destinationPlaylistId ? 'in_progress' : 'pending') : attempted >= job.readyTracks ? 'done' : 'stopped'
  const steps: { title: string; state: StepState; detail: string }[] = [
    { title: 'Queued', state: 'done', detail: `${job.readyTracks} tracks to send` },
    {
      title: job.destinationPlatform === 'spotify' ? 'Spotify playlist created' : 'YouTube playlist created',
      state: job.destinationPlaylistId ? 'done' : running ? 'in_progress' : 'stopped',
      detail: job.destinationPlaylistName ?? 'Waiting for YouTube',
    },
    {
      title: 'Adding tracks in order',
      state: addState,
      detail:
        `${job.transferredTracks} of ${job.readyTracks} added` + (job.failedTracks > 0 ? ` \u2022 ${job.failedTracks} failed` : ''),
    },
    {
      title: 'Finish',
      state: finished ? 'done' : stopped ? 'stopped' : 'pending',
      detail: finished ? 'Saved to transfer history' : stopped ? 'Stopped before finishing' : 'Waiting for all tracks',
    },
  ]

  const heading = finished
    ? 'Transfer Complete!'
    : job.status === 'FAILED' ? 'Transfer Paused'
    : job.status === 'CANCELLED' ? 'Transfer Cancelled'
    : `${job.progressPercent}% Migrated`

  const subheading = finished
    ? `${job.transferredTracks} tracks were added to your ${job.destinationPlatform === 'spotify' ? 'Spotify' : 'YouTube'} library.`
    : job.status === 'FAILED' ? 'Progress so far is saved.'
    : job.status === 'CANCELLED' ? 'Tracks already added stay in the YouTube playlist.'
    : 'Adding tracks one by one.'

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Transfer in Progress"
        description={`Job #${job.id} \u2022 ${job.playlistName}`}
        actions={<StatusBadge status={job.status.toLowerCase() as 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'pending'} />}
      />

      <div className="card text-center py-8 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/15 text-brand-light border border-brand/30 mb-2">
            {finished ? (
              <CheckCircle2 size={36} className="text-accent-green" />
            ) : stopped ? (
              <AlertCircle size={36} className="text-accent-yellow" />
            ) : (
              <Loader2 size={36} className="animate-spin text-brand-light" />
            )}
          </div>
          <h2 className="text-2xl font-black text-white">{heading}</h2>
          <p className="text-xs text-text-secondary">{subheading}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-bg-elevated h-2.5 rounded-full overflow-hidden border border-bg-border/60">
          <div
            className="bg-accent-green h-full rounded-full transition-all duration-700"
            style={{ width: `${job.progressPercent}%` }}
          />
        </div>

        {/* Counters */}
        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          <div><div className="text-lg font-bold text-accent-green">{job.transferredTracks}</div><div className="text-text-muted">Added</div></div>
          <div><div className="text-lg font-bold text-accent-red">{job.failedTracks}</div><div className="text-text-muted">Failed</div></div>
          <div><div className="text-lg font-bold text-text-primary">{remaining}</div><div className="text-text-muted">Waiting</div></div>
          <div><div className="text-lg font-bold text-text-muted">{job.skippedTracks}</div><div className="text-text-muted">Skipped</div></div>
        </div>

        {job.errorMessage && (
          <div className="mx-2 p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary text-left flex gap-2">
            <AlertCircle size={14} className="text-accent-yellow shrink-0 mt-0.5" />
            <span>{job.errorMessage}</span>
          </div>
        )}

        {/* Pipeline Steps */}
        <div className="text-left space-y-3 pt-4 border-t border-bg-border">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5">
                {s.state === 'done' ? (
                  <CheckCircle2 size={16} className="text-accent-green" />
                ) : s.state === 'in_progress' ? (
                  <Loader2 size={16} className="animate-spin text-brand-light" />
                ) : s.state === 'stopped' ? (
                  <XCircle size={16} className="text-accent-yellow" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-bg-border" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${s.state === 'pending' ? 'text-text-muted' : 'text-text-primary'}`}>{s.title}</div>
                <div className="text-[11px] text-text-muted">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-bg-border space-y-3">
          {job.destinationUrl && (
            <a
              href={job.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs w-full justify-center py-2.5 flex items-center gap-2"
            >
              <ExternalLink size={14} />
              <span>{job.destinationPlatform === 'spotify' ? 'Open playlist in Spotify' : 'Open playlist in YouTube Music'}</span>
            </a>
          )}

          {running && (
            <button
              onClick={() =>
                cancel.mutate(job.id, {
                  onSuccess: () => toast.success('Transfer cancelled'),
                  onError: (err) => toast.error(getApiError(err, 'Could not cancel').message),
                })
              }
              disabled={cancel.isPending}
              className="btn-ghost text-xs w-full justify-center py-2.5 text-accent-red"
            >
              Cancel transfer
            </button>
          )}

          {canResume && (
            <button
              onClick={() =>
                resume.mutate(job.id, {
                  onSuccess: () => toast.success('Resuming transfer'),
                  onError: (err) => toast.error(getApiError(err, 'Could not resume').message, { duration: 7000 }),
                })
              }
              disabled={resume.isPending}
              className="btn-primary text-xs w-full justify-center py-2.5 flex items-center gap-2"
            >
              <RotateCcw size={14} />
              <span>Resume ({remaining} tracks left)</span>
            </button>
          )}

          {!running && (
            <button
              onClick={() => navigate('/app/transfers')}
              className="btn-primary text-xs w-full justify-center py-2.5 flex items-center gap-2"
            >
              <span>View transfer history</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Per-track detail */}
      {tracks && tracks.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <button
            onClick={() => setShowTracks((v) => !v)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-bg-elevated/40"
          >
            <span>Track details ({tracks.length})</span>
            {showTracks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showTracks && (
            <div className="max-h-96 overflow-y-auto divide-y divide-bg-border border-t border-bg-border">
              {tracks.map((t) => (
                <div key={t.id} className="px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary truncate">{t.position}. {t.title}</div>
                    <div className="text-[11px] text-text-muted truncate">
                      {t.artist ?? 'Unknown artist'}
                      {t.errorMessage ? ` \u2022 ${t.errorMessage}` : ''}
                    </div>
                  </div>
                  <StatusBadge
                    status={
                      t.status === 'TRANSFERRED' ? 'completed'
                      : t.status === 'FAILED' ? 'failed'
                      : t.status === 'SKIPPED' ? 'skipped'
                      : 'pending'
                    }
                    label={t.status === 'MATCHED' ? 'Waiting' : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
