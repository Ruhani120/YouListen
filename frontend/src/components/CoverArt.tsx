import { Music } from 'lucide-react'

// Deep, muted gradients in the red and green family
export const RED_COVER: [string, string] = ['#2a0d10', '#d62f33']
export const GREEN_COVER: [string, string] = ['#06210f', '#1fa24f']

// Alternating red and green so neighbouring covers differ
const PALETTES: [string, string][] = [
  ['#2a0d10', '#b3262b'],
  ['#06210f', '#1a7f3c'],
  RED_COVER,
  GREEN_COVER,
  ['#2b0f12', '#8f1f23'],
  ['#0a2616', '#15803d'],
]
const ANGLES = [135, 160, 200, 225]

interface CoverArtProps {
  /** Same seed always gives the same cover */
  seed: string
  /** Shows its first letter when there is no icon */
  name?: string
  showInitial?: boolean
  /** Force a specific gradient instead of picking one from the seed */
  palette?: [string, string]
  /** Pick the gradient by number (e.g. the playlist id) so neighbours alternate red / green */
  variant?: number
  className?: string
}

/** Generated cover for playlists that have no image of their own. */
export default function CoverArt({ seed, name = '', showInitial = true, palette, variant, className = '' }: CoverArtProps) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const [from, to] = palette ?? PALETTES[(variant ?? hash) % PALETTES.length]
  const angle = ANGLES[(hash >>> 3) % ANGLES.length]
  const initial = (name.match(/[A-Za-z0-9]/)?.[0] ?? '').toUpperCase()

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(${angle}deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <circle cx={(hash % 40) + 60} cy={(hash % 30) + 10} r="38" fill="#fff" fillOpacity="0.06" />
        <circle cx={(hash % 30) + 5} cy={(hash % 25) + 70} r="30" fill="#fff" fillOpacity="0.05" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center select-none">
        {showInitial && initial ? (
          <span className="text-5xl font-black text-white/30 leading-none">{initial}</span>
        ) : (
          <Music className="w-1/4 h-1/4 text-white/40" />
        )}
      </div>
    </div>
  )
}
