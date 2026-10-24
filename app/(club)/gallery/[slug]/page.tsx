import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALBUMS, getAlbum } from '../../../../lib/gallery';
import AlbumGrid from '../../../../components/AlbumGrid';
import LayoutSwitch, { readLayout, withLayout } from '../../../../components/LayoutSwitch';

export function generateStaticParams() {
  return ALBUMS.map((a) => ({ slug: a.slug }));
}

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ layout?: string }>;
}) {
  const { slug } = await params;
  const layout = readLayout((await searchParams).layout);
  const album = getAlbum(slug);
  if (!album) notFound();

  return (
    <main className="page">
      <Link href={withLayout('/gallery', layout)} className="back">
        ← Gallery
      </Link>
      <div className="title-row">
        <div className="label" style={{ color: 'var(--lime)' }}>
          Event {album.index}
        </div>
        <LayoutSwitch base={`/gallery/${album.slug}`} layout={layout} />
      </div>
      <h1 className="display" style={{ fontSize: 34, marginTop: 8 }}>
        {album.name}
      </h1>
      <p className="muted album-meta">{album.photos} photos · tap a photo to view it</p>
      <AlbumGrid album={album} square={layout === 'square'} />
    </main>
  );
}
