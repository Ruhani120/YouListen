import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: number
  changeLabel?: string
  iconColor?: string
}

export default function StatCard({ title, value, icon, change, changeLabel, iconColor = 'text-accent-purple' }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="card hover:border-bg-border/80 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>
      <div className="text-text-secondary text-sm">{title}</div>
      {changeLabel && <div className="text-text-muted text-xs mt-1">{changeLabel}</div>}
    </div>
  )
}
