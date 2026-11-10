'use client';

import { useEffect } from 'react';

// Owner 2026-11-10: images can't be right-clicked ("Open image in new tab", "Save image
// as"), dragged to the desktop, or long-pressed to "Save to Photos" on phones. Right-click on
// text still works. Screenshots and browser dev tools can't be blocked by any website; this
// removes the easy ways.
export default function ImageGuard() {
  useEffect(() => {
    const onImage = (e: Event) => e.target instanceof HTMLImageElement;
    const block = (e: Event) => {
      if (onImage(e)) e.preventDefault();
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
    };
  }, []);

  return (
    <style>{`img { -webkit-user-drag: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }`}</style>
  );
}
