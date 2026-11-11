'use client';

import { useEffect, useRef, useState } from 'react';

// Under the course-access card on the thank-you page (owner 2026-11-11): no offer, no price,
// it only lets the buyer know Aiko has more courses, the ones they don't have yet. They
// unlock them from their Aiko Arts account, so tapping a course asks them to set up their
// account (or log in) first. aikoarts.com checks the payment and says which courses.
// The same file is on every course site.
const PLATFORM = 'https://aikoarts.com';

type Course = { title: string; thumbnail: string | null };

// Every course as a card, 3 in a row (2 on phones), rows one below the other; on wider
// screens the box is a bit wider than the thank-you column (owner 2026-11-11).
const CSS = `
.aa-oc-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 640px) {
  .aa-oc-box { margin-left: -64px; margin-right: -64px; }
  .aa-oc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
`;

const ORANGE = '#b4542f';
const INK = '#1f2a44';
const MUTED = '#5b6478';
const BLUE = '#2d4a8f';

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** Tapped a course: their account comes first (the same link as the access button above). */
function SetUpFirst({
  course,
  actionUrl,
  isNewUser,
  onClose,
}: {
  course: Course;
  actionUrl: string;
  isNewUser: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNewUser ? 'Set up your account first' : 'Log in first'}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {course.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 18,
            lineHeight: '32px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <div style={{ padding: '20px 24px 24px' }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: INK }}>
            {isNewUser ? 'Set up your account first' : 'Log in first'}
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: MUTED, lineHeight: 1.5 }}>
            Then you can unlock {course.title} from your Aiko Arts account.
          </p>
          <a
            href={actionUrl}
            style={{
              display: 'block',
              marginTop: 18,
              padding: '14px 20px',
              borderRadius: 10,
              background: BLUE,
              color: '#fff',
              fontSize: 17,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {isNewUser ? 'Set up your account' : 'Log in'}
          </a>
        </div>
      </div>
    </div>
  );
}

export function OtherCoursesCard({
  more,
  courses,
  actionUrl,
  isNewUser,
}: {
  more: number;
  courses: Course[];
  actionUrl: string;
  isNewUser: boolean;
}) {
  const [picked, setPicked] = useState<Course | null>(null);
  return (
    <div
      className="aa-oc-box rounded-xl p-6 sm:p-8 text-center"
      style={{ background: '#fff', border: '1px solid rgba(31,42,68,0.12)', marginTop: 24 }}
    >
      <style>{CSS}</style>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ORANGE }}>
        Aiko Arts
      </p>
      <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, color: INK }}>
        {more} more {more === 1 ? 'course' : 'courses'}
      </h2>
      {/* Course cards like the Aiko Arts home page. */}
      <div className="aa-oc-grid" style={{ margin: '16px 0 0', textAlign: 'left' }}>
        {courses.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() => setPicked(c)}
            style={{
              display: 'block',
              width: '100%',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              background: '#fff',
              border: '1px solid rgba(31,42,68,0.12)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative' }}>
              {c.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail}
                  alt=""
                  style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '16 / 10', background: '#e4e4e7' }} />
              )}
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: 11,
                  padding: '3px 8px',
                }}
              >
                <LockIcon />
                Locked
              </span>
            </div>
            <span style={{ display: 'block', padding: '10px 12px 12px', fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.3 }}>
              {c.title}
            </span>
          </button>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 15, color: MUTED }}>
        Unlock them from your Aiko Arts account.
      </p>
      {picked && (
        <SetUpFirst course={picked} actionUrl={actionUrl} isNewUser={isNewUser} onClose={() => setPicked(null)} />
      )}
    </div>
  );
}

export default function OtherCourses({
  paymentIntent,
  clientSecret,
  actionUrl,
  isNewUser,
}: {
  paymentIntent: string | null;
  clientSecret: string | null;
  /** The access button's link (set up the account, or log in). */
  actionUrl: string;
  isNewUser: boolean;
}) {
  const [data, setData] = useState<{ more: number; courses: Course[] } | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !paymentIntent || !clientSecret) return;
    fired.current = true;
    fetch(`${PLATFORM}/api/thankyou/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntent, clientSecret }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.show && d.more > 0) setData({ more: d.more, courses: d.courses ?? [] });
      })
      .catch(() => {});
  }, [paymentIntent, clientSecret]);

  if (!data || !actionUrl) return null;
  return <OtherCoursesCard more={data.more} courses={data.courses} actionUrl={actionUrl} isNewUser={isNewUser} />;
}
