import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Music,
  UploadCloud,
  ArrowLeftRight,
  Radio,
  BarChart3,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLogout } from '../hooks/useAuth'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Overview', items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/app/playlists', label: 'My Playlists', icon: Music },
      { to: '/app/transfers', label: 'Transfer History', icon: ArrowLeftRight },
    ]},
    { label: 'Migration', items: [
      { to: '/app/import', label: 'Import Playlist', icon: UploadCloud },
      { to: '/app/connections', label: 'Platforms', icon: Radio },
    ]},
    { label: 'Insights & Activity', items: [
      { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
    ]},
    { label: 'Account', items: [
      { to: '/app/profile', label: 'User Profile', icon: User },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ]},
  ]

  const userInitials = (user?.displayName || user?.username || 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-bg-border">
          <NavLink to="/app/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-purple to-accent-purple-light flex items-center justify-center shadow-lg shadow-accent-purple/20">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-accent-purple-light">
              YouListen
            </span>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navItems.map((group) => (
            <div key={group.label}>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to || (item.to !== '/app/dashboard' && location.pathname.startsWith(item.to))
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-accent-purple-light' : 'text-text-muted'} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-bg-border bg-bg-secondary">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-sm font-bold text-accent-purple-light">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {user?.displayName || user?.username || 'YouListen User'}
              </div>
              <div className="text-xs text-text-muted truncate">
                {user?.email || 'user@youlisten.com'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent-red/90 hover:bg-accent-red/10 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-bg-secondary/60 backdrop-blur-md border-b border-bg-border flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search playlists, tracks, artists..."
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/notifications')}
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-purple" />
            </button>

            <button
              onClick={() => navigate('/app/import')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <UploadCloud size={14} />
              <span>Import Playlist</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
