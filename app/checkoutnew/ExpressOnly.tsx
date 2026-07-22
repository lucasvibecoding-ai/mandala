'use client';

import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';

// TEST ONLY: a single Express Checkout Element with ALL methods and NO card element, to see
// whether Stripe renders PayPal as a button on mobile when there is no card fallback at all.
export default function ExpressOnly({
  emailValid,
  onEmailError,
  ensurePIAmountSynced,
  onError,
}: {
  emailValid: boolean;
  onEmailError: () => void;
  ensurePIAmountSynced?: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

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
        layout: {
          maxColumns: 1,
          overflow: 'never',
        },
        buttonTheme: {
          paypal: 'gold',
        },
        buttonType: {
          applePay: 'buy',
          googlePay: 'buy',
          paypal: 'pay',
        },
      }}
    />
  );
}
