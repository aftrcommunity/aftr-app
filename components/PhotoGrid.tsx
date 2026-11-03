'use client';

import { useEffect, useState } from 'react';
import type { Photo } from '../lib/media';

// Photos on a post or profile: small copies in a grid, tap to see one full size
export default function PhotoGrid({ photos, label = 'Photo', variant = 'post' }: { photos: Photo[]; label?: string; variant?: 'post' | 'profile' }) {
  const [open, setOpen] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((n) => (n === null ? n : (n + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpen((n) => (n === null ? n : (n - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, photos.length]);

  if (photos.length === 0) return null;
  return (
    <>
      <div className={`photo-grid photo-grid-${variant} count-${Math.min(photos.length, 4)}`}>
        {photos.map((p, i) => (
          <button
            key={p.small}
            type="button"
            className="photo-tile"
            style={{ backgroundImage: `url(${p.small})` }}
            onClick={() => setOpen(i)}
            aria-label={`${label} ${i + 1} of ${photos.length}`}
          />
        ))}
      </div>
      {open !== null && (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={`${label} ${open + 1}`}>
          <div className="viewer-top">
            <span>
              {open + 1} of {photos.length}
            </span>
            <button className="viewer-close" onClick={() => setOpen(null)}>
              Close ✕
            </button>
          </div>
          <div className="viewer-stage" onContextMenu={(e) => e.preventDefault()}>
            {loaded !== open && (
              <div className="viewer-placeholder" style={{ backgroundImage: `url(${photos[open].small})` }} aria-hidden>
                <span className="viewer-spinner" />
              </div>
            )}
            <img
              key={open}
              src={photos[open].full}
              alt={`${label} ${open + 1}`}
              draggable={false}
              onLoad={() => setLoaded(open)}
              style={loaded === open ? undefined : { opacity: 0 }}
            />
          </div>
          {photos.length > 1 && (
            <div className="viewer-nav">
              <button onClick={() => setOpen((open - 1 + photos.length) % photos.length)}>← Prev</button>
              <button onClick={() => setOpen((open + 1) % photos.length)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
