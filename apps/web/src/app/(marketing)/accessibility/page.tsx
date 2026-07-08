import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink py-20 px-6 selection:bg-ink selection:text-canvas">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-ink mb-12 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Accessibility Guide</h1>
          <p className="text-xl text-muted">Building an inclusive web is our core mission.</p>
        </div>
        
        <div className="space-y-8">
          <p className="text-muted leading-relaxed text-lg">
            At SignBridge, accessibility isn't an afterthought—it's the entire reason we exist. We are committed to ensuring our platform is usable by everyone, regardless of physical or cognitive ability.
          </p>

          <div className="bg-surface border border-line rounded-2xl p-8 space-y-6">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-ink text-lg mb-1">WCAG 2.1 AA Compliant</h3>
                <p className="text-muted text-sm">We strictly adhere to Web Content Accessibility Guidelines. All colors maintain a minimum contrast ratio of 4.5:1, and text is easily scalable.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-ink text-lg mb-1">Screen Reader Optimization</h3>
                <p className="text-muted text-sm">Every interactive element has precise ARIA labels. Dynamic content updates, like real-time translations, use aria-live regions so screen readers can announce them seamlessly.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-ink text-lg mb-1">Keyboard Navigation</h3>
                <p className="text-muted text-sm">You can navigate the entire platform without a mouse. Focus states are highly visible, and we provide skip-links to bypass repetitive navigation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
