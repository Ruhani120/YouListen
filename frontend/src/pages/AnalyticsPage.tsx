import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { Music, ArrowRightLeft, Sparkles, TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  const monthlyData = [
    { month: 'Oct', transfers: 12, tracks: 340 },
    { month: 'Nov', transfers: 19, tracks: 580 },
    { month: 'Dec', transfers: 28, tracks: 890 },
    { month: 'Jan', transfers: 35, tracks: 1100 },
    { month: 'Feb', transfers: 42, tracks: 1420 },
  ]

  const platformDistribution = [
    { name: 'Spotify Exports', value: 68, color: '#10b981' },
    { name: 'YouTube Destination', value: 24, color: '#ef4444' },
    { name: 'Manual Curation', value: 8, color: '#8b5cf6' },
  ]

  const matchAccuracyTrends = [
    { batch: 'B-1', score: 91 },
    { batch: 'B-2', score: 94 },
    { batch: 'B-3', score: 92 },
    { batch: 'B-4', score: 96 },
    { batch: 'B-5', score: 97.4 },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        title="Migration & Library Analytics"
        description="Quantitative insights on song matching accuracy, platform distribution, and transfer throughput."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Transferred"
          value="1,420 Tracks"
          icon={<ArrowRightLeft size={20} />}
          change={18}
          changeLabel="Tracks migrated"
          iconColor="text-accent-green"
        />
        <StatCard
          title="Average Accuracy"
          value="97.4%"
          icon={<Sparkles size={20} />}
          change={2.4}
          changeLabel="Deterministic ISRC match"
          iconColor="text-accent-purple-light"
        />
        <StatCard
          title="Total Playlists"
          value="14"
          icon={<Music size={20} />}
          change={4}
          changeLabel="Imported libraries"
          iconColor="text-cyan-400"
        />
        <StatCard
          title="Avg Job Latency"
          value="34.2s"
          icon={<TrendingUp size={20} />}
          changeLabel="SQS worker duration"
          iconColor="text-accent-yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Volume */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Monthly Migration Volume</h3>
            <span className="text-xs text-text-muted">Tracks per month</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a24', borderColor: '#2a2a3a', borderRadius: '8px' }}
                />
                <Bar dataKey="tracks" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Match Accuracy Trend */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Match Confidence Trend (%)</h3>
            <span className="text-xs text-text-muted">Last 5 batches</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={matchAccuracyTrends}>
                <XAxis dataKey="batch" stroke="#64748b" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a24', borderColor: '#2a2a3a', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
