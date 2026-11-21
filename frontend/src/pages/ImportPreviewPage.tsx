import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'
import { ImportPreview, useConfirmImport } from '../hooks/useImports'
import { getApiError } from '../hooks/useSpotify'
import { formatDuration } from '../lib/format'

export default function ImportPreviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const preview = (location.state as { preview?: ImportPreview } | null)?.preview
  const confirmImport = useConfirmImport()

  const [playlistName, setPlaylistName] = useState(
    preview?.fileName ? preview.fileName.replace(/\.(csv|json)$/i, '') : 'Imported playlist'
  )
  const [showInvalidOnly, setShowInvalidOnly] = useState(false)

  // Opened directly or refreshed: there is no parsed file any more, so start over
  if (!preview) {
    return <Navigate to="/app/import" replace />
  }

  const visible = showInvalidOnly ? preview.tracks.filter((t) => !t.valid) : preview.tracks
  const percent = (n: number) => (preview.totalRows === 0 ? 0 : Math.round((n / preview.totalRows) * 100))

  const handleSaveAndMatch = () => {
    if (!playlistName.trim()) {
      toast.error('Give the playlist a name')
      return
    }
    confirmImport.mutate(
      { name: playlistName.trim(), fileName: preview.fileName, format: preview.format, tracks: preview.tracks },
      {
        onSuccess: (result) => {
          toast.success(`Imported ${result.trackCount} tracks`)
          navigate(`/app/playlists/${result.playlistId}/match`)
        },
        onError: (err) => toast.error(getApiError(err, 'Could not save the playlist').message),
      }
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="Preview import"
        description="Check the tracks before saving."
        actions={
          <button onClick={() => navigate('/app/import')} className="btn-ghost text-xs flex items-center gap-1.5">
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
              Playlist Name
            </label>
            <input
              type="text"
              value={playlistName}
              maxLength={500}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="input-field text-base font-bold"
            />
          </div>

          <div className="flex items-center gap-4 text-xs bg-bg-elevated p-3 rounded-xl border border-bg-border">
            <div>
              <span className="text-text-muted block">Parsed Tracks:</span>
              <span className="text-white font-bold text-sm">{preview.totalRows} Total</span>
            </div>
            <div className="h-6 w-px bg-bg-border" />
            <div>
              <span className="text-text-muted block">Valid Records:</span>
              <span className="text-accent-green font-bold text-sm">
                {preview.validCount} ({percent(preview.validCount)}%)
              </span>
            </div>
            <div className="h-6 w-px bg-bg-border" />
            <div>
              <span className="text-text-muted block">With ISRC:</span>
              <span className="text-brand-light font-bold text-sm">
                {preview.isrcCount} ({percent(preview.isrcCount)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {preview.invalidCount > 0 && (
        <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-accent-yellow shrink-0 mt-0.5" />
            <span>
              {preview.invalidCount} row{preview.invalidCount === 1 ? '' : 's'} can&apos;t be imported (missing track name or
              artist) and will be skipped.
            </span>
          </div>
          <button onClick={() => setShowInvalidOnly((v) => !v)} className="btn-ghost text-xs px-2 py-1 shrink-0">
            {showInvalidOnly ? 'Show all' : 'Show these'}
          </button>
        </div>
      )}

      {/* Parsed Tracks Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">Tracks</h3>
          <span className="badge bg-accent-green/20 text-accent-green">
            {preview.validCount > 0 ? 'Ready to Match' : 'Nothing to import'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated/60 text-text-muted uppercase tracking-wider border-b border-bg-border sticky top-0">
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
              {visible.map((t) => (
                <tr key={t.position} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="py-3 px-4 text-center text-text-muted font-mono">{t.position}</td>
                  <td className="py-3 px-4 font-semibold text-text-primary">{t.title ?? '-'}</td>
                  <td className="py-3 px-4 text-text-secondary">{t.artist ?? '-'}</td>
                  <td className="py-3 px-4 text-text-muted truncate max-w-xs">{t.album ?? '-'}</td>
                  <td className="py-3 px-4 text-text-muted font-mono">{formatDuration(t.durationMs)}</td>
                  <td className="py-3 px-4 text-text-muted font-mono">{t.isrc ?? '-'}</td>
                  <td className="py-3 px-4 text-center">
                    {t.valid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-accent-green">
                        <CheckCircle2 size={12} />
                        <span>Valid</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-accent-yellow">
                        <AlertTriangle size={12} />
                        <span>{t.issue ?? 'Invalid'}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button onClick={() => navigate('/app/import')} className="btn-ghost text-xs">
          Cancel &amp; Back
        </button>

        <button
          onClick={handleSaveAndMatch}
          disabled={preview.validCount === 0 || confirmImport.isPending}
          className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
        >
          <span>{confirmImport.isPending ? 'Saving...' : 'Save & match songs'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
