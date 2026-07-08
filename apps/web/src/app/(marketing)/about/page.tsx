import Link from 'next/link';
import { ArrowLeft, Heart, Globe, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink py-20 px-6 selection:bg-ink selection:text-canvas">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-ink mb-12 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight">About SignBridge</h1>
          <p className="text-xl text-muted">Building the universal translator for sign languages.</p>
        </div>
        
        <div className="space-y-8 text-lg text-muted leading-relaxed">
          <p>
            SignBridge was born out of a simple observation: while machine translation for spoken languages has advanced leaps and bounds, sign languages have been largely left behind. We are a team of AI researchers, deaf advocates, and engineers dedicated to changing that.
          </p>
          <p>
            Our mission is to provide real-time, bi-directional translation between sign languages (starting with Indian Sign Language) and spoken/written languages, enabling fluid, natural conversations.
          </p>
          
          <h2 className="text-2xl font-bold text-ink mt-12 mb-6 border-b border-line pb-2">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-line rounded-2xl p-6">
              <Heart className="w-6 h-6 text-emerald-400 mb-4" />
              <h3 className="font-bold text-ink mb-2">Built with the Community</h3>
              <p className="text-sm">We don't build *for* the deaf community, we build *with* them. Our models are trained and validated by native signers.</p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-6">
              <Shield className="w-6 h-6 text-blue-400 mb-4" />
              <h3 className="font-bold text-ink mb-2">Privacy by Design</h3>
              <p className="text-sm">We use edge computing. Your camera feed stays on your device, ensuring complete privacy during intimate conversations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
