'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import WalletExpress from './WalletExpress';
import PayPalExpress from './PayPalExpress';
import CardForm from './CardForm';
import PayPalRedirectButton from './PayPalRedirectButton';
import PayPalForm from './PayPalForm';
// Direct PayPal switch (lib/paypal-direct.ts); read here so the server-only PayPal code stays out of the browser.
const PAYPAL_DIRECT = process.env.NEXT_PUBLIC_PAYPAL_DIRECT === '1';
import MobileCardForm from './MobileCardForm';
import { UPSELL_COURSE_NAME } from '../../lib/pricing';
import AllCourses, { PICKABLE_COURSES } from './AllCourses';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const BUMP_PRICE = 19.99;
const BASE_PRICE = 49.99;
// Second course offered at checkout (owner 2026-11-10): $29.99 on its own, the pack $19.99, both
// together $34.99. The server charges the same numbers (lib/pricing.ts extrasCents).
const UPSELL_PRICE = 29.99;
const BUNDLE_PRICE = 34.99;

// Timezones offered for a scheduled gift (the buyer's own is added on top when it's not here).
const GIFT_TIMEZONES: [string, string][] = [
  ['America/New_York', 'US Eastern (New York)'],
  ['America/Chicago', 'US Central (Chicago)'],
  ['America/Denver', 'US Mountain (Denver)'],
  ['America/Phoenix', 'Arizona (Phoenix)'],
  ['America/Los_Angeles', 'US Pacific (Los Angeles)'],
  ['America/Anchorage', 'Alaska'],
  ['Pacific/Honolulu', 'Hawaii'],
  ['America/Halifax', 'Canada Atlantic (Halifax)'],
  ['America/Toronto', 'Canada Eastern (Toronto)'],
  ['America/Vancouver', 'Canada Pacific (Vancouver)'],
  ['Europe/London', 'UK & Ireland (London)'],
  ['Europe/Lisbon', 'Portugal (Lisbon)'],
  ['Europe/Paris', 'Central Europe (Paris, Berlin, Rome)'],
  ['Europe/Athens', 'Eastern Europe (Athens, Helsinki)'],
  ['Africa/Johannesburg', 'South Africa'],
  ['Asia/Dubai', 'Dubai'],
  ['Asia/Kolkata', 'India'],
  ['Asia/Singapore', 'Singapore, Malaysia'],
  ['Asia/Manila', 'Philippines'],
  ['Asia/Tokyo', 'Japan'],
  ['Australia/Perth', 'Australia West (Perth)'],
  ['Australia/Adelaide', 'Australia Central (Adelaide)'],
  ['Australia/Brisbane', 'Australia (Brisbane)'],
  ['Australia/Sydney', 'Australia East (Sydney, Melbourne)'],
  ['Pacific/Auckland', 'New Zealand'],
];
const GIFT_HOURS = Array.from({ length: 24 }, (_, h) => {
  const value = `${String(h).padStart(2, '0')}:00`;
  const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'am' : 'pm'}`;
  return [value, label] as const;
});
const hourLabel = (v: string) => GIFT_HOURS.find(([h]) => h === v)?.[1] ?? v;
const tzLabel = (tz: string) => GIFT_TIMEZONES.find(([v]) => v === tz)?.[1] ?? tz.replace(/_/g, ' ');
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CheckoutClient() {
  const [clientSecret, setClientSecret] = useState('');
  const [paypalDown, setPaypalDown] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [bumpSelected, setBumpSelected] = useState(false);
  const [courseSelected, setCourseSelected] = useState(false);
  // Counts server-side amount changes, so the wallet buttons re-read the PaymentIntent.
  const [piVersion, setPiVersion] = useState(0);
  const [currency, setCurrency] = useState('usd');
  const [expressError, setExpressError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const fetched = useRef(false);
  const firstUpdate = useRef(true);

  // Every checkout (main page or /gift) first asks "for me" or "a gift" and then loads one of two
  // checkouts (owner 2026-11-23).
  const [flow, setFlow] = useState<'me' | 'gift' | null>(null);
  const [askedFlow, setAskedFlow] = useState(false);
  // The (i) next to "This is a gift": hover on desktop, tap on phones.
  const [giftInfoOpen, setGiftInfoOpen] = useState(false);
  const isGift = flow === 'gift';
  const chooseFlow = (f: 'me' | 'gift') => {
    setAskedFlow(true);
    setFlow(f);
    window.scrollTo(0, 0);
  };
  const [giftWhen, setGiftWhen] = useState<'now' | 'later' | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftDate, setGiftDate] = useState('');
  const [giftHour, setGiftHour] = useState('08:00');
  const [giftTz, setGiftTz] = useState('');
  const [myTz, setMyTz] = useState('');
  const [allTz, setAllTz] = useState<string[]>([]);
  const [today, setToday] = useState('');
  const [showCourses, setShowCourses] = useState(false);

  // Browser-only values (timezone, today's date), set after mount so the server render matches.
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setMyTz(tz);
    setGiftTz((cur) => cur || tz);
    setToday(isoDay(new Date()));
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    setAllTz(intl.supportedValuesOf?.('timeZone') ?? []);
  }, []);

  const christmas = (() => {
    if (!today) return '';
    const y = Number(today.slice(0, 4));
    return today > `${y}-12-25` ? `${y + 1}-12-25` : `${y}-12-25`;
  })();
  const tomorrow = (() => {
    if (!today) return '';
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return isoDay(d);
  })();
  const recipientEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());
  const giftValid =
    !isGift ||
    (recipientName.trim() !== '' &&
      recipientEmailValid &&
      senderName.trim() !== '' &&
      (giftWhen === 'now' || (giftWhen === 'later' && giftDate !== '')));
  const deliveryLabel = (() => {
    if (giftWhen === null) return 'when you choose';
    if (giftWhen === 'now' || !giftDate) return 'immediately';
    const [y, m, d] = giftDate.split('-').map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `on ${day} at ${hourLabel(giftHour)}, ${tzLabel(giftTz)} time`;
  })();
  const recipientShort = recipientName.trim() || 'They';
  const recipientGets = recipientName.trim() ? `${recipientShort} gets` : 'They get';
  // What goes on the PaymentIntent for a gift (lib/gift.ts giftMetadata); null = a "for me" order.
  const giftPayload = isGift
    ? {
        recipientName,
        recipientEmail,
        senderName,
        message: giftMessage,
        when: giftWhen,
        date: giftDate,
        hour: giftHour,
        tz: giftTz,
        label: deliveryLabel,
      }
    : null;
  const giftPayloadRef = useRef(giftPayload);
  giftPayloadRef.current = giftPayload;

  const bundle = bumpSelected && courseSelected;
  const bundleSaving = BUMP_PRICE + UPSELL_PRICE - BUNDLE_PRICE;
  const bundlePercent = Math.round((bundleSaving / (BUMP_PRICE + UPSELL_PRICE)) * 100);
  const extras = bundle
    ? BUNDLE_PRICE
    : (bumpSelected ? BUMP_PRICE : 0) + (courseSelected ? UPSELL_PRICE : 0);
  const total = BASE_PRICE + extras;
  const symbol = currency === 'eur' ? '€' : '$';
  const code = currency === 'eur' ? 'EUR' : 'USD';
  const fmt = (n: number) => `${symbol}${n.toFixed(2)}`;
  const totalFormatted = fmt(total);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const mountTime = Date.now();

    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId ?? '');
        setCurrency(data.currency ?? 'usd');
        setPaypalDown(data.paypalDown === true);
        const elapsed = Date.now() - mountTime;
        const remaining = Math.max(2000 - elapsed, 0);
        setTimeout(() => setVisible(true), remaining);
      });
  }, []);

  // Re-sync the PaymentIntent's amount + metadata on the server whenever the
  // bump checkbox toggles so Express Checkout and the final charge see the
  // right total. Skip the very first run (PI is created at $49.99 with no bump).
  useEffect(() => {
    if (!paymentIntentId) return;
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    fetch('/api/update-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, includeBump: bumpSelected, includeCourse: courseSelected, gift: giftPayloadRef.current }),
    })
      .then(() => setPiVersion((v) => v + 1))
      .catch((err) =>
      console.error('Failed to update PaymentIntent for bump toggle:', err)
    );
  }, [paymentIntentId, bumpSelected, courseSelected]);

  useEffect(() => {
    // Apple touch devices (iPhone/iPad — incl. iPads and iPhones in "desktop"/tablet view,
    // which masquerade as MacIntel but report touch points) NEVER get a PayPal button from
    // Stripe's Express Checkout Element, at any viewport width. So they always use the
    // custom-PayPal-button layout; everything else switches on width.
    const appleTouch =
      /iPhone|iPod|iPad/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const check = () => setIsMobile(appleTouch || window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // The next field still to fill, top to bottom; it gets the moving border (none once all are done).
  const nudge: 'email' | 'rname' | 'remail' | 'sname' | 'when' | 'date' | null = !emailValid
    ? 'email'
    : !isGift
      ? null
      : !recipientName.trim()
        ? 'rname'
        : !recipientEmailValid
          ? 'remail'
          : !senderName.trim()
            ? 'sname'
            : giftWhen === null
              ? 'when'
              : giftWhen === 'later' && !giftDate
                ? 'date'
                : null;
  const nudgeCls = (k: typeof nudge) => (nudge === k ? ' nudge' : '');
  // Gift checkout: the extras and payment only appear once the gift details are all done, and
  // then stay (changing a field afterwards doesn't hide the card form again).
  const [giftDetailsDone, setGiftDetailsDone] = useState(false);
  useEffect(() => {
    if (isGift && nudge === null) setGiftDetailsDone(true);
  }, [isGift, nudge]);
  const showExtrasAndPay = !isGift || giftDetailsDone;

  // Stash the typed email on the PaymentIntent as soon as it looks like an address.
  // PayPal replaces billing_details.email with the PayPal account address, so this is
  // the only record of what the buyer actually typed, and the webhook needs both to
  // invite them at both. Debounced so it is one write per pause in typing, not per key.
  useEffect(() => {
    if (!paymentIntentId || !emailValid) return;
    const t = setTimeout(() => {
      fetch('/api/update-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, email }),
      }).catch((err) => console.error('Failed to stash buyer email:', err));
    }, 600);
    return () => clearTimeout(t);
  }, [paymentIntentId, email, emailValid]);
  // Payment stays locked until the buyer's email AND (for an emailed gift) the gift details are in.
  const payReady = emailValid && giftValid;
  const showExpressEmailError = () =>
    setExpressError(
      emailValid
        ? 'Please fill in the gift details above to continue.'
        : 'Please enter a valid email address above to continue.'
    );

  // Force the PaymentIntent amount/metadata (extras + the gift details) to match the checkout
  // right before any confirm. For a gift this MUST land, or the payment would go through as a
  // normal order and the recipient would get nothing: false stops the payment.
  const ensurePIAmountSynced = async (): Promise<boolean> => {
    if (!paymentIntentId) return !isGift;
    try {
      const res = await fetch('/api/update-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, includeBump: bumpSelected, includeCourse: courseSelected, gift: giftPayload }),
      });
      return res.ok || !isGift;
    } catch (err) {
      console.error('ensurePIAmountSynced failed:', err);
      return !isGift;
    }
  };

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      colorPrimary: '#635BFF',
      borderRadius: '6px',
    },
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .checkout-page * { margin: 0; padding: 0; box-sizing: border-box; }

        .checkout-page {
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .checkout-container {
          width: 100%;
          max-width: 1040px;
          display: flex;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
        }

        .checkout-summary {
          width: 400px;
          min-width: 400px;
          background: #0A2540;
          color: #f5f0e8;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
        }

        .checkout-summary .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(245,240,232,0.5);
          font-size: 14px;
          text-decoration: none;
          margin-bottom: 32px;
          cursor: pointer;
          transition: color 0.15s;
        }

        .checkout-summary .back-link:hover {
          color: rgba(245,240,232,0.8);
        }

        .checkout-summary .product-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(245,240,232,0.5);
          letter-spacing: 0.02em;
          margin-bottom: 8px;
        }

        .checkout-summary .product-title {
          font-size: 24px;
          font-weight: 600;
          color: #f5f0e8;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .checkout-summary .product-price {
          font-size: 36px;
          font-weight: 700;
          color: #e8d5a0;
          margin-bottom: 32px;
        }

        .checkout-summary .social-proof {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: -18px 0 26px;
          padding: 6px 12px;
          border-radius: 14px;
          background: rgba(232,213,160,0.14);
          color: #e8d5a0;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .checkout-summary .social-proof svg { flex-shrink: 0; }

        .checkout-summary .product-price .currency {
          font-size: 20px;
          font-weight: 500;
          color: rgba(245,240,232,0.5);
          margin-left: 4px;
        }

        .checkout-summary .summary-divider {
          height: 1px;
          background: rgba(255,255,255,0.2);
          margin: 0 0 24px;
        }

        .checkout-summary .line-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .checkout-summary .line-item .item-name {
          font-size: 14px;
          color: rgba(245,240,232,0.7);
        }

        .checkout-summary .line-item .item-price {
          font-size: 14px;
          font-weight: 500;
          color: #f5f0e8;
        }

        .checkout-summary .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.2);
        }

        .checkout-summary .total-row .total-label {
          font-size: 14px;
          font-weight: 500;
          color: rgba(245,240,232,0.7);
        }

        .checkout-summary .total-row .total-amount {
          font-size: 16px;
          font-weight: 600;
          color: #e8d5a0;
        }

        .footer-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 12px;
          color: #9a9689;
          margin-top: 20px;
        }

        .footer-row a {
          color: #9a9689;
          text-decoration: none;
        }

        .footer-row a:hover {
          color: #635BFF;
        }

        .footer-sep {
          color: rgba(154,150,137,0.3);
          margin: 0 10px;
        }

        .checkout-form-panel {
          flex: 1;
          background: #fafafa;
          padding: 48px 40px;
        }

        .checkout-form-panel .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a2e1a;
          margin-bottom: 16px;
        }

        .checkout-form-panel .email-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #1a2e1a;
          margin-bottom: 6px;
        }

        .checkout-form-panel .email-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          color: #1a2e1a;
          background: #fff;
        }

        .checkout-form-panel .email-input:focus {
          border-color: #635BFF;
          box-shadow: 0 0 0 3px rgba(99,91,255,0.15);
        }

        .checkout-form-panel .email-input::placeholder {
          color: #9a9689;
        }

        .checkout-form-panel .form-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 24px 0;
        }

        /* GIFT BOX */
        .gift-box { margin-top: 16px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: #fff; transition: border-color .15s, box-shadow .15s; }
        .gift-box.is-open { border-color: #c7915b; box-shadow: 0 0 0 3px rgba(199,145,91,0.15); }
        .gift-toggle { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .gift-toggle input { width: 20px; height: 20px; accent-color: #b47b45; cursor: pointer; flex-shrink: 0; }
        .gift-icon { width: 38px; height: 38px; border-radius: 8px; background: #fdf3e7; color: #b47b45; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .gift-toggle-title { display: block; font-size: 15px; font-weight: 600; color: #1a2e1a; }
        .gift-toggle-sub { display: block; font-size: 13px; color: #6b7c93; margin-top: 1px; }
        .gift-fields { border-top: 1px solid #f1ebe3; padding: 16px 16px 18px; display: flex; flex-direction: column; gap: 14px; }
        .gift-when { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .gift-when button { text-align: left; border: 1.5px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 12px; cursor: pointer; font-family: inherit; transition: border-color .15s, background .15s; }
        .gift-when button.on { border-color: #b47b45; background: #fdf8f1; }
        .gift-when button { font-size: 14px; font-weight: 500; color: #1a2e1a; text-align: center; padding: 10px; }
        .gift-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .gift-label { display: block; font-size: 13px; font-weight: 500; color: #1a2e1a; margin-bottom: 5px; }
        .gift-label span { color: #9a9689; font-weight: 400; }
        .checkout-form-panel .gift-textarea { resize: vertical; min-height: 76px; line-height: 1.45; font-size: 15px; }
        .checkout-form-panel select.email-input { appearance: auto; font-size: 15px; }
        .gift-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .gift-chip { border: 1px solid #e8d9c5; background: #fdf8f1; color: #8a5a2b; font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 100px; cursor: pointer; font-family: inherit; }
        .gift-chip.on { background: #c7915b; border-color: #c7915b; color: #fff; }
        .gift-summary { font-size: 13px; line-height: 1.55; color: #5b4a36; background: #fdf8f1; border-radius: 8px; padding: 10px 12px; }
        .gift-pill { display: inline-block; margin-left: 10px; vertical-align: middle; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; background: #c7915b; color: #fff; padding: 3px 9px; border-radius: 100px; }
        @media (max-width: 480px) { .gift-row { grid-template-columns: 1fr; } }

        /* NEXT FIELD: a short brown line keeps running round the field (or the two choice buttons)
           to fill next. */
        @property --nudge-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        @keyframes nudge-spin { to { --nudge-a: 360deg; } }
        .checkout-form-panel .email-input.nudge,
        .checkout-form-panel .email-input.nudge:focus,
        .checkout-form-panel .gift-when button.nudge {
          border: 2px solid transparent;
          background:
            linear-gradient(#fff, #fff) padding-box,
            conic-gradient(from var(--nudge-a), transparent 0deg 230deg, rgba(199,145,91,0.14) 280deg, #c7915b 352deg, transparent 360deg) border-box,
            linear-gradient(#d1d5db, #d1d5db) border-box;
          animation: nudge-spin 2.8s linear infinite;
        }
        .checkout-form-panel .email-input.nudge { padding: 9px 11px; }
        .checkout-form-panel .gift-when button.nudge { padding: 9.5px; }
        @media (prefers-reduced-motion: reduce) { .checkout-form-panel .nudge { animation: none; } }

        /* Gift details appear one at a time. */
        @keyframes gift-reveal { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .gift-reveal { animation: gift-reveal .35s ease both; }

        /* FOR ME / GIFT QUESTION */
        .flow-choice, .flow-choice * { box-sizing: border-box; }
        .flow-choice { min-height: 100vh; background: #fafafa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .flow-inner { width: 100%; max-width: 640px; }
        .flow-back { display: inline-flex; align-items: center; gap: 6px; color: #9a9fab; font-size: 14px; text-decoration: none; margin-bottom: 28px; }
        .flow-back:hover { color: #0A2540; }
        .flow-title { font-size: 28px; font-weight: 700; color: #0A2540; text-align: center; margin-bottom: 32px; letter-spacing: -0.4px; }
        .flow-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .flow-cards > * { min-width: 0; }
        /* A short line that keeps travelling round each card's border (navy / gold). */
        @property --flow-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        @keyframes flow-spin { to { --flow-a: 360deg; } }
        .flow-card { --flow-c: #0A2540; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; border: 2px solid transparent; border-radius: 14px; padding: 34px 26px 30px; cursor: pointer; font-family: inherit; transition: box-shadow .15s;
          background:
            linear-gradient(#fff, #fff) padding-box,
            conic-gradient(from var(--flow-a), transparent 0deg 230deg, color-mix(in srgb, var(--flow-c) 12%, transparent) 280deg, var(--flow-c) 352deg, transparent 360deg) border-box,
            linear-gradient(#e6e8ec, #e6e8ec) border-box;
          animation: flow-spin 4s linear infinite; }
        .flow-card.gift { --flow-c: #c7915b; animation-delay: -2s; }
        .flow-card:hover { box-shadow: 0 8px 24px rgba(10,37,64,0.08); }
        @media (prefers-reduced-motion: reduce) { .flow-card { animation: none; } }
        .flow-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; background: #eef1f6; color: #0A2540; }
        .flow-card.gift .flow-icon { background: #fbf1e6; color: #b47b45; }
        .flow-name { font-size: 19px; font-weight: 600; color: #0A2540; margin-bottom: 8px; }
        .flow-info { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; margin-left: 7px; border-radius: 50%; border: 1.5px solid #b47b45; color: #b47b45; font-size: 11px; font-weight: 700; font-style: normal; font-family: Georgia, serif; vertical-align: 2px; cursor: help; }
        .flow-tip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); width: 260px; padding: 11px 13px; border-radius: 9px; background: #0A2540; color: #fff; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; font-weight: 400; line-height: 1.5; text-align: left; box-shadow: 0 10px 28px rgba(10,37,64,0.25); opacity: 0; visibility: hidden; transition: opacity .15s; z-index: 5; pointer-events: none; }
        .flow-tip::after { content: ''; position: absolute; top: 100%; left: 50%; margin-left: -6px; border: 6px solid transparent; border-top-color: #0A2540; }
        .flow-info:hover .flow-tip, .flow-info:focus .flow-tip, .flow-info.open .flow-tip { opacity: 1; visibility: visible; }
        .flow-desc { font-size: 14.5px; color: #6b7c93; line-height: 1.55; max-width: 240px; }
        @media (max-width: 640px) {
          .flow-choice { align-items: flex-start; padding: 24px 16px; }
          .flow-back { margin-bottom: 20px; }
          .flow-title { font-size: 23px; margin-bottom: 22px; }
          .flow-cards { grid-template-columns: 1fr; gap: 12px; }
          .flow-card { flex-direction: row; text-align: left; align-items: center; gap: 16px; padding: 20px 18px; }
          .flow-icon { margin-bottom: 0; flex-shrink: 0; width: 46px; height: 46px; }
          .flow-name { margin-bottom: 3px; font-size: 17px; }
          .flow-desc { max-width: none; font-size: 14px; }
          .flow-tip { left: auto; right: -70px; transform: none; width: 240px; }
          .flow-tip::after { left: auto; right: 72px; }
        }

        .order-bump {
          display: grid;
          grid-template-columns: auto auto 1fr;
          grid-template-areas:
            "check image headline"
            "check image sub";
          grid-template-rows: auto 1fr;
          column-gap: 14px;
          row-gap: 4px;
          padding: 16px;
          border: 2px dashed #d4a72c;
          background: #fffbeb;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          align-items: start;
        }

        .order-bump:hover {
          background: #fef3c7;
        }

        .order-bump.is-selected {
          background: #fef3c7;
          border-color: #b97c0e;
          box-shadow: 0 0 0 3px rgba(217,167,44,0.25);
        }

        .order-bump input[type="checkbox"] {
          grid-area: check;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #b97c0e;
          cursor: pointer;
        }

        .order-bump .bump-image {
          grid-area: image;
          width: 116px;
          height: 116px;
          object-fit: cover;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.06);
          align-self: center;
        }

        .order-bump .bump-headline {
          grid-area: headline;
          font-size: 15px;
          font-weight: 600;
          color: #1a2e1a;
          line-height: 1.4;
        }

        .order-bump .bump-yes {
          color: #b97c0e;
          font-weight: 700;
        }

        .order-bump .bump-sub {
          grid-area: sub;
          font-size: 13px;
          color: #6b7c93;
          line-height: 1.5;
          margin-top: 2px;
        }

        @media (max-width: 768px) {
          .order-bump {
            grid-template-columns: auto 1fr auto;
            grid-template-areas:
              "check headline image"
              "sub   sub      sub";
            grid-template-rows: auto auto;
            row-gap: 10px;
          }
          .order-bump .bump-image {
            width: 100px;
            height: 100px;
            justify-self: end;
            align-self: center;
          }
          .order-bump .bump-sub {
            margin-top: 0;
          }
        }

        .order-bump .bump-collage { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; overflow: hidden; padding: 0; }
        .order-bump .bump-collage img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .order-bump .bump-info { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; padding: 0; border: none; background: none; color: #2d4a8f; font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        .bump-both-note { margin-top: 10px; text-align: center; font-size: 13px; font-weight: 600; color: #15803d; background: #f0fdf4; border-radius: 6px; padding: 7px; }

        .order-bump .bump-was {
          color: #9a9689;
          font-weight: 400;
          text-decoration: line-through;
          margin-left: 4px;
        }

        .order-bump.bundle-bump {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .order-bump.bundle-bump:hover,
        .order-bump.bundle-bump.is-selected {
          background: #dcfce7;
          border-color: #15803d;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.2);
        }

        .order-bump.bundle-bump input[type="checkbox"] {
          accent-color: #15803d;
        }

        .order-bump.bundle-bump .bump-yes {
          color: #15803d;
        }

        .order-bump .bundle-badge {
          grid-area: image;
          align-self: center;
          justify-self: center;
          width: 116px;
          padding: 10px 0;
          border-radius: 6px;
          background: #16a34a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          text-align: center;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .order-bump .bundle-badge { width: 100px; }
        }

        .bundle-line-item .item-name,
        .bundle-line-item .item-price {
          color: #86efac !important;
          font-weight: 600 !important;
        }

        .bump-line-item .item-name,
        .bump-line-item .item-price {
          color: #e8d5a0 !important;
          font-weight: 600 !important;
        }

        .payment-methods {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }

        .payment-method-btn {
          flex: 1;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
        }

        .payment-method-btn.active {
          background: rgba(99,91,255,0.06);
          color: #1a2e1a;
          box-shadow: inset 0 -2px 0 #635BFF;
        }

        .payment-method-btn.inactive {
          background: #fff;
          color: #6b7c93;
        }

        .payment-method-btn.inactive:hover {
          background: #f7f8fa;
        }

        .payment-method-btn + .payment-method-btn {
          border-left: 1px solid #d1d5db;
        }

        .payment-method-btn .method-icon {
          width: 20px;
          height: 14px;
          display: inline-flex;
          align-items: center;
        }

        .payment-form-area {
          min-height: 180px;
        }

        .next-steps {
          margin-top: 168px;
          background: #ffffff;
          border-radius: 11px;
          overflow: hidden;
          color: #0A2540;
        }

        .next-steps-body {
          padding: 15px 17px;
        }

        .next-steps-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .next-step {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
          line-height: 1.35;
        }

        .next-step + .next-step {
          margin-top: 8px;
        }

        .next-step-check {
          flex: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #16a34a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .next-step-check svg {
          width: 11px;
          height: 11px;
        }

        .next-steps-spam {
          background: #fde68a;
          color: #78350f;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 8px 11px;
          text-align: center;
        }

        .checkout-form-panel .secure-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 24px;
          font-size: 12px;
          color: #9a9689;
        }

        .checkout-form-panel .secure-footer svg {
          width: 12px;
          height: 12px;
        }

        @media (max-width: 960px) {
          .checkout-summary {
            width: 340px;
            min-width: 340px;
            padding: 36px 28px;
          }

          .checkout-form-panel {
            padding: 36px 28px;
          }
        }

        @media (max-width: 768px) {
          .checkout-container {
            flex-direction: column;
            border-radius: 8px;
          }

          .checkout-summary {
            width: 100%;
            min-width: unset;
            padding: 20px 20px 16px;
          }

          .checkout-summary .back-link,
          .checkout-summary .summary-divider,
          .checkout-summary .line-item,
          .checkout-summary .total-row,
          .checkout-desktop-info {
            display: none;
          }

          .checkout-summary .product-title {
            font-size: 20px;
            margin-bottom: 4px;
          }

          .checkout-summary .product-price {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .checkout-summary .social-proof {
            margin: 2px 0 10px;
            padding: 5px 12px;
            font-size: 13px;
          }

          .checkout-mobile-info {
            display: flex !important;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            color: rgba(245,240,232,0.5);
          }

          .next-steps {
            margin-top: 28px;
            border-radius: 8px;
          }

          .next-steps-body {
            padding: 10px 12px;
          }

          .next-steps-title {
            font-size: 11px;
            margin-bottom: 6px;
          }

          .next-step {
            font-size: 11px;
            gap: 7px;
          }

          .next-step + .next-step {
            margin-top: 5px;
          }

          .next-step-check {
            width: 15px;
            height: 15px;
          }

          .next-step-check svg {
            width: 9px;
            height: 9px;
          }

          .next-steps-spam {
            font-size: 9px;
            letter-spacing: 0.01em;
            padding: 6px 8px;
          }

          .checkout-form-panel {
            padding: 24px 20px;
          }
        }

        @media (max-width: 400px) {
          .checkout-page {
            padding: 12px;
          }

          .checkout-summary {
            padding: 20px 16px;
          }

          .checkout-form-panel {
            padding: 20px 16px;
          }

          .checkout-summary .product-price {
            font-size: 24px;
          }
        }
      `,
        }}
      />

      {flow && !visible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(26,46,26,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f5f8f5', padding: '32px 40px', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', maxWidth: 320, margin: '0 16px' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#2d7a4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#1a2e1a', fontSize: 20, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span>&#128274;</span><span>Loading Secure Checkout...</span><span>&#128274;</span></p>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
          </div>
        </div>
      )}
      {!flow && (
        <div className="flow-choice">
          <div className="flow-inner">
            <a className="flow-back" href="/">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </a>
            <div className="flow-title">Who is the Mandala Masterclass for?</div>
            <div className="flow-cards">
              <button type="button" className="flow-card" onClick={() => chooseFlow('me')}>
                <span className="flow-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
                </span>
                <span>
                  <span className="flow-name" style={{ display: 'block' }}>This is for me</span>
                  <span className="flow-desc" style={{ display: 'block' }}>Instant access to the course after payment.</span>
                </span>
              </button>
              <button type="button" className="flow-card gift" onClick={() => chooseFlow('gift')}>
                <span className="flow-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>
                </span>
                <span>
                  <span className="flow-name" style={{ display: 'block' }}>
                    This is a gift
                    <span
                      className={`flow-info${giftInfoOpen ? ' open' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label="How the gift works"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGiftInfoOpen((o) => !o);
                      }}
                      onMouseLeave={() => setGiftInfoOpen(false)}
                    >
                      i
                      <span className="flow-tip" role="tooltip">
                        You choose who it&apos;s for and when it arrives. Add their name and email, then pick the time and day, and we will email the course access to them.
                      </span>
                    </span>
                  </span>
                  <span className="flow-desc" style={{ display: 'block' }}>Option to email it to them on the day and hour you choose.</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="checkout-page" style={flow ? undefined : { display: 'none' }}>
        <div className="checkout-container">
          <div className="checkout-summary">
            <a
              className="back-link"
              href={isGift ? '/gift' : '/'}
              onClick={(e) => {
                if (askedFlow) {
                  e.preventDefault();
                  setFlow(null);
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </a>

            <div className="product-title">Mandala Masterclass{isGift && <span className="gift-pill">GIFT</span>}</div>
            <div className="product-price">
              {fmt(BASE_PRICE)}<span className="currency">{code}</span>
            </div>
            {/* Social proof (owner 2026-11-10): counts buyers across ALL of Aiko's courses
                (Airtable: 4,288 paid buyers), never this one course. */}
            <div className="social-proof">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Join 4,000+ students
            </div>
            <div className="checkout-desktop-info" style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)', lineHeight: 1.8, marginBottom: 32 }}>
              Lifetime Access &middot; One-Time Payment<br />90-Day Money-Back Guarantee
            </div>
            <div className="checkout-mobile-info" style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span>Lifetime Access &middot; One-Time Payment</span>
              <span>90-Day Money-Back Guarantee</span>
            </div>

            <div className="summary-divider" />

            <div className="line-item">
              <span className="item-name">Mandala Masterclass (5 Modules){isGift ? ', as a gift' : ''}</span>
              <span className="item-price">{fmt(BASE_PRICE)}</span>
            </div>
            <div className="line-item">
              <span className="item-name">10 Printable Mandala Templates</span>
              <span className="item-price">FREE</span>
            </div>
            <div className="line-item">
              <span className="item-name">The Intention Series: 10 Ritual Templates</span>
              <span className="item-price">FREE</span>
            </div>
            <div className="line-item">
              <span className="item-name">The Color Harmony Guide</span>
              <span className="item-price">FREE</span>
            </div>
            <div className="line-item">
              <span className="item-name">The Master Color Series: 10 Colored Mandalas</span>
              <span className="item-price">FREE</span>
            </div>

            {courseSelected && (
              <div className="line-item bump-line-item">
                <span className="item-name">{isGift ? 'One more Aiko Arts course (their pick)' : UPSELL_COURSE_NAME}</span>
                <span className="item-price">{fmt(UPSELL_PRICE)}</span>
              </div>
            )}

            {bumpSelected && (
              <div className="line-item bump-line-item">
                <span className="item-name">
                  Mandala Pack (150 printable mandalas)
                </span>
                <span className="item-price">{fmt(BUMP_PRICE)}</span>
              </div>
            )}

            {bundle && (
              <div className="line-item bundle-line-item">
                <span className="item-name">Bundle discount</span>
                <span className="item-price">&minus;{fmt(bundleSaving)}</span>
              </div>
            )}

            <div className="total-row">
              <span className="total-label">Total due today</span>
              <span className="total-amount">{totalFormatted}</span>
            </div>

            <div className="next-steps">
              <div className="next-steps-body">
                <div className="next-steps-title">What happens next:</div>
                {(!isGift
                  ? ['Instant access after payment', 'Email with your invite link']
                  : ['Your receipt by email right away', `${recipientGets} the gift ${deliveryLabel}`]
                ).map((line) => (
                  <div className="next-step" key={line}>
                    <span className="next-step-check">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.3 2.3 4.7-4.9"/></svg>
                  </span>
                    {line}
                  </div>
                ))}
              </div>
              <div className="next-steps-spam">DON&apos;T FORGET TO CHECK YOUR SPAM FOLDER</div>
            </div>

          </div>

          <div className="checkout-form-panel">
            <div>
              <label className="email-label">{isGift ? 'Your email (for your receipt)' : 'Email'}</label>
              <input
                type="email"
                className={`email-input${nudgeCls('email')}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* GIFT: emailed to the recipient at a chosen day/hour/timezone, or an open gift link for the buyer. */}
              {isGift && (
              <div className="gift-box is-open">
                <div className="gift-toggle">
                  <span className="gift-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg></span>
                  <span>
                    <span className="gift-toggle-title">Gift details</span>
                    <span className="gift-toggle-sub">Who it&apos;s for and when it arrives</span>
                  </span>
                </div>
                  <div className="gift-fields">
                    <>
                        <div>
                          <label className="gift-label">Their name</label>
                          <input className={`email-input${nudgeCls('rname')}`} placeholder="Emma" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={60} />
                        </div>
                        {recipientName.trim() !== '' && (
                          <div className="gift-reveal">
                            <label className="gift-label">Their email</label>
                            <input type="email" className={`email-input${nudgeCls('remail')}`} placeholder="emma@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                          </div>
                        )}
                        {recipientName.trim() !== '' && recipientEmailValid && (
                          <div className="gift-reveal">
                            <label className="gift-label">Your name <span>(shown in the gift email)</span></label>
                            <input className={`email-input${nudgeCls('sname')}`} placeholder="Sarah" value={senderName} onChange={(e) => setSenderName(e.target.value)} maxLength={60} />
                          </div>
                        )}
                        {recipientName.trim() !== '' && recipientEmailValid && senderName.trim() !== '' && (
                          <>
                            <div className="gift-reveal">
                              <label className="gift-label">Your message <span>(optional)</span></label>
                              <textarea className="email-input gift-textarea" rows={3} maxLength={300} placeholder="Merry Christmas! I thought you'd love this." value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />
                            </div>
                            <div className="gift-reveal">
                              <div className="gift-label">When should it arrive?</div>
                              <div className="gift-when">
                                <button type="button" className={`${giftWhen === 'now' ? 'on' : ''}${nudgeCls('when')}`} onClick={() => setGiftWhen('now')}>Immediately</button>
                                <button type="button" className={`${giftWhen === 'later' ? 'on' : ''}${nudgeCls('when')}`} onClick={() => setGiftWhen('later')}>On a day I choose</button>
                              </div>
                            </div>
                            {giftWhen === 'later' && (
                              <>
                                <div className="gift-chips gift-reveal">
                                  <button type="button" className={`gift-chip ${giftDate === christmas ? 'on' : ''}`} onClick={() => { setGiftDate(christmas); setGiftHour('08:00'); }}>Christmas morning</button>
                                  <button type="button" className={`gift-chip ${giftDate === tomorrow ? 'on' : ''}`} onClick={() => setGiftDate(tomorrow)}>Tomorrow</button>
                                </div>
                                <div className="gift-row gift-reveal">
                                  <div>
                                    <label className="gift-label">Day</label>
                                    <input type="date" className={`email-input${nudgeCls('date')}`} min={today} value={giftDate} onChange={(e) => setGiftDate(e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="gift-label">Hour</label>
                                    <select className="email-input" value={giftHour} onChange={(e) => setGiftHour(e.target.value)}>
                                      {GIFT_HOURS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div className="gift-reveal">
                                  <label className="gift-label">Their timezone</label>
                                  <select className="email-input" value={giftTz} onChange={(e) => setGiftTz(e.target.value)}>
                                    {myTz && <option value={myTz}>Same as mine ({tzLabel(myTz)})</option>}
                                    <optgroup label="Common">
                                      {GIFT_TIMEZONES.filter(([v]) => v !== myTz).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </optgroup>
                                    {allTz.length > 0 && (
                                      <optgroup label="All timezones">
                                        {allTz.filter((v) => v !== myTz && !GIFT_TIMEZONES.some(([c]) => c === v)).map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                                      </optgroup>
                                    )}
                                  </select>
                                </div>
                              </>
                            )}
                            {giftWhen && (
                              <div className="gift-summary gift-reveal">
                                <strong>{recipientGets} the gift {deliveryLabel}.</strong> Your receipt goes to your email, so check your spam folder if you don&apos;t see it.
                              </div>
                            )}
                          </>
                        )}
                    </>
                  </div>
              </div>
              )}

              {showExtrasAndPay && (
              <div className={isGift ? 'gift-reveal' : undefined}>
              <div className="form-divider" />

              {isGift ? (
                <>
                  {/* Gift checkout extras, both inside the gift: one more Aiko Arts course the recipient
                      picks after the Mandala Masterclass, and the pack. Same prices as the normal boxes
                      (course 29.99, pack 19.99, both 34.99), so the server amounts don't change. */}
                  <label className={`order-bump ${courseSelected ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={courseSelected}
                      onChange={(e) => setCourseSelected(e.target.checked)}
                    />
                    <div className="bump-image bump-collage" aria-hidden="true">
                      {PICKABLE_COURSES.slice(0, 4).map((c) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={c.slug} src={c.thumbnail} alt="" />
                      ))}
                    </div>
                    <div className="bump-headline">
                      <span className="bump-yes">YES!</span> Let them pick any additional Aiko Arts course once they finish the Mandala Masterclass, for just {fmt(UPSELL_PRICE)} <span className="bump-was">{fmt(BASE_PRICE)}</span>
                    </div>
                    <div className="bump-sub">
                      <button
                        type="button"
                        className="bump-info"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowCourses(true);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        See all {PICKABLE_COURSES.length} courses
                      </button>
                    </div>
                  </label>

                  <div style={{ height: 12 }} />

                  <label className={`order-bump ${bumpSelected ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={bumpSelected}
                      onChange={(e) => setBumpSelected(e.target.checked)}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/mandalas.webp" alt="" className="bump-image" />
                    <div className="bump-headline">
                      <span className="bump-yes">YES!</span> Add the Mandala Pack (150 printable mandalas) to the gift for just {fmt(BUMP_PRICE)}
                    </div>
                    <div className="bump-sub">
                      150 ready-to-color mandala designs inside their course, for the days they don&apos;t feel like drawing from scratch.
                    </div>
                  </label>
                  {bundle && (
                    <div className="bump-both-note">Both together: you save {fmt(bundleSaving)}</div>
                  )}
                  {showCourses && <AllCourses onClose={() => setShowCourses(false)} />}
                </>
              ) : (
                <>
              <label className={`order-bump ${courseSelected ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={courseSelected}
                  onChange={(e) => setCourseSelected(e.target.checked)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/upsell-course.jpg"
                  alt=""
                  className="bump-image"
                />
                <div className="bump-headline">
                  <span className="bump-yes">YES!</span> Add the {UPSELL_COURSE_NAME} for just {fmt(UPSELL_PRICE)} <span className="bump-was">{fmt(BASE_PRICE)}</span>
                </div>
                <div className="bump-sub">
                  A second full course: 5 modules of cute Japanese kawaii doodles, the same relaxing pen-and-paper practice. Lifetime access.
                </div>
              </label>

              <div style={{ height: 12 }} />

              <label className={`order-bump ${bumpSelected ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={bumpSelected}
                  onChange={(e) => setBumpSelected(e.target.checked)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mandalas.webp"
                  alt=""
                  className="bump-image"
                />
                <div className="bump-headline">
                  <span className="bump-yes">YES!</span> Add the Mandala Pack — 150 printable mandalas — for just {fmt(BUMP_PRICE)}
                </div>
                <div className="bump-sub">
                  A one-time upgrade. Lifetime access to 150 ready-to-color mandala designs alongside your masterclass.
                </div>
              </label>

              <div style={{ height: 12 }} />

              {/* Third box = both extras at the bundle price. It is ticked whenever both are, and
                  ticking it ticks both (unticking clears both). */}
              <label className={`order-bump bundle-bump ${bundle ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={bundle}
                  onChange={(e) => {
                    setCourseSelected(e.target.checked);
                    setBumpSelected(e.target.checked);
                  }}
                />
                <div className="bundle-badge">SAVE {bundlePercent}%</div>
                <div className="bump-headline">
                  <span className="bump-yes">BEST VALUE!</span> Get both for just {fmt(BUNDLE_PRICE)} <span className="bump-was">{fmt(BUMP_PRICE + UPSELL_PRICE)}</span> (save {bundlePercent}%)
                </div>
                <div className="bump-sub">
                  The {UPSELL_COURSE_NAME} and the Mandala Pack together.
                </div>
              </label>
                </>
              )}

              <div className="form-divider" />

              <div className="section-title">Express checkout</div>

              <div className="payment-form-area">
                {/* Localhost only: the local Stripe key is a placeholder, so the real buttons can't load here. */}
                {process.env.NODE_ENV === 'development' && !clientSecret && flow && (
                  <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: '28px 16px', textAlign: 'center', color: '#6b7c93', fontSize: 14, lineHeight: 1.6 }}>
                    Apple Pay / Google Pay, PayPal and the card form show here on the live site.<br />
                    (They can&apos;t load on localhost.)
                  </div>
                )}
                {/* Stripe mounts only once a checkout is chosen (the question screen hides this panel). */}
                {clientSecret && flow && (
                  <>
                    {expressError && (
                      <p style={{ color: '#df1b41', fontSize: '14px', marginBottom: '12px' }}>
                        {expressError}
                      </p>
                    )}

                    {isMobile ? (
                      /* MOBILE: Stripe's element never offers a PayPal button on iOS, so we
                         render OUR OWN gold PayPal button that starts Stripe's PayPal redirect
                         flow (confirmPayPalPayment) on the same PaymentIntent, plus a card-only
                         form so PayPal cannot appear under the card. */
                      <>
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                          <WalletExpress
                            syncVersion={piVersion}
                            emailValid={payReady}
                            onEmailError={showExpressEmailError}
                            ensurePIAmountSynced={ensurePIAmountSynced}
                            onError={setExpressError}
                          />
                        </Elements>

                        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                          {PAYPAL_DIRECT ? (
                            /* Direct PayPal (lib/paypal-direct.ts): PayPal's own gold button, same spot.
                               Never for a gift: that order has no PaymentIntent to carry the gift. */
                            !isGift && <div style={{ marginTop: 12 }}>
                              <PayPalForm
                                email={email}
                                emailValid={payReady}
                                currency={currency}
                                includeAddon={bumpSelected}
                                includeCourse={courseSelected}
                                onEmailError={showExpressEmailError}
                                onError={setExpressError}
                              />
                            </div>
                          ) : !paypalDown && (
                          <div style={{ marginTop: 12 }}>
                            <PayPalRedirectButton
                              email={email}
                              emailValid={payReady}
                              clientSecret={clientSecret}
                              ensurePIAmountSynced={ensurePIAmountSynced}
                              onEmailError={showExpressEmailError}
                              onError={setExpressError}
                            />
                          </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                            <span style={{ fontSize: 13, color: '#9a9689', whiteSpace: 'nowrap' }}>Or pay with card</span>
                            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                          </div>

                          <MobileCardForm
                            email={email}
                            emailValid={payReady}
                            clientSecret={clientSecret}
                            ensurePIAmountSynced={ensurePIAmountSynced}
                            totalLabel={totalFormatted}
                          />
                        </Elements>
                      </>
                    ) : (
                      /* DESKTOP: same as the live /checkout split — wallets + Link, then the
                         native gold PayPal express button full-width, then card (PayPal deduped
                         out of the card box by sharing the PayPal Elements group). */
                      <>
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                          <WalletExpress
                            syncVersion={piVersion}
                            emailValid={payReady}
                            onEmailError={showExpressEmailError}
                            ensurePIAmountSynced={ensurePIAmountSynced}
                            onError={setExpressError}
                          />
                        </Elements>

                        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                          {PAYPAL_DIRECT ? (
                            /* Direct PayPal (lib/paypal-direct.ts): PayPal's own gold button, same spot.
                               Never for a gift: that order has no PaymentIntent to carry the gift. */
                            !isGift && <div style={{ marginTop: 12 }}>
                              <PayPalForm
                                email={email}
                                emailValid={payReady}
                                currency={currency}
                                includeAddon={bumpSelected}
                                includeCourse={courseSelected}
                                onEmailError={showExpressEmailError}
                                onError={setExpressError}
                              />
                            </div>
                          ) : !paypalDown && (
                          <div style={{ marginTop: 12 }}>
                            <PayPalExpress
                              syncVersion={piVersion}
                              emailValid={payReady}
                              onEmailError={showExpressEmailError}
                              ensurePIAmountSynced={ensurePIAmountSynced}
                              onError={setExpressError}
                            />
                          </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                            <span style={{ fontSize: 13, color: '#9a9689', whiteSpace: 'nowrap' }}>Or pay with card</span>
                            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                          </div>

                          <CardForm
                            email={email}
                            emailValid={payReady}
                            ensurePIAmountSynced={ensurePIAmountSynced}
                            totalLabel={totalFormatted}
                          />
                        </Elements>
                      </>
                    )}
                  </>
                )}
              </div>

              </div>
              )}

              <div className="footer-row">
                Powered by <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>Stripe</a>
                <span className="footer-sep">|</span>
                <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener noreferrer">Terms</a>
                <span style={{ width: '12px', display: 'inline-block' }} />
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
              </div>
              <div className="secure-footer">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M9.5 5.5V4a3.5 3.5 0 00-7 0v1.5M3 5.5h6a1 1 0 011 1V10a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Your payment is secure and encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
