import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const pixelId = '1713180170119949';
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!accessToken) {
      // CAPI not configured yet, silently skip
      return NextResponse.json({ ok: true, capi: false });
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              event_name: 'InitiateCheckout',
              event_time: eventTime,
              event_id: eventId,
              action_source: 'website',
              custom_data: {
                value: 47.0,
                currency: 'USD',
                content_name: 'Mandala Masterclass',
                content_category: 'Online Course',
              },
            },
          ],
        }),
      }
    );

    const data = await res.json();
    return NextResponse.json({ ok: true, capi: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
