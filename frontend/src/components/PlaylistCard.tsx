import { Star, Music, Clock } from 'lucide-react'
import PlatformBadge from './PlatformBadge'

interface PlaylistCardProps {
  id: number
  name: string
  trackCount: number
  duration?: string
  source: 'spotify' | 'youtube' | 'apple_music' | 'deezer' | 'tidal'
  coverUrl?: string
  isFavorite?: boolean
  onClick?: () => void
  onFavoriteToggle?: () => void
}

const gradients = [
  'from-purple-600 to-pink-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600',
  'from-orange-600 to-red-600',
  'from-indigo-600 to-purple-600',
  'from-rose-600 to-orange-600',
]

export default function PlaylistCard({
  id, name, trackCount, duration, source, coverUrl, isFavorite = false, onClick, onFavoriteToggle
}: PlaylistCardProps) {
  const gradient = gradients[id % gradients.length]

  return (
    <div
      onClick={onClick}
      className="bg-bg-secondary border border-bg-border rounded-xl overflow-hidden hover:border-accent-purple/50 transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-purple/10 group"
    >
      <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {coverUrl ? (
          <img src={coverUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Music size={36} className="text-white/60" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.() }}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
            isFavorite ? 'text-accent-yellow bg-black/40' : 'text-white/40 hover:text-white bg-black/20 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-4">
        <div className="font-semibold text-text-primary text-sm mb-1 truncate">{name}</div>
        <div className="flex items-center justify-between mt-2">
          <PlatformBadge platform={source} size="sm" />
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <span className="flex items-center gap-1"><Music size={10} />{trackCount}</span>
            {duration && <span className="flex items-center gap-1"><Clock size={10} />{duration}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
