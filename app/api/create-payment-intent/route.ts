import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Cents to add to the base price when the buyer accepts the order bump.
const BUMP_AMOUNT_CENTS = 1700;

// Countries priced in USD ($47). Everything else — all of Europe, Africa, the Middle East,
// Asia, and unknown location — is priced in EUR (€47). €47 and $47 are both amount 4700, so
// only the currency flips; the amount stays the product's unit_amount.
const USD_COUNTRIES = new Set([
  // North America + US territories
  'US', 'CA', 'MX', 'PR', 'VI', 'GU', 'AS', 'MP',
  // Central America
  'GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA',
  // South America
  'CO', 'VE', 'EC', 'PE', 'BO', 'PY', 'UY', 'CL', 'AR', 'BR', 'GY', 'SR',
  // Caribbean
  'CU', 'DO', 'HT', 'JM', 'TT', 'BS', 'BB', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC',
  // Officially use the US dollar elsewhere
  'ZW', 'TL', 'PW', 'MH', 'FM',
  // Australia + New Zealand
  'AU', 'NZ',
]);

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
    // Buyer location for the VAT counter. Additive metadata only; absent in local dev.
    // update-payment-intent spreads existing metadata, so these survive an order-bump toggle.
    const ipCountry = request.headers.get('x-vercel-ip-country');
    const ipRegion = request.headers.get('x-vercel-ip-country-region');
    const ipCityRaw = request.headers.get('x-vercel-ip-city');
    const ipAddress =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '';
    if (ipCountry) metadata.ip_country = ipCountry;
    if (ipRegion) metadata.ip_region = ipRegion;
    if (ipCityRaw) metadata.ip_city = decodeURIComponent(ipCityRaw);
    if (ipAddress) metadata.ip_address = ipAddress;

    // Price in USD for the Americas + AU/NZ + dollar countries; EUR for everyone else.
    const currency =
      ipCountry && USD_COUNTRIES.has(ipCountry.toUpperCase()) ? 'usd' : 'eur';

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      currency,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
