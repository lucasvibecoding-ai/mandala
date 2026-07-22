'use client';

import { useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const ELEMENT_STYLE = {
  base: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '16px',
    color: '#1a2e1a',
    '::placeholder': { color: '#9a9689' },
  },
  invalid: { color: '#df1b41' },
};

const fieldWrap: React.CSSProperties = {
  padding: '12px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: '#fff',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#6b7c93',
  marginBottom: '6px',
};

// Mobile card form: split card fields (number / expiry / CVC) so the form reads like a proper
// card form. Card-only by nature — PayPal can never appear here (on mobile it gets our own
// gold redirect button above instead). Confirms via confirmCardPayment on the shared PI.
export default function MobileCardForm({
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
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setCardError('');
    setIsProcessing(true);

    await ensurePIAmountSynced?.();

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
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
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabel}>Card number</label>
        <div style={fieldWrap}>
          <CardNumberElement options={{ style: ELEMENT_STYLE, showIcon: true }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Expiry</label>
          <div style={fieldWrap}>
            <CardExpiryElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>CVC</label>
          <div style={fieldWrap}>
            <CardCvcElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </div>
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
