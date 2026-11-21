import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import TransferArt from './TransferArt'

/** Two-column layout for sign in / register: brand panel on the left (large screens), form on the right. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 ambient-bg">
      <aside className="hidden lg:flex flex-col justify-between p-12 border-r border-bg-border bg-gradient-to-br from-brand/10 via-transparent to-accent-green/10">
        <Link to="/" className="inline-flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-white">YouListen</span>
        </Link>

        <TransferArt className="scale-90 xl:scale-100" />

        <p className="text-2xl font-bold text-white leading-snug max-w-sm">
          Your playlists, <span className="text-brand-light">everywhere</span>.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6">{children}</main>
    </div>
  )
}
