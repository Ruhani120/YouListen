import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ExternalLink } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import PlatformBadge from '../components/PlatformBadge'
import { isActive, useTransfers } from '../hooks/useTransfers'
import { getApiError } from '../hooks/useSpotify'
import { formatDateTime, formatSeconds } from '../lib/format'

type Filter = 'all' | 'completed' | 'failed'

export default function TransferHistoryPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const { data: history, isLoading, error, refetch } = useTransfers()

  const filtered = (history ?? []).filter((h) => {
    if (filter === 'all') return true
    if (filter === 'completed') return h.status === 'COMPLETED'
    return h.status === 'FAILED'
  })

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Transfer history"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-bg-border pb-3">
        {(['all', 'completed', 'failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === tab
                ? 'bg-brand/15 text-brand-light border border-brand/30'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-32 rounded-xl bg-bg-elevated animate-pulse-soft" />}

      {error && (
        <div className="card flex items-center justify-between gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="text-accent-red" />
            {getApiError(error, 'Could not load transfer history').message}
          </span>
          <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-1">Try again</button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="card text-center py-12 space-y-3">
          <p className="text-sm text-text-secondary">
            {filter === 'all' ? 'No transfers yet.' : `No ${filter} transfers.`}
          </p>
          {filter === 'all' && (
            <button onClick={() => navigate('/app/playlists')} className="btn-primary text-xs px-4 py-2">
              Pick a playlist to transfer
            </button>
          )}
        </div>
      )}

      {/* History Table */}
      {filtered.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-elevated/60 text-text-muted uppercase tracking-wider border-b border-bg-border">
                <tr>
                  <th className="py-3 px-4">Job</th>
                  <th className="py-3 px-4">Source Playlist</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 text-center">Tracks</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Started</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/app/transfer/${item.id}/progress`)}
                    className="hover:bg-bg-elevated/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-brand-light">#{item.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{item.playlistName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{item.destinationPlaylistName ?? '-'}</span>
                        {item.destinationUrl && (
                          <a
                            href={item.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={item.destinationPlatform === 'spotify' ? 'Open in Spotify' : 'Open in YouTube Music'}
                            className="text-text-muted hover:text-white"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                        <PlatformBadge platform={item.destinationPlatform === 'spotify' ? 'spotify' : 'youtube'} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-text-primary">
                        {item.transferredTracks}/{item.readyTracks}
                      </span>
                      {item.failedTracks > 0 && (
                        <span className="text-[10px] text-accent-red block">({item.failedTracks} failed)</span>
                      )}
                      {item.skippedTracks > 0 && (
                        <span className="text-[10px] text-text-muted block">({item.skippedTracks} skipped)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">{formatSeconds(item.durationSeconds)}</td>
                    <td className="py-3 px-4 text-text-muted">{formatDateTime(item.startedAt ?? item.createdAt)}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={item.status.toLowerCase() as 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'pending'}
                        label={isActive(item.status) ? `${item.progressPercent}%` : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
