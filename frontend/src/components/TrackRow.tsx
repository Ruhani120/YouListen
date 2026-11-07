import StatusBadge from './StatusBadge'
import ConfidenceBar from './ConfidenceBar'

interface TrackRowProps {
  position?: number
  title: string
  artist: string
  album?: string
  duration?: string
  matchStatus?: 'matched' | 'unmatched' | 'skipped' | 'warning'
  confidence?: number
  isrc?: string
  selected?: boolean
  onClick?: () => void
}

export default function TrackRow({
  position, title, artist, album, duration, matchStatus, confidence, isrc, selected, onClick
}: TrackRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-bg-border/50 transition-colors hover:bg-bg-elevated/50 ${
        selected ? 'bg-accent-purple/10' : ''
      } ${matchStatus === 'warning' ? 'bg-accent-yellow/5' : ''} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {position !== undefined && (
        <td className="py-3 px-4 text-text-muted text-sm tabular-nums w-10">{position}</td>
      )}
      <td className="py-3 px-4">
        <div className="font-medium text-text-primary text-sm">{title}</div>
        <div className="text-text-muted text-xs mt-0.5">{artist}</div>
      </td>
      {album !== undefined && (
        <td className="py-3 px-4 text-text-secondary text-sm hidden md:table-cell">{album}</td>
      )}
      {duration && (
        <td className="py-3 px-4 text-text-muted text-sm tabular-nums w-16 hidden sm:table-cell">{duration}</td>
      )}
      {isrc !== undefined && (
        <td className="py-3 px-4 text-text-muted text-xs font-mono hidden lg:table-cell">{isrc || '—'}</td>
      )}
      {confidence !== undefined && (
        <td className="py-3 px-4 w-28">
          <ConfidenceBar score={confidence} />
        </td>
      )}
      {matchStatus && (
        <td className="py-3 px-4 w-24">
          <StatusBadge status={matchStatus} />
        </td>
      )}
    </tr>
  )
}
