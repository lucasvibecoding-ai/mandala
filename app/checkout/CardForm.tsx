'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// The card form (Payment Element) + Pay button, in its own Elements instance.
export default function CardForm({
  email,
  emailValid,
  ensurePIAmountSynced,
  totalLabel,
}: {
  email: string;
  emailValid: boolean;
  ensurePIAmountSynced?: () => Promise<void>;
  totalLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setCardError('Please enter a valid email address above to continue.');
      return;
    }
    if (!stripe || !elements) return;

    setCardError('');
    setIsProcessing(true);

    await ensurePIAmountSynced?.();

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
        payment_method_data: {
          billing_details: { email },
        },
      },
    });

    if (error) {
      setCardError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          paymentMethodOrder: ['card'],
          fields: {
            billingDetails: {
              email: 'never',
            },
          },
          wallets: {
            applePay: 'never',
            googlePay: 'never',
          },
        }}
      />
      {cardError && (
        <p style={{ color: '#df1b41', fontSize: '14px', marginTop: '12px' }}>
          {cardError}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '12px 24px',
          background: isProcessing ? '#a3acb9' : '#635BFF',
          border: 'none',
          borderRadius: '6px',
          color: '#ffffff',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          letterSpacing: '0.01em',
        }}
      >
        {isProcessing ? 'Processing...' : `Pay ${totalLabel}`}
      </button>
    </form>
  );
}
