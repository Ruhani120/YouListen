import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  ListMusic,
  Music,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Bring your playlist',
    description: 'Import from Spotify, YouTube, or upload a CSV or JSON playlist file.',
    icon: Upload,
  },
  {
    number: '02',
    title: 'Match your tracks',
    description: 'YouListen finds the closest song matches on your destination platform.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Review the results',
    description: 'Check suggested matches, make edits, and keep the songs you want.',
    icon: CheckCircle2,
  },
  {
    number: '04',
    title: 'Take your music along',
    description: 'Transfer your reviewed playlist and keep listening where you like.',
    icon: ArrowLeftRight,
  },
]

const features = [
  {
    title: 'Your playlists, your way',
    description: 'Start with a connected music platform or bring in a playlist file you already have.',
    icon: ListMusic,
  },
  {
    title: 'Review before transfer',
    description: 'See proposed matches first, so you stay in control of what makes it across.',
    icon: CheckCircle2,
  },
  {
    title: 'A smoother handoff',
    description: 'Follow the matching and transfer journey from one clear workspace.',
    icon: ShieldCheck,
  },
]

const activityFeed = [
  {
    title: 'Late Night Mix',
    status: 'Transferred Successfully',
    isSuccess: true,
    cover: 'from-fuchsia-500 via-purple-600 to-indigo-700',
  },
  {
    title: 'Workout Jams',
    status: 'Awaiting Review',
    isSuccess: false,
    cover: 'from-amber-400 via-orange-500 to-rose-600',
  },
  {
    title: '80s Synth Pop',
    status: 'Awaiting Review',
    isSuccess: false,
    cover: 'from-teal-400 via-cyan-500 to-blue-600',
  },
  {
    title: 'Indie Drive',
    status: 'Awaiting Review',
    isSuccess: false,
    cover: 'from-emerald-400 via-teal-600 to-slate-700',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#070d19] bg-[radial-gradient(ellipse_at_15%_85%,rgba(45,212,191,0.14),transparent_42%),radial-gradient(ellipse_at_88%_18%,rgba(56,189,248,0.12),transparent_42%),linear-gradient(160deg,#060b16_0%,#0a1324_50%,#070e1c_100%)] text-white selection:bg-teal-400 selection:text-slate-950">
      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#070d19]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label="YouListen home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#34d399] via-[#2dd4bf] to-[#38bdf8] shadow-lg shadow-teal-500/20 transition-transform group-hover:scale-105">
              <Music className="h-5 w-5 text-[#06101d]" strokeWidth={2.6} />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">YouListen</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm font-medium text-slate-300/75 transition-colors hover:text-white">
              How it works
            </a>
            <a href="#features" className="text-sm font-medium text-slate-300/75 transition-colors hover:text-white">
              Why YouListen
            </a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/login" className="text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:border-teal-400/30 hover:bg-white/[0.11] sm:px-5"
            >
              Get started <ArrowRight className="h-4 w-4 text-teal-300" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative isolate">
          {/* Topographic Contour Lines SVG Background */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
            viewBox="0 0 1440 800"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="topo-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
                <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="topo-top" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#070d19" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Bottom-Left Wave Contours */}
            <g stroke="url(#topo-cyan)" strokeWidth="1.2">
              <path d="M-120 620 C 80 560, 220 710, 410 640 C 560 585, 650 740, 820 820" />
              <path d="M-100 660 C 100 600, 240 740, 430 675 C 580 620, 670 765, 840 840" />
              <path d="M-80 700 C 120 640, 260 770, 450 710 C 600 655, 690 790, 860 860" />
              <path d="M-60 740 C 140 680, 280 800, 470 745 C 620 690, 710 815, 880 880" />
              <path d="M-140 580 C 60 520, 200 680, 390 605 C 540 550, 630 715, 800 800" />
            </g>

            {/* Top-Right Wave Contours */}
            <g stroke="url(#topo-top)" strokeWidth="1.2">
              <path d="M1540 180 C 1340 240, 1210 90, 1020 160 C 870 215, 790 60, 620 -20" />
              <path d="M1520 140 C 1320 200, 1190 60, 1000 125 C 850 180, 770 35, 600 -40" />
              <path d="M1500 100 C 1300 160, 1170 30, 980 90 C 830 145, 750 10, 580 -60" />
              <path d="M1560 220 C 1360 280, 1230 120, 1040 195 C 890 250, 810 85, 640 0" />
            </g>
          </svg>

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1.15fr_0.95fr] lg:gap-8 lg:px-10 lg:pb-28 lg:pt-24">
            {/* COLUMN 1: Headline & Copy */}
            <div className="relative z-10 mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-teal-300">
                <Sparkles className="h-3.5 w-3.5" /> YOUR MUSIC, WITHOUT BORDERS
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.25rem]">
                Playlists.
                <br />
                Music.{' '}
                <span className="bg-gradient-to-r from-[#5eead4] via-[#7dd3fc] to-[#fda4af] bg-clip-text text-transparent">
                  InSync.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-300/75 sm:text-lg lg:mx-0">
                Effortless, automated playlist transfer between Spotify and YouTube. Import, match, review, and move your library in one workspace.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs font-medium text-slate-400 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-400" /> CSV & JSON import
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-400" /> Review song matches
                </span>
              </div>
            </div>

            {/* COLUMN 2: Center Sync Bridge & Primary Gradient CTA */}
            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
              {/* Sync Status Indicator */}
              <div className="mb-3 flex flex-col items-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <RefreshCw className="h-4 w-4 animate-spin text-teal-300 [animation-duration:6s]" />
                  <span>Ready to Sync</span>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#34d399] via-[#38bdf8] to-[#f87171]" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">86%</span>
                </div>
              </div>

              {/* Spotify -> Flowing Infinity Ribbon -> YouTube */}
              <div className="relative my-4 flex w-full items-center justify-between px-2 sm:px-4">
                {/* Ambient glow behind bridge */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/25 via-sky-400/15 to-rose-500/25 blur-2xl"
                />

                {/* Spotify Node */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#111c33] shadow-xl shadow-black/40 sm:h-20 sm:w-20">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ed760] text-[#06130b] shadow-md shadow-green-500/30 sm:h-11 sm:w-11">
                    <Music className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  </span>
                </div>

                {/* Flowing Infinity Wave SVG */}
                <svg
                  className="mx-[-8px] h-24 flex-1 overflow-visible"
                  viewBox="0 0 260 100"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="ribbon-one" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#1ed760" stopOpacity="0.65" />
                      <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#ff4545" stopOpacity="0.65" />
                    </linearGradient>
                    <linearGradient id="ribbon-two" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 50 C 65 -5, 195 105, 260 50"
                    stroke="url(#ribbon-one)"
                    strokeWidth="26"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0 50 C 65 105, 195 -5, 260 50"
                    stroke="url(#ribbon-two)"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                </svg>

                {/* YouTube Node */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#111c33] shadow-xl shadow-black/40 sm:h-20 sm:w-20">
                  <span className="flex h-10 w-12 items-center justify-center rounded-xl bg-[#ff2a2a] text-white shadow-md shadow-red-500/30 sm:h-11 sm:w-14">
                    <Play className="ml-0.5 h-5 w-5 fill-white" />
                  </span>
                </div>
              </div>

              {/* Mint-to-Coral Gradient CTA Button */}
              <Link
                to="/register"
                className="group mt-4 inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#5eead4] via-[#a7f3d0] to-[#fca5a5] px-7 py-4 text-base font-extrabold text-[#0b1322] shadow-[0_12px_32px_rgba(94,234,212,0.22)] transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                <span>Start Seamless Transfer</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#how-it-works"
                className="mt-3.5 text-xs font-medium text-slate-300/75 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
              >
                Or see how the 4-step workflow works
              </a>
            </div>

            {/* COLUMN 3: Recent Activity Feed Glass Card */}
            <div className="relative z-10 mx-auto w-full max-w-sm lg:ml-auto lg:mr-0">
              <div className="rounded-2xl border border-white/[0.09] bg-[#0d1628]/85 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl">
                <div className="border-b border-white/[0.07] pb-3.5">
                  <h2 className="text-sm font-bold text-white">Recent Activity Feed</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Automatic Sync Playlists</p>
                </div>

                <div className="mt-4 space-y-3.5">
                  {activityFeed.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 transition-colors hover:border-white/[0.09] hover:bg-white/[0.04]"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.cover} shadow-inner`}
                      >
                        <Music className="h-4 w-4 text-white/90" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{item.title}</p>
                        <p
                          className={`mt-0.5 truncate text-xs font-medium ${
                            item.isSuccess ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM STRIP */}
        <section className="border-y border-white/[0.07] bg-[#091120]/80">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-5 py-7 text-center sm:flex-row sm:gap-10 sm:px-8 lg:px-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Move music between
            </span>
            <div className="flex items-center gap-8">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white/85">
                <Music className="h-5 w-5 text-[#1ed760]" /> Spotify
              </span>
              <ArrowLeftRight className="h-4 w-4 text-slate-500" />
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white/85">
                <Play className="h-5 w-5 text-[#ff4545]" /> YouTube
              </span>
            </div>
            <span className="hidden text-xs text-slate-400 sm:inline">+ CSV / JSON playlist files</span>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Simple by design</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Four steps. One familiar soundtrack.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
              Take your playlists along without rebuilding your music library one song at a time.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1628]/90 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-[#111d34]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-[0.18em] text-teal-300/85">{step.number}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-200 transition-colors group-hover:border-teal-400/25 group-hover:bg-teal-400/10 group-hover:text-teal-300">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                  <div className="absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-teal-400/[0.05] blur-2xl transition-all group-hover:bg-teal-400/[0.12]" />
                </div>
              )
            })}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="scroll-mt-20 border-y border-white/[0.08] bg-[#091120]/85 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:py-24">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Made for your music</span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Less rebuilding.
                <br />
                More listening.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                Your playlists are personal. YouListen helps make moving them feel straightforward, with clear steps and a chance to review your matches.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-teal-300 transition-colors hover:text-teal-200"
              >
                Try YouListen <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/[0.08] bg-[#0d1628]/70 p-5 transition-colors hover:border-white/[0.16] hover:bg-[#111d34] sm:p-6"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-base font-bold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0d192e] via-[#0a1324] to-[#13172b] px-6 py-12 text-center sm:px-12 sm:py-16">
            <div aria-hidden="true" className="absolute -left-20 -top-28 h-72 w-72 rounded-full bg-teal-400/15 blur-[80px]" />
            <div aria-hidden="true" className="absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-rose-400/10 blur-[90px]" />
            <div className="relative">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34d399] to-[#2dd4bf] text-[#06101d] shadow-lg shadow-teal-500/20">
                <Music className="h-6 w-6" />
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Your next playlist is only a few steps away.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300/75 sm:text-base">
                Bring your playlist in, review the matches, and keep the music going.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5eead4] via-[#a7f3d0] to-[#fca5a5] px-7 py-3.5 text-sm font-extrabold text-[#0b1322] shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#060b16]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-7 sm:flex-row sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#34d399] to-[#2dd4bf]">
              <Music className="h-4 w-4 text-[#06101d]" />
            </span>
            <span className="text-sm font-extrabold text-white">YouListen</span>
          </Link>
          <p className="text-xs text-slate-400">Your playlists, wherever you listen.</p>
          <div className="flex items-center gap-5 text-xs font-medium text-slate-400">
            <Link to="/login" className="transition-colors hover:text-white">
              Sign in
            </Link>
            <Link to="/register" className="transition-colors hover:text-white">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}