import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout OLD - Mandala Masterclass',
  description: 'Preview: the old checkout (PayPal and Stripe separated)',
};

export default function CheckoutOldPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
