type StatusType = 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'pending' | 'matched' | 'unmatched' | 'skipped' | 'warning'

interface StatusBadgeProps {
  status: StatusType
  label?: string
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-accent-green/20 text-accent-green' },
  failed: { label: 'Failed', className: 'bg-accent-red/20 text-accent-red' },
  in_progress: { label: 'In Progress', className: 'bg-brand/20 text-brand-light' },
  cancelled: { label: 'Cancelled', className: 'bg-text-muted/20 text-text-muted' },
  pending: { label: 'Pending', className: 'bg-accent-yellow/20 text-accent-yellow' },
  matched: { label: 'Matched', className: 'bg-accent-green/20 text-accent-green' },
  unmatched: { label: 'Unmatched', className: 'bg-accent-red/20 text-accent-red' },
  skipped: { label: 'Skipped', className: 'bg-text-muted/20 text-text-muted' },
  warning: { label: 'Warning', className: 'bg-accent-yellow/20 text-accent-yellow' },
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={`badge ${config.className}`}>
      {label || config.label}
    </span>
  )
}
