import { NextResponse } from 'next/server';
import { currencyForCountry } from '../../../../lib/pricing';
import { PAYPAL_API, PAYPAL_DIRECT, PAYPAL_PRODUCT, paypalAccessToken, paypalDirectOpen } from '../../../../lib/paypal-direct';

// Direct PayPal (lib/paypal-direct.ts): creates the PayPal order the SDK button opens;
// /api/paypal/capture-order finishes it and fulfils the sale. The amounts mirror the card
// checkout: the course at $49.99 / €49.99 by buyer IP, plus the pack and/or the upsell course
// (both together at the bundle price) when their boxes are ticked.

export async function POST(request: Request) {
  if (!PAYPAL_DIRECT) return NextResponse.json({ error: 'PayPal is not enabled' }, { status: 404 });
  // Today's PayPal limit is reached: the button hides, and a stale button can't open PayPal.
  if (!(await paypalDirectOpen())) return NextResponse.json({ error: 'PayPal is closed for today' }, { status: 403 });
  try {
    const body = (await request.json().catch(() => ({}))) as { currency?: unknown; includeAddon?: unknown; includeCourse?: unknown };

    // €49.99 / $49.99 by buyer IP (lib/pricing.ts), the same rule the Stripe charge uses. PayPal
    // rejects an order whose currency differs from the SDK context, so the button's
    // currency is honoured only when it agrees.
    const locked = currencyForCountry(request.headers.get('x-vercel-ip-country')).toUpperCase();
    const requested = typeof body.currency === 'string' ? body.currency.toUpperCase() : '';
    if (requested && requested !== locked) {
      console.warn(`paypal create-order: ignoring requested currency ${requested}, using ${locked}`);
    }
    const currency = locked;
    const withAddon = body.includeAddon === true;
    const withCourse = body.includeCourse === true;

    const item = (name: string, value: string) => ({ name, quantity: '1', category: 'DIGITAL_GOODS', unit_amount: { currency_code: currency, value } });
    // Both extras together are one bundle line at the bundle price, so the lines add up to the total.
    const extras =
      withAddon && withCourse
        ? [item(PAYPAL_PRODUCT.bundleName, PAYPAL_PRODUCT.bundlePrice)]
        : [
            ...(withAddon ? [item(PAYPAL_PRODUCT.addonName, PAYPAL_PRODUCT.addonPrice)] : []),
            ...(withCourse ? [item(PAYPAL_PRODUCT.upsellName, PAYPAL_PRODUCT.upsellPrice)] : []),
          ];
    const items = [item(PAYPAL_PRODUCT.name, PAYPAL_PRODUCT.price), ...extras];
    const total = items.reduce((sum, i) => sum + Number(i.unit_amount.value), 0).toFixed(2);

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await paypalAccessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: PAYPAL_PRODUCT.name,
            // Read back by capture-order to grant the extras too.
            custom_id: withAddon || withCourse ? `extras:${[withAddon && 'pack', withCourse && 'course'].filter(Boolean).join('+')}` : 'course',
            amount: { currency_code: currency, value: total, breakdown: { item_total: { currency_code: currency, value: total } } },
            items,
          },
        ],
        application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
      }),
    });

    const data = await res.json();
    if (!data.id) {
      console.error('PayPal create order returned no id:', data);
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 502 });
    }
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
  }
}
