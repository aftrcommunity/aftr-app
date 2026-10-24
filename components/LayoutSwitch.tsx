import Link from 'next/link';

// Ovals vs squares, so the two gallery looks can be compared side by side.
// Kept in the URL (?layout=square) so the choice carries into each album.
export type GalleryLayout = 'oval' | 'square';

export const readLayout = (v: string | string[] | undefined): GalleryLayout => (v === 'square' ? 'square' : 'oval');

export const withLayout = (href: string, layout: GalleryLayout) => (layout === 'square' ? `${href}?layout=square` : href);

export default function LayoutSwitch({ base, layout }: { base: string; layout: GalleryLayout }) {
  return (
    <div className="seg" role="group" aria-label="Gallery layout">
      <Link href={base} className={layout === 'oval' ? 'on' : ''} aria-pressed={layout === 'oval'}>
        Ovals
      </Link>
      <Link href={`${base}?layout=square`} className={layout === 'square' ? 'on' : ''} aria-pressed={layout === 'square'}>
        Squares
      </Link>
    </div>
  );
}
