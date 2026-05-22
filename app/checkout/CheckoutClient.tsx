'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeForm from './StripeForm';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const BUMP_PRICE = 19.99;
const BASE_PRICE = 47;

export default function CheckoutClient() {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [bumpSelected, setBumpSelected] = useState(false);
  const fetched = useRef(false);
  const firstUpdate = useRef(true);

  const total = BASE_PRICE + (bumpSelected ? BUMP_PRICE : 0);
  const totalFormatted = `$${total.toFixed(2)}`;

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const mountTime = Date.now();

    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId ?? '');
        const elapsed = Date.now() - mountTime;
        const remaining = Math.max(2000 - elapsed, 0);
        setTimeout(() => setVisible(true), remaining);
      });
  }, []);

  // Re-sync the PaymentIntent's amount + metadata on the server whenever the
  // bump checkbox toggles so Express Checkout and the final charge see the
  // right total. Skip the very first run (PI is created at $47 with no bump).
  useEffect(() => {
    if (!paymentIntentId) return;
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    fetch('/api/update-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, includeBump: bumpSelected }),
    }).catch((err) =>
      console.error('Failed to update PaymentIntent for bump toggle:', err)
    );
  }, [paymentIntentId, bumpSelected]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .checkout-page * { margin: 0; padding: 0; box-sizing: border-box; }

        .checkout-page {
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .checkout-container {
          width: 100%;
          max-width: 960px;
          display: flex;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
        }

        .checkout-summary {
          width: 400px;
          min-width: 400px;
          background: #0A2540;
          color: #f5f0e8;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
        }

        .checkout-summary .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(245,240,232,0.5);
          font-size: 14px;
          text-decoration: none;
          margin-bottom: 32px;
          cursor: pointer;
          transition: color 0.15s;
        }

        .checkout-summary .back-link:hover {
          color: rgba(245,240,232,0.8);
        }

        .checkout-summary .product-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(245,240,232,0.5);
          letter-spacing: 0.02em;
          margin-bottom: 8px;
        }

        .checkout-summary .product-title {
          font-size: 24px;
          font-weight: 600;
          color: #f5f0e8;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .checkout-summary .product-price {
          font-size: 36px;
          font-weight: 700;
          color: #e8d5a0;
          margin-bottom: 32px;
        }

        .checkout-summary .product-price .currency {
          font-size: 20px;
          font-weight: 500;
          color: rgba(245,240,232,0.5);
          margin-left: 4px;
        }

        .checkout-summary .summary-divider {
          height: 1px;
          background: rgba(255,255,255,0.2);
          margin: 0 0 24px;
        }

        .checkout-summary .line-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .checkout-summary .line-item .item-name {
          font-size: 14px;
          color: rgba(245,240,232,0.7);
        }

        .checkout-summary .line-item .item-price {
          font-size: 14px;
          font-weight: 500;
          color: #f5f0e8;
        }

        .checkout-summary .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.2);
        }

        .checkout-summary .total-row .total-label {
          font-size: 14px;
          font-weight: 500;
          color: rgba(245,240,232,0.7);
        }

        .checkout-summary .total-row .total-amount {
          font-size: 16px;
          font-weight: 600;
          color: #e8d5a0;
        }

        .footer-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 12px;
          color: #9a9689;
          margin-top: 20px;
        }

        .footer-row a {
          color: #9a9689;
          text-decoration: none;
        }

        .footer-row a:hover {
          color: #635BFF;
        }

        .footer-sep {
          color: rgba(154,150,137,0.3);
          margin: 0 10px;
        }

        .checkout-form-panel {
          flex: 1;
          background: #fafafa;
          padding: 48px 40px;
        }

        .checkout-form-panel .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a2e1a;
          margin-bottom: 16px;
        }

        .checkout-form-panel .email-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #1a2e1a;
          margin-bottom: 6px;
        }

        .checkout-form-panel .email-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          color: #1a2e1a;
          background: #fff;
        }

        .checkout-form-panel .email-input:focus {
          border-color: #635BFF;
          box-shadow: 0 0 0 3px rgba(99,91,255,0.15);
        }

        .checkout-form-panel .email-input::placeholder {
          color: #9a9689;
        }

        .checkout-form-panel .form-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 24px 0;
        }

        .order-bump {
          display: grid;
          grid-template-columns: auto auto 1fr;
          grid-template-areas:
            "check image headline"
            "check image sub";
          column-gap: 14px;
          row-gap: 4px;
          padding: 16px;
          border: 2px dashed #d4a72c;
          background: #fffbeb;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          align-items: start;
        }

        .order-bump:hover {
          background: #fef3c7;
        }

        .order-bump.is-selected {
          background: #fef3c7;
          border-color: #b97c0e;
          box-shadow: 0 0 0 3px rgba(217,167,44,0.25);
        }

        .order-bump input[type="checkbox"] {
          grid-area: check;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #b97c0e;
          cursor: pointer;
        }

        .order-bump .bump-image {
          grid-area: image;
          width: 84px;
          height: 84px;
          object-fit: cover;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.06);
          align-self: center;
        }

        .order-bump .bump-headline {
          grid-area: headline;
          font-size: 15px;
          font-weight: 600;
          color: #1a2e1a;
          line-height: 1.4;
        }

        .order-bump .bump-yes {
          color: #b97c0e;
          font-weight: 700;
        }

        .order-bump .bump-sub {
          grid-area: sub;
          font-size: 13px;
          color: #6b7c93;
          line-height: 1.5;
          margin-top: 2px;
        }

        @media (max-width: 768px) {
          .order-bump {
            grid-template-columns: auto 1fr auto;
            grid-template-areas:
              "check headline image"
              "sub   sub      sub";
            row-gap: 10px;
          }
          .order-bump .bump-image {
            width: 84px;
            height: 84px;
            justify-self: end;
            align-self: center;
          }
          .order-bump .bump-sub {
            margin-top: 0;
          }
        }

        .bump-line-item .item-name,
        .bump-line-item .item-price {
          color: #e8d5a0 !important;
          font-weight: 600 !important;
        }

        .payment-methods {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }

        .payment-method-btn {
          flex: 1;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
        }

        .payment-method-btn.active {
          background: rgba(99,91,255,0.06);
          color: #1a2e1a;
          box-shadow: inset 0 -2px 0 #635BFF;
        }

        .payment-method-btn.inactive {
          background: #fff;
          color: #6b7c93;
        }

        .payment-method-btn.inactive:hover {
          background: #f7f8fa;
        }

        .payment-method-btn + .payment-method-btn {
          border-left: 1px solid #d1d5db;
        }

        .payment-method-btn .method-icon {
          width: 20px;
          height: 14px;
          display: inline-flex;
          align-items: center;
        }

        .payment-form-area {
          min-height: 180px;
        }

        .checkout-form-panel .secure-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 24px;
          font-size: 12px;
          color: #9a9689;
        }

        .checkout-form-panel .secure-footer svg {
          width: 12px;
          height: 12px;
        }

        @media (max-width: 960px) {
          .checkout-summary {
            width: 340px;
            min-width: 340px;
            padding: 36px 28px;
          }

          .checkout-form-panel {
            padding: 36px 28px;
          }
        }

        @media (max-width: 768px) {
          .checkout-container {
            flex-direction: column;
            border-radius: 8px;
          }

          .checkout-summary {
            width: 100%;
            min-width: unset;
            padding: 20px 20px 16px;
          }

          .checkout-summary .back-link,
          .checkout-summary .summary-divider,
          .checkout-summary .line-item,
          .checkout-summary .total-row,
          .checkout-desktop-info {
            display: none;
          }

          .checkout-summary .product-title {
            font-size: 20px;
            margin-bottom: 4px;
          }

          .checkout-summary .product-price {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .checkout-mobile-info {
            display: flex !important;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            color: rgba(245,240,232,0.5);
          }

          .checkout-form-panel {
            padding: 24px 20px;
          }
        }

        @media (max-width: 400px) {
          .checkout-page {
            padding: 12px;
          }

          .checkout-summary {
            padding: 20px 16px;
          }

          .checkout-form-panel {
            padding: 20px 16px;
          }

          .checkout-summary .product-price {
            font-size: 24px;
          }
        }
      `,
        }}
      />

      {!visible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(26,46,26,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f5f8f5', padding: '32px 40px', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', maxWidth: 320, margin: '0 16px' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#2d7a4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#1a2e1a', fontSize: 20, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span>&#128274;</span><span>Loading Secure Checkout...</span><span>&#128274;</span></p>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
          </div>
        </div>
      )}
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-summary">
            <a className="back-link" href="/">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </a>

            <div className="product-title">Mandala Masterclass</div>
            <div className="product-price">
              $47.00<span className="currency">USD</span>
            </div>
            <div className="checkout-desktop-info" style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)', lineHeight: 1.8, marginBottom: 32 }}>
              Lifetime Access &middot; One-Time Payment<br />90-Day Money-Back Guarantee
            </div>
            <div className="checkout-mobile-info" style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span>Lifetime Access &middot; One-Time Payment</span>
              <span>90-Day Money-Back Guarantee</span>
            </div>

            <div className="summary-divider" />

            <div className="line-item">
              <span className="item-name">Mandala Masterclass (5 Modules)</span>
              <span className="item-price">$47.00</span>
            </div>
            <div className="line-item">
              <span className="item-name">10 Printable Mandala Templates</span>
              <span className="item-price">FREE</span>
            </div>
            <div className="line-item">
              <span className="item-name">The Intention Series: 10 Ritual Templates</span>
              <span className="item-price">FREE</span>
            </div>
            <div className="line-item">
              <span className="item-name">The Color Harmony Guide</span>
              <span className="item-price">FREE</span>
            </div>
            <div className="line-item">
              <span className="item-name">The Master Color Series: 10 Colored Mandalas</span>
              <span className="item-price">FREE</span>
            </div>

            {bumpSelected && (
              <div className="line-item bump-line-item">
                <span className="item-name">
                  Mandala Pack (150 printable mandalas)
                </span>
                <span className="item-price">$19.99</span>
              </div>
            )}

            <div className="total-row">
              <span className="total-label">Total due today</span>
              <span className="total-amount">{totalFormatted}</span>
            </div>

          </div>

          <div className="checkout-form-panel">
            <div>
              <label className="email-label">Email</label>
              <input
                type="email"
                className="email-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="form-divider" />

              <label className={`order-bump ${bumpSelected ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={bumpSelected}
                  onChange={(e) => setBumpSelected(e.target.checked)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mandalas.webp"
                  alt=""
                  className="bump-image"
                />
                <div className="bump-headline">
                  <span className="bump-yes">YES!</span> Add the Mandala Pack — 150 printable mandalas — for just $19.99
                </div>
                <div className="bump-sub">
                  A one-time upgrade. Lifetime access to 150 ready-to-color mandala designs alongside your masterclass.
                </div>
              </label>

              <div className="form-divider" />

              <div className="section-title">Express checkout</div>

              <div className="payment-form-area">
                {clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                          colorPrimary: '#635BFF',
                          borderRadius: '6px',
                        },
                      },
                    }}
                  >
                    <StripeForm email={email} onEmailChange={setEmail} paypalEmail={email} totalLabel={totalFormatted} includeBump={bumpSelected} paymentIntentId={paymentIntentId} />
                  </Elements>
                )}
              </div>

              <div className="footer-row">
                Powered by <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>Stripe</a>
                <span className="footer-sep">|</span>
                <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener noreferrer">Terms</a>
                <span style={{ width: '12px', display: 'inline-block' }} />
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
              </div>
              <div className="secure-footer">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M9.5 5.5V4a3.5 3.5 0 00-7 0v1.5M3 5.5h6a1 1 0 011 1V10a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Your payment is secure and encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
