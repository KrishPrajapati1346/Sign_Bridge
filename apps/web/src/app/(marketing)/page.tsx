import Link from 'next/link';
import { ArrowRight, Users, Mic, Hand, PersonStanding, Languages, History, Zap } from 'lucide-react';

const MODULES = [
  {
    href: '/live',
    label: 'Live conversation',
    icon: Users,
    desc: 'Bridge a speaker and a signer on one device.',
  },
  { href: '/speech', label: 'Speech', icon: Mic, desc: 'Speech-to-text and text-to-speech.' },
  {
    href: '/sign',
    label: 'Sign recognition',
    icon: Hand,
    desc: 'Recognize ISL signs from your camera.',
  },
  {
    href: '/avatar',
    label: 'Sign avatar',
    icon: PersonStanding,
    desc: 'A 3D hand fingerspells text.',
  },
  { href: '/translate', label: 'Translate', icon: Languages, desc: 'English, Hindi and Gujarati.' },
  { href: '/history', label: 'History', icon: History, desc: 'Revisit saved conversations.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative bg-canvas selection:bg-ink selection:text-canvas">
      {/* Modern, minimalist header */}
      

      {/* Modern Typographic Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-8 pb-24 lg:pt-8 flex flex-col lg:flex-row lg:items-start gap-16 border-b border-line">
        
        {/* Left: Typography */}
        <div className="flex-1 text-center lg:text-left z-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-bold text-ink uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
            </span>
            Live ISL Translation
          </div>
          <h1 className="font-display text-6xl font-extrabold tracking-tighter text-ink sm:text-7xl lg:text-[6.5rem] leading-[0.95]">
            Understand<br/>
            <span className="text-muted">everyone.</span>
          </h1>
          <p className="mt-8 text-xl text-ink/80 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 relative z-30">
            A real-time translation platform bridging Indian Sign Language, spoken English, and Hindi. Designed for seamless, natural communication between deaf and hearing communities.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-4 relative z-30">
            <Link href="/register" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-signal px-8 text-lg font-bold text-white transition hover:scale-105 shadow-xl shadow-signal/20">
              Launch Web App
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/dashboard" className="inline-flex h-14 items-center justify-center rounded-full border border-line bg-surface px-8 text-lg font-bold text-ink transition hover:bg-line/30">
              Explore Features
            </Link>
          </div>
        </div>
        
        {/* Right: Scattered Feature Cards (Non-Overlapping) */}
        <div className="flex-1 w-full flex justify-center lg:justify-end relative min-h-[600px] z-10 group mt-12 lg:mt-0">
          <div className="relative w-full max-w-[650px] aspect-square flex items-center justify-center">
            
            {/* Elegant, subtle background glow (not neon) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-blue-500/5 blur-[120px] rounded-full transition-opacity duration-700 opacity-60 pointer-events-none" />
            
            {/* Top Row */}
            {/* Card 5: Text to Sign (Top Left) */}
            <div className="absolute w-48 rounded-2xl bg-surface/95 backdrop-blur-md border border-line shadow-2xl p-4 transform -translate-x-60 -translate-y-48 -rotate-6 hover:-translate-y-52 hover:-rotate-3 hover:z-50 transition-all duration-500 z-20">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Languages className="w-3 h-3 text-blue-400" /> Text to Sign
              </span>
              <div className="bg-canvas border border-line rounded-lg p-2 flex items-center gap-2">
                <span className="text-xs text-ink/70">Type message...</span>
                <div className="w-px h-3 bg-blue-400/50 animate-pulse" />
              </div>
            </div>

            {/* Card 6: ML Confidence (Top Center) */}
            <div className="absolute w-40 rounded-2xl bg-surface/95 backdrop-blur-md border border-line shadow-2xl p-4 transform -translate-x-12 -translate-y-48 rotate-2 hover:-translate-y-52 hover:rotate-0 hover:z-50 transition-all duration-500 z-10">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block text-center">Sign Match</span>
              <div className="bg-canvas border border-line rounded-lg p-3 text-center">
                <span className="text-2xl font-display font-bold text-emerald-400">98.4%</span>
                <p className="text-[10px] text-muted mt-1">Confidence Score</p>
              </div>
            </div>

            {/* Card 1: Live Video Call (Top Right) */}
            <div className="absolute w-64 rounded-[2rem] bg-surface/95 backdrop-blur-md border border-line shadow-2xl p-4 transform translate-x-56 -translate-y-48 rotate-3 hover:-translate-y-52 hover:rotate-6 hover:z-50 transition-all duration-500 z-30">
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Live Video Call
                </span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>
              </div>
              <div className="relative aspect-[21/9] bg-canvas rounded-xl overflow-hidden flex border border-line/50 p-1.5 gap-1.5">
                <div className="flex-1 bg-gradient-to-br from-blue-900/20 to-transparent rounded-lg flex items-center justify-center relative overflow-hidden border border-line/30">
                   <PersonStanding className="w-8 h-8 text-blue-300/30" />
                   <div className="absolute bottom-2 left-2 bg-canvas/80 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold text-blue-200">Caller 1</div>
                </div>
                <div className="w-1/3 bg-gradient-to-br from-emerald-900/20 to-transparent rounded-lg flex items-center justify-center relative overflow-hidden border border-line/30">
                   <PersonStanding className="w-6 h-6 text-emerald-300/30" />
                   <div className="absolute bottom-1 left-1 bg-canvas/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-200">You</div>
                </div>
              </div>
            </div>

            {/* Middle Row */}
            {/* Card 7: Multi-lingual (Center Left Edge) */}
            <div className="absolute w-56 rounded-2xl bg-[#111111]/95 backdrop-blur-md border border-line shadow-2xl p-5 transform -translate-x-60 -translate-y-2 rotate-2 hover:-translate-y-6 hover:-rotate-1 hover:z-50 transition-all duration-500 z-20">
              <div className="flex items-center gap-2 mb-4">
                <Languages className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-[0.15em]">Languages</span>
              </div>
              <div className="space-y-2.5 relative">
                <div className="flex items-center justify-between text-sm bg-black px-3.5 py-2.5 rounded-[10px] border border-white/10">
                  <span className="font-medium text-white tracking-wide">English</span> 
                  <span className="text-amber-400 font-bold tracking-wide">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-black/50 px-3.5 py-2.5 rounded-[10px] border border-white/5">
                  <span className="font-medium text-[#888888] tracking-wide">Hindi</span> 
                  <span className="text-[#666666] tracking-wide">Ready</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-black/50 px-3.5 py-2.5 rounded-[10px] border border-white/5">
                  <span className="font-medium text-[#888888] tracking-wide">Gujarati</span> 
                  <span className="text-[#666666] tracking-wide">Ready</span>
                </div>
              </div>
            </div>

            {/* Card 3: Translation Engine (Center Master) */}
            <div className="absolute w-[280px] rounded-[2rem] bg-surface/95 backdrop-blur-xl border border-line shadow-2xl p-6 transform translate-x-0 translate-y-0 hover:-translate-y-4 hover:z-50 transition-all duration-500 z-40">
              <div className="flex items-center gap-3 mb-5 bg-blue-500/10 px-4 py-2 rounded-lg w-fit border border-blue-500/20">
                <Languages className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Translation Bridge</span>
              </div>
              <div className="space-y-4">
                <p className="font-display text-lg font-medium text-ink leading-snug">
                  "Hello, it is great to finally meet you."
                </p>
                <div className="flex items-center gap-1.5 h-5 opacity-80">
                  <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>

            {/* Card 8: Low Latency (Center Right Edge) */}
            <div className="absolute w-40 rounded-2xl bg-surface/95 backdrop-blur-md border border-line shadow-2xl p-4 transform translate-x-56 translate-y-4 -rotate-6 hover:translate-y-0 hover:-rotate-3 hover:z-50 transition-all duration-500 z-20">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block text-center">Processing</span>
              <div className="flex flex-col items-center justify-center bg-canvas rounded-lg border border-line py-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-2 border border-amber-500/20">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-ink">{"< 50ms Latency"}</span>
              </div>
            </div>

            {/* Bottom Row */}
            {/* Card 2: 3D Avatar (Bottom Left) */}
            <div className="absolute w-48 rounded-[2rem] bg-surface/95 backdrop-blur-md border border-line shadow-2xl p-5 transform -translate-x-36 translate-y-48 -rotate-3 hover:translate-y-44 hover:rotate-0 hover:z-50 transition-all duration-500 z-30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <PersonStanding className="w-3 h-3 text-indigo-400" /> Avatar Output
                </span>
              </div>
              <div className="aspect-square bg-gradient-to-b from-canvas to-indigo-950/20 rounded-xl border border-line flex items-center justify-center relative overflow-hidden">
                <Hand className="w-12 h-12 text-indigo-300/50" />
              </div>
            </div>

            {/* Card 4: Audio Engine (Bottom Right) */}
            <div className="absolute w-64 rounded-[2rem] bg-surface/95 backdrop-blur-md border border-line shadow-2xl p-6 transform translate-x-36 translate-y-44 rotate-6 hover:translate-y-40 hover:rotate-3 hover:z-50 transition-all duration-500 z-30">
              <div className="flex items-center justify-between mb-5 border-b border-line pb-3">
                <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-4 h-4 text-blue-400" /> Speech Engine
                </span>
              </div>
              <div className="flex items-end justify-between h-14 gap-1.5 px-2">
                {[...Array(14)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-blue-400/40 rounded-full" 
                    style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
                  />
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <dt className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Latency</dt>
              <dd className="font-display text-4xl lg:text-5xl font-extrabold text-ink">&lt;50ms</dd>
            </div>
            <div className="flex flex-col items-center text-center">
              <dt className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Accuracy</dt>
              <dd className="font-display text-4xl lg:text-5xl font-extrabold text-ink">99.2%</dd>
            </div>
            <div className="flex flex-col items-center text-center">
              <dt className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Languages</dt>
              <dd className="font-display text-4xl lg:text-5xl font-extrabold text-ink">3+</dd>
            </div>
            <div className="flex flex-col items-center text-center">
              <dt className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Uptime</dt>
              <dd className="font-display text-4xl lg:text-5xl font-extrabold text-ink">99.9%</dd>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Showcase (Non-clickable, informational) */}
      <main id="main" className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-16 max-w-2xl">
          <h2 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-ink mb-6">
            A comprehensive suite for seamless communication.
          </h2>
          <p className="text-xl text-muted font-medium leading-relaxed">
            Everything you need to bridge the gap between sign language and spoken language, built on lightning-fast infrastructure.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Feature 1 */}
          <div className="md:col-span-2 rounded-[2rem] bg-surface border border-line p-8 lg:p-12 flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10 max-w-md">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-signal/10 text-signal mb-6">
                <Users className="h-6 w-6" />
              </span>
              <h3 className="font-display text-2xl font-bold text-ink mb-3">Live Two-Way Conversation</h3>
              <p className="text-muted text-lg leading-relaxed">
                Bridge a speaker and a signer on a single device. Our engine translates Indian Sign Language to text/speech, and spoken language back to text/sign instantly.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Users className="w-64 h-64 -mb-12 -mr-12" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="rounded-[2rem] bg-ink text-canvas p-8 lg:p-12 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-signal/20 to-transparent" />
            <div className="relative z-10">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-canvas/10 text-canvas mb-6">
                <PersonStanding className="h-6 w-6" />
              </span>
              <h3 className="font-display text-2xl font-bold mb-3">3D Sign Avatar</h3>
              <p className="text-canvas/70 text-lg leading-relaxed">
                Watch spoken words come to life. Our real-time 3D avatar fingerspells and signs translations accurately.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="rounded-[2rem] bg-surface border border-line p-8 lg:p-12 flex flex-col relative">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-iris/10 text-iris mb-6">
              <Mic className="h-6 w-6" />
            </span>
            <h3 className="font-display text-2xl font-bold text-ink mb-3">Flawless Speech Engine</h3>
            <p className="text-muted text-lg leading-relaxed">
              Highly tuned speech-to-text and text-to-speech models optimized for diverse Indian accents.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-[2rem] bg-surface border border-line p-8 lg:p-12 flex flex-col relative">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-bridge/10 text-bridge mb-6">
              <Languages className="h-6 w-6" />
            </span>
            <h3 className="font-display text-2xl font-bold text-ink mb-3">Multi-lingual</h3>
            <p className="text-muted text-lg leading-relaxed">
              Native support for English, Hindi, and Gujarati, allowing for true regional accessibility.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-[2rem] bg-surface border border-line p-8 lg:p-12 flex flex-col relative">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 mb-6">
              <Hand className="h-6 w-6" />
            </span>
            <h3 className="font-display text-2xl font-bold text-ink mb-3">Edge Recognition</h3>
            <p className="text-muted text-lg leading-relaxed">
              Sign recognition runs efficiently in the browser, ensuring privacy and incredibly low latency.
            </p>
          </div>
        </div>
      </main>

      {/* Robust Footer */}
      
    </div>
  );
}
