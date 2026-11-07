import { useParams, useNavigate } from 'react-router-dom'
import {
  Music,
  ArrowRightLeft,
  Edit3,
  Trash2,
  Share2,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlatformBadge from '../components/PlatformBadge'
import TrackRow from '../components/TrackRow'
import toast from 'react-hot-toast'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const sampleTracks = [
    { id: 1, position: 1, title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: '4:03', durationMs: 243000, matchStatus: 'matched' as const, confidence: 98 },
    { id: 2, position: 2, title: 'Starboy', artist: 'The Weeknd, Daft Punk', album: 'Starboy', duration: '3:50', durationMs: 230000, matchStatus: 'matched' as const, confidence: 95 },
    { id: 3, position: 3, title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: '3:32', durationMs: 212000, matchStatus: 'matched' as const, confidence: 92 },
    { id: 4, position: 4, title: 'Instant Crush', artist: 'Daft Punk, Julian Casablancas', album: 'Random Access Memories', duration: '5:37', durationMs: 337000, matchStatus: 'matched' as const, confidence: 96 },
    { id: 5, position: 5, title: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', duration: '4:19', durationMs: 259000, matchStatus: 'warning' as const, confidence: 78 },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Synthwave & Cyberpunk Vibes"
        description="Imported from Spotify &bull; 42 Tracks &bull; 2h 15m duration"
        breadcrumb="My Playlists"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/app/playlists/${id}/edit`)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Edit3 size={14} />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => navigate(`/app/playlists/${id}/match`)}
              className="btn-secondary text-xs flex items-center gap-1.5 text-accent-purple-light"
            >
              <Sparkles size={14} />
              <span>Review Matches</span>
            </button>
            <button
              onClick={() => navigate(`/app/transfer/${id}`)}
              className="btn-primary text-xs flex items-center gap-1.5 shadow-lg shadow-accent-purple/20"
            >
              <ArrowRightLeft size={14} />
              <span>Transfer to YouTube</span>
            </button>
          </div>
        }
      />

      {/* Hero Overview */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-bg-secondary via-bg-elevated/40 to-bg-secondary border-bg-border/80">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent-purple to-pink-600 flex items-center justify-center text-white shadow-xl">
            <Music size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <PlatformBadge platform="spotify" size="sm" />
              <span className="text-xs text-accent-green bg-accent-green/10 px-2 py-0.5 rounded">
                Verified Spotify Import
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Synthwave & Cyberpunk Vibes</h2>
            <p className="text-xs text-text-muted mt-1 max-w-md">
              Imported via CSV. Contains verified ISRC codes and complete track metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-bg-border pt-4 md:pt-0 md:pl-6 text-xs">
          <div>
            <span className="text-text-muted block">Match Health</span>
            <span className="text-accent-green font-bold text-sm">96% High Conf</span>
          </div>
          <div>
            <span className="text-text-muted block">Estimated Sync</span>
            <span className="text-white font-bold text-sm">~45 seconds</span>
          </div>
        </div>
      </div>

      {/* Track Listing */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Tracklist ({sampleTracks.length} items)</h3>
          <span className="text-xs text-text-muted">Preserving track sequence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-bg-border">
              {sampleTracks.map((track) => (
                <TrackRow
                  key={track.id}
                  position={track.position}
                  title={track.title}
                  artist={track.artist}
                  album={track.album}
                  duration={track.duration}
                  matchStatus={track.matchStatus}
                  confidence={track.confidence}
                  onClick={() => navigate(`/app/playlists/${id}/match`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
