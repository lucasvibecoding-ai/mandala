import { NextResponse } from 'next/server';
import { PAYPAL_DIRECT, paypalDirectOpen } from '../../../../lib/paypal-direct';

// The PayPal button asks this before it shows (daily limit, lib/paypal-direct.ts). Cached at
// the edge for a minute; create-order re-checks without the cache before opening PayPal.
export async function GET() {
  const open = PAYPAL_DIRECT && (await paypalDirectOpen());
  return NextResponse.json({ open }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } });
}
