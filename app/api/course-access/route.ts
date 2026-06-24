import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Add-on for the success page: turn a just-completed payment into a one-click
// course login/setup link, so the buyer does not have to open the email.
// The confirmation email flow is unchanged; this is purely additive and the
// course platform's grant-access is idempotent (it is also called by the
// Stripe webhook / PayPal capture).

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

// Resolve the buyer's email ONLY from a verified, successful payment.
// Returns null for anything unverified so no access link is ever handed out
// for a transaction id that was guessed or not actually paid.
async function verifiedEmail(body: {
  paymentIntent?: string;
  paypalOrder?: string;
}): Promise<string | null> {
  if (body.paymentIntent) {
    const pi = await stripe.paymentIntents.retrieve(body.paymentIntent);
    if (pi.status !== 'succeeded') return null;
    if (pi.metadata?.product_id !== process.env.STRIPE_PRODUCT_ID) return null;
    let email = pi.receipt_email;
    if (!email && pi.latest_charge) {
      const charge = await stripe.charges.retrieve(pi.latest_charge as string);
      email = charge.billing_details?.email || null;
    }
    return email || null;
  }

  if (body.paypalOrder) {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${body.paypalOrder}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status !== 'COMPLETED') return null;
    return data.payer?.email_address || null;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      paymentIntent?: string;
      paypalOrder?: string;
    };

    const email = await verifiedEmail(body);
    if (!email) return NextResponse.json({ ready: false });

    if (!process.env.COURSE_PLATFORM_URL || !process.env.COURSE_PLATFORM_SECRET) {
      return NextResponse.json({ ready: false });
    }

    const grantRes = await fetch(`${process.env.COURSE_PLATFORM_URL}/api/grant-access`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.COURSE_PLATFORM_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, courseSlug: 'mandala-masterclass' }),
    });
    if (!grantRes.ok) return NextResponse.json({ ready: false });

    const data = (await grantRes.json()) as { actionUrl?: string; isNewUser?: boolean };
    if (!data.actionUrl) return NextResponse.json({ ready: false });

    return NextResponse.json({ actionUrl: data.actionUrl, isNewUser: !!data.isNewUser, email });
  } catch (err) {
    console.error('course-access error:', err);
    return NextResponse.json({ ready: false });
  }
}
