import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, CheckCircle2, Clock, ExternalLink, Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import PlatformBadge from '../components/PlatformBadge'

export default function TransferHistoryPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all')

  const history = [
    {
      id: 'job-9021',
      sourceName: 'Synthwave & Cyberpunk Vibes',
      destName: 'Synthwave & Cyberpunk Vibes (Transferred)',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracksTotal: 42,
      tracksTransferred: 42,
      tracksFailed: 0,
      status: 'completed' as const,
      date: 'Today, 10:04',
      duration: '42s',
    },
    {
      id: 'job-8910',
      sourceName: 'Discover Weekly Archive',
      destName: 'Discover Weekly 2026 Archive',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracksTotal: 30,
      tracksTransferred: 29,
      tracksFailed: 1,
      status: 'completed' as const,
      date: 'Yesterday, 14:22',
      duration: '31s',
    },
    {
      id: 'job-8700',
      sourceName: 'Lofi Chill Beats 2026',
      destName: 'Lofi Chill Study Beats',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracksTotal: 75,
      tracksTransferred: 74,
      tracksFailed: 1,
      status: 'completed' as const,
      date: '3 days ago',
      duration: '1m 15s',
    },
    {
      id: 'job-8520',
      sourceName: 'Unreleased Mixes',
      destName: 'Unreleased Underground',
      sourcePlatform: 'spotify' as const,
      destPlatform: 'youtube' as const,
      tracksTotal: 12,
      tracksTransferred: 4,
      tracksFailed: 8,
      status: 'failed' as const,
      date: '5 days ago',
      duration: '18s',
    },
  ]

  const filteredHistory = history.filter((h) => {
    if (filter === 'all') return true
    return h.status === filter
  })

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Transfer History & Audit Logs"
        description="Comprehensive audit trail of all background playlist migration jobs."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-bg-border pb-3">
        {(['all', 'completed', 'failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === tab
                ? 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* History Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated/60 text-text-muted uppercase tracking-wider border-b border-bg-border">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Source Playlist</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-center">Tracks</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-accent-purple-light">{item.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-text-primary">{item.sourceName}</div>
                    <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                      <PlatformBadge platform={item.sourcePlatform} size="sm" />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-text-primary">{item.destName}</div>
                    <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                      <PlatformBadge platform={item.destPlatform} size="sm" />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-text-primary">
                      {item.tracksTransferred}/{item.tracksTotal}
                    </span>
                    {item.tracksFailed > 0 && (
                      <span className="text-[10px] text-accent-red block">
                        ({item.tracksFailed} failed)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-text-muted">{item.duration}</td>
                  <td className="py-3 px-4 text-text-muted">{item.date}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
