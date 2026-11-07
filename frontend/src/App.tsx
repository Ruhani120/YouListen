import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ConnectionsPage from './pages/ConnectionsPage'
import ImportPage from './pages/ImportPage'
import ImportPreviewPage from './pages/ImportPreviewPage'
import PlaylistsPage from './pages/PlaylistsPage'
import PlaylistDetailPage from './pages/PlaylistDetailPage'
import EditPlaylistPage from './pages/EditPlaylistPage'
import SongMatchingPage from './pages/SongMatchingPage'
import TransferPage from './pages/TransferPage'
import TransferProgressPage from './pages/TransferProgressPage'
import TransferHistoryPage from './pages/TransferHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="import/preview" element={<ImportPreviewPage />} />
        <Route path="playlists" element={<PlaylistsPage />} />
        <Route path="playlists/:id" element={<PlaylistDetailPage />} />
        <Route path="playlists/:id/edit" element={<EditPlaylistPage />} />
        <Route path="playlists/:id/match" element={<SongMatchingPage />} />
        <Route path="transfer/:playlistId" element={<TransferPage />} />
        <Route path="transfer/:jobId/progress" element={<TransferProgressPage />} />
        <Route path="transfers" element={<TransferHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
