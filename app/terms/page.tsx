import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Mandala Class",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-serif tracking-tight mb-8 text-cream">
        Terms of Service
      </h1>
      <p className="text-muted mb-8">Last updated: March 25, 2026</p>

      <div className="space-y-8 text-lg leading-relaxed text-muted">
        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">1. Overview</h2>
          <p>
            By purchasing and accessing the Mandala Masterclass (&quot;the Course&quot;),
            you agree to be bound by these Terms of Service. If you do not agree to these
            terms, please do not purchase or use the Course.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">2. Access &amp; License</h2>
          <p>
            Upon purchase, you are granted a personal, non-transferable, non-exclusive
            license to access the Course content for your own personal use. This
            license is for a single user only.
          </p>
          <p className="mt-3">You may not:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Share, redistribute, or resell the Course content</li>
            <li>Upload Course materials to any public or file sharing platform</li>
            <li>Use the content to create a competing product or course</li>
            <li>Share your account credentials with others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">3. Payment &amp; Pricing</h2>
          <p>
            The Course is available for a one time payment as listed on the checkout page.
            Prices are shown in EUR or USD depending on your location. Payment is processed securely through Stripe or PayPal.
            You will receive immediate access to the Course upon successful payment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">4. Refund Policy</h2>
          <p>
            We offer a <strong className="text-cream">90 day money back guarantee</strong>. If you are not
            satisfied with the Course for any reason, simply email us within 90 days of
            purchase and we will issue a full refund within 24 hours. No questions asked.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">5. Intellectual Property</h2>
          <p>
            All Course content, including videos, text, images, templates, and
            downloadable materials, is the intellectual property of Mandala Class
            and is protected by copyright law. Purchasing the Course does not
            transfer ownership of any intellectual property.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">6. Disclaimer</h2>
          <p>
            The Course is provided for educational purposes. Results may vary depending on
            individual effort, experience, and materials used. We do not guarantee
            specific results. Any figures referenced on the website or in the Course are
            examples only and should not be considered as promises of typical results.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">7. Liability</h2>
          <p>
            Mandala drawing involves working with pens, ink, and related materials.
            You are solely responsible for following proper safety procedures.
            Mandala Class is not liable for any issues that may arise from
            following the techniques taught in the Course.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">8. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes will be posted
            on this page with an updated date. Continued use of the Course after changes
            constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif mb-3 text-cream">9. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:hello@mandalapractice.com" className="text-gold underline">
              hello@mandalapractice.com
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
