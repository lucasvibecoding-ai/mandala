import { after } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createHash } from 'crypto';
import OrderConfirmation from '../../../emails/OrderConfirmation';
import { PROOF_SITE, redactLinks, sendProof, type ProofEvent } from '../../../lib/proof';
import { recordPurchase } from '../../../lib/airtable';
import { createFiscalInvoiceWithin } from '../../../lib/eracuni';
import { resolveBuyerCountry } from '../../../lib/vat-country';

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
  suppressReminders = false,
  proof?: { orderId: string; role: string },
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
        // Proof of delivery: ties this grant and its logged link to the order.
        ...(proof ? { orderId: proof.orderId, site: PROOF_SITE, role: proof.role, via: 'email' } : {}),
        ...(addonSlug ? { addonSlug } : {}),
        ...(suppressReminders ? { suppressReminders: true } : {}),
      }),
    });
    if (grantRes.ok) {
      const data = (await grantRes.json()) as {
        actionUrl?: string;
        trackedUrl?: string | null;
        isNewUser?: boolean;
      };
      // trackedUrl is the platform's logged version of the link (proof of delivery).
      const link = data.trackedUrl || data.actionUrl;
      if (link) {
        return data.isNewUser ? { setupUrl: link } : { loginUrl: link };
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
        let stripeProof: Record<string, unknown> | null = null;

        // The charge's timestamp is when the money actually moved; the PI can be days
        // older if the buyer left checkout open, which would misdate the Airtable row.
        let chargeCreated: number | null = null;
        let payMethod = 'Stripe';
        let paypal: {
          payer_email?: string | null;
          payer_id?: string | null;
          transaction_id?: string | null;
          seller_protection?: { status?: string | null } | null;
        } | null = null;
        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
          chargeCreated = charge.created;
          payMethod = charge.payment_method_details?.type === 'paypal' ? 'PayPal' : 'Stripe';
          paypal =
            charge.payment_method_details?.type === 'paypal'
              ? (charge.payment_method_details.paypal ?? null)
              : null;
          // The PayPal account's own address, straight from PayPal: it is the address
          // PayPal knows, so it must always get an invitation (proof of delivery).
          customerEmail =
            customerEmail || paypal?.payer_email || charge.billing_details?.email || null;
          customerName = charge.billing_details?.name || null;
          cardCountry = charge.payment_method_details?.card?.country ?? null;
          billingCountry = charge.billing_details?.address?.country ?? null;
          postalCode = charge.billing_details?.address?.postal_code ?? null;
          // Full raw Stripe payment evidence for the VAT counter's transaction proof.
          stripeProof = {
            chargeId: charge.id,
            paymentType: charge.payment_method_details?.type ?? null,
            receiptUrl: charge.receipt_url ?? null,
            paymentMethod: charge.payment_method_details ?? null,
            billing: charge.billing_details ?? null,
            outcome: charge.outcome ?? null,
          };
        }

        // The address the buyer TYPED at checkout, stashed on the PI while they typed.
        // On PayPal, customerEmail above is the PayPal account address instead, and the
        // two are often different people's inboxes: one they read, one that proves
        // delivery in a dispute. Treat the typed one as primary and invite both.
        const typedEmailRaw =
          typeof paymentIntent.metadata?.buyer_email === 'string'
            ? paymentIntent.metadata.buyer_email.trim().toLowerCase()
            : '';
        const typedEmail = typedEmailRaw.includes('@') ? typedEmailRaw : null;
        const payerEmail = customerEmail ? customerEmail.trim().toLowerCase() : null;
        const primaryEmail = typedEmail || payerEmail;
        // Only the primary is nudged by the platform's reminder cron (user, 2026-09-01).
        const secondaryEmail =
          primaryEmail && payerEmail && payerEmail !== primaryEmail ? payerEmail : null;

        const toEmail = primaryEmail || 'hello@mandalapractice.com';
        const firstName = customerName?.split(' ')[0];

        const addonSlug =
          typeof paymentIntent.metadata?.includes_addon === 'string'
            ? paymentIntent.metadata.includes_addon
            : null;

        // Grant access and create the fiscal invoice in parallel. The invoice call retries
        // until it succeeds or the deadline, so the email waits for the invoice (up to
        // ~45s) but never longer, and never goes out before the invoice attempt resolves.
        // Where the buyer consumed the course, decided by the same signals (and the same
        // rules) the VAT counter uses below, so the invoice and the counter never disagree.
        const buyerCountry = resolveBuyerCountry({
          ipCountry:
            typeof paymentIntent.metadata?.ip_country === 'string'
              ? paymentIntent.metadata.ip_country
              : null,
          billingCountry,
          cardCountry,
        });

        // Proof of delivery: which inbox each invitation goes to. The PayPal account's
        // address is the one that counts in a PayPal dispute.
        const paypalEmail = paypal?.payer_email ? paypal.payer_email.trim().toLowerCase() : null;
        const roleOf = (email: string | null) =>
          paypalEmail && email === paypalEmail
            ? 'paypal'
            : email && email === typedEmail
              ? 'typed'
              : 'billing';
        const proofFor = (email: string | null) => ({ orderId: paymentIntent.id, role: roleOf(email) });
        const proofEmails: ProofEvent[] = [];

        const [access, secondaryAccess, invoice] = await Promise.all([
          grantCourseAccess(primaryEmail, addonSlug, false, proofFor(primaryEmail)),
          secondaryEmail
            ? grantCourseAccess(secondaryEmail, addonSlug, true, proofFor(secondaryEmail))
            : Promise.resolve(null),
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
              buyerCountry,
            },
            INVOICE_DEADLINE_MS,
          ).catch((err) => {
            console.error('invoice error:', err);
            return null;
          }),
        ]);

        // One confirmation per address, each carrying its own access link, so either
        // inbox is a complete route into the course. Sent one at a time: a failure on
        // the second address must never lose the first.
        const recipients: { email: string; access: { setupUrl?: string; loginUrl?: string } }[] = [
          { email: toEmail, access },
          ...(secondaryEmail && secondaryAccess
            ? [{ email: secondaryEmail, access: secondaryAccess }]
            : []),
        ];
        for (const recipient of recipients) {
          // The fiscal invoice is made out to the PAYER, so its link only ever goes
          // to that address (user, 2026-09-01). The other inbox gets access, not
          // someone else's receipt.
          const invoiceForThisRecipient =
            !payerEmail || recipient.email === payerEmail ? invoice?.publicUrl : undefined;
          try {
            const html = await render(
              OrderConfirmation({
                customerEmail: recipient.email,
                setupUrl: recipient.access.setupUrl,
                loginUrl: recipient.access.loginUrl,
                invoiceUrl: invoiceForThisRecipient,
              }),
            );
            const subject = 'Your Mandala Course is ready!';
            const emailResult = await resend.emails.send({
              from: 'Aiko Mori <hello@mandalapractice.com>',
              to: recipient.email,
              replyTo: 'hello@mandalapractice.com',
              subject,
              html,
            });
            console.log(`Email sent successfully to ${recipient.email}:`, emailResult);
            proofEmails.push(
              emailResult.error
                ? {
                    eventId: `email-failed:${paymentIntent.id}:${recipient.email}:${Date.now()}`,
                    kind: 'email.failed',
                    orderId: paymentIntent.id,
                    courseSlug: 'mandala-masterclass',
                    email: recipient.email,
                    data: { role: roleOf(recipient.email), subject, error: emailResult.error.message },
                  }
                : {
                    eventId: `email:${paymentIntent.id}:${recipient.email}`,
                    kind: 'email.sent',
                    orderId: paymentIntent.id,
                    courseSlug: 'mandala-masterclass',
                    email: recipient.email,
                    data: {
                      resendId: emailResult.data?.id ?? null,
                      subject,
                      role: roleOf(recipient.email),
                      template: access.setupUrl || access.loginUrl ? 'ready' : 'holding',
                      html: redactLinks(html, [recipient.access.setupUrl, recipient.access.loginUrl]),
                    },
                  },
            );
          } catch (emailErr) {
            console.error(`Failed to send email to ${recipient.email}:`, emailErr);
            proofEmails.push({
              eventId: `email-failed:${paymentIntent.id}:${recipient.email}:${Date.now()}`,
              kind: 'email.failed',
              orderId: paymentIntent.id,
              courseSlug: 'mandala-masterclass',
              email: recipient.email,
              data: {
                role: roleOf(recipient.email),
                error: emailErr instanceof Error ? emailErr.message : String(emailErr),
              },
            });
          }
        }

        // Proof of delivery: the payment, then every access email with its copy. Two
        // requests, so a problem with an email copy can never cost the payment record.
        const meta = (key: string) =>
          typeof paymentIntent.metadata?.[key] === 'string' ? paymentIntent.metadata[key] : null;
        await sendProof([
          {
            eventId: `paid:${paymentIntent.id}`,
            kind: 'order.paid',
            occurredAt: new Date((chargeCreated ?? paymentIntent.created) * 1000).toISOString(),
            orderId: paymentIntent.id,
            courseSlug: 'mandala-masterclass',
            email: paypalEmail || payerEmail || primaryEmail,
            paypalTxn: paypal?.transaction_id ?? null,
            ip: meta('ip_address'),
            userAgent: meta('user_agent'),
            country: meta('ip_country'),
            city: meta('ip_city'),
            data: {
              amount: paymentIntent.amount / 100,
              currency: (paymentIntent.currency || '').toUpperCase(),
              method: payMethod === 'PayPal' ? 'paypal' : (stripeProof?.paymentType ?? 'card'),
              paypalEmail,
              paypalPayerId: paypal?.payer_id ?? null,
              sellerProtection: paypal?.seller_protection?.status ?? null,
              typedEmail,
              payerEmail,
              payerName: customerName,
              product: 'Mandala Masterclass',
              addon: addonSlug ?? null,
              chargeId: stripeProof?.chargeId ?? null,
              receiptUrl: stripeProof?.receiptUrl ?? null,
            },
          },
        ]);
        await sendProof(proofEmails);

        if (customerEmail) {
          await recordPurchase({
            transactionId: paymentIntent.id,
            date: new Date((chargeCreated ?? paymentIntent.created) * 1000),
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            provider: payMethod,
            buyerCountry,
            email: customerEmail,
            firstName,
            // Customer stays the payer; the address they typed at checkout is kept
            // alongside it so support can find this purchase by either one.
            secondEmail: secondaryEmail ? primaryEmail : null,
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
          stripeProof: stripeProof ?? undefined,
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
