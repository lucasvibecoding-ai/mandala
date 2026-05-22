'use client';

import { useState } from 'react';
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';
import PayPalForm from './PayPalForm';

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const EMAIL_ERROR = 'Please enter a valid email address above to continue.';

export default function StripeForm({ email, onEmailChange, paypalEmail, totalLabel, includeBump, paymentIntentId }: { email: string; onEmailChange: (v: string) => void; paypalEmail: string; totalLabel: string; includeBump: boolean; paymentIntentId: string }) {
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

  const showCardEmailError = () => {
    setCardError(EMAIL_ERROR);
    setExpressError('');
  };

  const clearErrors = () => {
    setExpressError('');
    setCardError('');
  };

  // Defensive: force the PaymentIntent's amount + metadata to match the
  // current bump state right before any confirm. Prevents a race where the
  // buyer toggles the bump and immediately clicks Pay before the on-toggle
  // useEffect update has reached the server.
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
      showCardEmailError();
      return;
    }
    if (!stripe || !elements) return;

    clearErrors();
    setIsProcessing(true);

    await ensurePIAmountSynced();

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
        receipt_email: email,
      },
    });

    if (submitError) {
      setCardError(submitError.message || 'Payment failed. Please try again.');
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
        receipt_email: email,
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
    // Apple/Google Pay reads the amount from the PaymentIntent when the
    // sheet opens. Sync the bump state to the PI before letting the sheet
    // render so the buyer sees and confirms the right total.
    await ensurePIAmountSynced();
    event.resolve();
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
          buttonType: {
            applePay: 'buy',
            googlePay: 'buy',
          },
        }}
      />

      <div style={{ marginTop: 12 }}>
        <PayPalForm email={paypalEmail} onEmailError={showExpressEmailError} includeBump={includeBump} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: 13, color: '#9a9689', whiteSpace: 'nowrap' }}>Or pay with card</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      <form onSubmit={handleSubmit}>
        <PaymentElement
          options={{
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
    </div>
  );
}
