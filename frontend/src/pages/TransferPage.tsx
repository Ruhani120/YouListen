import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRightLeft,
  ArrowRight,
  Radio,
  CheckCircle2,
  Lock,
  Globe,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlatformBadge from '../components/PlatformBadge'
import GoogleConnectButton from '../components/GoogleConnectButton'
import toast from 'react-hot-toast'
import { usePlaylist } from '../hooks/usePlaylists'
import { useMatchingOverview } from '../hooks/useMatching'
import { useGoogleStatus } from '../hooks/useGoogle'
import { useCreateTransfer } from '../hooks/useTransfers'
import { getApiError } from '../hooks/useSpotify'

type Privacy = 'public' | 'unlisted' | 'private'

export default function TransferPage() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const id = Number(playlistId)
  const navigate = useNavigate()

  const { data: playlist } = usePlaylist(id)
  const { data: matching, isLoading: matchingLoading } = useMatchingOverview(id)
  const { data: google, isLoading: googleLoading } = useGoogleStatus()
  const createTransfer = useCreateTransfer()

  const [destinationTitle, setDestinationTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [privacy, setPrivacy] = useState<Privacy>('private')

  // Prefill the title once the playlist is known (unless the user already typed one)
  useEffect(() => {
    if (playlist?.name && !titleTouched) {
      setDestinationTitle(`${playlist.name} (YouListen)`)
    }
  }, [playlist?.name, titleTouched])

  const ready = matching?.confirmed ?? 0
  const review = matching?.needsReview ?? 0
  const unmatched = matching?.unmatched ?? 0
  const pending = matching?.pending ?? 0
  const quotaUnits = ready * 50 + 50           // playlists.insert + one playlistItems.insert per track
  const googleReady = !!google?.connected

  const blocker =
    !googleReady ? 'Connect your Google account to create the YouTube playlist.'
    : ready === 0 ? 'No confirmed matches yet. Run song matching and confirm some tracks first.'
    : null

  const handleStartTransfer = () => {
    if (!destinationTitle.trim()) {
      toast.error('Give the YouTube playlist a title')
      return
    }
    createTransfer.mutate(
      { playlistId: id, destinationName: destinationTitle.trim(), privacy },
      {
        onSuccess: (job) => {
          toast.success('Transfer started')
          navigate(`/app/transfer/${job.id}/progress`)
        },
        onError: (err) => toast.error(getApiError(err, 'Could not start the transfer').message, { duration: 7000 }),
      }
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Transfer to YouTube"
        description="Choose a title and privacy, then start."
        actions={
          <button onClick={() => navigate(-1)} className="btn-ghost text-xs flex items-center gap-1.5">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        }
      />

      <div className="card space-y-6">
        {/* Source vs Destination visual */}
        <div className="p-4 rounded-xl bg-bg-elevated border border-bg-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PlatformBadge platform={playlist?.source ?? 'spotify'} size="md" />
            <div className="min-w-0">
              <div className="text-xs text-text-muted">Source</div>
              <div className="text-sm font-bold text-white truncate">{playlist?.name ?? 'Playlist'}</div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-brand/20 text-brand-light flex items-center justify-center shrink-0">
            <ArrowRightLeft size={16} />
          </div>

          <div className="flex items-center gap-3">
            <PlatformBadge platform="youtube" size="md" />
            <div>
              <div className="text-xs text-text-muted">Destination</div>
              <div className="text-sm font-bold text-white">
                {googleReady ? google?.channelTitle ?? 'YouTube' : 'YouTube (not connected)'}
              </div>
            </div>
          </div>
        </div>

        {/* What will be transferred */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-accent-green/10 border border-accent-green/30 p-3">
            <div className="text-xl font-bold text-accent-green">{matchingLoading ? '-' : ready}</div>
            <div className="text-[11px] text-text-muted">Will transfer</div>
          </div>
          <div className="rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 p-3">
            <div className="text-xl font-bold text-accent-yellow">{matchingLoading ? '-' : review}</div>
            <div className="text-[11px] text-text-muted">Need review</div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-bg-border p-3">
            <div className="text-xl font-bold text-text-primary">{matchingLoading ? '-' : unmatched + pending}</div>
            <div className="text-[11px] text-text-muted">No match / not searched</div>
          </div>
        </div>

        {(review > 0 || pending > 0 || unmatched > 0) && (
          <div className="text-[11px] text-text-muted flex items-center justify-between gap-3">
            <span>Only confirmed matches are transferred. The rest are skipped.</span>
            <button onClick={() => navigate(`/app/playlists/${id}/match`)} className="btn-ghost text-[11px] px-2 py-1 shrink-0">
              Review matches
            </button>
          </div>
        )}

        {/* Google connection */}
        {!googleLoading && !googleReady && (
          <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-3 text-xs text-text-secondary">
              <AlertCircle size={16} className="text-accent-yellow shrink-0 mt-0.5" />
              <span>Connect the Google account whose YouTube you want the playlist created in.</span>
            </div>
            <GoogleConnectButton />
          </div>
        )}

        {/* Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Destination Playlist Title
            </label>
            <input
              type="text"
              value={destinationTitle}
              maxLength={150}
              onChange={(e) => {
                setTitleTouched(true)
                setDestinationTitle(e.target.value)
              }}
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              YouTube Privacy Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'public', label: 'Public', icon: Globe },
                { id: 'unlisted', label: 'Unlisted', icon: Radio },
                { id: 'private', label: 'Private', icon: Lock },
              ].map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrivacy(opt.id as Privacy)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      privacy === opt.id
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
          </div>

          <div className="py-3 border-t border-bg-border text-[11px] text-text-muted flex items-start gap-2">
            <CheckCircle2 size={14} className="text-accent-green shrink-0 mt-0.5" />
            <span>
              Uses about <span className="text-text-primary font-semibold">{quotaUnits.toLocaleString()}</span> of YouTube&apos;s
              10,000 free daily quota units. If it runs out, progress is saved and you can resume tomorrow.
            </span>
          </div>
        </div>

        {blocker && (
          <div className="text-xs text-accent-yellow flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{blocker}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-bg-border flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-xs">
            Cancel
          </button>

          <button
            onClick={handleStartTransfer}
            disabled={!!blocker || createTransfer.isPending}
            className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
          >
            <span>{createTransfer.isPending ? 'Starting...' : 'Start transfer'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
