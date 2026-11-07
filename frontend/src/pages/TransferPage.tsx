import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRightLeft,
  ArrowRight,
  Radio,
  CheckCircle2,
  Lock,
  Globe,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlatformBadge from '../components/PlatformBadge'
import toast from 'react-hot-toast'

export default function TransferPage() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()

  const [destinationTitle, setDestinationTitle] = useState('Synthwave & Cyberpunk Vibes (Transferred)')
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false)

  const handleStartTransfer = () => {
    toast.success('Transfer job created! Initializing SQS worker pipeline.')
    navigate(`/app/transfer/job-9021/progress`)
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Configure YouTube Transfer"
        description="Set destination playlist options and launch background migration."
        breadcrumb="Migration Pipeline"
        actions={
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        }
      />

      <div className="card space-y-6">
        {/* Source vs Destination visual */}
        <div className="p-4 rounded-xl bg-bg-elevated border border-bg-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlatformBadge platform="spotify" size="md" />
            <div>
              <div className="text-xs text-text-muted">Source</div>
              <div className="text-sm font-bold text-white">Spotify Playlist</div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-accent-purple/20 text-accent-purple-light flex items-center justify-center">
            <ArrowRightLeft size={16} />
          </div>

          <div className="flex items-center gap-3">
            <PlatformBadge platform="youtube" size="md" />
            <div>
              <div className="text-xs text-text-muted">Destination</div>
              <div className="text-sm font-bold text-white">YouTube Data API v3</div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Destination Playlist Title
            </label>
            <input
              type="text"
              value={destinationTitle}
              onChange={(e) => setDestinationTitle(e.target.value)}
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
                    onClick={() => setPrivacy(opt.id as any)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      privacy === opt.id
                        ? 'bg-accent-purple/15 border-accent-purple text-white'
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

          <div className="flex items-center justify-between py-3 border-t border-bg-border">
            <div>
              <div className="text-xs font-semibold text-text-primary">
                Only Transfer High-Confidence Matches (&ge;85%)
              </div>
              <div className="text-[11px] text-text-muted">
                Skip lower-confidence tracks to ensure exact studio audio matches.
              </div>
            </div>
            <input
              type="checkbox"
              checked={highConfidenceOnly}
              onChange={(e) => setHighConfidenceOnly(e.target.checked)}
              className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-bg-border flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleStartTransfer}
            className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-accent-purple/25"
          >
            <span>Launch YouTube Transfer</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
