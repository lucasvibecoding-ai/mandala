'use client';

import { useState } from 'react';
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js';

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const EMAIL_ERROR = 'Please enter a valid email address above to continue.';

export default function StripeForm({ email, onEmailChange, totalLabel, includeBump, paymentIntentId }: { email: string; onEmailChange: (v: string) => void; totalLabel: string; includeBump: boolean; paymentIntentId: string }) {
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
        // Attach the buyer's email as billing details (NOT receipt_email) so the webhook /
        // course-access can still resolve it from the charge, without triggering Stripe's
        // automatic email receipt. receipt_email would override the dashboard toggle.
        payment_method_data: {
          billing_details: { email },
        },
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

    // For Apple/Google Pay the buyer's email comes from the wallet (requested via
    // emailRequired in onExpressCheckoutClick) and lands in the charge's billing details,
    // so we do NOT set receipt_email here — that would trigger Stripe's auto-receipt.
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
    // Apple/Google Pay reads the amount from the PaymentIntent when the
    // sheet opens. Sync the bump state to the PI before letting the sheet
    // render so the buyer sees and confirms the right total.
    await ensurePIAmountSynced();
    // Ask the wallet for the buyer's email so it lands in the charge's billing details
    // (our backend reads it there) now that we no longer set receipt_email.
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
          // PayPal is offered inside the Payment Element below (a redirect method
          // processed by Stripe), so keep it out of the express row to avoid duplicates.
          paymentMethods: {
            paypal: 'never',
          },
          buttonType: {
            applePay: 'buy',
            googlePay: 'buy',
          },
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: 13, color: '#9a9689', whiteSpace: 'nowrap' }}>Or pay with card or PayPal</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      <form onSubmit={handleSubmit}>
        <PaymentElement
          options={{
            // The email is collected by our own field above and passed as billing details
            // on confirm, so don't render the Payment Element's own email field. This lets
            // us set billing_details.email without setting receipt_email (which is what was
            // forcing Stripe's automatic receipt).
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
    </div>
  );
}
