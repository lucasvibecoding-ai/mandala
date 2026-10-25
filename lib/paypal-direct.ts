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

// Daily sales limit (owner, 2026-10-25): course-business-admin decides whether PayPal is open
// today (6-8 sales a day in the first week, reopening at 00:00 Berlin) and counts each sale.
const LIMIT_API = process.env.PAYPAL_DIRECT_ADMIN_URL || 'https://course-business-admin.vercel.app';
const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'unknown';

/** Whether PayPal may take a payment right now. Closed when the admin can't be asked. */
export async function paypalDirectOpen(): Promise<boolean> {
  try {
    const res = await fetch(`${LIMIT_API}/api/paypal-direct/status`, {
      headers: { Authorization: `Bearer ${process.env.PAYPAL_DIRECT_SECRET}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    return ((await res.json()) as { open?: boolean }).open === true;
  } catch (err) {
    console.error('paypal-direct status error:', err);
    return false;
  }
}

/** After a sale is in Airtable: the admin re-counts today and switches PayPal off at the limit. */
export async function reportPaypalDirectSale(): Promise<void> {
  try {
    await fetch(`${LIMIT_API}/api/paypal-direct/after-sale?site=${encodeURIComponent(SITE)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYPAL_DIRECT_SECRET}` },
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    console.error('paypal-direct after-sale error:', err);
  }
}
