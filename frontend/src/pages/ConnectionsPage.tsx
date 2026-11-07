import { Radio, CheckCircle, ExternalLink, Shield } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PlatformBadge from '../components/PlatformBadge'

export default function ConnectionsPage() {
  const platforms = [
    {
      id: 'spotify',
      name: 'Spotify',
      type: 'Source Platform' as const,
      status: 'active' as const,
      description: 'Primary import mechanism via user-exported JSON and CSV playlists. Fully offline-capable without API limits.',
      authMethod: 'CSV / JSON Export Import (Default) & Optional OAuth 2.0',
      connected: true,
      account: 'Import Engine Active',
    },
    {
      id: 'youtube',
      name: 'YouTube / YouTube Music',
      type: 'Destination Platform' as const,
      status: 'ready' as const,
      description: 'Official YouTube Data API v3 integration for playlist creation, item insertion, and sequence preservation.',
      authMethod: 'Google OAuth 2.0 (read/write playlists)',
      connected: false,
      account: 'Configure in Phase 3',
    },
    {
      id: 'apple_music',
      name: 'Apple Music',
      type: 'Connector Architecture' as const,
      status: 'planned' as const,
      description: 'Apple MusicKit API connector scheduled for multi-platform phase expansion.',
      authMethod: 'MusicKit Developer Token',
      connected: false,
      account: 'Phase 4 Roadmap',
    },
    {
      id: 'deezer',
      name: 'Deezer',
      type: 'Connector Architecture' as const,
      status: 'planned' as const,
      description: 'Public Deezer API connector for cross-platform song queries and playlist synchronization.',
      authMethod: 'OAuth 2.0',
      connected: false,
      account: 'Phase 4 Roadmap',
    },
    {
      id: 'tidal',
      name: 'Tidal',
      type: 'Connector Architecture' as const,
      status: 'planned' as const,
      description: 'High-fidelity audio platform connector using Tidal OpenAPI specifications.',
      authMethod: 'OAuth 2.0',
      connected: false,
      account: 'Phase 4 Roadmap',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Music Platform Connections"
        description="Manage connected music services, OAuth tokens, and connector architecture status."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((p) => (
          <div key={p.id} className="card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center">
                    <Radio size={20} className="text-accent-purple-light" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{p.name}</h3>
                    <span className="text-xs text-text-muted">{p.type}</span>
                  </div>
                </div>
                {p.connected ? (
                  <span className="badge bg-accent-green/20 text-accent-green flex items-center gap-1">
                    <CheckCircle size={12} />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="badge bg-bg-elevated text-text-muted">
                    {p.status === 'ready' ? 'Ready to Authorize' : 'Future Phase'}
                  </span>
                )}
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {p.description}
              </p>

              <div className="bg-bg-elevated/60 rounded-lg p-3 text-xs space-y-1.5 border border-bg-border/60">
                <div className="flex justify-between">
                  <span className="text-text-muted">Mechanism:</span>
                  <span className="text-text-primary font-medium">{p.authMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Status:</span>
                  <span className="text-text-primary">{p.account}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {p.id === 'spotify' ? (
                <button className="w-full btn-secondary text-xs py-2 justify-center">
                  <span>Import Engine Configured</span>
                </button>
              ) : p.id === 'youtube' ? (
                <button className="w-full btn-primary text-xs py-2 justify-center">
                  <span>Connect Google Account</span>
                </button>
              ) : (
                <button disabled className="w-full btn-ghost text-xs py-2 justify-center opacity-50 cursor-not-allowed">
                  <span>Roadmap Phase 4</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
