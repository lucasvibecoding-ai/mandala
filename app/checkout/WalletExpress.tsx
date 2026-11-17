'use client';

import { useEffect } from 'react';
import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';

// Row 1: Apple/Google Pay + Link. PayPal is deliberately excluded here and rendered as its
// own full-width element (PayPalExpress) so the wallets stay 2-up and PayPal gets its own row.
export default function WalletExpress({
  emailValid,
  onEmailError,
  ensurePIAmountSynced,
  onError,
  syncVersion = 0,
}: {
  emailValid: boolean;
  onEmailError: () => void;
  ensurePIAmountSynced?: () => Promise<void>;
  onError: (msg: string) => void;
  /** Bumped by the checkout each time the PaymentIntent amount changes on the server. */
  syncVersion?: number;
}) {
  const stripe = useStripe();
  const elements = useElements();

  // Ticking an extra changes the PaymentIntent amount on the server; pull it in so the
  // Apple Pay / Google Pay / PayPal sheet shows the same total the buyer is charged.
  useEffect(() => {
    if (syncVersion > 0) elements?.fetchUpdates().catch(() => {});
  }, [elements, syncVersion]);

  const onConfirm = async () => {
    if (!stripe || !elements) return;
    await ensurePIAmountSynced?.();
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
    });
    if (error) onError(error.message || 'Payment failed. Please try again.');
  };

  const onClick = async (event: StripeExpressCheckoutElementClickEvent) => {
    if (!emailValid) {
      onEmailError();
      return;
    }
    await ensurePIAmountSynced?.();
    event.resolve({ emailRequired: true });
  };

  return (
    <ExpressCheckoutElement
      onConfirm={onConfirm}
      onClick={onClick}
      options={{
        paymentMethods: {
          // Show Apple Pay and Google Pay in every browser that supports them (owner 2026-11-17), e.g. Apple Pay in
          // Chrome, and Google Pay without a saved card. Stripe's default ('auto') shows Apple Pay in Safari only.
          applePay: 'always',
          googlePay: 'always',
          paypal: 'never',
          amazonPay: 'never',
        },
        buttonType: {
          applePay: 'buy',
          googlePay: 'buy',
        },
      }}
    />
  );
}
