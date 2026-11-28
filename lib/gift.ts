import { Resend } from 'resend';
import { render } from '@react-email/render';
import GiftRecipient from '../emails/GiftRecipient';
import { markGiftSentInAirtable } from './airtable';

// Gift orders (owner 2026-11-23). The checkout stores the gift on the PaymentIntent metadata
// (gift=1 + gift_*). The webhook registers the gift on the course platform (aikoarts.com
// /api/gifts), which holds the one-use gift link and the send time. The recipient's email always
// goes out from THIS site's own address: straight from the webhook when it is due now, else when
// the platform's 5-minute cron calls /api/gift/deliver. The buyer never gets the course.

// Per-site settings: the only part that differs between the course sites.
export const GIFT_SITE = {
  site: 'mandala',
  siteUrl: 'https://mandalapractice.com',
  courseSlug: 'mandala-masterclass',
  courseName: 'Mandala Masterclass',
  packName: 'Mandala Pack',
  from: 'Aiko <hello@mandalapractice.com>',
  replyTo: 'hello@mandalapractice.com',
};

export type GiftOrder = {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  /** ISO time the gift email goes out ('' = immediately). */
  sendAt: string;
  sendTz: string;
  /** e.g. "on Fri, Dec 25 at 8:00 am, UK & Ireland (London) time"; '' = immediately. */
  sendLocal: string;
};

const meta = (m: Record<string, string> | null | undefined, k: string) =>
  typeof m?.[k] === 'string' ? m[k].trim() : '';

/** The gift on a PaymentIntent, or null for a normal "for me" order. */
export function giftFromMetadata(m: Record<string, string> | null | undefined): GiftOrder | null {
  if (meta(m, 'gift') !== '1') return null;
  const recipientEmail = meta(m, 'gift_to_email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return null;
  return {
    recipientName: meta(m, 'gift_to_name'),
    recipientEmail,
    senderName: meta(m, 'gift_from'),
    message: meta(m, 'gift_msg'),
    sendAt: meta(m, 'gift_send_at'),
    sendTz: meta(m, 'gift_tz'),
    sendLocal: meta(m, 'gift_local'),
  };
}

/** Wall-clock `date` (YYYY-MM-DD) at `hour` (0-23) in `tz`, as a UTC instant. Null if invalid. */
export function zonedToUtc(date: string, hour: number, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m || !Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const wall = Date.UTC(y, mo - 1, d, hour, 0, 0);
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return null;
  }
  const offsetAt = (t: number) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
  };
  // Two passes settle the offset, also across a DST change.
  let t = wall - offsetAt(wall);
  t = wall - offsetAt(t);
  return new Date(t);
}

/** Metadata to store on the PaymentIntent for a gift (all '' to clear it). */
export function giftMetadata(input: {
  recipientName?: unknown;
  recipientEmail?: unknown;
  senderName?: unknown;
  message?: unknown;
  when?: unknown;
  date?: unknown;
  hour?: unknown;
  tz?: unknown;
  label?: unknown;
} | null): Record<string, string> {
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  if (!input) {
    return { gift: '', gift_to_name: '', gift_to_email: '', gift_from: '', gift_msg: '', gift_send_at: '', gift_tz: '', gift_local: '' };
  }
  const tz = s(input.tz, 64) || 'UTC';
  let sendAt = '';
  let label = '';
  if (input.when === 'later') {
    const hour = Number(s(input.hour, 5).split(':')[0]);
    const at = zonedToUtc(s(input.date, 10), hour, tz);
    if (at && at.getTime() > Date.now()) {
      sendAt = at.toISOString();
      label = s(input.label, 120);
    }
  }
  return {
    gift: '1',
    gift_to_name: s(input.recipientName, 60),
    gift_to_email: s(input.recipientEmail, 200).toLowerCase(),
    gift_from: s(input.senderName, 60),
    gift_msg: s(input.message, 480),
    gift_send_at: sendAt,
    gift_tz: tz,
    gift_local: label,
  };
}

type Registered = { code: string; giftUrl: string; sendAt: string; sent: boolean; sendNow: boolean };

/** Register the gift on the platform (idempotent on the order). Retries a few times. */
export async function registerGift(input: {
  orderId: string;
  order: GiftOrder;
  buyerEmail: string;
  addonSlug: string | null;
  extraCourse: boolean;
}): Promise<Registered> {
  const url = process.env.COURSE_PLATFORM_URL;
  const secret = process.env.COURSE_PLATFORM_SECRET;
  if (!url || !secret) throw new Error('COURSE_PLATFORM_URL / COURSE_PLATFORM_SECRET not set');
  let last = '';
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${url}/api/gifts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: input.orderId,
          site: GIFT_SITE.site,
          siteUrl: GIFT_SITE.siteUrl,
          courseSlug: GIFT_SITE.courseSlug,
          addonSlug: input.addonSlug,
          extraCourse: input.extraCourse,
          buyerEmail: input.buyerEmail,
          senderName: input.order.senderName,
          recipientName: input.order.recipientName,
          recipientEmail: input.order.recipientEmail,
          message: input.order.message,
          sendAt: input.order.sendAt,
          sendTz: input.order.sendTz,
          sendLocal: input.order.sendLocal,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return (await res.json()) as Registered;
      last = `${res.status} ${await res.text().catch(() => '')}`;
      if (res.status >= 400 && res.status < 500) break;
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, attempt * 2000));
  }
  throw new Error(`gift register failed: ${last}`);
}

export type DeliveryPayload = {
  code: string;
  giftUrl: string;
  orderId: string;
  courseSlug: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  addonSlug: string | null;
  extraCourse: boolean;
};

// Made on first send, so importing this file (the thank-you page does) never needs the key.
let resendClient: Resend | null = null;
const getResend = () => (resendClient ??= new Resend(process.env.RESEND_API_KEY!));

/** Send the gift email to the recipient and tick "Gift Sent" in Airtable. Returns the Resend id. */
export async function sendGiftEmail(g: DeliveryPayload): Promise<string> {
  const html = await render(
    GiftRecipient({
      recipientName: g.recipientName,
      senderName: g.senderName || 'Someone who loves you',
      message: g.message,
      giftUrl: g.giftUrl,
      extraCourse: g.extraCourse,
      pack: !!g.addonSlug,
      siteUrl: GIFT_SITE.siteUrl,
    }),
  );
  const from = g.senderName ? `${g.senderName} sent you a gift` : 'You have been sent a gift';
  const { data, error } = await getResend().emails.send(
    {
      from: GIFT_SITE.from,
      to: g.recipientEmail,
      replyTo: GIFT_SITE.replyTo,
      subject: `${from}: the ${GIFT_SITE.courseName}`,
      html,
    },
    // One gift email per gift, even when the webhook and the cron both try.
    { idempotencyKey: `gift-${g.code}` },
  );
  if (error || !data?.id) throw new Error(error?.message || 'Resend returned no id');
  await markGiftSentInAirtable(g.orderId).catch((err) => console.error('Airtable Gift Sent tick failed:', err));
  return data.id;
}

/** Tell the platform how a send went (so the cron retries a failure). */
export async function reportGiftSend(code: string, result: { emailId: string } | { error: string }) {
  const url = process.env.COURSE_PLATFORM_URL;
  const secret = process.env.COURSE_PLATFORM_SECRET;
  if (!url || !secret) return;
  await fetch(`${url}/api/gifts/sent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, ...result }),
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => console.error('gift sent report failed:', err));
}
