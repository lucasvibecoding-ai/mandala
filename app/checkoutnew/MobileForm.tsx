'use client';

import { useState } from 'react';
import {
  CardElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const EMAIL_ERROR = 'Please enter a valid email address above to continue.';

// MOBILE experiment: the card field is a card-only CardElement (no method list), so PayPal
// cannot appear inside the card box. The single Express Checkout Element still offers all
// express methods. This tests whether, with no card-box fallback, Stripe renders PayPal as an
// express button on mobile, or simply hides it.
export default function MobileForm({
  email,
  onEmailChange,
  clientSecret,
  totalLabel,
  includeBump,
  paymentIntentId,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  clientSecret: string;
  totalLabel: string;
  includeBump: boolean;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [expressError, setExpressError] = useState('');
  const [cardError, setCardError] = useState('');

  const emailValid = isValidEmail(email);

  const showExpressEmailError = () => {
    setExpressError(EMAIL_ERROR);
    setCardError('');
  };

  const clearErrors = () => {
    setExpressError('');
    setCardError('');
  };

  const ensurePIAmountSynced = async () => {
    if (!paymentIntentId) return;
    try {
      await fetch('/api/update-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, includeBump }),
      });
    } catch (err) {
      console.error('ensurePIAmountSynced failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setCardError(EMAIL_ERROR);
      return;
    }
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    clearErrors();
    setIsProcessing(true);

    await ensurePIAmountSynced();

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

  const onExpressCheckoutConfirm = async () => {
    if (!emailValid) {
      showExpressEmailError();
      return;
    }
    if (!stripe || !elements) return;
    clearErrors();
    setIsProcessing(true);

    await ensurePIAmountSynced();

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (confirmError) {
      setCardError(confirmError.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const onExpressCheckoutClick = async (
    event: StripeExpressCheckoutElementClickEvent
  ) => {
    if (!emailValid) {
      showExpressEmailError();
      return;
    }
    await ensurePIAmountSynced();
    event.resolve({ emailRequired: true });
  };

  return (
    <div>
      {expressError && (
        <p style={{ color: '#df1b41', fontSize: '14px', marginBottom: '12px' }}>
          {expressError}
        </p>
      )}

      <ExpressCheckoutElement
        onConfirm={onExpressCheckoutConfirm}
        onClick={onExpressCheckoutClick}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: 13, color: '#9a9689', whiteSpace: 'nowrap' }}>Or pay with card</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

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
    </div>
  );
}
