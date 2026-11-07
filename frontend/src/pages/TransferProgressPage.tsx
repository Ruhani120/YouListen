import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, ArrowRight, Check, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

export default function TransferProgressPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(65)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100)
      setIsCompleted(true)
      toast.success('Playlist transfer completed successfully!')
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const steps = [
    { title: 'Initialized Background Job', status: 'done', detail: 'SQS message queued & dequeued by worker' },
    { title: 'Deterministic Match Execution', status: 'done', detail: 'Metadata verified against YouTube Data API' },
    { title: 'YouTube Playlist Creation', status: 'done', detail: 'Created "Synthwave & Cyberpunk Vibes (Transferred)"' },
    { title: 'Sequential Track Insertion', status: isCompleted ? 'done' : 'in_progress', detail: isCompleted ? '42 of 42 tracks inserted' : 'Inserting tracks 28 of 42...' },
    { title: 'Finalize Job & History', status: isCompleted ? 'done' : 'pending', detail: isCompleted ? 'Updated transfer_jobs in PostgreSQL' : 'Waiting for batch completion' },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Transfer in Progress"
        description={`Job ID: ${jobId || 'job-9021'} &bull; Real-time background execution status`}
        breadcrumb="Worker Monitor"
      />

      <div className="card text-center py-8 space-y-6">
        {/* Circular / Linear Progress */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30 mb-2">
            {isCompleted ? (
              <CheckCircle2 size={36} className="text-accent-green" />
            ) : (
              <Loader2 size={36} className="animate-spin text-accent-purple-light" />
            )}
          </div>
          <h2 className="text-2xl font-black text-white">
            {isCompleted ? 'Transfer Complete!' : `${progress}% Migrated`}
          </h2>
          <p className="text-xs text-text-secondary">
            {isCompleted
              ? 'All matched tracks have been added to your YouTube library.'
              : 'Asynchronous worker is processing tracks sequentially.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-bg-elevated h-2.5 rounded-full overflow-hidden border border-bg-border/60">
          <div
            className="bg-gradient-to-r from-accent-purple to-accent-green h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pipeline Steps */}
        <div className="text-left space-y-3 pt-4 border-t border-bg-border">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5">
                {s.status === 'done' ? (
                  <CheckCircle2 size={16} className="text-accent-green" />
                ) : s.status === 'in_progress' ? (
                  <Loader2 size={16} className="animate-spin text-accent-purple-light" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-bg-border" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${s.status === 'pending' ? 'text-text-muted' : 'text-text-primary'}`}>
                  {s.title}
                </div>
                <div className="text-[11px] text-text-muted">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {isCompleted && (
          <div className="pt-4 border-t border-bg-border">
            <button
              onClick={() => navigate('/app/transfers')}
              className="btn-primary text-xs w-full justify-center py-2.5 flex items-center gap-2 shadow-lg shadow-accent-purple/20"
            >
              <span>View Transfer History & Summary</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
