import { useNavigate } from 'react-router-dom'
import {
  Music,
  ArrowRightLeft,
  CheckCircle,
  Radio,
  UploadCloud,
  ExternalLink,
  Plus,
  Play,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import PlaylistCard from '../components/PlaylistCard'
import StatusBadge from '../components/StatusBadge'
import PlatformBadge from '../components/PlatformBadge'
import { usePlaylists } from '../hooks/usePlaylists'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: playlists, isLoading } = usePlaylists()

  const recentTransfers = [
    {
      id: 1,
      sourceName: 'Discover Weekly Archive',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracks: 30,
      matched: 29,
      status: 'completed' as const,
      date: 'Today, 09:20',
    },
    {
      id: 2,
      sourceName: 'Lofi Chill Beats 2026',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracks: 75,
      matched: 74,
      status: 'completed' as const,
      date: 'Yesterday',
    },
    {
      id: 3,
      sourceName: 'Gym Workout High Energy',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracks: 45,
      matched: 42,
      status: 'in_progress' as const,
      date: '2 days ago',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.displayName || user?.username || 'User'}`}
        description="Here is your multi-platform playlist overview and migration pipeline status."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/import')}
              className="btn-primary"
            >
              <UploadCloud size={16} />
              <span>Import Playlist</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Playlists"
          value={playlists?.length ?? 4}
          icon={<Music size={20} />}
          change={12}
          changeLabel="vs last month"
          iconColor="text-accent-purple-light"
        />
        <StatCard
          title="Tracks Transferred"
          value="1,420"
          icon={<ArrowRightLeft size={20} />}
          change={8}
          changeLabel="vs last month"
          iconColor="text-accent-green"
        />
        <StatCard
          title="Match Confidence Rate"
          value="97.4%"
          icon={<CheckCircle size={20} />}
          change={2.1}
          changeLabel="Deterministic metadata"
          iconColor="text-cyan-400"
        />
        <StatCard
          title="Active Platforms"
          value="2 / 5"
          icon={<Radio size={20} />}
          changeLabel="Spotify & YouTube"
          iconColor="text-accent-red"
        />
      </div>

      {/* Main Grid: Recent Playlists & Recent Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Playlists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Recent Playlists</h2>
              <p className="text-xs text-text-muted">Imported and ready for migration</p>
            </div>
            <button
              onClick={() => navigate('/app/playlists')}
              className="text-xs text-accent-purple-light hover:underline flex items-center gap-1"
            >
              View all ({playlists?.length ?? 3})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(playlists && playlists.length > 0
              ? playlists.slice(0, 3)
              : [
                  {
                    id: 101,
                    name: 'Synthwave & Cyberpunk Vibes',
                    trackCount: 42,
                    duration: '2h 15m',
                    source: 'spotify' as const,
                    isFavorite: true,
                  },
                  {
                    id: 102,
                    name: 'Acoustic Morning Coffee',
                    trackCount: 28,
                    duration: '1h 32m',
                    source: 'spotify' as const,
                    isFavorite: false,
                  },
                  {
                    id: 103,
                    name: 'Late Night Coding Sessions',
                    trackCount: 65,
                    duration: '3h 48m',
                    source: 'youtube' as const,
                    isFavorite: true,
                  },
                ]
            ).map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                id={playlist.id}
                name={playlist.name}
                trackCount={playlist.trackCount}
                duration={playlist.duration || '45m'}
                source={playlist.source}
                isFavorite={playlist.isFavorite}
                onClick={() => navigate(`/app/playlists/${playlist.id}`)}
              />
            ))}
          </div>

          {/* Quick Migration Banner */}
          <div className="card bg-gradient-to-r from-accent-purple/20 via-bg-secondary to-bg-elevated border-accent-purple/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple-light">
                <UploadCloud size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Have a Spotify export ready?</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Upload CSV or JSON files to start deterministic matching right away.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/import')}
              className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
            >
              Start New Import
            </button>
          </div>
        </div>

        {/* Right Column (1 col): Recent Transfers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Recent Transfers</h2>
              <p className="text-xs text-text-muted">Background job status</p>
            </div>
            <button
              onClick={() => navigate('/app/transfers')}
              className="text-xs text-accent-purple-light hover:underline"
            >
              History
            </button>
          </div>

          <div className="space-y-3">
            {recentTransfers.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate('/app/transfers')}
                className="card p-4 hover:border-bg-border/90 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    {t.sourceName}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={t.sourcePlatform} size="sm" />
                    <span>&rarr;</span>
                    <PlatformBadge platform={t.destPlatform} size="sm" />
                  </div>
                  <span>{t.matched}/{t.tracks} matched</span>
                </div>
              </div>
            ))}
          </div>

          {/* Connected Platforms Quick Widget */}
          <div className="card p-4 space-y-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Connected Platforms
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-bg-border/60">
                <div className="flex items-center gap-2 text-xs text-text-primary">
                  <span className="w-2 h-2 rounded-full bg-accent-green" />
                  <span>Spotify (File Import)</span>
                </div>
                <span className="text-[11px] text-accent-green bg-accent-green/10 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-bg-border/60">
                <div className="flex items-center gap-2 text-xs text-text-primary">
                  <span className="w-2 h-2 rounded-full bg-accent-red" />
                  <span>YouTube Data API</span>
                </div>
                <span className="text-[11px] text-accent-red bg-accent-red/10 px-2 py-0.5 rounded">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="w-2 h-2 rounded-full bg-text-muted" />
                  <span>Apple / Deezer / Tidal</span>
                </div>
                <span className="text-[11px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded">
                  Phase 4
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
