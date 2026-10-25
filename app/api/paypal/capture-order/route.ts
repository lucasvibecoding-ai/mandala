import { NextResponse, after } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createHash } from 'crypto';
import OrderConfirmation from '../../../../emails/OrderConfirmation';
import { recordPurchase } from '../../../../lib/airtable';
import { PROOF_SITE, redactLinks, sendProof, type ProofEvent } from '../../../../lib/proof';
import { PAYPAL_API, PAYPAL_DIRECT, PAYPAL_PRODUCT, paypalAccessToken } from '../../../../lib/paypal-direct';

// Direct PayPal (lib/paypal-direct.ts): captures the PayPal order, then fulfils it the way
// the Stripe webhook fulfils a card sale: course access (incl. the pack) for the typed AND
// the PayPal address, the confirmation email, proof of delivery, Airtable and the Meta
// Purchase event. Differences on purpose: the seller is NOT LH, so no e-računi invoice, no
// VAT Counter, and Airtable gets Fiscalized = "No" with no VAT.
//
// ⚠️ The SECOND place a confirmation email is sent and access is granted. A change to the
// email, subject, course slug or tracking in `app/api/stripe-webhook` belongs here too.

export const maxDuration = 60;

const sha256 = (value: string) => createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
const resend = new Resend(process.env.RESEND_API_KEY!);
const COURSE = PAYPAL_PRODUCT.courseSlug;

// Grant course access on the platform and return the per-buyer setup/login URL for the
// email. Idempotent (also called by the /success page).
async function grantCourseAccess(
  email: string | null,
  addonSlug: string | null,
  suppressReminders: boolean,
  proof: { orderId: string; role: string },
): Promise<{ setupUrl?: string; loginUrl?: string }> {
  if (!process.env.COURSE_PLATFORM_URL || !process.env.COURSE_PLATFORM_SECRET || !email) return {};
  const loginUrl = `${process.env.COURSE_PLATFORM_URL}/sign-in`;
  try {
    const grantRes = await fetch(`${process.env.COURSE_PLATFORM_URL}/api/grant-access`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.COURSE_PLATFORM_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        courseSlug: COURSE,
        orderId: proof.orderId,
        site: PROOF_SITE,
        role: proof.role,
        via: 'email',
        ...(addonSlug ? { addonSlug } : {}),
        ...(suppressReminders ? { suppressReminders: true } : {}),
      }),
    });
    if (grantRes.ok) {
      const data = (await grantRes.json()) as { actionUrl?: string; trackedUrl?: string | null; isNewUser?: boolean };
      const link = data.trackedUrl || data.actionUrl;
      if (link) return data.isNewUser ? { setupUrl: link } : { loginUrl: link };
    } else {
      console.error('grant-access failed:', grantRes.status, await grantRes.text());
    }
  } catch (err) {
    console.error('grant-access error:', err);
  }
  return { loginUrl };
}

