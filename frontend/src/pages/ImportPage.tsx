import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SpotifyConnectSection from '../components/SpotifyConnectSection'
import YouTubeImportSection from '../components/YouTubeImportSection'
import { usePreviewImport } from '../hooks/useImports'
import { getApiError } from '../hooks/useSpotify'
import toast from 'react-hot-toast'

// Result codes the backend puts on the redirect after Spotify login: /app/import?spotify=<code>
const SPOTIFY_RESULT_MESSAGES: Record<string, { type: 'success' | 'error'; text: string }> = {
  connected: { type: 'success', text: 'Spotify connected!' },
  restricted: {
    type: 'error',
    text: 'Spotify connected, but Spotify is restricting API access for this app. In Development Mode the app owner needs active Premium. Your connection is saved.',
  },
  denied: { type: 'error', text: 'Spotify login was cancelled.' },
  invalid_state: { type: 'error', text: 'Spotify login expired. Please try connecting again.' },
  error: { type: 'error', text: 'Could not connect Spotify. Please try again.' },
}

export default function ImportPage() {
  const navigate = useNavigate()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv')
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const previewImport = usePreviewImport()

  // Handle the redirect back from Spotify (?spotify=connected | restricted | denied | ...)
  useEffect(() => {
    const result = searchParams.get('spotify')
    if (!result) return
    const message = SPOTIFY_RESULT_MESSAGES[result] ?? SPOTIFY_RESULT_MESSAGES.error
    if (message.type === 'success') {
      toast.success(message.text, { id: 'spotify-result' })
    } else {
      toast.error(message.text, { id: 'spotify-result', duration: 8000 })
    }
    queryClient.invalidateQueries({ queryKey: ['spotify'] })
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    const lower = file.name.toLowerCase()
    const isCsv = lower.endsWith('.csv')
    const isJson = lower.endsWith('.json')

    if (!isCsv && !isJson) {
      toast.error('Please upload a valid CSV or JSON file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('That file is larger than 10 MB.')
      return
    }

    setImportFormat(isCsv ? 'csv' : 'json')
    setSelectedFile(file)
    toast.success(`Loaded ${file.name}`)
  }

  const handleProceed = () => {
    if (!selectedFile) {
      toast.error('Please select a file to import')
      return
    }
    // The backend parses the file and returns what it found; nothing is saved until the preview is confirmed
    previewImport.mutate(selectedFile, {
      onSuccess: (preview) => navigate('/app/import/preview', { state: { preview } }),
      onError: (err) => toast.error(getApiError(err, 'Could not read that file').message, { duration: 7000 }),
    })
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Import Playlist"
        description="Bring in a playlist from Spotify, YouTube, or a CSV/JSON file."
      />

      {/* Spotify OAuth: pick a real playlist from your account */}
      <SpotifyConnectSection />

      {/* YouTube / YouTube Music: bring a playlist in, then send it to Spotify */}
      <YouTubeImportSection />

      <div className="flex items-center gap-4 text-xs text-text-muted uppercase tracking-wider">
        <div className="h-px flex-1 bg-bg-border" />
        <span>or upload a file</span>
        <div className="h-px flex-1 bg-bg-border" />
      </div>

      {/* Format Selector */}
      <div className="card space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          File format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setImportFormat('csv')}
            className={`p-4 rounded-xl border text-left transition-all ${
              importFormat === 'csv'
                ? 'bg-brand/10 border-brand text-white'
                : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white'
            }`}
          >
            <div className="font-bold text-sm mb-1 flex items-center justify-between">
              <span>CSV</span>
              {importFormat === 'csv' && <CheckCircle2 size={16} className="text-brand-light" />}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Track name, artist, album and duration columns.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setImportFormat('json')}
            className={`p-4 rounded-xl border text-left transition-all ${
              importFormat === 'json'
                ? 'bg-brand/10 border-brand text-white'
                : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white'
            }`}
          >
            <div className="font-bold text-sm mb-1 flex items-center justify-between">
              <span>JSON</span>
              {importFormat === 'json' && <CheckCircle2 size={16} className="text-brand-light" />}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Exportify or Spotify data exports.
            </p>
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div className="card space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Upload file
        </label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            dragActive
              ? 'border-brand bg-brand/10 scale-[1.01]'
              : 'border-bg-border hover:border-text-muted bg-bg-elevated/40'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-brand/15 text-brand-light flex items-center justify-center mx-auto mb-4">
            <UploadCloud size={32} />
          </div>

          <h3 className="text-base font-bold text-text-primary mb-1">
            Drop your playlist file here
          </h3>
          <p className="text-xs text-text-muted mb-6">
            .csv or .json, up to 10 MB
          </p>

          <input
            id="file-upload"
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="btn-secondary text-xs px-5 py-2.5 cursor-pointer inline-flex items-center gap-2"
          >
            <FileText size={14} />
            <span>Browse Files</span>
          </label>
        </div>

        {selectedFile && (
          <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-accent-green" />
              <div>
                <div className="text-sm font-semibold text-text-primary">{selectedFile.name}</div>
                <div className="text-xs text-text-muted">{(selectedFile.size / 1024).toFixed(1)} KB &bull; {importFormat.toUpperCase()}</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-xs text-accent-red hover:underline"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => navigate('/app/playlists')}
          className="btn-ghost text-xs"
        >
          Cancel
        </button>

        <button
          onClick={handleProceed}
          disabled={!selectedFile || previewImport.isPending}
          className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
        >
          <span>{previewImport.isPending ? 'Reading file...' : 'Preview & Parse Playlist'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
