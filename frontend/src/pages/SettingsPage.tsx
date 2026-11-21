import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [autoMatch, setAutoMatch] = useState(true)

  const handleSave = () => {
    toast.success('Preferences saved')
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Settings"
      />

      <div className="card space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Defaults</h3>
          <p className="text-xs text-text-muted mb-4">Matching and notifications</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-bg-border/60">
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  Auto-approve strong matches
                </div>
                <div className="text-[11px] text-text-muted">
                  Matches scoring 85% or higher are confirmed automatically
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoMatch}
                onChange={(e) => setAutoMatch(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-bg-border/60">
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  Email me when a transfer finishes
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand"
              />
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
