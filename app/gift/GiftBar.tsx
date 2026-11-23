'use client';

import { useEffect, useState } from 'react';

// Bottom bar on /gift: no countdown, just the real promise (pick the day it arrives) and a
// shortcut down to the price box.
export default function GiftBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      style={{
        background: 'rgba(26,31,61,0.96)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(199,145,91,0.4)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p className="hidden sm:block" style={{ color: '#FAF8F5', fontSize: 18, fontWeight: 500, margin: 0, fontFamily: "'Lora', serif" }}>
          You pick the day and hour it arrives
        </p>
        <a
          href="#give"
          style={{ background: '#c7915b', color: '#fff', fontWeight: 600, fontSize: 17, padding: '10px 26px', borderRadius: 8, whiteSpace: 'nowrap', fontFamily: "'Lora', serif" }}
        >
          Give This Gift
        </a>
      </div>
    </div>
  );
}
