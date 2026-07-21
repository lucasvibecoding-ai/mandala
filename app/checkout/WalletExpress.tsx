'use client';

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
