import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

export default function ImportPage() {
  const navigate = useNavigate()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv')

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
    const isCsv = file.name.endsWith('.csv')
    const isJson = file.name.endsWith('.json')

    if (!isCsv && !isJson) {
      toast.error('Please upload a valid CSV or JSON file.')
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
    // Navigate to preview page with simulated file state
    navigate('/app/import/preview', {
      state: {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        format: importFormat,
      },
    })
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Import Playlist"
        description="Upload your exported Spotify playlist in CSV or JSON format for deterministic matching and migration."
      />

      {/* Format Selector */}
      <div className="card space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          1. Select Export Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setImportFormat('csv')}
            className={`p-4 rounded-xl border text-left transition-all ${
              importFormat === 'csv'
                ? 'bg-accent-purple/10 border-accent-purple text-white'
                : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white'
            }`}
          >
            <div className="font-bold text-sm mb-1 flex items-center justify-between">
              <span>Spotify CSV Export</span>
              {importFormat === 'csv' && <CheckCircle2 size={16} className="text-accent-purple-light" />}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Standard comma-separated format: Track Name, Artist Name, Album, Duration, ISRC.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setImportFormat('json')}
            className={`p-4 rounded-xl border text-left transition-all ${
              importFormat === 'json'
                ? 'bg-accent-purple/10 border-accent-purple text-white'
                : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white'
            }`}
          >
            <div className="font-bold text-sm mb-1 flex items-center justify-between">
              <span>Spotify JSON Export</span>
              {importFormat === 'json' && <CheckCircle2 size={16} className="text-accent-purple-light" />}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Structured JSON format from tools like Exportify or Spotify Extended History.
            </p>
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div className="card space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          2. Upload Export File
        </label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            dragActive
              ? 'border-accent-purple bg-accent-purple/10 scale-[1.01]'
              : 'border-bg-border hover:border-text-muted bg-bg-elevated/40'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/15 text-accent-purple-light flex items-center justify-center mx-auto mb-4">
            <UploadCloud size={32} />
          </div>

          <h3 className="text-base font-bold text-text-primary mb-1">
            Drag and drop your playlist file here
          </h3>
          <p className="text-xs text-text-muted mb-6">
            Supports .csv and .json files up to 10MB
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
          disabled={!selectedFile}
          className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
        >
          <span>Preview & Parse Playlist</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
