import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout NEW - Mandala Masterclass',
  description: 'Preview: PayPal as its own full-width express row (two Express Checkout Elements)',
};

export default function CheckoutNewPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
