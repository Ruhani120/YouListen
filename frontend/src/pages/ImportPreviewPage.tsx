import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Music, AlertTriangle, ArrowLeft } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

interface ParsedTrack {
  position: number
  title: string
  artist: string
  album: string
  duration: string
  isrc: string
  valid: boolean
}

export default function ImportPreviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const fileState = (location.state as { fileName?: string; format?: string }) || {}

  const [playlistName, setPlaylistName] = useState(
    fileState.fileName ? fileState.fileName.replace(/\.(csv|json)$/i, '') : 'Imported Spotify Favorites'
  )

  const sampleParsedTracks: ParsedTrack[] = [
    { position: 1, title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: '4:03', isrc: 'FR01A1100650', valid: true },
    { position: 2, title: 'Starboy', artist: 'The Weeknd, Daft Punk', album: 'Starboy', duration: '3:50', isrc: 'USUG11601728', valid: true },
    { position: 3, title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: '3:32', isrc: 'QZDA61448651', valid: true },
    { position: 4, title: 'Instant Crush', artist: 'Daft Punk, Julian Casablancas', album: 'Random Access Memories', duration: '5:37', isrc: 'USQX91300105', valid: true },
    { position: 5, title: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', duration: '4:19', isrc: 'FR01A1000850', valid: true },
    { position: 6, title: 'Get Lucky (Radio Edit)', artist: 'Daft Punk, Pharrell Williams', album: 'Random Access Memories', duration: '4:08', isrc: 'USQX91300108', valid: true },
  ]

  const handleSaveAndMatch = () => {
    toast.success('Playlist imported successfully! Proceeding to song matching.')
    navigate('/app/playlists/101/match')
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="Import Preview & Validation"
        description="Verify parsed tracks, column mappings, and metadata before saving to PostgreSQL."
        breadcrumb="Import Workflow"
        actions={
          <button
            onClick={() => navigate('/app/import')}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Re-upload</span>
          </button>
        }
      />

      {/* Summary Card */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Playlist Destination Name
            </label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="input-field text-base font-bold"
            />
          </div>

          <div className="flex items-center gap-4 text-xs bg-bg-elevated p-3 rounded-xl border border-bg-border">
            <div>
              <span className="text-text-muted block">Parsed Tracks:</span>
              <span className="text-white font-bold text-sm">6 Total</span>
            </div>
            <div className="h-6 w-px bg-bg-border" />
            <div>
              <span className="text-text-muted block">Valid Records:</span>
              <span className="text-accent-green font-bold text-sm">6 (100%)</span>
            </div>
            <div className="h-6 w-px bg-bg-border" />
            <div>
              <span className="text-text-muted block">ISRC Matchable:</span>
              <span className="text-accent-purple-light font-bold text-sm">6 (100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parsed Tracks Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Parsed Track Metadata</h3>
          <span className="badge bg-accent-green/20 text-accent-green">Ready to Match</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated/60 text-text-muted uppercase tracking-wider border-b border-bg-border">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Artist</th>
                <th className="py-3 px-4">Album</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">ISRC</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {sampleParsedTracks.map((t) => (
                <tr key={t.position} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="py-3 px-4 text-center text-text-muted font-mono">{t.position}</td>
                  <td className="py-3 px-4 font-semibold text-text-primary">{t.title}</td>
                  <td className="py-3 px-4 text-text-secondary">{t.artist}</td>
                  <td className="py-3 px-4 text-text-muted truncate max-w-xs">{t.album}</td>
                  <td className="py-3 px-4 text-text-muted font-mono">{t.duration}</td>
                  <td className="py-3 px-4 text-text-muted font-mono">{t.isrc}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-accent-green">
                      <CheckCircle2 size={12} />
                      <span>Valid</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => navigate('/app/import')}
          className="btn-ghost text-xs"
        >
          Cancel & Back
        </button>

        <button
          onClick={handleSaveAndMatch}
          className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-accent-purple/20"
        >
          <span>Save & Start Song Matching</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
