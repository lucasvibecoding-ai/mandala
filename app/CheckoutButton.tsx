'use client';

import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>, options?: { eventID: string }) => void;
  }
}

export default function CheckoutButton() {
  const router = useRouter();

  const handleClick = () => {
    const eventId = crypto.randomUUID();

    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: 47.00,
        currency: 'USD',
        content_name: 'Mandala Masterclass',
        content_category: 'Online Course',
      }, { eventID: eventId });
    }

    navigator.sendBeacon('/api/track-checkout', JSON.stringify({ eventId }));

    router.push('/checkout');
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="cta-btn text-white w-full md:w-auto px-12 sm:px-14 md:px-16 py-5 sm:py-7 md:py-9 rounded-lg text-xl sm:text-2xl md:text-3xl font-medium transition-all hover:shadow-lg cursor-pointer disabled:opacity-70 animate-pulse-glow leading-snug"
    >
      Unlock Permanent<br />Access Now
    </button>
  );
}
