import { after } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createHash } from 'crypto';
import OrderConfirmation from '../../../emails/OrderConfirmation';
import { recordPurchase } from '../../../lib/airtable';
import { createFiscalInvoiceWithin } from '../../../lib/eracuni';

// Allow the background fulfillment (below) to run up to 60s — the Vercel Hobby cap.
export const maxDuration = 60;

// How long we keep retrying the e-računi invoice before sending the email without the
// invoice link. Kept safely under maxDuration so there's room to actually send the email
// and record the purchase before the function is killed at 60s.
const INVOICE_DEADLINE_MS = 30000;

const sha256 = (value: string) =>
  createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const resend = new Resend(process.env.RESEND_API_KEY!);

// Grant course access on the platform and return the per-buyer setup/login URL for the
// email. Idempotent (also called by the /success page and the PayPal capture route).
async function grantCourseAccess(
  email: string | null,
  addonSlug: string | null,
): Promise<{ setupUrl?: string; loginUrl?: string }> {
  if (!process.env.COURSE_PLATFORM_URL || !process.env.COURSE_PLATFORM_SECRET || !email) {
    return {};
  }
  // The course platform is configured (live course), so the buyer always gets the "ready"
  // email. If grant-access doesn't return a per-buyer link (e.g. the account already exists
  // because the /success page granted it first), fall back to the generic sign-in page so we
  // never send an "access pending" style email once a course is live.
  const loginUrl = `${process.env.COURSE_PLATFORM_URL}/sign-in`;
  try {
    const grantRes = await fetch(`${process.env.COURSE_PLATFORM_URL}/api/grant-access`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.COURSE_PLATFORM_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        courseSlug: 'mandala-masterclass',
        ...(addonSlug ? { addonSlug } : {}),
      }),
    });
    if (grantRes.ok) {
      const data = (await grantRes.json()) as { actionUrl?: string; isNewUser?: boolean };
      if (data.actionUrl) {
        return data.isNewUser ? { setupUrl: data.actionUrl } : { loginUrl: data.actionUrl };
      }
    } else {
      console.error('grant-access failed:', grantRes.status, await grantRes.text());
    }
  } catch (err) {
    console.error('grant-access error:', err);
  }
  return { loginUrl };
}

