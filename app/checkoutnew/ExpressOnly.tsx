'use client';

import { useState } from 'react';
import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';

// TEST + DEBUG: a single Express Checkout Element with ALL methods and NO card element. It prints
// availablePaymentMethods on the page (via onReady) so we can read, on the actual iPhone, exactly
// which methods Stripe considers available on this device (e.g. paypal:false => Stripe is dropping
// it at the availability level, not just hiding it via layout).
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
  const [debug, setDebug] = useState<string>('(waiting for availablePaymentMethods…)');

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
    <div>
      <div
        style={{
          marginBottom: 12,
          padding: 10,
          background: '#fff3cd',
          border: '1px solid #d4a72c',
          borderRadius: 6,
          fontSize: 13,
          color: '#1a2e1a',
          wordBreak: 'break-all',
        }}
      >
        DEBUG availablePaymentMethods: {debug}
      </div>

      <ExpressCheckoutElement
        onReady={(event) => {
          setDebug(JSON.stringify(event.availablePaymentMethods ?? null));
        }}
        onConfirm={onConfirm}
        onClick={onClick}
        options={{
          phoneNumberRequired: false,
          shippingAddressRequired: false,
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
    </div>
  );
}
