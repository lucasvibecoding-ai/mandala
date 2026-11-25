// Black Friday 2026 (owner 2026-11-25): every price box shows the struck $119 with a
// "Black Friday · 58% off" tag, and a bar sits at the top of the sales page. The charge itself
// is unchanged (49.99, lib/pricing.ts). It switches itself off at the end of Monday Nov 30
// (US Pacific), and the page goes back to its normal value line. Delete this file after that.
export const BF_END = Date.parse('2026-12-01T08:00:00Z');
export const BF_ANCHOR = 119;
export const BF_PERCENT = 58;

export function isBlackFriday(now: number = Date.now()): boolean {
  return now < BF_END;
}

export function BlackFridayBar({ sym }: { sym: string }) {
  return (
    <div style={{ background: '#111111', color: '#ffffff', textAlign: 'center', padding: '10px 16px', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.45 }}>
      <span style={{ color: '#FFD54A' }}>BLACK FRIDAY: {BF_PERCENT}% OFF</span>
      {' · '}
      <s style={{ opacity: 0.7, fontWeight: 500 }}>{sym}{BF_ANCHOR}</s> {sym}49.99
      {' · '}Ends Monday, Nov 30
    </div>
  );
}

export function BlackFridayTag() {
  return (
    <div style={{ display: 'inline-block', background: '#111111', color: '#FFD54A', padding: '6px 14px', borderRadius: 999, fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
      Black Friday · {BF_PERCENT}% off
    </div>
  );
}
