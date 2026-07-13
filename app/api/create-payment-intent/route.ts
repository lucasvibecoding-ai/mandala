import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Cents to add to the base price when the buyer accepts the order bump.
const BUMP_AMOUNT_CENTS = 1700;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      includeBump?: boolean;
    };
    const includeBump = body.includeBump === true;

    const productId = process.env.STRIPE_PRODUCT_ID!;

    const product = await stripe.products.retrieve(
      productId,
      { expand: ['default_price'] }
    );
    const price = product.default_price as Stripe.Price;
    const amount = (price.unit_amount ?? 0) + (includeBump ? BUMP_AMOUNT_CENTS : 0);

    const metadata: Record<string, string> = {
      product_id: product.id,
      product_name: product.name,
    };
    if (includeBump) {
      metadata.includes_addon = 'mandala-pack';
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
