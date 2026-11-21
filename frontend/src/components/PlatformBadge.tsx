type Platform = 'spotify' | 'youtube' | 'apple_music' | 'deezer' | 'tidal'

interface PlatformBadgeProps {
  platform: Platform
  size?: 'sm' | 'md'
}

const platformConfig: Record<Platform, { label: string; className: string; dot: string }> = {
  spotify: { label: 'Spotify', className: 'bg-accent-green/20 text-accent-green', dot: 'bg-accent-green' },
  youtube: { label: 'YouTube', className: 'bg-accent-red/20 text-accent-red', dot: 'bg-accent-red' },
  apple_music: { label: 'Apple Music', className: 'bg-zinc-500/20 text-zinc-300', dot: 'bg-zinc-400' },
  deezer: { label: 'Deezer', className: 'bg-zinc-500/20 text-zinc-300', dot: 'bg-zinc-400' },
  tidal: { label: 'Tidal', className: 'bg-zinc-500/20 text-zinc-300', dot: 'bg-zinc-400' },
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
