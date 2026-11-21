import { ArrowLeftRight } from 'lucide-react'
import CoverArt, { GREEN_COVER, RED_COVER } from './CoverArt'

function MiniPlaylist({ label, tone, seed }: { label: string; tone: 'green' | 'red'; seed: string }) {
  const dot = tone === 'green' ? 'bg-accent-green' : 'bg-brand'
  return (
    <div className="w-36 sm:w-52 rounded-2xl border border-bg-border bg-bg-secondary p-3 shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      </div>
      <CoverArt seed={seed} palette={tone === 'green' ? GREEN_COVER : RED_COVER} showInitial={false} className="relative aspect-square rounded-xl mb-3" />
      <div className="space-y-2">
        {[78, 62, 70].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-bg-elevated shrink-0" />
            <div className="h-1.5 rounded bg-white/15" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Decorative picture: a playlist moving from Spotify to YouTube. No text to read, just atmosphere. */
export default function TransferArt({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 sm:gap-6 ${className}`} aria-hidden="true">
      <div className="-rotate-3">
        <MiniPlaylist label="Spotify" tone="green" seed="spotify-art" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-11 h-11 rounded-full bg-bg-elevated border border-brand/40 text-brand-light flex items-center justify-center shadow-lg shadow-brand/20 animate-pulse-soft">
          <ArrowLeftRight size={18} />
        </div>
      </div>
      <div className="rotate-3 mt-6">
        <MiniPlaylist label="YouTube" tone="red" seed="youtube-art" />
      </div>
    </div>
  )
}
