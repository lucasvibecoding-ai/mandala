'use client';

import { useEffect, useRef, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// PayPal runs on its OWN rails here, not through Stripe: PayPal's JS SDK button
// creates a PayPal order (/api/paypal/create-order) and captures it
// (/api/paypal/capture-order), so the money never touches the Stripe
// PaymentIntent. That means there is a SECOND fulfilment path, and the
// confirmation email plus course access live in capture-order as well as in the
// Stripe webhook. Change one, change the other.
//
// Used when direct PayPal is on (lib/paypal-direct.ts): PayPal is a separate seller's
// account, not LH's Stripe.

export default function PayPalForm({
  clientId,
  email,
  emailValid,
  currency,
  includeAddon = false,
  onEmailError,
  onError,
}: {
  // Handed down from the server component (PAYPAL_CLIENT_ID), falling back to the
  // NEXT_PUBLIC_ copy if that is how this deployment is configured.
  clientId?: string;
  email: string;
  emailValid: boolean;
  currency: string;
  /** The order-bump box: the pack is added to the PayPal order too. */
  includeAddon?: boolean;
  onEmailError: () => void;
  onError: (message: string) => void;
}) {
  const resolvedClientId = clientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  // PayPal fires onError after actions.reject(), which would otherwise show a
  // scary "something went wrong" on top of the email validation message.
  const rejectedForEmail = useRef(false);
  // Daily PayPal limit: hidden until the site confirms PayPal is open today.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/api/paypal/status')
      .then((r) => r.json())
      .then((d: { open?: boolean }) => { if (live) setOpen(d.open === true); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  if (!open) return null;

  if (!resolvedClientId) {
    return (
      <p style={{ color: '#df1b41', fontSize: 14, margin: 0 }}>
        PayPal is not configured.
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      // The SDK script is fetched once per options set, so a currency that changes
      // after mount would otherwise leave the button running in the old currency while
      // create-order builds the new one. Keying on it forces a reload instead.
      key={currency.toUpperCase()}
      options={{
        clientId: resolvedClientId,
        // Must match the currency create-order builds the order in, or PayPal
        // rejects the order. create-order is told this exact value below, so the
        // two cannot drift apart.
        currency: currency.toUpperCase(),
        intent: 'capture',
        // Card and Pay Later are handled by Stripe's card form below, so the
        // PayPal button stays a PayPal button.
        disableFunding: 'card,credit',
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        onClick={(_data, actions) => {
          if (!emailValid) {
            rejectedForEmail.current = true;
            onEmailError();
            return actions.reject();
          }
          rejectedForEmail.current = false;
          return actions.resolve();
        }}
        createOrder={async () => {
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Send the currency the SDK actually loaded with. It is the source of
            // truth: an order in a different currency than the SDK context is
            // rejected by PayPal.
            body: JSON.stringify({ email, currency: currency.toUpperCase(), includeAddon }),
          });
          const data = await res.json();
          if (!data.id) throw new Error('No PayPal order id');
          return data.id;
        }}
        onApprove={async (data) => {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID, email }),
          });
          const result = await res.json().catch(() => ({}));
          if (result.success) {
            // A test purchase must not report a Purchase to the Meta pixel (PurchaseTracker).
            window.location.href = `/success?paypal_order=${encodeURIComponent(data.orderID)}`;
          } else {
            onError('That PayPal payment did not go through. Please try again.');
          }
        }}
        onError={() => {
          if (rejectedForEmail.current) {
            rejectedForEmail.current = false;
            return;
          }
          onError('Something went wrong with PayPal. Please try again.');
        }}
      />
    </PayPalScriptProvider>
  );
}
