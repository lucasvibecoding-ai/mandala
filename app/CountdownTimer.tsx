'use client';

import { useEffect, useState } from 'react';

const TIMER_START_SECONDS = 38 * 60 + 33; // 38 minutes 33 seconds
const STORAGE_KEY = 'mandala_timer_end';

export default function CountdownTimer({ banner = false }: { banner?: boolean }) {
  const [secondsLeft, setSecondsLeft] = useState(TIMER_START_SECONDS);
  const [mounted, setMounted] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem(STORAGE_KEY);
    let endTime: number;

    if (stored && parseInt(stored, 10) > Date.now()) {
      endTime = parseInt(stored, 10);
    } else {
      endTime = Date.now() + TIMER_START_SECONDS * 1000;
      localStorage.setItem(STORAGE_KEY, endTime.toString());
    }

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const secs = Math.ceil(remaining / 1000);
      setSecondsLeft(secs);
      if (secs <= 0) setExpired(true);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  if (banner) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-serif)', color: '#E07A5F', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {expired ? '00' : String(hours).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(249,246,242,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Hours</div>
        </div>
        <span style={{ color: '#E07A5F', fontSize: 20, fontWeight: 300, marginTop: -12 }}>:</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-serif)', color: '#E07A5F', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {expired ? '00' : String(minutes).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(249,246,242,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Minutes</div>
        </div>
        <span style={{ color: '#E07A5F', fontSize: 20, fontWeight: 300, marginTop: -12 }}>:</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-serif)', color: '#E07A5F', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {expired ? '00' : String(seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(249,246,242,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Seconds</div>
        </div>
      </div>
    );
  }

  // Default inline display (for use inside pricing boxes)
  return (
    <div style={{ paddingTop: 24, maxWidth: 420, margin: '0 auto' }}>
      <div style={{ background: 'rgba(224,122,95,0.08)', border: '2px solid rgba(224,122,95,0.25)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 12, textAlign: 'center' }}>
          {expired ? 'Offer has expired' : 'Offer valid for:'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, color: '#E07A5F', fontVariantNumeric: 'tabular-nums' }}>
              {String(minutes).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Minutes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, color: '#E07A5F', fontVariantNumeric: 'tabular-nums' }}>
              {String(seconds).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seconds</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useTimerExpired() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const endTime = parseInt(stored, 10);
        setExpired(Date.now() >= endTime);
      }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  return expired;
}
