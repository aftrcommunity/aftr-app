'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home', label: 'Home', glyph: '◈' },
  { href: '/events', label: 'Events', glyph: '◷' },
  { href: '/gallery', label: 'Gallery', glyph: '▤' },
  { href: '/card', label: 'Card', glyph: '▭' },
  { href: '/forum', label: 'Back Room', glyph: '◍' },
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
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(t.href + '/');
        const locked = backRoomLocked && t.href === '/forum';
        return (
          <Link
            key={t.href}
            href={t.href}
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
