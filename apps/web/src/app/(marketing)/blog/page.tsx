import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: "How we achieved <50ms latency for real-time sign recognition",
      date: "July 2, 2026",
      tag: "Engineering",
      excerpt: "A deep dive into our custom edge-ML architecture, WebAssembly optimizations, and how we got neural networks to run at 60fps in the browser."
    },
    {
      title: "Expanding to Regional Languages: Gujarati and Beyond",
      date: "June 15, 2026",
      tag: "Product",
      excerpt: "SignBridge now natively translates Indian Sign Language into regional languages, breaking down even more geographical communication barriers."
    },
    {
      title: "Announcing the SignBridge Community Open Source Fund",
      date: "May 28, 2026",
      tag: "Community",
      excerpt: "We are pledging $100k to open-source developers building accessibility tools for the deaf and hard-of-hearing communities."
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink py-20 px-6 selection:bg-ink selection:text-canvas">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-ink mb-12 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight">The SignBridge Blog</h1>
          <p className="text-xl text-muted">Updates, engineering deep dives, and community stories.</p>
        </div>
        
        <div className="space-y-6">
          {posts.map((post, i) => (
            <div key={i} className="group bg-surface border border-line rounded-2xl p-8 hover:border-blue-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-wider">{post.tag}</span>
                <span className="text-xs text-muted flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.date}</span>
              </div>
              <h2 className="text-2xl font-bold text-ink mb-3 group-hover:text-blue-400 transition-colors">{post.title}</h2>
              <p className="text-muted leading-relaxed">{post.excerpt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
