import { useState } from 'react'
import { Bell, CheckCheck, Trash2, ArrowRightLeft, Sparkles, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

interface NotificationItem {
  id: number
  title: string
  message: string
  type: 'transfer' | 'matching' | 'system'
  timestamp: string
  isRead: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'Transfer Completed',
      message: 'Job #job-9021 successfully transferred 42 tracks to YouTube.',
      type: 'transfer',
      timestamp: '10 minutes ago',
      isRead: false,
    },
    {
      id: 2,
      title: 'Deterministic Match Complete',
      message: 'Spotify export "Discover Weekly" parsed and matched with 96% accuracy.',
      type: 'matching',
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: 3,
      title: 'PostgreSQL Migration V6 Applied',
      message: 'Database schema verified and synced successfully via Flyway.',
      type: 'system',
      timestamp: '1 day ago',
      isRead: true,
    },
  ])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success('All notifications marked as read')
  }

  const clearAll = () => {
    setNotifications([])
    toast.success('Notifications cleared')
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Notifications Center"
        description="Real-time alerts, transfer job statuses, and system updates."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
            <button
              onClick={clearAll}
              className="btn-ghost text-xs text-text-muted hover:text-accent-red flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        }
      />

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card text-center py-12 text-text-muted">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-4 transition-colors ${
                n.isRead ? 'opacity-70 bg-bg-secondary/60' : 'bg-bg-secondary border-accent-purple/30'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-accent-purple/15 text-accent-purple-light flex items-center justify-center shrink-0 mt-0.5">
                {n.type === 'transfer' ? (
                  <ArrowRightLeft size={16} />
                ) : n.type === 'matching' ? (
                  <Sparkles size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-text-primary">{n.title}</h4>
                  <span className="text-[11px] text-text-muted">{n.timestamp}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
