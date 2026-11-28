import { NextResponse } from 'next/server';
import { GIFT_SITE, sendGiftEmail, type DeliveryPayload } from '../../../../lib/gift';

// POST /api/gift/deliver (Bearer COURSE_PLATFORM_SECRET): the platform's 5-minute cron asks this
// site to send a gift email that is due, from this site's own address. The platform marks it
// sent from the reply; the send itself is idempotent per gift (Resend idempotency key).
export async function POST(req: Request) {
  const secret = process.env.COURSE_PLATFORM_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const g = (await req.json().catch(() => null)) as DeliveryPayload | null;
  if (!g?.code || !g.giftUrl || !g.recipientEmail || g.courseSlug !== GIFT_SITE.courseSlug) {
    return NextResponse.json({ error: 'bad gift' }, { status: 400 });
  }
  try {
    const emailId = await sendGiftEmail(g);
    return NextResponse.json({ ok: true, emailId });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('gift deliver failed:', error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
