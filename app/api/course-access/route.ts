import { NextResponse, after } from 'next/server';
import Stripe from 'stripe';
import { PROOF_SITE, requestInfo, sendProof } from '../../../lib/proof';
import { PAYPAL_PRODUCT } from '../../../lib/paypal-direct';
import { UPSELL_COURSE_SLUG } from '../../../lib/pricing';

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

// Resolve the buyer's email ONLY from a verified, successful payment, plus the checkout
// extras they paid for (pack slug, upsell course slug) so the thank-you page can grant
// everything at once. Returns null for anything unverified so no access link is ever
// handed out for a transaction id that was guessed or not actually paid.
type Verified = { email: string; addonSlug: string | null; upsellSlug: string | null };

async function verifiedPurchase(body: {
  paymentIntent?: string;
  paypalOrder?: string;
}): Promise<Verified | null> {
  if (body.paymentIntent) {
    const pi = await stripe.paymentIntents.retrieve(body.paymentIntent);
    if (pi.status !== 'succeeded') return null;
    if (pi.metadata?.product_id !== process.env.STRIPE_PRODUCT_ID) return null;
    const addonSlug = pi.metadata?.includes_addon || null;
    const upsellSlug = pi.metadata?.includes_course || null;
    // Prefer the address the buyer typed at checkout (stashed on the PI while they
    // typed). On PayPal, billing_details holds the PayPal account address instead,
    // and the success-page button should sign them in as the account they expect.
    // The webhook still invites both addresses.
    const typed =
      typeof pi.metadata?.buyer_email === 'string' && pi.metadata.buyer_email.includes('@')
        ? pi.metadata.buyer_email.trim().toLowerCase()
        : null;
    if (typed) return { email: typed, addonSlug, upsellSlug };
    let email = pi.receipt_email;
    if (!email && pi.latest_charge) {
      const charge = await stripe.charges.retrieve(pi.latest_charge as string);
      email = charge.billing_details?.email || null;
    }
    return email ? { email, addonSlug, upsellSlug } : null;
  }

  if (body.paypalOrder) {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${body.paypalOrder}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status !== 'COMPLETED') return null;
    const email = data.payer?.email_address || null;
    // Direct-PayPal extras ride in custom_id (app/api/paypal/create-order).
    const unit = data.purchase_units?.[0];
    const customId: unknown = unit?.payments?.captures?.[0]?.custom_id ?? unit?.custom_id;
    const extras = typeof customId === 'string' && customId.startsWith('extras:') ? customId.slice(7).split('+') : [];
    const addonSlug =
      typeof customId === 'string' && customId.startsWith('addon:')
        ? customId.slice(6)
        : extras.includes('pack')
          ? PAYPAL_PRODUCT.addonSlug
          : null;
    return email ? { email, addonSlug, upsellSlug: extras.includes('course') ? UPSELL_COURSE_SLUG : null } : null;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      paymentIntent?: string;
      paypalOrder?: string;
    };

    const purchase = await verifiedPurchase(body);
    if (!purchase) return NextResponse.json({ ready: false });
    const { email, addonSlug, upsellSlug } = purchase;

    // Proof of delivery: the thank-you page of a verified payment was opened here.
    const orderId = body.paymentIntent || body.paypalOrder || null;
    const info = requestInfo(request.headers);
    after(() =>
      sendProof([
        {
          eventId: `thankyou:${orderId}`,
          kind: 'thankyou.shown',
          orderId,
          courseSlug: 'mandala-masterclass',
          email,
          ...info,
          data: {
            accessButton: !!(process.env.COURSE_PLATFORM_URL && process.env.COURSE_PLATFORM_SECRET),
          },
        },
      ]),
    );

    if (!process.env.COURSE_PLATFORM_URL || !process.env.COURSE_PLATFORM_SECRET) {
      return NextResponse.json({ ready: false });
    }

    const signInUrl = `${process.env.COURSE_PLATFORM_URL}/sign-in`;

    // Immediate access to the upsell course too: grant it BEFORE the main course, so its
    // pending enrollment already exists when the buyer clicks the button below and signs up
    // (the platform converts every pending enrollment for the email at sign-up). Idempotent
    // with the webhook / PayPal capture grants. Reminders stay with the main course.
    if (upsellSlug) {
      await fetch(`${process.env.COURSE_PLATFORM_URL}/api/grant-access`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.COURSE_PLATFORM_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          courseSlug: upsellSlug,
          suppressReminders: true,
          ...(orderId ? { orderId, site: PROOF_SITE, role: 'typed', via: 'thankyou' } : {}),
        }),
      }).catch((err) => console.error('upsell grant-access error:', err));
    }

    const grantRes = await fetch(`${process.env.COURSE_PLATFORM_URL}/api/grant-access`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.COURSE_PLATFORM_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        courseSlug: 'mandala-masterclass',
        // The pack too, so it is there from the first login.
        ...(addonSlug ? { addonSlug } : {}),
        // Proof of delivery: ties this grant and its logged link to the order.
        ...(orderId ? { orderId, site: PROOF_SITE, role: 'typed', via: 'thankyou' } : {}),
      }),
    });

    // The account may already exist because the Stripe webhook / PayPal capture granted access
    // first — in that race grant-access returns no per-buyer link. Since the payment is verified
    // and the course is live, still show the button, pointing at the generic sign-in page, so it
    // never silently disappears on the buyer.
    if (grantRes.ok) {
      const data = (await grantRes.json()) as {
        actionUrl?: string;
        trackedUrl?: string | null;
        isNewUser?: boolean;
      };
      if (data.actionUrl) {
        // trackedUrl is the platform's logged version of the link (proof of delivery).
        return NextResponse.json({
          actionUrl: data.trackedUrl || data.actionUrl,
          isNewUser: !!data.isNewUser,
          email,
        });
      }
    } else {
      console.error('grant-access failed:', grantRes.status, await grantRes.text());
    }

    return NextResponse.json({ actionUrl: signInUrl, isNewUser: false, email });
  } catch (err) {
    console.error('course-access error:', err);
    return NextResponse.json({ ready: false });
  }
}
