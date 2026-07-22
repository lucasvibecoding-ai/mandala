'use client';

import { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

// PayPal's official wordmark (from paypalobjects.com paypal-ui assets), inlined so the button
// shows the genuine logo artwork instead of imitation styled text. Monochrome-on-gold is
// PayPal's current button branding.
const PayPalWordmark = ({ height = 21 }: { height?: number }) => (
  <svg viewBox="0 0 135 48" style={{ height, width: 'auto', display: 'block' }} aria-hidden="true" focusable="false">
    <path
      fill="#000"
      d="M133 2.02v32.83h-7.47V2.02H133zM122.78 13.1v21.81h-6.64v-1.88c-.84.82-1.8 1.44-2.86 1.88-1.07.46-2.23.7-3.47.7-1.56 0-3.01-.29-4.34-.87-1.33-.61-2.49-1.44-3.47-2.48-.99-1.05-1.77-2.27-2.35-3.66-.55-1.42-.82-2.95-.82-4.58s.27-3.14.82-4.53c.58-1.42 1.36-2.66 2.35-3.71a10.45 10.45 0 0 1 3.47-2.44c1.33-.61 2.78-.92 4.34-.92 1.24 0 2.4.23 3.47.7 1.07.44 2.03 1.06 2.86 1.88v-1.88h6.64v-.02zm-11.77 15.87c1.36 0 2.47-.46 3.34-1.4.9-.93 1.35-2.12 1.35-3.57 0-1.45-.45-2.65-1.35-3.57-.87-.93-1.99-1.4-3.34-1.4-1.35 0-2.49.46-3.39 1.4-.87.93-1.31 2.12-1.31 3.57 0 1.45.44 2.65 1.31 3.57.9.93 2.03 1.4 3.39 1.4zM88.17 2.02c1.97 0 3.65.28 5.04.83 1.39.55 2.56 1.32 3.52 2.31.98 1.02 1.75 2.18 2.3 3.49.55 1.31.82 2.72.82 4.23 0 1.51-.27 2.92-.82 4.23a11.15 11.15 0 0 1-2.3 3.49c-.95.99-2.13 1.76-3.52 2.31-1.39.55-3.07.83-5.04.83h-3.6V34.9h-7.6V2.02h11.2zm-1.09 14.96c1.02 0 1.79-.1 2.35-.31.58-.23 1.06-.53 1.43-.87.78-.73 1.17-1.7 1.17-2.92s-.39-2.19-1.17-2.92c-.38-.35-.85-.63-1.43-.83-.55-.23-1.33-.35-2.35-.35h-2.52v8.2h2.52zM48.97 13.1h8.25l5.6 10.46h.09L67.9 13.1h7.64L59.17 45.98h-7.6l7.47-15.04L48.97 13.1zm-1.47 0v21.81h-6.64v-1.88c-.84.82-1.8 1.44-2.86 1.88-1.07.46-2.23.7-3.47.7-1.56 0-3.01-.29-4.34-.87-1.33-.61-2.49-1.44-3.47-2.48-.99-1.05-1.77-2.27-2.35-3.66-.55-1.42-.82-2.95-.82-4.58s.27-3.14.82-4.53c.58-1.42 1.36-2.66 2.35-3.71a10.35 10.35 0 0 1 3.47-2.44c1.33-.61 2.78-.92 4.34-.92 1.24 0 2.4.23 3.47.7 1.07.44 2.03 1.06 2.86 1.88v-1.88h6.64v-.02zM35.73 28.97c1.36 0 2.47-.46 3.35-1.4.9-.93 1.35-2.12 1.35-3.57 0-1.45-.45-2.65-1.35-3.57-.87-.93-1.99-1.4-3.35-1.4s-2.49.46-3.39 1.4c-.87.93-1.3 2.12-1.3 3.57 0 1.45.44 2.65 1.3 3.57.9.93 2.03 1.4 3.39 1.4zM13.2 2.02c1.97 0 3.65.28 5.04.83 1.39.55 2.56 1.32 3.52 2.31.98 1.02 1.75 2.18 2.3 3.49.55 1.31.82 2.72.82 4.23 0 1.51-.27 2.92-.82 4.23a11.15 11.15 0 0 1-2.3 3.49c-.95.99-2.13 1.76-3.52 2.31-1.39.55-3.07.83-5.04.83H9.6V34.9H2V2.02h11.2zm-1.08 14.96c1.02 0 1.79-.1 2.35-.31.58-.23 1.06-.53 1.43-.87.78-.73 1.17-1.7 1.17-2.92s-.39-2.19-1.17-2.92c-.38-.35-.85-.63-1.43-.83-.55-.23-1.33-.35-2.35-.35H9.6v8.2h2.52z"
    />
  </svg>
);

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
      aria-label="Pay with PayPal"
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 46,
      }}
    >
      {isProcessing ? (
        'Redirecting to PayPal…'
      ) : (
        <>
          <span style={{ lineHeight: 1 }}>Pay with</span>
          <PayPalWordmark height={21} />
        </>
      )}
    </button>
  );
}
