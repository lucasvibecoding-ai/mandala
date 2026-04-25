'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>, options?: { eventID: string }) => void;
  }
}

export default function PurchaseTracker() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');
  const paypalOrder = searchParams.get('paypal_order');
  const hasFiredRef = useRef(false);

  const stripeSucceeded = paymentIntent && redirectStatus === 'succeeded';
  const eventId = stripeSucceeded ? paymentIntent : paypalOrder;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!eventId) return;

    const storageKey = `purchase_tracked_${eventId}`;
    if (sessionStorage.getItem(storageKey) || hasFiredRef.current) return;

    hasFiredRef.current = true;

    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: 47.00,
        currency: 'USD',
        content_name: 'Mandala Masterclass',
        content_type: 'product',
      }, { eventID: eventId });
    }

    sessionStorage.setItem(storageKey, 'true');
  }, [eventId]);

  return null;
}
