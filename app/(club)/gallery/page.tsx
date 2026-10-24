import Link from 'next/link';
import { ALBUMS, photoUrl, photoPosition } from '../../../lib/gallery';
import LayoutSwitch, { readLayout, withLayout } from '../../../components/LayoutSwitch';

export default async function Gallery({ searchParams }: { searchParams: Promise<{ layout?: string }> }) {
  const layout = readLayout((await searchParams).layout);
  const square = layout === 'square';

  return (
    <main className="page">
      <div className="title-row">
        <h1 className="display">Gallery</h1>
        <LayoutSwitch base="/gallery" layout={layout} />
      </div>
      <p className="muted intro">
        For members only. Nothing here leaves the app — no sharing, no indexing. Ask us to remove a photo any time.
      </p>
      <div className={square ? 'square-grid' : 'pill-grid'}>
        {ALBUMS.map((a, i) => (
          <Link
            key={a.slug}
            href={withLayout(`/gallery/${a.slug}`, layout)}
            className={square ? 'sq' : `pill${i % 4 === 1 || i % 4 === 2 ? ' tall' : ''}`}
            style={{ backgroundImage: `url(${photoUrl(a.slug, 1, 'thumb')})`, backgroundPosition: photoPosition(a, 1) }}
          >
            <span className={square ? 'sq-caption' : 'pill-caption'}>
              <span className="num">{a.index}</span>
              <span className="name">{a.name}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
