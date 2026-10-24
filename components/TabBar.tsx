'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home', label: 'Home', glyph: '◈' },
  { href: '/events', label: 'Events', glyph: '◷' },
  { href: '/gallery', label: 'Gallery', glyph: '▤' },
  { href: '/card', label: 'Card', glyph: '▭' },
  { href: '/forum', label: 'Forum', glyph: '◍' },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(t.href + '/');
        return (
          <Link key={t.href} href={t.href} className={`tab${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="glyph" aria-hidden>
              {t.glyph}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
