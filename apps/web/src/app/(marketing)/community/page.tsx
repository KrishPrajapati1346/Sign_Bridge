import Link from 'next/link';
import { ArrowLeft, MessageSquare, Code2, Calendar } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink py-20 px-6 selection:bg-ink selection:text-canvas">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-ink mb-12 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Community Hub</h1>
          <p className="text-xl text-muted">Join the movement to break down communication barriers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl p-6 hover:bg-[#5865F2]/20 transition-colors cursor-pointer flex flex-col">
            <MessageSquare className="w-8 h-8 text-[#5865F2] mb-4" />
            <h3 className="font-bold text-ink mb-2">Discord Server</h3>
            <p className="text-sm text-muted mb-6 flex-1">Chat directly with the engineering team, linguists, and other developers building on our platform.</p>
            <button className="text-sm font-bold text-white bg-[#5865F2] px-4 py-2.5 rounded-xl w-full">Join Discord</button>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer flex flex-col">
            <Code2 className="w-8 h-8 text-ink mb-4" />
            <h3 className="font-bold text-ink mb-2">Open Source</h3>
            <p className="text-sm text-muted mb-6 flex-1">Contribute to our open-source datasets, UI components, and edge-learning pipelines on GitHub.</p>
            <button className="text-sm font-bold text-canvas bg-ink px-4 py-2.5 rounded-xl w-full">View Repository</button>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-6 hover:border-amber-500/50 transition-colors cursor-pointer flex flex-col">
            <Calendar className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="font-bold text-ink mb-2">Upcoming Events</h3>
            <p className="text-sm text-muted mb-6 flex-1">Join our monthly town halls, accessibility workshops, and hackathons focused on inclusive tech.</p>
            <button className="text-sm font-bold text-amber-900 bg-amber-500 px-4 py-2.5 rounded-xl w-full hover:bg-amber-400 transition-colors">View Calendar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
