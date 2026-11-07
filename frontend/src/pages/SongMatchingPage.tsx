import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ConfidenceBar from '../components/ConfidenceBar'
import toast from 'react-hot-toast'

export default function SongMatchingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [matches, setMatches] = useState([
    {
      id: 1,
      sourceTitle: 'Midnight City',
      sourceArtist: 'M83',
      sourceAlbum: 'Hurry Up, We\'re Dreaming',
      sourceDuration: '4:03',
      isrc: 'FR01A1100650',
      matchedVideoTitle: 'M83 - Midnight City (Official Video)',
      matchedChannel: 'M83',
      matchedDuration: '4:04',
      confidence: 98,
      status: 'approved' as const,
    },
    {
      id: 2,
      sourceTitle: 'Starboy',
      sourceArtist: 'The Weeknd, Daft Punk',
      sourceAlbum: 'Starboy',
      sourceDuration: '3:50',
      isrc: 'USUG11601728',
      matchedVideoTitle: 'The Weeknd - Starboy ft. Daft Punk (Official Music Video)',
      matchedChannel: 'TheWeekndVEVO',
      matchedDuration: '3:51',
      confidence: 96,
      status: 'approved' as const,
    },
    {
      id: 3,
      sourceTitle: 'Resonance',
      sourceArtist: 'HOME',
      sourceAlbum: 'Odyssey',
      sourceDuration: '3:32',
      isrc: 'QZDA61448651',
      matchedVideoTitle: 'HOME - Resonance',
      matchedChannel: 'Electronic Gems',
      matchedDuration: '3:32',
      confidence: 93,
      status: 'approved' as const,
    },
    {
      id: 4,
      sourceTitle: 'Nightcall',
      sourceArtist: 'Kavinsky',
      sourceAlbum: 'OutRun',
      sourceDuration: '4:19',
      isrc: 'FR01A1000850',
      matchedVideoTitle: 'Kavinsky - Nightcall (Drive Original Soundtrack)',
      matchedChannel: 'Record Makers',
      matchedDuration: '4:20',
      confidence: 84,
      status: 'review' as const,
    },
  ])

  const handleApprove = (matchId: number) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'approved' } : m))
    )
    toast.success('Match confirmed')
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="Deterministic Song Matching Engine"
        description="Inspect metadata ranking between Spotify sources and YouTube video candidates."
        breadcrumb="Song Identification"
        actions={
          <button
            onClick={() => navigate(`/app/transfer/${id}`)}
            className="btn-primary text-xs flex items-center gap-1.5 shadow-lg shadow-accent-purple/20"
          >
            <span>Proceed to Transfer</span>
            <ArrowRight size={14} />
          </button>
        }
      />

      {/* Matching Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">Total Tracks Analyzed</div>
          <div className="text-2xl font-bold text-white">4 Tracks</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">High Confidence (&ge;85%)</div>
          <div className="text-2xl font-bold text-accent-green">3 (75%)</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-1">Requires Review (&lt;85%)</div>
          <div className="text-2xl font-bold text-accent-yellow">1 (25%)</div>
        </div>
      </div>

      {/* Match Candidates List */}
      <div className="space-y-4">
        {matches.map((item) => (
          <div key={item.id} className="card p-5 space-y-4 hover:border-bg-border/90 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border/60 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-text-muted w-6">#{item.id}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.sourceTitle}</h4>
                  <p className="text-xs text-text-muted">
                    {item.sourceArtist} &bull; {item.sourceAlbum} ({item.sourceDuration})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ConfidenceBar score={item.confidence} />
              </div>
            </div>

            {/* Candidate Box */}
            <div className="bg-bg-elevated/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-bg-border/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <span>{item.matchedVideoTitle}</span>
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Channel: {item.matchedChannel} &bull; Duration: {item.matchedDuration} &bull; ISRC: {item.isrc}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {item.status === 'approved' ? (
                  <span className="badge bg-accent-green/20 text-accent-green text-[11px] flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Confirmed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="btn-primary text-xs py-1 px-3"
                  >
                    Confirm Candidate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
