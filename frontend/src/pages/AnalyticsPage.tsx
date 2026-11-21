import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Music, ArrowRightLeft, CheckCircle, ListChecks } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { usePlaylists } from '../hooks/usePlaylists'
import { useTransfers } from '../hooks/useTransfers'

const tooltipStyle = { backgroundColor: '#1b1b1d', borderColor: '#2a2a2d', borderRadius: '8px' }

export default function AnalyticsPage() {
  const { data: playlists } = usePlaylists()
  const { data: transfers, isLoading } = useTransfers()
  const jobs = transfers ?? []

  const tracksTransferred = jobs.reduce((sum, t) => sum + t.transferredTracks, 0)
  const completed = jobs.filter((t) => t.status === 'COMPLETED').length
  const failed = jobs.filter((t) => t.status === 'FAILED').length
  const successRate = completed + failed === 0 ? null : Math.round((completed / (completed + failed)) * 100)

  // tracks transferred per month, last 6 months
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString(undefined, { month: 'short' }), tracks: 0 }
  })
  jobs.forEach((t) => {
    const d = new Date(t.createdAt)
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (bucket) bucket.tracks += t.transferredTracks
  })

  const toYoutube = jobs.filter((t) => t.destinationPlatform !== 'spotify').length
  const toSpotify = jobs.filter((t) => t.destinationPlatform === 'spotify').length
  const destinations = [
    { name: 'To YouTube', value: toYoutube, color: '#d62f33' },
    { name: 'To Spotify', value: toSpotify, color: '#22c55e' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader title="Analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Tracks transferred" value={tracksTransferred} icon={<ArrowRightLeft size={20} />} iconColor="text-accent-green" />
        <StatCard title="Transfers" value={jobs.length} icon={<ListChecks size={20} />} iconColor="text-brand-light" />
        <StatCard
          title="Success rate"
          value={successRate === null ? '-' : `${successRate}%`}
          icon={<CheckCircle size={20} />}
          iconColor="text-accent-green"
        />
        <StatCard title="Playlists" value={playlists?.length ?? 0} icon={<Music size={20} />} iconColor="text-brand-light" />
      </div>

      {!isLoading && jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-text-secondary">Charts appear after your first transfer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-white">Tracks per month</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months}>
                  <XAxis dataKey="month" stroke="#85858f" fontSize={11} />
                  <YAxis stroke="#85858f" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="tracks" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-white">Direction</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={destinations} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {destinations.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 text-xs text-text-secondary">
              {destinations.map((d) => (
                <span key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
