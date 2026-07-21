'use client';

import { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Card-only input via CardElement (NOT PaymentElement). CardElement never renders PayPal or
// Link, so there is no method to de-dupe and nothing to arbitrate Link away from the wallet
// Express Checkout Element above. That keeps Link in the wallet row (Safari included) while the
// card box stays card-only. Confirms with confirmCardPayment (no redirect) and sends the buyer
// to /success on success, mirroring the return_url the Payment Element flow would have used.
export default function CardForm({
  email,
  emailValid,
  clientSecret,
  ensurePIAmountSynced,
  totalLabel,
}: {
  email: string;
  emailValid: boolean;
  clientSecret: string;
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
    const card = elements.getElement(CardElement);
    if (!card) return;

    setCardError('');
    setIsProcessing(true);

    await ensurePIAmountSynced?.();

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: { email },
      },
    });

    if (error) {
      setCardError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      window.location.href = `/success?payment_intent=${paymentIntent.id}&redirect_status=succeeded`;
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          padding: '12px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: '#fff',
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: '16px',
                color: '#1a2e1a',
                '::placeholder': { color: '#9a9689' },
              },
              invalid: { color: '#df1b41' },
            },
          }}
        />
      </div>
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
