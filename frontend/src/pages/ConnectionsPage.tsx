import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Radio, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import GoogleConnectButton from '../components/GoogleConnectButton'
import { useDisconnectGoogle, useGoogleStatus } from '../hooks/useGoogle'
import { getApiError, useConnectSpotify, useSpotifyStatus } from '../hooks/useSpotify'

// Result codes the backend puts on the redirect after Google sign-in: /app/connections?google=<code>
const GOOGLE_RESULT_MESSAGES: Record<string, { type: 'success' | 'error'; text: string }> = {
  connected: { type: 'success', text: 'Google account connected!' },
  no_channel: {
    type: 'error',
    text: 'Google connected, but this account has no YouTube channel yet. Open youtube.com, create a channel, then try again.',
  },
  no_refresh: {
    type: 'error',
    text: 'Google did not give a long-lived login. Remove YouListen at myaccount.google.com/permissions, then connect again.',
  },
  scope_missing: {
    type: 'error',
    text: 'The YouTube permission was not granted. Connect again and tick the YouTube checkbox on Google\'s screen.',
  },
  denied: { type: 'error', text: 'Google sign-in was cancelled.' },
  invalid_state: { type: 'error', text: 'Google sign-in expired. Please try connecting again.' },
  error: { type: 'error', text: 'Could not connect Google. Please try again.' },
}

function ConnectedBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="badge bg-accent-green/20 text-accent-green flex items-center gap-1">
      <CheckCircle size={12} />
      <span>Connected</span>
    </span>
  ) : (
    <span className="badge bg-bg-elevated text-text-muted">Not connected</span>
  )
}

export default function ConnectionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: google, isLoading: googleLoading, error: googleError, refetch: refetchGoogle } = useGoogleStatus()
  const { data: spotify } = useSpotifyStatus()
  const disconnectGoogle = useDisconnectGoogle()
  const connectSpotify = useConnectSpotify()

  // Handle the redirect back from Google (?google=connected | no_channel | ...)
  useEffect(() => {
    const result = searchParams.get('google')
    if (!result) return
    const message = GOOGLE_RESULT_MESSAGES[result] ?? GOOGLE_RESULT_MESSAGES.error
    if (message.type === 'success') {
      toast.success(message.text, { id: 'google-result' })
    } else {
      toast.error(message.text, { id: 'google-result', duration: 9000 })
    }
    queryClient.invalidateQueries({ queryKey: ['google'] })
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const spotifyStatusText = spotify?.connected
    ? spotify.displayName ? `Connected as ${spotify.displayName}` : 'Account connected'
    : 'Not connected'
  const youtubeStatusText = google?.connected
    ? google.channelTitle ? `Connected as ${google.channelTitle}` : 'Account connected'
    : 'Not connected'

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Connections" description="Your Spotify and YouTube accounts." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spotify */}
        <div className="card flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center">
                  <Radio size={20} className="text-accent-green" />
                </div>
                <h3 className="text-base font-bold text-text-primary">Spotify</h3>
              </div>
              <ConnectedBadge connected={!!spotify?.connected} />
            </div>
            <p className="text-xs text-text-secondary">Import your playlists, or create new ones from YouTube.</p>
            <p className="text-xs text-text-muted">{spotifyStatusText}</p>
          </div>

          <div className="space-y-2">
            <button onClick={() => navigate('/app/import')} className="w-full btn-secondary text-xs py-2 justify-center">
              <span>Import a playlist</span>
            </button>
            {spotify?.configured && (!spotify.connected || !spotify.canCreatePlaylists) && (
              <button
                onClick={() =>
                  connectSpotify.mutate(undefined, {
                    onError: (err) => toast.error(getApiError(err, 'Could not start Spotify login').message),
                  })
                }
                disabled={connectSpotify.isPending}
                className="w-full btn-primary text-xs py-2 justify-center"
              >
                <span>
                  {connectSpotify.isPending
                    ? 'Redirecting to Spotify...'
                    : spotify.connected ? 'Reconnect to allow creating playlists' : 'Connect Spotify'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* YouTube */}
        <div className="card flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center">
                  <Radio size={20} className="text-brand-light" />
                </div>
                <h3 className="text-base font-bold text-text-primary">YouTube / YouTube Music</h3>
              </div>
              <ConnectedBadge connected={!!google?.connected} />
            </div>
            <p className="text-xs text-text-secondary">Find songs, import your playlists, and create new ones.</p>
            <p className="text-xs text-text-muted">{youtubeStatusText}</p>
          </div>

          <div className="space-y-2">
            {googleLoading && <div className="h-9 rounded-lg bg-bg-elevated animate-pulse-soft" />}

            {googleError && (
              <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-xs text-text-secondary flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-accent-red shrink-0" />
                  Could not load Google status.
                </span>
                <button onClick={() => refetchGoogle()} className="btn-secondary text-xs px-3 py-1">
                  Try again
                </button>
              </div>
            )}

            {google && !google.configured && (
              <div className="p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 text-xs text-text-secondary flex gap-2">
                <AlertCircle size={14} className="text-accent-yellow shrink-0 mt-0.5" />
                <span>Google login isn&apos;t set up on this server yet.</span>
              </div>
            )}

            {google && google.configured && !google.connected && (
              <GoogleConnectButton className="w-full btn-primary text-xs py-2" />
            )}

            {google?.connected && (
              <button
                onClick={() =>
                  disconnectGoogle.mutate(undefined, {
                    onSuccess: () => toast.success('Google disconnected'),
                    onError: () => toast.error('Could not disconnect Google'),
                  })
                }
                disabled={disconnectGoogle.isPending}
                className="w-full btn-secondary text-xs py-2 justify-center"
              >
                <span>{disconnectGoogle.isPending ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
