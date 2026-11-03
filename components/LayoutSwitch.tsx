import Link from 'next/link';

// Squares (the default) or ovals. Kept in the URL (?layout=oval) so the
// choice carries into each album.
export type GalleryLayout = 'oval' | 'square';

export const readLayout = (v: string | string[] | undefined): GalleryLayout => (v === 'oval' ? 'oval' : 'square');

export const withLayout = (href: string, layout: GalleryLayout) => (layout === 'oval' ? `${href}?layout=oval` : href);

export default function LayoutSwitch({ base, layout }: { base: string; layout: GalleryLayout }) {
  return (
    <div className="seg" role="group" aria-label="Gallery layout">
      <Link href={base} className={layout === 'square' ? 'on' : ''} aria-pressed={layout === 'square'}>
        Squares
      </Link>
      <Link href={`${base}?layout=oval`} className={layout === 'oval' ? 'on' : ''} aria-pressed={layout === 'oval'}>
        Ovals
      </Link>
    </div>
  );
}
