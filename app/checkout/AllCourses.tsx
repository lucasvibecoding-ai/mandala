'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AIKO_COURSES } from '../../lib/aikoCourses';

// The course this site sells is left out of the "pick any course" list.
const THIS_COURSE = 'mandala-masterclass';
export const PICKABLE_COURSES = AIKO_COURSES.filter((c) => c.slug !== THIS_COURSE);

const CSS = `
.ac-back { position: fixed; inset: 0; z-index: 2147483000; background: rgba(10,37,64,0.55); display: flex; align-items: center; justify-content: center; padding: 16px; }
.ac-box { position: relative; width: 100%; max-width: 820px; max-height: 88vh; background: #fff; border-radius: 16px; box-shadow: 0 24px 70px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.ac-head { padding: 22px 56px 16px 24px; border-bottom: 1px solid #eef0f3; }
.ac-title { font-size: 20px; font-weight: 700; color: #0A2540; margin: 0; }
.ac-sub { font-size: 14px; color: #6b7c93; margin: 4px 0 0; line-height: 1.5; }
.ac-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 50%; border: none; background: #f2f4f7; color: #0A2540; font-size: 20px; line-height: 34px; cursor: pointer; }
.ac-close:hover { background: #e6e9ee; }
.ac-grid { padding: 18px 24px 24px; overflow-y: auto; min-height: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: max-content; align-content: start; gap: 14px; }
.ac-card { border: 1px solid #e6e8ec; border-radius: 12px; overflow: hidden; background: #fff; }
.ac-card img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; background: #f2f4f7; }
.ac-card-body { padding: 10px 12px 12px; }
.ac-card-title { font-size: 14px; font-weight: 600; color: #0A2540; margin: 0; }
.ac-card-blurb { font-size: 12.5px; color: #6b7c93; margin: 3px 0 0; line-height: 1.45; }
@media (max-width: 640px) {
  .ac-box { max-height: 92vh; }
  .ac-head { padding: 18px 52px 14px 18px; }
  .ac-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px 16px 18px; gap: 10px; }
}
`;

export default function AllCourses({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(
    <div className="ac-back" onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ac-box" role="dialog" aria-modal="true" aria-label="All Aiko Arts courses" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ac-close" onClick={onClose} aria-label="Close">&times;</button>
        <div className="ac-head">
          <p className="ac-title">They can pick any of these {PICKABLE_COURSES.length} courses</p>
          <p className="ac-sub">Once they finish the Mandala Masterclass, they choose their next course in their Aiko Arts account.</p>
        </div>
        <div className="ac-grid">
          {PICKABLE_COURSES.map((c) => (
            <div className="ac-card" key={c.slug}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.thumbnail} alt="" loading="lazy" />
              <div className="ac-card-body">
                <p className="ac-card-title">{c.title}</p>
                <p className="ac-card-blurb">{c.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
