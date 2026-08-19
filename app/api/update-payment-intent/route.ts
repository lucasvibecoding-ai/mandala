import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const BUMP_AMOUNT_CENTS = 1700;

// Toggles the order-bump on/off for an already-created PaymentIntent. Called
// when the buyer ticks/unticks the bump checkbox on the checkout page so
// Express Checkout (Apple/Google Pay) and the final card charge always match
// the live total. The PI's client_secret stays valid across updates.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      paymentIntentId?: string;
      includeBump?: boolean;
    };
    const piId = body.paymentIntentId;
    const includeBump = body.includeBump === true;
    if (!piId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId' },
        { status: 400 }
      );
    }

    const productId = process.env.STRIPE_PRODUCT_ID!;
    const product = await stripe.products.retrieve(productId, {
      expand: ['default_price'],
    });
    const price = product.default_price as Stripe.Price;
    const amount = (price.unit_amount ?? 0) + (includeBump ? BUMP_AMOUNT_CENTS : 0);

    // Stripe MERGES metadata on update — omitting a key does NOT remove it. A key is
    // only unset by posting an empty string, so untick must send includes_addon: ''.
    const updated = await stripe.paymentIntents.update(piId, {
      amount,
      metadata: { includes_addon: includeBump ? 'mandala-pack' : '' },
    });

    return NextResponse.json({ amount: updated.amount });
  } catch (error) {
    console.error('Update payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
