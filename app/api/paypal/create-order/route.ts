import { NextResponse } from 'next/server';

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
    const body = (await request.json().catch(() => ({}))) as {
      includeBump?: boolean;
    };
    const includeBump = body.includeBump === true;

    const baseDescription = 'Mandala Masterclass';
    const description = includeBump
      ? `${baseDescription} + Mandala Pack`
      : baseDescription;
    const value = includeBump ? '64.00' : '47.00';

    const accessToken = await getAccessToken();

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value,
            },
            description,
            // custom_id flags whether the bump was bought so capture-order can
            // grant the addon access on aikoarts after capture.
            custom_id: includeBump ? 'includes_addon=mandala-pack' : 'base_only',
          },
        ],
      }),
    });

    const data = await res.json();
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
