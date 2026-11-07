import { useState } from 'react'
import { Settings, Shield, Bell, Database, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [autoMatch, setAutoMatch] = useState(true)
  const [telemetry, setTelemetry] = useState(false)

  const handleSave = () => {
    toast.success('Preferences saved successfully')
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Settings & Preferences"
        description="Configure system preferences, notification defaults, and cloud options."
      />

      <div className="card space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Migration Engine Defaults</h3>
          <p className="text-xs text-text-muted mb-4">Control how playlists are parsed and transferred</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-bg-border/60">
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  Automatic High-Confidence Approval
                </div>
                <div className="text-[11px] text-text-muted">
                  Auto-select candidate videos with &ge;85% metadata confidence
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoMatch}
                onChange={(e) => setAutoMatch(e.target.checked)}
                className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-bg-border/60">
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  Email Notifications
                </div>
                <div className="text-[11px] text-text-muted">
                  Receive transfer job completion reports via email
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white mb-1">Cloud Architecture & Storage</h3>
          <p className="text-xs text-text-muted mb-3">Database and persistent storage connection</p>
          <div className="bg-bg-elevated p-3 rounded-xl border border-bg-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Target Cloud:</span>
              <span className="text-accent-purple-light font-medium">AWS (ECS / SQS / RDS)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Database:</span>
              <span className="text-text-primary">PostgreSQL 16 (harmonysync)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Comparative Architecture:</span>
              <span className="text-text-secondary">Microsoft Azure</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-bg-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => toast.error('Account deletion requires admin confirmation.')}
            className="text-xs text-accent-red hover:underline flex items-center gap-1"
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>

          <button
            onClick={handleSave}
            className="btn-primary text-xs px-5 py-2"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
