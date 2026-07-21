import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout NEW - Mandala Masterclass',
  description: 'Preview: the old look with PayPal going through Stripe',
};

export default function CheckoutNewPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
