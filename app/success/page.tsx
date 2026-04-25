import type { Metadata } from "next";
import { Suspense } from "react";
import PurchaseFlag from "./PurchaseFlag";
import PurchaseTracker from "./PurchaseTracker";

export const metadata: Metadata = {
  title: "You're In! - Mandala Masterclass",
};

export default function Success() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20" style={{ background: '#f8f6f3' }}>
      <PurchaseFlag />
      <Suspense fallback={null}>
        <PurchaseTracker />
      </Suspense>
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(45,74,143,0.1)' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10"
            style={{ color: '#2d4a8f' }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-cream">
          You&apos;re in!
        </h1>

        <p className="text-lg sm:text-xl text-muted leading-relaxed">
          Your payment went through and you now have{" "}
          <strong className="text-cream">lifetime access</strong> to the course.
        </p>

        <div className="rounded-xl p-6 sm:p-8 text-left space-y-4 shadow-sm" style={{ background: '#f8f6f3', border: '1px solid rgba(45,74,143,0.15)' }}>
          <h2 className="text-xl font-serif font-bold text-cream">
            What happens next:
          </h2>
          <ol className="space-y-3 text-muted text-base sm:text-lg">
            <li className="flex items-start gap-3">
              <span className="text-gold font-bold flex-shrink-0">1.</span>
              <span>Check your email for your <strong className="text-cream">login details and course access link</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold font-bold flex-shrink-0">2.</span>
              <span>Start with <strong className="text-cream">Module 1</strong> to learn the history and foundations of mandala art</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold font-bold flex-shrink-0">3.</span>
              <span>Follow along at your own pace. <strong className="text-cream">No deadlines, no pressure</strong></span>
            </li>
          </ol>
        </div>

        <div className="rounded-xl p-6 sm:p-8 text-left space-y-3" style={{ background: '#fff', border: '1px solid rgba(45,74,143,0.15)' }}>
          <h2 className="text-lg font-serif font-bold text-cream">
            Please check your spam folder
          </h2>
          <p className="text-muted text-base leading-relaxed">
            Email providers sometimes filter course emails into spam or promotions. To make sure you get everything:
          </p>
          <ol className="space-y-2 text-muted text-base">
            <li className="flex items-start gap-3">
              <span className="font-bold flex-shrink-0" style={{ color: '#2d4a8f' }}>1.</span>
              <span><strong className="text-cream">Check your spam/promotions folder.</strong> If my email landed there, move it to your inbox and mark it &quot;Not spam.&quot;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold flex-shrink-0" style={{ color: '#2d4a8f' }}>2.</span>
              <span><strong className="text-cream">Add me to your contacts.</strong> Save <strong>hello@mandalapractice.com</strong> as a contact so future emails go straight to your inbox.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold flex-shrink-0" style={{ color: '#2d4a8f' }}>3.</span>
              <span><strong className="text-cream">Reply to my email.</strong> Even just &quot;Got it&quot; works. This tells your email provider you know me.</span>
            </li>
          </ol>
          <p className="text-muted text-sm" style={{ opacity: 0.7 }}>
            Still nothing? Contact me at{" "}
            <a href="mailto:hello@mandalapractice.com" className="text-gold underline">
              hello@mandalapractice.com
            </a>
          </p>
        </div>

        <div className="pt-4">
          <p className="text-muted text-lg font-medium">
            Welcome to the most rewarding craft
          </p>
        </div>

      </div>
    </main>
  );
}
