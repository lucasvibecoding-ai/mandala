// Thank-you page for a GIFT order (owner 2026-11-23). Gifts are always emailed to the person
// receiving them. Never logs the buyer into the course and never shows the other-courses box:
// the course is the recipient's. page.tsx reads the details from the verified PaymentIntent;
// on localhost /success?gift=email&preview=1 shows sample data.
import MaterialsList from '../MaterialsList';

export type GiftInfo = {
  buyerEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  scheduledFor?: string; // e.g. "on Fri, Dec 25 at 8:00 am, UK & Ireland (London) time"; empty = sent now
  extraCourse?: boolean;
  pack?: boolean;
};

export function sampleGift(now: boolean): GiftInfo {
  return {
    buyerEmail: 'sarah@example.com',
    recipientName: 'Emma',
    recipientEmail: 'emma@example.com',
    scheduledFor: now ? undefined : 'on Fri, Dec 25 at 8:00 am, UK & Ireland (London) time',
    extraCourse: true,
    pack: true,
  };
}

const INK = '#1a1f3d';
const MUTED = '#6b7089';
const GOLD = '#b47b45';

function GiftIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

export default function GiftSuccess({ info, country }: { info: GiftInfo; country?: string | null }) {
  const name = info.recipientName?.trim();
  const them = name || 'They';

  return (
    <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', fontFamily: "'Lora', Georgia, serif" }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fbf1e6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
        <GiftIcon />
      </div>

      <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.4rem)', color: INK, margin: '0 0 16px', fontWeight: 500 }}>Your gift is all set!</h1>
      <p style={{ fontSize: 19, color: MUTED, lineHeight: 1.6, margin: '0 0 10px' }}>
        {info.recipientEmail ? (
          info.scheduledFor ? (
            <><strong style={{ color: INK }}>{them}</strong> gets the Mandala Masterclass {info.scheduledFor}.</>
          ) : (
            <>We&apos;ve just emailed <strong style={{ color: INK }}>{them}</strong> the Mandala Masterclass.</>
          )
        ) : (
          <>Your gift of the Mandala Masterclass is on its way, at the time you chose.</>
        )}
      </p>
      {info.recipientEmail && (
        <p style={{ fontSize: 16, color: MUTED, margin: '0 0 22px' }}>It goes to {info.recipientEmail}.</p>
      )}
      {(info.extraCourse || info.pack) && (
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, margin: 0 }}>
          {info.extraCourse && <>{them} can also pick <strong style={{ color: INK }}>any additional Aiko Arts course</strong> once they finish the Mandala Masterclass. </>}
          {info.pack && <>The <strong style={{ color: INK }}>Mandala Pack</strong> is inside the gift too.</>}
        </p>
      )}

      <div style={{ background: '#fdf3c7', border: '1px solid #f0d77a', borderRadius: 12, padding: '18px 22px', textAlign: 'left', margin: '26px 0 0' }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 6px' }}>Please tell {name || 'them'} to check the spam folder</p>
        <p style={{ fontSize: 15.5, color: '#4a4237', lineHeight: 1.6, margin: 0 }}>
          Once the gift email is sent, it might end up in the spam or promotions folder. If {name || 'they'} can&apos;t find it, ask them to look there for an email from hello@mandalapractice.com and mark it as &quot;Not spam&quot;.
        </p>
      </div>

      {/* Owner 2026-11-23: tell the buyer to check spam for their own receipt too. */}
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: '26px 0 0' }}>
        Your receipt is on its way{info.buyerEmail ? <> to <strong style={{ color: INK }}>{info.buyerEmail}</strong></> : null}.
        {' '}If you don&apos;t see it in a few minutes, check your spam or promotions folder.
      </p>
      {/* Materials to wrap with the gift (owner 2026-11-23): Amazon links for everything. */}
      <div style={{ marginTop: 34, paddingTop: 30, borderTop: '1px solid #e8dfd2' }}>
        <p style={{ fontSize: 21, color: INK, margin: '0 0 6px' }}>Want something to wrap with it?</p>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '0 0 18px' }}>
          Good news: we provide Amazon links for everything {name || 'they'} will need, all together under $30.
        </p>
        <MaterialsList country={country} />
      </div>

      <p style={{ fontSize: 18, color: MUTED, margin: '32px 0 0' }}>Thank you for giving the gift of mandalas</p>
    </div>
  );
}
