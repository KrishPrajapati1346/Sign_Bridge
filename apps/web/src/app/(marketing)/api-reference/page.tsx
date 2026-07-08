import Link from 'next/link';
import { ArrowLeft, Code } from 'lucide-react';

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink py-20 px-6 selection:bg-ink selection:text-canvas">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-ink mb-12 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight">API Reference</h1>
          <p className="text-xl text-muted">Integrate our translation engine into your own applications.</p>
        </div>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-ink mb-4 flex items-center gap-2"><Code className="w-6 h-6 text-blue-400"/> Authentication</h2>
            <p className="text-muted mb-4">All API requests require a Bearer token in the authorization header.</p>
            <div className="bg-[#0D1117] border border-line rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-blue-300"><code>Authorization: Bearer sb_live_xxxxxxxxxxxxx</code></pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-4">WebSocket Connection</h2>
            <p className="text-muted mb-4">For real-time translation, connect to our WebSocket endpoint. The connection expects binary frame data containing normalized hand landmarks.</p>
            <div className="bg-[#0D1117] border border-line rounded-xl p-4 overflow-x-auto mb-4">
              <pre className="text-sm text-emerald-300"><code>wss://api.signbridge.io/v1/stream</code></pre>
            </div>
            <div className="bg-surface border border-line rounded-xl p-6">
              <h4 className="font-bold text-ink mb-2">Message Format (JSON)</h4>
              <ul className="list-disc list-inside text-sm text-muted space-y-2">
                <li><code className="text-blue-400">timestamp</code>: Epoch time in milliseconds</li>
                <li><code className="text-blue-400">landmarks</code>: Array of 21 3D coordinates (MediaPipe format)</li>
                <li><code className="text-blue-400">languageId</code>: Target spoken language ('en', 'hi', 'gu')</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
