import Stripe from 'stripe';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createHash } from 'crypto';
import OrderConfirmation from '../../../emails/OrderConfirmation';
import { recordPurchase } from '../../../lib/airtable';

const sha256 = (value: string) =>
  createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const resend = new Resend(process.env.RESEND_API_KEY!);

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
      process.env.STRIPE_WEBHOOK_SECRET!
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

    let customerEmail = paymentIntent.receipt_email;
    let customerName: string | null = null;

    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
      customerEmail = customerEmail || charge.billing_details?.email || null;
      customerName = charge.billing_details?.name || null;
    }

    const toEmail = customerEmail || 'hello@mandalapractice.com';
    const firstName = customerName?.split(' ')[0];
    console.log(`Sending confirmation email to: ${toEmail} (receipt_email was: ${paymentIntent.receipt_email})`);

    try {
      const html = await render(OrderConfirmation({ customerEmail: toEmail }));
      const emailResult = await resend.emails.send({
        from: 'Aiko Mori <hello@mandalapractice.com>',
        to: toEmail,
        replyTo: 'hello@mandalapractice.com',
        subject: 'About your course purchase. Important update',
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
        }
      ).catch((err) => console.error('CAPI Purchase error:', err));
    }
  }

  return new Response('ok', { status: 200 });
}
