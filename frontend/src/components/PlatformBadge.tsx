type Platform = 'spotify' | 'youtube' | 'apple_music' | 'deezer' | 'tidal'

interface PlatformBadgeProps {
  platform: Platform
  size?: 'sm' | 'md'
}

const platformConfig: Record<Platform, { label: string; className: string; dot: string }> = {
  spotify: { label: 'Spotify', className: 'bg-accent-green/20 text-accent-green', dot: 'bg-accent-green' },
  youtube: { label: 'YouTube', className: 'bg-accent-red/20 text-accent-red', dot: 'bg-accent-red' },
  apple_music: { label: 'Apple Music', className: 'bg-pink-500/20 text-pink-400', dot: 'bg-pink-400' },
  deezer: { label: 'Deezer', className: 'bg-accent-purple/20 text-accent-purple-light', dot: 'bg-accent-purple-light' },
  tidal: { label: 'Tidal', className: 'bg-cyan-500/20 text-cyan-400', dot: 'bg-cyan-400' },
}

export default function PlatformBadge({ platform, size = 'md' }: PlatformBadgeProps) {
  const config = platformConfig[platform]
  return (
    <span className={`badge ${config.className} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {size === 'md' ? config.label : config.label.split(' ')[0]}
    </span>
  )
}
