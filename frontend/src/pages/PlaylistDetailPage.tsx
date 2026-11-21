import { useParams, useNavigate } from 'react-router-dom'
import { Music, ArrowRightLeft, Edit3, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlatformBadge from '../components/PlatformBadge'
import EmptyState from '../components/EmptyState'
import { usePlaylist } from '../hooks/usePlaylists'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: playlist, isLoading } = usePlaylist(Number(id))

  if (isLoading) {
    return <div className="text-sm text-text-muted">Loading playlist...</div>
  }

  if (!playlist) {
    return (
      <EmptyState
        icon={<Music size={32} />}
        title="Playlist not found"
        description="It may have been deleted."
        action={
          <button onClick={() => navigate('/app/playlists')} className="btn-primary text-xs">
            Back to My Playlists
          </button>
        }
      />
    )
  }

  const sourceLabel = playlist.source === 'youtube' ? 'YouTube' : 'Spotify'

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title={playlist.name}
        description={`Imported from ${sourceLabel} • ${playlist.trackCount} tracks${
          playlist.duration ? ` • ${playlist.duration}` : ''
        }`}
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
              className="btn-secondary text-xs flex items-center gap-1.5 text-brand-light"
            >
              <Sparkles size={14} />
              <span>Review Matches</span>
            </button>
            <button
              onClick={() => navigate(`/app/playlists/${id}/to-spotify`)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowRightLeft size={14} />
              <span>Transfer to Spotify</span>
            </button>
            <button
              onClick={() => navigate(`/app/transfer/${id}`)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <ArrowRightLeft size={14} />
              <span>Transfer to YouTube</span>
            </button>
          </div>
        }
      />

      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center text-white">
          <Music size={32} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <PlatformBadge platform={playlist.source} size="sm" />
          </div>
          <h2 className="text-xl font-bold text-white">{playlist.name}</h2>
          {playlist.description && (
            <p className="text-xs text-text-muted mt-1 max-w-md">{playlist.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}