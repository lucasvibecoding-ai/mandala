import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Mandala Class",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-serif tracking-tight mb-8 text-cream">
        Privacy Policy
      </h1>
      <p className="text-muted mb-8">Last updated: March 25, 2026</p>

      <div className="space-y-8 text-lg leading-relaxed text-muted">
        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">1. Information We Collect</h2>
          <p>
            When you purchase our course or visit our website, we may collect the following
            information:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Name and email address (when you make a purchase)</li>
            <li>Payment information (processed securely through Stripe or PayPal. We never store your card details)</li>
            <li>Usage data such as pages visited, time spent on site, and referring URLs</li>
            <li>Device and browser information collected automatically</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To process your purchase and deliver course access</li>
            <li>To send you purchase confirmations and account related emails</li>
            <li>To improve our website and course content</li>
            <li>To respond to customer support requests</li>
          </ul>
          <p className="mt-3">
            We will never sell, rent, or share your personal information with third parties
            for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">3. Payment Processing</h2>
          <p>
            All payments are processed through Stripe and PayPal. These services handle your
            payment information directly. We do not store credit card numbers, CVVs, or
            banking details on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">4. Cookies</h2>
          <p>
            We use essential cookies to keep the site functioning properly and analytics
            cookies to understand how visitors use our site. You can disable cookies in your
            browser settings, though this may affect site functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as
            needed to provide you with course access. If you request deletion of your data,
            we will remove it within 30 days, except where we are legally required to retain
            it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">7. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:hello@mandalaclass.com" className="text-gold underline">
              hello@mandalaclass.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8" style={{ borderTop: '1px solid rgba(217,207,192,0.5)' }}>
        <a href="/" className="text-gold hover:underline">&larr; Back to home</a>
      </div>
    </main>
  );
}
