'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// prefetch: load the page in the background so the tap is instant. The Back Room
// changes all the time, so it's always fetched fresh when tapped.
const TABS = [
  { href: '/home', label: 'Home', glyph: '◈', prefetch: true },
  { href: '/events', label: 'Events', glyph: '◷', prefetch: true },
  { href: '/gallery', label: 'Gallery', glyph: '▤', prefetch: true },
  { href: '/card', label: 'Card', glyph: '▭', prefetch: true },
  { href: '/forum', label: 'Back Room', glyph: '◍', prefetch: false },
];

const Padlock = () => (
  <svg className="tab-lock" viewBox="0 0 12 14" width="9" height="10" aria-hidden>
    <rect x="1" y="6" width="10" height="7.5" rx="1.8" fill="currentColor" />
    <path d="M3.2 6V4.4a2.8 2.8 0 0 1 5.6 0V6" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

// backRoomLocked: The Community sees the Back Room tab with a padlock
export default function TabBar({ backRoomLocked = false }: { backRoomLocked?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  // The tab you just tapped lights up straight away, before its page has arrived
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => setTapped(null), [path]);
  useEffect(() => {
    // Warm up the Back Room's loading screen too, so it responds at once
    router.prefetch('/forum');
  }, [router]);
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const here = path === t.href || path.startsWith(t.href + '/');
        const active = tapped ? tapped === t.href : here;
        const locked = backRoomLocked && t.href === '/forum';
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch={t.prefetch ? true : undefined}
            onClick={() => !here && setTapped(t.href)}
            className={`tab${active ? ' active' : ''}${locked ? ' locked' : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={locked ? `${t.label} (part of The Club)` : undefined}
          >
            <span className="glyph" aria-hidden>
              {t.glyph}
              {locked && <Padlock />}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
