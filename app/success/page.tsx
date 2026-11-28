import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import PurchaseFlag from "./PurchaseFlag";
import PurchaseTracker from "./PurchaseTracker";
import CourseAccessButton from "./CourseAccessButton";
import Stripe from "stripe";
import GiftSuccess, { sampleGift, type GiftInfo } from "./GiftSuccess";
import { giftFromMetadata } from "../../lib/gift";

export const metadata: Metadata = {
  title: "You're In! - Mandala Masterclass",
};

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Gift orders get their own thank-you page: no course login for the buyer, no other-courses box.
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  let giftInfo: GiftInfo | null = null;
  if (process.env.NODE_ENV === 'development' && one(sp.gift) === 'email' && one(sp.preview) === '1') {
    giftInfo = sampleGift(one(sp.now) === '1');
  } else if (one(sp.payment_intent).startsWith('pi_') && one(sp.payment_intent_client_secret)) {
    giftInfo = await verifiedGift(one(sp.payment_intent), one(sp.payment_intent_client_secret));
  }
  if (giftInfo) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20" style={{ background: '#f8f6f3' }}>
        <PurchaseFlag />
        <Suspense fallback={null}>
          <PurchaseTracker />
        </Suspense>
        <Suspense fallback={null}>
          <GiftSuccess info={giftInfo} country={(await headers()).get("x-vercel-ip-country")} />
        </Suspense>
      </main>
    );
  }
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

        <Suspense fallback={null}>
          <CourseAccessButton />
        </Suspense>

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

// The gift on this payment, read from Stripe and only when the client secret in the URL matches
// (nobody can look up someone else's gift by guessing an id). Null for a normal order.
async function verifiedGift(piId: string, clientSecret: string): Promise<GiftInfo | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });
    const pi = await stripe.paymentIntents.retrieve(piId);
    if (pi.client_secret !== clientSecret || pi.metadata?.product_id !== process.env.STRIPE_PRODUCT_ID) return null;
    const gift = giftFromMetadata(pi.metadata);
    if (!gift) return null;
    return {
      buyerEmail: pi.metadata?.buyer_email || pi.receipt_email || '',
      recipientName: gift.recipientName,
      recipientEmail: gift.recipientEmail,
      scheduledFor: gift.sendAt ? gift.sendLocal || undefined : undefined,
      extraCourse: pi.metadata?.includes_course === 'any',
      pack: !!pi.metadata?.includes_addon,
    };
  } catch (err) {
    console.error('gift lookup failed:', err);
    return null;
  }
}
