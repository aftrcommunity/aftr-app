'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type Album, photoUrl, photoPosition } from '../lib/gallery';

export default function AlbumGrid({ album, square = false }: { album: Album; square?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<number | null>(null);
  const startX = useRef<number | null>(null);
  const nums = Array.from({ length: album.photos }, (_, i) => i + 1);

  const go = useCallback(
    (step: number) => setOpen((n) => (n === null ? n : ((n - 1 + step + album.photos) % album.photos) + 1)),
    [album.photos],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    // Load the photos either side now, so Next and Prev show them straight away
    for (const step of [1, -1, 2]) {
      const n = ((open - 1 + step + album.photos) % album.photos) + 1;
      const img = new Image();
      img.src = photoUrl(album.slug, n);
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, go, album.photos, album.slug]);

  return (
    <>
      <div className={square ? 'square-grid' : 'pill-grid'}>
        {nums.map((n) => (
          <button
            key={n}
            className={square ? 'sq' : 'pill'}
            style={{ backgroundImage: `url(${photoUrl(album.slug, n, 'thumb')})`, backgroundPosition: photoPosition(album, n) }}
            onClick={() => setOpen(n)}
            aria-label={`${album.name}, photo ${n}`}
          />
        ))}
      </div>

      {open !== null && (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={`${album.name}, photo ${open}`}>
          <div className="viewer-top">
            <span>
              {open} of {album.photos}
            </span>
            <button className="viewer-close" onClick={() => setOpen(null)}>
              Close ✕
            </button>
          </div>
          <div
            className="viewer-stage"
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (startX.current === null) return;
              const dx = e.changedTouches[0].clientX - startX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              startX.current = null;
            }}
          >
            {loaded !== open && (
              <div
                className="viewer-placeholder"
                style={{ backgroundImage: `url(${photoUrl(album.slug, open, 'thumb')})` }}
                aria-hidden
              >
                <span className="viewer-spinner" />
              </div>
            )}
            <img
              key={open}
              src={photoUrl(album.slug, open)}
              alt={`${album.name}, photo ${open}`}
              draggable={false}
              onLoad={() => setLoaded(open)}
              style={loaded === open ? undefined : { opacity: 0 }}
            />
          </div>
          <p className="viewer-note">Photos stay in the app. Want one removed? Message the team.</p>
          <div className="viewer-nav">
            <button onClick={() => go(-1)}>← Prev</button>
            <button onClick={() => go(1)}>Next →</button>
          </div>
        </div>
      )}
    </>
  );
}
