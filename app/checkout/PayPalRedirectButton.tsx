'use client';

import { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

// PayPal's official CLASSIC wordmark (from paypalobjects.com/images/shared/paypal-logo-129x32.svg,
// monogram paths removed): the italic two-tone blue "PayPal" ("Pay" #003087, "Pal" #009CDE) —
// the look of the classic gold PayPal button. viewBox cropped to the wordmark's bounds.
const PayPalLogo = ({ height = 18 }: { height?: number }) => (
  <svg viewBox="36 6 91.769 25.5" style={{ height, width: 'auto', display: 'block' }} aria-hidden="true" focusable="false">
    <path fill="#009CDE" d="M98.396,6.933H91.37c-0.479,0-0.89,0.35-0.964,0.824l-2.841,18.015c-0.056,0.355,0.219,0.676,0.579,0.676h3.604c0.335,0,0.622-0.244,0.674-0.576l0.807-5.107c0.074-0.474,0.483-0.824,0.964-0.824h2.223c4.628,0,7.298-2.239,7.996-6.678c0.314-1.941,0.014-3.467-0.896-4.535C102.518,7.553,100.746,6.933,98.396,6.933z M99.207,13.512c-0.384,2.522-2.31,2.522-4.173,2.522h-1.061l0.744-4.708c0.045-0.285,0.29-0.495,0.578-0.495h0.485c1.269,0,2.467,0,3.084,0.723C99.234,11.986,99.347,12.626,99.207,13.512z" />
    <path fill="#003087" d="M48.288,6.933h-7.025c-0.481,0-0.89,0.35-0.965,0.824l-2.841,18.015c-0.056,0.355,0.219,0.676,0.579,0.676h3.354c0.48,0,0.889-0.349,0.964-0.823l0.767-4.86c0.075-0.474,0.484-0.824,0.964-0.824h2.223c4.627,0,7.298-2.239,7.997-6.678c0.314-1.941,0.012-3.467-0.896-4.535C52.409,7.553,50.638,6.933,48.288,6.933z M49.099,13.512c-0.384,2.522-2.31,2.522-4.173,2.522h-1.06l0.743-4.708c0.045-0.285,0.291-0.495,0.579-0.495h0.486c1.268,0,2.466,0,3.083,0.723C49.126,11.986,49.238,12.626,49.099,13.512z" />
    <path fill="#003087" d="M69.286,13.432h-3.363c-0.289,0-0.534,0.209-0.579,0.494l-0.147,0.94l-0.236-0.341c-0.728-1.058-2.352-1.41-3.973-1.41c-3.716,0-6.891,2.816-7.509,6.766c-0.322,1.971,0.135,3.854,1.252,5.169c1.026,1.208,2.492,1.71,4.237,1.71c2.995,0,4.657-1.924,4.657-1.924l-0.15,0.935c-0.056,0.355,0.218,0.677,0.578,0.677h3.03c0.48,0,0.889-0.349,0.965-0.822l1.817-11.517C69.921,13.752,69.646,13.432,69.286,13.432z M64.598,19.979c-0.325,1.923-1.851,3.212-3.797,3.212c-0.976,0-1.757-0.314-2.259-0.907c-0.498-0.59-0.685-1.429-0.527-2.363c0.303-1.905,1.854-3.237,3.771-3.237c0.955,0,1.73,0.316,2.243,0.917C64.543,18.205,64.746,19.05,64.598,19.979z" />
    <path fill="#009CDE" d="M119.394,13.432h-3.363c-0.288,0-0.533,0.209-0.578,0.494l-0.148,0.94l-0.235-0.341c-0.729-1.058-2.352-1.41-3.973-1.41c-3.718,0-6.893,2.816-7.51,6.766c-0.321,1.971,0.135,3.854,1.252,5.169c1.026,1.208,2.492,1.71,4.237,1.71c2.995,0,4.657-1.924,4.657-1.924l-0.15,0.935c-0.057,0.355,0.219,0.677,0.578,0.677h3.03c0.479,0,0.889-0.349,0.964-0.822l1.818-11.517C120.029,13.752,119.754,13.432,119.394,13.432z M114.706,19.979c-0.325,1.923-1.851,3.212-3.797,3.212c-0.976,0-1.757-0.314-2.26-0.907c-0.496-0.59-0.685-1.429-0.526-2.363c0.304-1.905,1.853-3.237,3.77-3.237c0.956,0,1.731,0.316,2.243,0.917C114.651,18.205,114.854,19.05,114.706,19.979z" />
    <path fill="#003087" d="M87.204,13.432h-3.382c-0.323,0-0.626,0.16-0.808,0.427l-4.664,6.87l-1.978-6.601c-0.123-0.414-0.504-0.696-0.935-0.696h-3.324c-0.401,0-0.683,0.395-0.555,0.774l3.724,10.929l-3.502,4.941C71.506,30.464,71.784,31,72.259,31h3.379c0.319,0,0.619-0.157,0.802-0.42l11.246-16.229C87.954,13.962,87.676,13.432,87.204,13.432z" />
    <path fill="#009CDE" d="M123.359,7.427l-2.883,18.344c-0.057,0.355,0.218,0.676,0.578,0.676h2.9c0.48,0,0.889-0.349,0.964-0.822l2.843-18.016c0.056-0.355-0.219-0.677-0.578-0.677h-3.246C123.65,6.933,123.404,7.143,123.359,7.427z" />
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
          <PayPalLogo height={18} />
        </>
      )}
    </button>
  );
}
