import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="mb-12 border-b border-line pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-ink">Privacy Policy</h1>
        <p className="text-xl text-muted">Effective Date: July 8, 2026</p>
      </div>
      
      <div className="prose prose-invert prose-blue max-w-none text-muted space-y-8">
        <p className="text-lg leading-relaxed">
          At SignBridge ("we," "us," or "our"), privacy is not an afterthought—it is a foundational pillar of our platform. We recognize that communication is inherently intimate and private. Because our core service involves processing camera feeds to translate sign language, we have engineered our architecture around <strong className="text-ink">Edge Machine Learning</strong> to ensure maximum privacy and security.
        </p>

        <section className="bg-surface border border-line rounded-2xl p-8 my-10">
          <h2 className="text-2xl font-bold text-ink mb-4 mt-0">1. The Edge AI Privacy Guarantee</h2>
          <p className="leading-relaxed">
            Our translation models operate entirely via Edge Machine Learning directly within your web browser. This means:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
            <li><strong className="text-ink">No Video Transmission:</strong> Your live camera feed is never sent to our servers.</li>
            <li><strong className="text-ink">No Server-Side Image Processing:</strong> The heavy lifting of sign language recognition happens locally on your device's GPU/CPU.</li>
            <li><strong className="text-ink">No Recording:</strong> We do not record, store, or have any technical ability to access your video feed or images.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">2. Information We Collect</h2>
          <p className="leading-relaxed mb-4">While we do not collect your video feed, we do collect minimal information necessary to provide and improve our services:</p>
          <ul className="list-disc list-inside space-y-3 ml-4">
            <li><strong className="text-ink">Account Information:</strong> When you register, we collect your name, email address, and authentication credentials (such as Google OAuth tokens).</li>
            <li><strong className="text-ink">Telemetry and Usage Data:</strong> We collect anonymous metrics such as translation latency, error rates, browser type, and operating system to monitor platform health.</li>
            <li><strong className="text-ink">Translation Text (Opt-In):</strong> By default, the text generated from translations is ephemeral. If you explicitly choose to save a conversation to your "History," that text is encrypted and stored on our servers so you can retrieve it later.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">3. How We Use Your Information</h2>
          <p className="leading-relaxed mb-4">We use the collected information for the following purposes:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>To authenticate you and secure your account.</li>
            <li>To synchronize your saved translation history across your devices.</li>
            <li>To analyze performance bottlenecks and improve our local machine learning models.</li>
            <li>To communicate important service updates or security alerts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">4. Data Sharing and Disclosure</h2>
          <p className="leading-relaxed mb-4">We will never sell your personal information to third parties. We only share information under the following strict circumstances:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-ink">Service Providers:</strong> We share data with trusted third-party hosting and infrastructure providers (e.g., AWS, Vercel) strictly for the purpose of operating the application.</li>
            <li><strong className="text-ink">Legal Compliance:</strong> We may disclose information if required by law, subpoena, or other legal processes, provided we believe the disclosure is legally mandated.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">5. Security of Your Data</h2>
          <p className="leading-relaxed">We implement robust, industry-standard security measures including AES-256 encryption for data at rest and TLS 1.3 for data in transit. Despite our best efforts, no method of transmission over the Internet is 100% secure. Therefore, we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">6. Your Data Rights</h2>
          <p className="leading-relaxed mb-4">Depending on your jurisdiction (such as under the GDPR or CCPA), you have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access the personal data we hold about you.</li>
            <li>Request the deletion of your account and all associated data.</li>
            <li>Opt-out of telemetry and analytics collection via your account settings.</li>
          </ul>
          <p className="mt-4">To exercise these rights, please contact us at <a href="mailto:privacy@signbridge.io" className="text-blue-400 hover:underline">privacy@signbridge.io</a>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-4">7. Changes to This Privacy Policy</h2>
          <p className="leading-relaxed">We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. We will notify you of any material changes via email or a prominent notice on our platform prior to the change becoming effective.</p>
        </section>
      </div>
    </div>
  );
}
