import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Grid, List, Music, UploadCloud } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlaylistCard from '../components/PlaylistCard'
import EmptyState from '../components/EmptyState'
import { usePlaylists, Playlist } from '../hooks/usePlaylists'

export default function PlaylistsPage() {
  const navigate = useNavigate()
  const { data: playlists, isLoading } = usePlaylists()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const defaultPlaylists: Playlist[] = [
    {
      id: 101,
      name: 'Synthwave & Cyberpunk Vibes',
      description: 'Retrofuturistic synthwave, darksynth and chill out electronic jams.',
      coverUrl: null,
      source: 'spotify',
      trackCount: 42,
      duration: '2h 15m',
      isPublic: true,
      isFavorite: true,
      createdAt: '2026-03-01',
      updatedAt: '2026-03-01',
    },
    {
      id: 102,
      name: 'Acoustic Morning Coffee',
      description: 'Gentle acoustic guitar melodies, soft folk vocals and calm mornings.',
      coverUrl: null,
      source: 'spotify',
      trackCount: 28,
      duration: '1h 32m',
      isPublic: false,
      isFavorite: false,
      createdAt: '2026-03-02',
      updatedAt: '2026-03-02',
    },
    {
      id: 103,
      name: 'Late Night Coding Sessions',
      description: 'Ambient techno and minimal beats for deep focused engineering work.',
      coverUrl: null,
      source: 'youtube',
      trackCount: 65,
      duration: '3h 48m',
      isPublic: true,
      isFavorite: true,
      createdAt: '2026-03-03',
      updatedAt: '2026-03-03',
    },
    {
      id: 104,
      name: 'Gym Workout High Energy',
      description: 'Hard electro, phonk, and upbeat bass for intensive cardio.',
      coverUrl: null,
      source: 'spotify',
      trackCount: 50,
      duration: '2h 45m',
      isPublic: false,
      isFavorite: false,
      createdAt: '2026-03-04',
      updatedAt: '2026-03-04',
    },
  ]

  const displayList = playlists && playlists.length > 0 ? playlists : defaultPlaylists
  const filtered = displayList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Playlists"
        description="Organize, inspect track listings, and transfer your multi-platform playlists."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/import')}
              className="btn-primary text-xs"
            >
              <UploadCloud size={14} />
              <span>Import Playlist</span>
            </button>
          </div>
        }
      />

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border text-text-secondary ${
              viewMode === 'grid' ? 'bg-bg-elevated border-accent-purple text-white' : 'border-bg-border'
            }`}
            title="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border text-text-secondary ${
              viewMode === 'list' ? 'bg-bg-elevated border-accent-purple text-white' : 'border-bg-border'
            }`}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Playlist Grid / List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Music size={32} />}
          title="No playlists found"
          description="Try a different search term or import your first Spotify playlist."
          action={
            <button
              onClick={() => navigate('/app/import')}
              className="btn-primary text-xs"
            >
              Import Playlist
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((playlist) => (
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
      )}
    </div>
  )
}
