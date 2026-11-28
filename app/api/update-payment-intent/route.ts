import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { COURSE_PRICE_CENTS, UPSELL_COURSE_SLUG, extrasCents } from '../../../lib/pricing';
import { giftMetadata } from '../../../lib/gift';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Toggles the order-bump on/off for an already-created PaymentIntent. Called
// when the buyer ticks/unticks the bump checkbox on the checkout page so
// Express Checkout (Apple/Google Pay) and the final card charge always match
// the live total. The PI's client_secret stays valid across updates.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      paymentIntentId?: string;
      includeBump?: boolean;
      includeCourse?: boolean;
      email?: string;
      // Gift checkout: the gift details (null = a "for me" order, clears any earlier gift).
      gift?: Record<string, unknown> | null;
    };
    const piId = body.paymentIntentId;
    const includeBump = body.includeBump === true;
    const includeCourse = body.includeCourse === true;
    if (!piId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId' },
        { status: 400 }
      );
    }

    // Email-only update: stash the address the buyer TYPED into the PI metadata.
    // PayPal overwrites billing_details.email with the PayPal account address, so
    // without this the typed address is lost the moment the tab closes and the
    // webhook can never tell the two apart. Metadata-only, so it must not touch
    // the amount (that would silently undo the order bump).
    if (typeof body.email === 'string' && body.includeBump === undefined) {
      const email = body.email.trim().toLowerCase();
      const updated = await stripe.paymentIntents.update(piId, {
        metadata: { buyer_email: email },
      });
      return NextResponse.json({ amount: updated.amount });
    }

    const amount = COURSE_PRICE_CENTS + extrasCents(includeBump, includeCourse);

    // Stripe MERGES metadata on update — omitting a key does NOT remove it. A key is
    // only unset by posting an empty string, so untick must send includes_addon: ''.
    // A gift's "any additional Aiko Arts course" is a free-course credit for the recipient
    // ('any'), not the fixed upsell course.
    const isGift = !!body.gift;
    const updated = await stripe.paymentIntents.update(piId, {
      amount,
      metadata: {
        includes_addon: includeBump ? 'mandala-pack' : '',
        includes_course: includeCourse ? (isGift ? 'any' : UPSELL_COURSE_SLUG) : '',
        ...('gift' in body ? giftMetadata(body.gift ?? null) : {}),
      },
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
