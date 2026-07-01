import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createHash } from 'crypto';
import OrderConfirmation from '../../../../emails/OrderConfirmation';
import { recordPurchase } from '../../../../lib/airtable';

const sha256 = (value: string) =>
  createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

const resend = new Resend(process.env.RESEND_API_KEY!);

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
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

export async function POST(request: Request) {
  try {
    const { orderID } = await request.json();
    const accessToken = await getAccessToken();

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (data.status === 'COMPLETED') {
      const customerEmail = data.payer?.email_address || 'hello@mandalapractice.com';

      // Look at the custom_id we stamped on the PayPal order to decide whether
      // the buyer added the Mandala Pack bump.
      const customId = data.purchase_units?.[0]?.custom_id as string | undefined;
      const addonSlug = customId?.startsWith('includes_addon=')
        ? customId.slice('includes_addon='.length)
        : null;

      // Grant access on the course platform — get back a per-buyer URL to embed
      // in the confirmation email so the buyer gets a single message with a CTA.
      let setupUrl: string | undefined;
      let loginUrl: string | undefined;
      try {
        if (
          process.env.COURSE_PLATFORM_URL &&
          process.env.COURSE_PLATFORM_SECRET &&
          data.payer?.email_address
        ) {
          const grantRes = await fetch(
            `${process.env.COURSE_PLATFORM_URL}/api/grant-access`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.COURSE_PLATFORM_SECRET}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: data.payer.email_address,
                courseSlug: 'mandala-masterclass',
                ...(addonSlug ? { addonSlug } : {}),
              }),
            }
          );
          if (grantRes.ok) {
            const granted = (await grantRes.json()) as {
              actionUrl?: string;
              isNewUser?: boolean;
            };
            if (granted.actionUrl) {
              if (granted.isNewUser) setupUrl = granted.actionUrl;
              else loginUrl = granted.actionUrl;
            }
          } else {
            console.error('grant-access failed:', grantRes.status, await grantRes.text());
          }
        }
      } catch (err) {
        console.error('grant-access error:', err);
      }

      try {
        const html = await render(OrderConfirmation({ customerEmail, setupUrl, loginUrl }));
        const subject = setupUrl || loginUrl
          ? 'Your Mandala Course is ready!'
          : 'About your course purchase. Important update';
        const emailResult = await resend.emails.send({
          from: 'Aiko Mori <hello@mandalapractice.com>',
          to: customerEmail,
          replyTo: 'hello@mandalapractice.com',
          subject,
          html,
        });
        console.log(`Email sent successfully to ${customerEmail}:`, emailResult);
      } catch (emailErr) {
        console.error(`Failed to send email to ${customerEmail}:`, emailErr);
      }

      if (data.payer?.email_address) {
        const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
        const amountStr = capture?.amount?.value;
        const amount = amountStr ? Number(amountStr) : 47;
        await recordPurchase({
          transactionId: orderID,
          date: new Date(),
          amount,
          provider: 'PayPal',
          email: data.payer.email_address,
          firstName: data.payer.name?.given_name,
        });
      }

      // Server-side CAPI Purchase event
      const capiToken = process.env.META_CAPI_ACCESS_TOKEN;
      if (capiToken) {
        const pixelId = '1713180170119949';
        const eventId = orderID;
        const forwardedFor = request.headers.get('x-forwarded-for') || '';
        const clientIp = forwardedFor.split(',')[0]?.trim() || undefined;
        const userAgent = request.headers.get('user-agent') || undefined;
        const cookieHeader = request.headers.get('cookie') || '';
        const fbp = cookieHeader.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
        const fbc = cookieHeader.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
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
                    em: [sha256(customerEmail)],
                    ...(clientIp ? { client_ip_address: clientIp } : {}),
                    ...(userAgent ? { client_user_agent: userAgent } : {}),
                    ...(fbp ? { fbp } : {}),
                    ...(fbc ? { fbc } : {}),
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
          }
        ).catch((err) => console.error('CAPI Purchase error:', err));
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { error: 'Payment not completed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
}