export async function POST(request: Request) {
  if (!PAYPAL_DIRECT) return NextResponse.json({ error: 'PayPal is not enabled' }, { status: 404 });
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const clientIp = request.headers.get('x-real-ip') || forwardedFor.split(',')[0]?.trim() || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;
  const cookieHeader = request.headers.get('cookie') || '';
  const fbp = cookieHeader.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
  const fbc = cookieHeader.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
  const ipCountry = request.headers.get('x-vercel-ip-country') || undefined;
  const ipCityRaw = request.headers.get('x-vercel-ip-city');
  const ipCity = ipCityRaw ? decodeURIComponent(ipCityRaw) : undefined;

  try {
    const { orderID, email } = (await request.json()) as { orderID?: string; email?: unknown };
    if (!orderID) return NextResponse.json({ error: 'Missing orderID' }, { status: 400 });

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await paypalAccessToken()}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.status !== 'COMPLETED') {
      console.error('PayPal capture not completed:', data);
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // The address TYPED at checkout is primary (the inbox they read); the PayPal account
    // address is invited too (it proves delivery in a dispute), exactly like the webhook.
    const typedRaw = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const typedEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedRaw) ? typedRaw : null;
    const payerEmail = (data.payer?.email_address as string | undefined)?.trim().toLowerCase() || null;
    const primaryEmail = typedEmail || payerEmail;
    const secondaryEmail = primaryEmail && payerEmail && payerEmail !== primaryEmail ? payerEmail : null;
    const roleOf = (e: string | null) => (e && e === payerEmail ? 'paypal' : e && e === typedEmail ? 'typed' : 'payer');

    const firstName = data.payer?.name?.given_name as string | undefined;
    const buyerName = data.payer?.name ? [data.payer.name.given_name, data.payer.name.surname].filter(Boolean).join(' ') : null;
    const buyerCountry = (data.payer?.address?.country_code as string | undefined) || ipCountry || null;
    const unit = data.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const amount = capture?.amount?.value ? Number(capture.amount.value) : Number(PAYPAL_PRODUCT.price);
    const currency = (capture?.amount?.currency_code || 'USD') as string;
    const addonSlug = typeof unit?.custom_id === 'string' && unit.custom_id.startsWith('addon:') ? unit.custom_id.slice(6) : null;
    const paidAt = capture?.create_time ? new Date(capture.create_time) : new Date();

    // Answer the browser now (it goes to /success); fulfil in the background.
    after(async () => {
      try {
        const [access, secondaryAccess] = await Promise.all([
          grantCourseAccess(primaryEmail, addonSlug, false, { orderId: orderID, role: roleOf(primaryEmail) }),
          secondaryEmail
            ? grantCourseAccess(secondaryEmail, addonSlug, true, { orderId: orderID, role: roleOf(secondaryEmail) })
            : Promise.resolve(null),
        ]);

        const recipients = [
          ...(primaryEmail ? [{ email: primaryEmail, access }] : []),
          ...(secondaryEmail && secondaryAccess ? [{ email: secondaryEmail, access: secondaryAccess }] : []),
        ];
        const proofEmails: ProofEvent[] = [];
        for (const recipient of recipients) {
          // Same subject as the card confirmation (app/api/stripe-webhook).
          const subject = 'Your Mandala Course is ready!';
          try {
            const html = await render(
              OrderConfirmation({ customerEmail: recipient.email, setupUrl: recipient.access.setupUrl, loginUrl: recipient.access.loginUrl }),
            );
            const emailResult = await resend.emails.send({
              from: 'Aiko Mori <hello@mandalapractice.com>',
              to: recipient.email,
              replyTo: 'hello@mandalapractice.com',
              subject,
              html,
            });
            proofEmails.push(
              emailResult.error
                ? { eventId: `email-failed:${orderID}:${recipient.email}:${Date.now()}`, kind: 'email.failed', orderId: orderID, courseSlug: COURSE, email: recipient.email, data: { role: roleOf(recipient.email), subject, error: emailResult.error.message } }
                : {
                    eventId: `email:${orderID}:${recipient.email}`,
                    kind: 'email.sent',
                    orderId: orderID,
                    courseSlug: COURSE,
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
            proofEmails.push({ eventId: `email-failed:${orderID}:${recipient.email}:${Date.now()}`, kind: 'email.failed', orderId: orderID, courseSlug: COURSE, email: recipient.email, data: { role: roleOf(recipient.email), error: emailErr instanceof Error ? emailErr.message : String(emailErr) } });
          }
        }

        // Proof of delivery: the payment, then every access email.
        await sendProof([
          {
            eventId: `paid:${orderID}`,
            kind: 'order.paid',
            occurredAt: paidAt.toISOString(),
            orderId: orderID,
            courseSlug: COURSE,
            email: payerEmail || primaryEmail,
            paypalTxn: capture?.id ?? null,
            ip: clientIp ?? null,
            userAgent: userAgent ?? null,
            country: ipCountry ?? null,
            city: ipCity ?? null,
            data: {
              amount,
              currency,
              method: 'paypal-direct',
              paypalEmail: payerEmail,
              paypalPayerId: data.payer?.payer_id ?? null,
              sellerProtection: capture?.seller_protection?.status ?? null,
              typedEmail,
              payerEmail,
              payerName: buyerName,
              product: PAYPAL_PRODUCT.name,
              addon: addonSlug,
              captureId: capture?.id ?? null,
            },
          },
        ]);
        await sendProof(proofEmails);

        const customerEmail = payerEmail || primaryEmail;
        if (customerEmail) {
          await recordPurchase({
            transactionId: orderID,
            date: paidAt,
            amount,
            currency,
            provider: 'PayPal',
            buyerCountry,
            email: customerEmail,
            firstName,
            secondEmail: secondaryEmail ? primaryEmail : null,
            includeAddon: !!addonSlug,
            notFiscalized: true,
          });
        }

        const capiToken = process.env.META_CAPI_ACCESS_TOKEN;
        if (capiToken) {
          await fetch(`https://graph.facebook.com/v21.0/1713180170119949/events?access_token=${capiToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: [
                {
                  event_name: 'Purchase',
                  event_time: Math.floor(paidAt.getTime() / 1000),
                  event_id: orderID,
                  action_source: 'website',
                  user_data: {
                    ...(primaryEmail ? { em: [sha256(primaryEmail)] } : {}),
                    ...(clientIp ? { client_ip_address: clientIp } : {}),
                    ...(userAgent ? { client_user_agent: userAgent } : {}),
                    ...(fbp ? { fbp } : {}),
                    ...(fbc ? { fbc } : {}),
                  },
                  custom_data: { value: amount, currency, content_name: 'Mandala Masterclass', content_type: 'product' },
                },
              ],
            }),
          }).catch((err) => console.error('CAPI Purchase error:', err));
        }
      } catch (err) {
        console.error('Fulfillment error:', err);
      }
    });

    return NextResponse.json({ success: true, orderID });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ error: 'Failed to capture PayPal payment' }, { status: 500 });
  }
}
