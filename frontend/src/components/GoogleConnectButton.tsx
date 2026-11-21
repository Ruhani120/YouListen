import { Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConnectGoogle } from '../hooks/useGoogle'
import { getApiError } from '../hooks/useSpotify'

interface Props {
  label?: string
  className?: string
}

/** Starts the Google sign-in (full-page redirect to Google, then back to /app/connections). */
export default function GoogleConnectButton({ label = 'Connect Google Account', className = 'btn-primary text-xs py-2 px-4' }: Props) {
  const connect = useConnectGoogle()
  return (
    <button
      onClick={() =>
        connect.mutate(undefined, {
          onError: (err) => toast.error(getApiError(err, 'Could not start Google sign-in').message),
        })
      }
      disabled={connect.isPending}
      className={`${className} inline-flex items-center justify-center gap-2`}
    >
      <Radio size={14} />
      <span>{connect.isPending ? 'Redirecting to Google...' : label}</span>
    </button>
  )
}
