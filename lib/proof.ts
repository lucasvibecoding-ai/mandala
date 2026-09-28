// Proof of delivery: this site's sales and access emails go to the proof log in
// course-business-admin (/api/proof/ingest), which seals them into a tamper-evident
// chain. Best effort: never throws and never holds up a sale.

export const PROOF_SITE = 'mandala';

export type ProofEvent = {
  eventId?: string;
  kind: string;
  occurredAt?: string;
  orderId?: string | null;
  site?: string | null;
  courseSlug?: string | null;
  email?: string | null;
  paypalTxn?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
  data?: Record<string, unknown>;
};

export async function sendProof(events: ProofEvent[]): Promise<boolean> {
  const url = process.env.PROOF_INGEST_URL;
  const secret = process.env.PROOF_INGEST_SECRET;
  if (!url || !secret || events.length === 0) return false;
  const body = JSON.stringify({
    events: events.map((e) => ({ source: `site:${PROOF_SITE}`, site: PROOF_SITE, ...e })),
  });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return true;
      if (res.status < 500) {
        // A 4xx will not heal on retry: it is a bug in the event, so say so loudly.
        console.error(`proof: events rejected (${res.status}): ${await res.text().catch(() => '')}`);
        return false;
      }
    } catch (err) {
      if (attempt === 3) console.error('proof: send failed', err);
    }
    await new Promise((r) => setTimeout(r, 400 * attempt));
  }
  return false;
}

export function requestInfo(h: Headers) {
  const forwarded = h.get('x-forwarded-for');
  let city = h.get('x-vercel-ip-city');
  try {
    city = city ? decodeURIComponent(city) : null;
  } catch {
    // keep the raw header
  }
  return {
    ip: h.get('x-real-ip') || (forwarded ? forwarded.split(',')[0].trim() : null),
    userAgent: h.get('user-agent'),
    country: h.get('x-vercel-ip-country'),
    city,
  };
}

/** The email as sent with the personal access link blanked: the copy the proof log keeps. */
export function redactLinks(html: string, links: (string | undefined)[]): string {
  let out = html;
  for (const link of links) {
    if (!link) continue;
    for (const form of [link, link.replace(/&/g, '&amp;')]) {
      out = out.split(form).join('[personal access link]');
    }
  }
  return out;
}
