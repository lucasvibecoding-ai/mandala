'use client';

import { useEffect, useRef, useState } from 'react';

// The Aiko Arts membership offer on the thank-you page: all courses for $25/€25 a month
// (kept while they stay) for 30 minutes after the course payment. aikoarts.com decides
// everything (who sees it, the price, the real time limit, the charge); this only shows
// it. Card buyers say yes in one click (the card they just used); PayPal buyers get a
// short secure Stripe page. After a yes they go straight to setting up their account.
// The same file is on every course site.
const PLATFORM = 'https://aikoarts.com';

type Course = { slug: string; title: string; thumbnail: string | null; minutes: number; yours: boolean };
type Offer = {
  show: true;
  price: string;
  regularPrice: string;
  msLeft: number;
  total: number;
  hours: number;
  oneClick: boolean;
  courses: Course[];
};

const ORANGE = '#b4542f';
const INK = '#1f2a44';
const MUTED = '#5b6478';

export default function MembershipUpsell({
  paymentIntent,
  clientSecret,
  actionUrl,
  joinedFromCheckout,
}: {
  paymentIntent: string | null;
  clientSecret: string | null;
  /** Where "Set up your account" goes; a yes leads straight there. */
  actionUrl: string;
  /** Back from the Stripe page after paying for the membership. */
  joinedFromCheckout: boolean;
}) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'joined' | 'ended' | 'closed'>(
    joinedFromCheckout ? 'joined' : 'idle',
  );
  const [left, setLeft] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const fired = useRef(false);
  const closedKey = `aa-upsell-no:${paymentIntent}`;

  useEffect(() => {
    if (fired.current || joinedFromCheckout || !paymentIntent || !clientSecret) return;
    fired.current = true;
    try {
      if (sessionStorage.getItem(closedKey)) return;
    } catch {}
    fetch(`${PLATFORM}/api/upsell/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntent, clientSecret }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.show) {
          setOffer(d);
          const end = Date.now() + d.msLeft;
          const tick = () => {
            const ms = end - Date.now();
            setLeft(Math.max(0, ms));
            if (ms <= 0) {
              clearInterval(id);
              setState((s) => (s === 'idle' ? 'ended' : s));
            }
          };
          const id = window.setInterval(tick, 1000);
          tick();
        } else if (d?.joined) {
          setState('joined');
        }
      })
      .catch(() => {});
  }, [paymentIntent, clientSecret, joinedFromCheckout, closedKey]);

  useEffect(() => {
    if (!showAll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowAll(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showAll]);

  async function yes() {
    if (state === 'busy') return;
    setState('busy');
    try {
      const r = await fetch(`${PLATFORM}/api/upsell/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntent, clientSecret, returnUrl: window.location.href }),
      });
      const d = await r.json();
      if (d?.state === 'joined') {
        setShowAll(false);
        setState('joined');
        if (actionUrl) setTimeout(() => (window.location.href = actionUrl), 1800);
        return;
      }
      if (d?.state === 'checkout' && d.url) {
        window.location.href = d.url;
        return;
      }
      setState('ended');
    } catch {
      setState('idle');
    }
  }

  function noThanks() {
    try {
      sessionStorage.setItem(closedKey, '1');
    } catch {}
    setState('closed');
  }

  if (state === 'joined') {
    return (
      <div style={{ ...card, border: '2px solid #16a34a', padding: '20px 22px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: INK }}>Done! All the Aiko Arts courses are yours.</p>
        <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 15 }}>
          {actionUrl
            ? 'Taking you to set up your account, where they are all waiting...'
            : 'Set up your account with the button above and they are all waiting there.'}
        </p>
      </div>
    );
  }
  if (!offer || state === 'closed') return null;
  if (state === 'ended') {
    return (
      <div style={{ ...card, padding: '16px 20px', color: MUTED, fontSize: 15 }}>
        This special offer has ended.
      </div>
    );
  }

  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const label = offer.oneClick ? `Yes, add all ${offer.total} courses` : `Get all ${offer.total} for ${offer.price}/month`;
  const sub = offer.oneClick ? 'Charged to the card you just used' : 'Secure payment by Stripe: card, Apple Pay or Google Pay';
  const pics = offer.courses.filter((c) => c.thumbnail).slice(0, 8);

  return (
    <>
      <style>{css}</style>
      <div style={card} className="aa-up">
        <div style={top}>
          <span>A special offer for you</span>
          <span style={timer} role="timer">
            ⏱ Ends in <b style={{ fontSize: 16, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{m}:{String(s).padStart(2, '0')}</b>
          </span>
        </div>
        <button type="button" onClick={() => setShowAll(true)} style={gallery} aria-label={`See all ${offer.total} courses`}>
          <span className="aa-up-grid">
            {pics.map((c) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.slug} src={c.thumbnail!} alt="" />
            ))}
          </span>
          <span style={more}>See all {offer.total} courses ›</span>
        </button>
        <div style={{ padding: '20px 22px 18px', display: 'grid', gap: 12, justifyItems: 'center', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: INK, fontFamily: 'inherit' }}>Add all {offer.total} courses</h2>
          <div style={priceBox}>
            <b style={{ fontSize: 50, lineHeight: 1, color: ORANGE, letterSpacing: '-0.02em' }}>{offer.price}</b>
            <span style={{ fontSize: 18, fontWeight: 600, color: INK }}>/month</span>
            <s style={was}>{offer.regularPrice}</s>
          </div>
          <p style={{ margin: 0, color: MUTED, fontSize: 15 }}>Every course, plus every new one. Cancel anytime.</p>
          <button type="button" onClick={yes} disabled={state === 'busy'} style={yesBtn} className="aa-up-pulse">
            {state === 'busy' ? 'One moment...' : label}
            <small style={{ display: 'block', fontSize: 12, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>{sub}</small>
          </button>
          <button type="button" onClick={noThanks} style={noBtn}>
            No thanks
          </button>
        </div>
      </div>

      {showAll && (
        <div style={scrim} onClick={(e) => e.target === e.currentTarget && setShowAll(false)}>
          <div role="dialog" aria-modal="true" aria-label={`All ${offer.total} courses`} style={sheet}>
            <button type="button" onClick={() => setShowAll(false)} style={close}>
              Close
            </button>
            <div style={{ padding: '22px 24px 14px', borderBottom: '1px solid #e7e3dc', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: ORANGE }}>
                Everything in the membership
              </p>
              <h2 style={{ margin: '6px 0 0', fontSize: 22, color: INK }}>
                All {offer.total} courses, {offer.hours}+ hours of lessons
              </h2>
            </div>
            <ul className="aa-up-all">
              {offer.courses.map((c) => (
                <li key={c.slug}>
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail} alt="" />
                  ) : (
                    <span className="aa-up-ph" />
                  )}
                  {c.yours && <span className="aa-up-yours">✓ Yours</span>}
                  <p>{c.title}</p>
                  <span className="aa-up-min">{hm(c.minutes)} of video</span>
                </li>
              ))}
            </ul>
            <div style={sheetFoot}>
              <span style={{ color: INK }}>
                <b>{offer.price}/month</b> <s style={{ ...was, fontSize: 15 }}>{offer.regularPrice}</s> · cancel anytime
              </span>
              <button type="button" onClick={yes} disabled={state === 'busy'} style={{ ...yesBtn, width: 'auto', padding: '12px 22px' }} className="aa-up-pulse">
                {state === 'busy' ? 'One moment...' : label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function hm(min: number) {
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

const card: React.CSSProperties = {
  textAlign: 'left',
  background: '#fff',
  border: `2px solid ${ORANGE}`,
  borderRadius: 18,
  overflow: 'hidden',
  boxShadow: '0 14px 40px rgba(31,42,68,.12)',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  marginTop: 28,
};
const top: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  background: ORANGE,
  color: '#fff',
  padding: '10px 16px',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
};
const timer: React.CSSProperties = { background: 'rgba(0,0,0,.22)', borderRadius: 999, padding: '4px 12px', letterSpacing: '.02em' };
const gallery: React.CSSProperties = { all: 'unset', cursor: 'pointer', display: 'block', position: 'relative', width: '100%' };
const more: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 12,
  transform: 'translateX(-50%)',
  background: '#fff',
  color: INK,
  fontSize: 14,
  fontWeight: 700,
  padding: '8px 16px',
  borderRadius: 999,
  boxShadow: '0 6px 18px rgba(0,0,0,.25)',
  whiteSpace: 'nowrap',
};
const priceBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px 10px',
  flexWrap: 'wrap',
  justifyContent: 'center',
  background: '#f6e7df',
  borderRadius: 14,
  padding: '10px 26px',
};
const was: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#71717a',
  textDecorationColor: '#dc2626',
  textDecorationThickness: 3,
};
const yesBtn: React.CSSProperties = {
  width: '100%',
  background: ORANGE,
  color: '#fff',
  border: 0,
  borderRadius: 12,
  padding: 14,
  fontSize: 17,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const noBtn: React.CSSProperties = {
  background: 'none',
  border: 0,
  color: '#8a90a0',
  textDecoration: 'underline',
  fontSize: 13.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const scrim: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(9,9,11,.7)',
  display: 'grid',
  placeItems: 'center',
  padding: 16,
};
const sheet: React.CSSProperties = {
  position: 'relative',
  background: '#fff',
  borderRadius: 16,
  width: 'min(920px, 100%)',
  maxHeight: '88vh',
  overflow: 'auto',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
};
const close: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 2,
  background: 'rgba(0,0,0,.6)',
  color: '#fff',
  border: 0,
  borderRadius: 999,
  fontSize: 13,
  padding: '5px 12px',
  cursor: 'pointer',
};
const sheetFoot: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  background: '#fff',
  borderTop: '1px solid #e7e3dc',
  padding: '14px 24px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'left',
};
const css = `
.aa-up-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px }
.aa-up-grid img { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block }
.aa-up-all { list-style: none; margin: 0; padding: 18px 24px 24px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; text-align: left }
.aa-up-all li { position: relative; border: 1px solid #e7e3dc; border-radius: 10px; overflow: hidden; background: #fff }
.aa-up-all img, .aa-up-ph { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; background: #eee }
.aa-up-all p { margin: 0; padding: 8px 10px 0; font-size: 13.5px; font-weight: 600; color: ${INK}; line-height: 1.3 }
.aa-up-min { display: block; padding: 2px 10px 9px; font-size: 12px; color: ${MUTED} }
.aa-up-yours { position: absolute; left: 8px; top: 8px; background: #16a34a; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px }
@keyframes aa-up-pulse { 0% { box-shadow: 0 0 0 0 rgba(180,84,47,.55) } 70% { box-shadow: 0 0 0 14px rgba(180,84,47,0) } 100% { box-shadow: 0 0 0 0 rgba(180,84,47,0) } }
.aa-up-pulse { animation: aa-up-pulse 2s ease-out infinite }
.aa-up-pulse:disabled { animation: none; opacity: .7 }
@media (max-width: 760px) { .aa-up-all { grid-template-columns: repeat(3, minmax(0, 1fr)) } }
@media (max-width: 480px) {
  .aa-up-grid { grid-template-columns: repeat(3, 1fr) } .aa-up-grid img:nth-child(n+7) { display: none }
  .aa-up-all { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px 16px 18px }
}
@media (prefers-reduced-motion: reduce) { .aa-up-pulse { animation: none } }
`;
