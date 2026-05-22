'use client';

import { useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function PayPalForm({ email, onEmailError }: { email: string; onEmailError: () => void }) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const rejectedForEmail = useRef(false);

  if (!clientId) {
    return <p style={{ color: '#dc2626' }}>PayPal is not configured.</p>;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: 'USD',
        intent: 'capture',
        disableFunding: 'card,credit',
      }}
    >
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
        }}
        onClick={(_data, actions) => {
          if (!isValidEmail(email)) {
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
            body: JSON.stringify({}),
          });
          const data = await res.json();
          return data.id;
        }}
        onApprove={async (data) => {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID }),
          });
          const result = await res.json();
          if (result.success) {
            window.location.href = `/success?paypal_order=${encodeURIComponent(data.orderID)}`;
          } else {
            alert('Payment failed. Please try again.');
          }
        }}
        onError={() => {
          if (rejectedForEmail.current) {
            rejectedForEmail.current = false;
            return;
          }
          alert('Something went wrong with PayPal. Please try again.');
        }}
      />
    </PayPalScriptProvider>
  );
}
