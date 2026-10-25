// Direct PayPal: PayPal on its OWN account, separate from Stripe (owner, 2026-10-25). The
// PayPal account belongs to a DIFFERENT seller than LH (Stripe), so these sales are never
// fiscalized (no e-računi invoice), never posted to the VAT Counter, and are written to
// Airtable with Fiscalized = "No" and no VAT. Everything else matches a card sale: the same
// course invite (incl. the pack), the same confirmation email, the same proof of delivery,
// the same Meta Purchase event.
//
// OFF until NEXT_PUBLIC_PAYPAL_DIRECT=1 is set on Vercel (with PAYPAL_CLIENT_ID,
// NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_MODE=live). While it is off
// the checkout shows the Stripe PayPal button exactly as before.

export const PAYPAL_DIRECT = process.env.NEXT_PUBLIC_PAYPAL_DIRECT === '1';

export const PAYPAL_API =
  process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

/** The course and its order-bump pack, as PayPal and the platform know them. */
export const PAYPAL_PRODUCT = {
  courseSlug: 'mandala-masterclass',
  addonSlug: 'mandala-pack',
  /** What the buyer sees on PayPal's approval page and receipt (owner, 2026-10-25). */
  name: 'Online Art Learning Platform Access: Mandala Drawing',
  addonName: 'Online Art Learning Platform Access: Mandala Drawing Pack',
  /** Same numbers as the card checkout: $47 / €47 by buyer IP, the pack +$17 / +€17. */
  price: '47.00',
  addonPrice: '17.00',
};

export async function paypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('PayPal auth failed');
  return data.access_token;
}