// Report the sale to the VAT counter. Fully isolated: no-ops unless VAT_COUNTER_URL and
// VAT_COUNTER_SECRET are set, times out fast, and never throws — so it can never affect the
// payment, email, course access, fiscal invoice, or Airtable record.
async function postVatSale(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.VAT_COUNTER_URL;
  const secret = process.env.VAT_COUNTER_SECRET;
  if (!url || !secret) return;
  try {
    const res = await fetch(`${url}/api/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error('vat-counter ingest failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('vat-counter ingest error:', err);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (paymentIntent.metadata?.product_id !== process.env.STRIPE_PRODUCT_ID) {
      return new Response('ok', { status: 200 });
    }

    // Ack Stripe immediately, then fulfill in the background. This lets us wait up to
    // ~45s for the fiscalized invoice without Stripe timing out and retrying. Course
    // access is also granted on the /success page, so the buyer is never blocked on this.
    after(async () => {
      try {
        let customerEmail = paymentIntent.receipt_email;
        let customerName: string | null = null;
        let cardCountry: string | null = null;
        let billingCountry: string | null = null;
        let postalCode: string | null = null;

        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
          customerEmail = customerEmail || charge.billing_details?.email || null;
          customerName = charge.billing_details?.name || null;
          cardCountry = charge.payment_method_details?.card?.country ?? null;
          billingCountry = charge.billing_details?.address?.country ?? null;
          postalCode = charge.billing_details?.address?.postal_code ?? null;
        }

        const toEmail = customerEmail || 'hello@mandalapractice.com';
        const firstName = customerName?.split(' ')[0];

        const addonSlug =
          typeof paymentIntent.metadata?.includes_addon === 'string'
            ? paymentIntent.metadata.includes_addon
            : null;

        // Grant access and create the fiscal invoice in parallel. The invoice call retries
        // until it succeeds or the deadline, so the email waits for the invoice (up to
        // ~45s) but never longer, and never goes out before the invoice attempt resolves.
        const [access, invoice] = await Promise.all([
          grantCourseAccess(customerEmail, addonSlug),
          createFiscalInvoiceWithin(
            {
              apiTransactionId: paymentIntent.id,
              buyerName: customerName || undefined,
              buyerEmail: customerEmail || undefined,
              description: 'Mandala Masterclass',
              amount: paymentIntent.amount / 100,
              currency: (paymentIntent.currency || 'eur').toUpperCase(),
              methodOfPayment: 'Stripe',
              includeAddon: !!addonSlug,
            },
            INVOICE_DEADLINE_MS,
          ).catch((err) => {
            console.error('invoice error:', err);
            return null;
          }),
        ]);

        try {
          const html = await render(
            OrderConfirmation({
              customerEmail: toEmail,
              setupUrl: access.setupUrl,
              loginUrl: access.loginUrl,
              invoiceUrl: invoice?.publicUrl,
            }),
          );
          const subject = 'Your Mandala Course is ready!';
          const emailResult = await resend.emails.send({
            from: 'Aiko Mori <hello@mandalapractice.com>',
            to: toEmail,
            replyTo: 'hello@mandalapractice.com',
            subject,
            html,
          });
          console.log(`Email sent successfully to ${toEmail}:`, emailResult);
        } catch (emailErr) {
          console.error(`Failed to send email to ${toEmail}:`, emailErr);
        }

        if (customerEmail) {
          await recordPurchase({
            transactionId: paymentIntent.id,
            date: new Date(paymentIntent.created * 1000),
            amount: paymentIntent.amount / 100,
            provider: 'Stripe',
            email: customerEmail,
            firstName,
            includeAddon: !!addonSlug,
          });
        }

        // Server-side CAPI Purchase event
        const capiToken = process.env.META_CAPI_ACCESS_TOKEN;
        if (capiToken) {
          const pixelId = '1713180170119949';
          const eventId = paymentIntent.id;
          await fetch(
            `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${capiToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: [
                  {
                    event_name: 'Purchase',
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    action_source: 'website',
                    user_data: {
                      em: [sha256(toEmail)],
                    },
                    custom_data: {
                      value: 47.0,
                      currency: 'USD',
                      content_name: 'Mandala Masterclass',
                      content_type: 'product',
                    },
                  },
                ],
              }),
            },
          ).catch((err) => console.error('CAPI Purchase error:', err));
        }

        // Report the sale to the VAT counter. Runs last and is fully isolated, so it can
        // never delay or affect anything above.
        await postVatSale({
          source: 'mandala',
          transactionId: paymentIntent.id,
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency,
          ipCountry:
            typeof paymentIntent.metadata?.ip_country === 'string'
              ? paymentIntent.metadata.ip_country
              : undefined,
          ipRegion:
            typeof paymentIntent.metadata?.ip_region === 'string'
              ? paymentIntent.metadata.ip_region
              : undefined,
          ipCity:
            typeof paymentIntent.metadata?.ip_city === 'string'
              ? paymentIntent.metadata.ip_city
              : undefined,
          ipAddress:
            typeof paymentIntent.metadata?.ip_address === 'string'
              ? paymentIntent.metadata.ip_address
              : undefined,
          stripeCountry: billingCountry ?? undefined,
          cardCountry: cardCountry ?? undefined,
          postalCode: postalCode ?? undefined,
          createdAt: new Date(paymentIntent.created * 1000).toISOString(),
        });
      } catch (err) {
        console.error('Fulfillment error:', err);
      }
    });

    return new Response('ok', { status: 200 });
  }

  return new Response('ok', { status: 200 });
}
