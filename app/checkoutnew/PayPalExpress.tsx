'use client';

import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';

// Row 2: PayPal ONLY, full width (maxColumns 1) in its own Elements instance, so its single
// column layout does not force the Apple/Google Pay + Link buttons full-width too.
export default function PayPalExpress({
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
        paymentMethods: {
          applePay: 'never',
          googlePay: 'never',
          link: 'never',
          amazonPay: 'never',
        },
        layout: {
          maxColumns: 1,
          overflow: 'never',
        },
        buttonTheme: {
          paypal: 'gold',
        },
        buttonType: {
          paypal: 'pay',
        },
      }}
    />
  );
}
