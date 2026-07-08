import Link from 'next/link';
import { ArrowLeft, BookOpen, Terminal, Video } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink py-20 px-6 selection:bg-ink selection:text-canvas">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-ink mb-12 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Documentation</h1>
          <p className="text-xl text-muted">Everything you need to integrate and use SignBridge.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-line rounded-2xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform"><BookOpen className="w-5 h-5"/></div>
            <h3 className="text-lg font-bold text-ink mb-2">Quick Start Guide</h3>
            <p className="text-muted text-sm leading-relaxed">Learn how to set up your first real-time translation session in under 5 minutes.</p>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform"><Video className="w-5 h-5"/></div>
            <h3 className="text-lg font-bold text-ink mb-2">Camera & Privacy</h3>
            <p className="text-muted text-sm leading-relaxed">Understand how our Edge ML models process camera feeds locally without compromising privacy.</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-ink border-b border-line pb-2 mb-4">Core Concepts</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>SignBridge operates on a revolutionary edge-computing architecture. Unlike traditional translation services that send your data to the cloud, our sign language recognition models are downloaded once and run entirely in your browser.</p>
              <p>This allows us to achieve incredibly low latency (less than 50ms) while ensuring your camera feed never leaves your local device.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
