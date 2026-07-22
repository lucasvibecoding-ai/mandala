'use client';

import { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

// Our own full-width gold PayPal button for mobile, where Stripe's Express Checkout Element
// never offers a PayPal button (iOS WebKit gets PayPal only as a redirect method). Clicking it
// starts Stripe's own PayPal redirect flow on the SAME PaymentIntent via confirmPayPalPayment:
// full-page redirect to PayPal, back to /success, same webhook/fulfillment as every other path.
// No PayPal SDK involved — the payment stays 100% through Stripe.
export default function PayPalRedirectButton({
  email,
  emailValid,
  clientSecret,
  ensurePIAmountSynced,
  onEmailError,
  onError,
}: {
  email: string;
  emailValid: boolean;
  clientSecret: string;
  ensurePIAmountSynced?: () => Promise<void>;
  onEmailError: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (!emailValid) {
      onEmailError();
      return;
    }
    if (!stripe) return;

    setIsProcessing(true);

    await ensurePIAmountSynced?.();

    // Attach the buyer's email as billing details (NOT receipt_email), mirroring the card flow,
    // so the webhook / course-access can resolve it from the charge.
    const { error } = await stripe.confirmPayPalPayment(clientSecret, {
      payment_method: {
        billing_details: { email },
      },
      return_url: `${window.location.origin}/success`,
    });

    // On success the browser navigates to PayPal, so we only get here on failure.
    if (error) {
      onError(error.message || 'PayPal payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!stripe || isProcessing}
      style={{
        width: '100%',
        padding: '12px 24px',
        background: isProcessing ? '#f5d78a' : '#FFC439',
        border: 'none',
        borderRadius: '6px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: '16px',
        fontWeight: 600,
        color: '#1a1a1a',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s ease',
        letterSpacing: '0.01em',
      }}
    >
      {isProcessing ? (
        'Redirecting to PayPal…'
      ) : (
        <>
          Pay with{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 700, color: '#003087' }}>Pay</span>
          <span style={{ fontStyle: 'italic', fontWeight: 700, color: '#009cde' }}>Pal</span>
        </>
      )}
    </button>
  );
}
