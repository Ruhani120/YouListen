import { Link } from 'react-router-dom'
import {
  Music,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  Database,
  Radio,
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: UploadCloud,
      title: 'Lossless Spotify Export Import',
      desc: 'Seamlessly upload your Spotify exported playlists in standard CSV and JSON formats with comprehensive field validation.',
    },
    {
      icon: Sparkles,
      title: 'Deterministic Match Engine',
      desc: 'Smart, deterministic title, artist, and ISRC comparison ranking ensures accurate song matches without brittle ML dependencies.',
    },
    {
      icon: Radio,
      title: 'Direct YouTube Creation',
      desc: 'Generate official YouTube playlists with preserved track order, automated video linking, and instant transfer summaries.',
    },
    {
      icon: Layers,
      title: 'Centralized Music Management',
      desc: 'Unify and organize playlists across platforms from a single dark, high-performance web dashboard.',
    },
    {
      icon: Database,
      title: 'Enterprise PostgreSQL Core',
      desc: 'Robust relational schema ensuring complete user data isolation, transactional integrity, and job history tracking.',
    },
    {
      icon: Zap,
      title: 'Cloud Computing Ready',
      desc: 'Engineered for asynchronous SQS background jobs, ECS Fargate horizontal scaling, and S3 persistent storage.',
    },
  ]

  const metrics = [
    { value: '100%', label: 'Deterministic Matching' },
    { value: '30+', label: 'Core Platform Features' },
    { value: 'Zero', label: 'Vendor Lock-in' },
    { value: '<200ms', label: 'API Response Time' },
  ]

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-purple selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-bg-border/60 bg-bg-primary/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-purple to-accent-purple-light flex items-center justify-center shadow-lg shadow-accent-purple/20">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-accent-purple-light">
              YouListen
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#cloud" className="hover:text-white transition-colors">Cloud Architecture</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm px-4 py-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-accent-purple/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-accent-purple-light text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles size={14} />
            <span>Next-Gen Music Playlist Migration System</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight md:leading-none mb-6">
            Your Music Library.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple-light via-indigo-400 to-accent-green">
              Everywhere You Listen.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate cross-platform friction. Import your Spotify playlists, match tracks deterministically, and export directly to YouTube with complete precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto btn-primary px-8 py-3.5 text-base shadow-xl shadow-accent-purple/20 flex items-center justify-center gap-2"
            >
              <span>Start Migrating Now</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-base flex items-center justify-center"
            >
              Explore Live Demo
            </Link>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-20 pt-10 border-t border-bg-border/60">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{m.value}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 border-t border-bg-border/60 bg-bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">How YouListen Migrates Music</h2>
            <p className="text-text-secondary text-sm md:text-base">
              A clear 4-step pipeline ensuring complete transparency and user control at every phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Export & Upload', desc: 'Export from Spotify in CSV or JSON and drag it into YouListen.' },
              { step: '02', title: 'Deterministic Match', desc: 'Our engine identifies track titles, artists, duration, and ISRC records.' },
              { step: '03', title: 'Review & Verify', desc: 'Inspect confidence scores and manually correct any ambiguous matches.' },
              { step: '04', title: 'YouTube Creation', desc: 'Create the destination YouTube playlist and transfer tracks in exact sequence.' },
            ].map((s) => (
              <div key={s.step} className="card relative group hover:border-accent-purple/50 transition-all">
                <div className="text-3xl font-black text-accent-purple/30 group-hover:text-accent-purple/60 transition-colors mb-3">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">{s.title}</h3>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Architected for Accuracy & Scale</h2>
            <p className="text-text-secondary text-sm md:text-base">
              Combining a responsive user interface with resilient Spring Boot services and scalable cloud design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card hover:border-accent-purple/40 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/15 text-accent-purple-light flex items-center justify-center mb-5">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cloud Callout */}
      <section id="cloud" className="py-20 border-t border-bg-border/60 bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <ShieldCheck className="w-12 h-12 text-accent-green mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Final-Year Cloud Computing Architecture</h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-sm md:text-base mb-8">
            Complete decoupling of web APIs and background execution. Designed with Amazon SQS for asynchronous job distribution, RDS PostgreSQL for relational persistence, and ECS Fargate for independent worker elasticity.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Docker', 'PostgreSQL 16', 'Spring Boot 3', 'JWT Auth', 'AWS SQS', 'AWS S3', 'ECS Fargate'].map((badge) => (
              <span key={badge} className="px-3.5 py-1.5 rounded-lg bg-bg-elevated border border-bg-border text-xs font-semibold text-text-primary">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bg-border/60 py-10 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-accent-purple" />
            <span className="font-semibold text-text-primary">YouListen</span>
            <span>&copy; 2026. Academic Cloud Computing Project.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white">Sign In</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
            <span>v1.0.0-phase1</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
