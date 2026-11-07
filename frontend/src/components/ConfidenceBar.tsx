interface ConfidenceBarProps {
  score: number
  showLabel?: boolean
}

export default function ConfidenceBar({ score, showLabel = true }: ConfidenceBarProps) {
  const color =
    score >= 85 ? 'bg-accent-green' :
    score >= 60 ? 'bg-accent-yellow' :
    'bg-accent-red'

  const textColor =
    score >= 85 ? 'text-accent-green' :
    score >= 60 ? 'text-accent-yellow' :
    'text-accent-red'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium tabular-nums w-8 text-right ${textColor}`}>
          {score}%
        </span>
      )}
    </div>
  )
}
