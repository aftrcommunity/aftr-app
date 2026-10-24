import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALBUMS, getAlbum } from '../../../../lib/gallery';
import AlbumGrid from '../../../../components/AlbumGrid';

export function generateStaticParams() {
  return ALBUMS.map((a) => ({ slug: a.slug }));
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) notFound();

  return (
    <main className="page">
      <Link href="/gallery" className="back">
        ← Gallery
      </Link>
      <div className="label" style={{ color: 'var(--lime)' }}>
        Event {album.index}
      </div>
      <h1 className="display" style={{ fontSize: 34, marginTop: 8 }}>
        {album.name}
      </h1>
      <p className="muted album-meta">{album.photos} photos · tap a photo to view it</p>
      <AlbumGrid album={album} />
    </main>
  );
}
