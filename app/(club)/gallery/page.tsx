import Link from 'next/link';
import { ALBUMS, photoUrl, photoPosition } from '../../../lib/gallery';

export default function Gallery() {
  return (
    <main className="page">
      <h1 className="display">Gallery</h1>
      <p className="muted intro">
        For members only. Nothing here leaves the app — no sharing, no indexing. Ask us to remove a photo any time.
      </p>
      <div className="pill-grid">
        {ALBUMS.map((a, i) => (
          <Link
            key={a.slug}
            href={`/gallery/${a.slug}`}
            className={`pill${i % 4 === 1 || i % 4 === 2 ? ' tall' : ''}`}
            style={{ backgroundImage: `url(${photoUrl(a.slug, 1, 'thumb')})`, backgroundPosition: photoPosition(a, 1) }}
          >
            <span className="pill-caption">
              <span className="num">{a.index}</span>
              <span className="name">{a.name}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
