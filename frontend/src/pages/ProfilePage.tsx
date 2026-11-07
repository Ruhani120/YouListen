import { useState } from 'react'
import { User, Mail, Shield, Save, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [displayName, setDisplayName] = useState(user?.displayName || 'Alex Rivera')
  const [username, setUsername] = useState(user?.username || 'alexr')
  const [email] = useState(user?.email || 'alex@example.com')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser({ displayName, username })
    toast.success('Profile updated successfully!')
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="User Profile"
        description="Manage your personal account information and credentials."
      />

      <div className="card space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-bg-border">
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-xl font-bold text-accent-purple-light">
            {(displayName || username || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{displayName}</h3>
            <p className="text-xs text-text-muted">Role: {user?.role || 'USER'} &bull; PostgreSQL Authenticated</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Email Address (Immutable)
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="input-field text-sm opacity-60 cursor-not-allowed bg-bg-primary"
            />
          </div>

          <div className="pt-4 border-t border-bg-border flex justify-end">
            <button
              type="submit"
              className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
