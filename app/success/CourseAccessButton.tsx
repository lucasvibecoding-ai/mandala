'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Add-on: fetches the buyer's one-click course access link from the just-completed
// payment and shows a button, so they can log in without opening the email.
// If anything is not ready (no verified payment, course platform not configured),
// it renders nothing and the email remains the path in.
export default function CourseAccessButton() {
  const sp = useSearchParams();
  const paymentIntent = sp.get('payment_intent');
  const redirectStatus = sp.get('redirect_status');
  const paypalOrder = sp.get('paypal_order');

  const [status, setStatus] = useState<'loading' | 'ready' | 'hidden'>('loading');
  const [actionUrl, setActionUrl] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const body =
      paymentIntent && redirectStatus === 'succeeded'
        ? { paymentIntent }
        : paypalOrder
        ? { paypalOrder }
        : null;
    if (!body) {
      setStatus('hidden');
      return;
    }
    fired.current = true;

    let cancelled = false;
    fetch('/api/course-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.actionUrl) {
          setActionUrl(d.actionUrl);
          setIsNewUser(!!d.isNewUser);
          setStatus('ready');
        } else {
          setStatus('hidden');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('hidden');
      });
    return () => {
      cancelled = true;
    };
  }, [paymentIntent, redirectStatus, paypalOrder]);

  if (status === 'hidden') return null;

  if (status === 'loading') {
    return (
      <div
        className="rounded-xl p-5 flex items-center justify-center gap-3"
        style={{ background: '#fff', border: '1px solid rgba(45,74,143,0.15)' }}
      >
        <span
          className="inline-block w-5 h-5 rounded-full animate-spin"
          style={{ border: '3px solid #e5e7eb', borderTopColor: '#2d4a8f' }}
        />
        <span style={{ color: '#6b7089' }}>Preparing your course access...</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-6 sm:p-8 space-y-3 text-center"
      style={{ background: '#fff', border: '2px solid rgba(45,74,143,0.3)' }}
    >
      <p style={{ color: '#6b7089', margin: 0 }}>
        {isNewUser ? 'Set your password and jump straight in:' : 'Your course is ready:'}
      </p>
      <a
        href={actionUrl}
        className="inline-block w-full sm:w-auto px-10 py-4 rounded-lg text-lg font-medium transition-all hover:shadow-lg"
        style={{ background: '#2d4a8f', color: '#ffffff', textDecoration: 'none' }}
      >
        {isNewUser ? 'Set up your account' : 'Log in to your course'}
      </a>
      <p style={{ color: '#9a9489', fontSize: 13, margin: 0 }}>
        We also emailed you this link, so you can get back in anytime.
      </p>
    </div>
  );
}
