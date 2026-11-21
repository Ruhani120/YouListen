import { useNavigate } from 'react-router-dom'
import { Music, ArrowRightLeft, CheckCircle, Radio, UploadCloud } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import PlaylistCard from '../components/PlaylistCard'
import StatusBadge from '../components/StatusBadge'
import PlatformBadge from '../components/PlatformBadge'
import { usePlaylists } from '../hooks/usePlaylists'
import { useTransfers } from '../hooks/useTransfers'
import { useGoogleStatus } from '../hooks/useGoogle'
import { useSpotifyStatus } from '../hooks/useSpotify'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: playlists } = usePlaylists()
  const { data: transfers } = useTransfers()
  const { data: google } = useGoogleStatus()
  const { data: spotify } = useSpotifyStatus()

  const allTransfers = transfers ?? []
  const tracksTransferred = allTransfers.reduce((sum, t) => sum + t.transferredTracks, 0)
  const completed = allTransfers.filter((t) => t.status === 'COMPLETED').length
  const connectedCount = (spotify?.connected ? 1 : 0) + (google?.connected ? 1 : 0)
  const recentPlaylists = (playlists ?? []).slice(0, 3)
  const recentTransfers = allTransfers.slice(0, 3)

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Hi, ${user?.displayName || user?.username || 'there'}`}
        actions={
          <button onClick={() => navigate('/app/import')} className="btn-primary">
            <UploadCloud size={16} />
            <span>Import Playlist</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Playlists" value={playlists?.length ?? 0} icon={<Music size={20} />} iconColor="text-brand-light" />
        <StatCard title="Tracks transferred" value={tracksTransferred} icon={<ArrowRightLeft size={20} />} iconColor="text-accent-green" />
        <StatCard title="Transfers completed" value={completed} icon={<CheckCircle size={20} />} iconColor="text-accent-green" />
        <StatCard title="Platforms connected" value={`${connectedCount} / 2`} icon={<Radio size={20} />} iconColor="text-brand-light" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Recent playlists</h2>
            {recentPlaylists.length > 0 && (
              <button onClick={() => navigate('/app/playlists')} className="text-xs text-brand-light hover:underline">
                View all ({playlists?.length ?? 0})
              </button>
            )}
          </div>

          {recentPlaylists.length === 0 ? (
            <div className="card text-center py-10 space-y-3">
              <p className="text-sm text-text-secondary">No playlists yet.</p>
              <button onClick={() => navigate('/app/import')} className="btn-primary text-xs px-4 py-2 mx-auto">
                Import your first playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentPlaylists.map((p) => (
                <PlaylistCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  trackCount={p.trackCount}
                  duration={p.duration || ''}
                  source={p.source}
                  coverUrl={p.coverUrl ?? undefined}
                  isFavorite={p.isFavorite}
                  onClick={() => navigate(`/app/playlists/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Recent transfers</h2>
            {recentTransfers.length > 0 && (
              <button onClick={() => navigate('/app/transfers')} className="text-xs text-brand-light hover:underline">
                History
              </button>
            )}
          </div>

          {recentTransfers.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-text-secondary">No transfers yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransfers.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/app/transfer/${t.id}/progress`)}
                  className="card p-4 hover:border-bg-border/90 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary truncate">{t.playlistName}</span>
                    <StatusBadge status={t.status.toLowerCase() as 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'pending'} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <PlatformBadge platform={t.destinationPlatform === 'spotify' ? 'spotify' : 'youtube'} size="sm" />
                    <span>{t.transferredTracks}/{t.readyTracks} tracks</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card p-4 space-y-2">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Platforms</div>
            {[
              { name: 'Spotify', on: !!spotify?.connected },
              { name: 'YouTube', on: !!google?.connected },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between py-1 text-xs">
                <div className="flex items-center gap-2 text-text-primary">
                  <span className={`w-2 h-2 rounded-full ${p.on ? 'bg-accent-green' : 'bg-text-muted'}`} />
                  <span>{p.name}</span>
                </div>
                <span className={p.on ? 'text-accent-green' : 'text-text-muted'}>{p.on ? 'Connected' : 'Not connected'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
