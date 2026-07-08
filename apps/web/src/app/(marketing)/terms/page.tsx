import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="mb-12 border-b border-line pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-ink">Terms of Service</h1>
        <p className="text-xl text-muted">Effective Date: July 8, 2026</p>
      </div>
      
      <div className="prose prose-invert prose-blue max-w-none text-muted space-y-8">
        <p className="text-lg leading-relaxed">
          Welcome to SignBridge. Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the SignBridge website, API, or applications (the "Service") operated by SignBridge Inc. ("us", "we", or "our").
        </p>
        <p className="text-lg leading-relaxed font-medium text-ink">
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">1. Description of Service</h2>
          <p className="leading-relaxed">
            SignBridge is an AI-powered platform providing real-time, bi-directional translation between sign languages and spoken/written languages utilizing edge machine learning. We provide consumer-facing web applications, mobile applications, and developer APIs.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">2. Accounts and Registration</h2>
          <p className="leading-relaxed mb-4">When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>You are responsible for safeguarding the password or authentication methods (e.g., Google OAuth) that you use to access the Service.</li>
            <li>You agree not to disclose your password to any third party.</li>
            <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">3. Acceptable Use and Conduct</h2>
          <p className="leading-relaxed mb-4">You agree not to use the Service:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>To exploit, harm, or attempt to exploit or harm minors in any way.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent.</li>
            <li>To attempt to reverse-engineer, decompile, or extract the proprietary machine learning models, weights, or architecture delivered to your browser via our edge computing infrastructure.</li>
            <li>To abuse the API by exceeding rate limits, scraping endpoints, or circumventing authentication mechanisms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">4. Intellectual Property</h2>
          <p className="leading-relaxed">
            The Service and its original content (excluding User Content), features, functionality, and machine learning models are and will remain the exclusive property of SignBridge Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of SignBridge Inc.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">5. Disclaimer regarding AI Translation</h2>
          <p className="leading-relaxed p-6 bg-surface border border-line rounded-xl text-ink font-medium">
            SignBridge utilizes experimental artificial intelligence to translate complex human languages. While we strive for extreme accuracy, machine translation is inherently imperfect. We do not guarantee the absolute accuracy, completeness, or reliability of any translations provided by the Service. SignBridge should NOT be relied upon as the sole method of communication in life-threatening, medical, legal, or emergency situations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">6. Limitation of Liability</h2>
          <p className="leading-relaxed">
            In no event shall SignBridge, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content or translations obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">7. Termination</h2>
          <p className="leading-relaxed">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">8. Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions about these Terms, please contact our legal team at <a href="mailto:legal@signbridge.io" className="text-blue-400 hover:underline">legal@signbridge.io</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
