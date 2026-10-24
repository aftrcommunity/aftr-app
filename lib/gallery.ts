// Gallery albums, named and ordered exactly as on aftr.community/gallery
// (newest first, with the same event numbers).
// Photos live in /private/gallery/<slug>/ and are served by app/media/gallery.

export type Album = {
  slug: string;
  index: string; // event number shown on the website, e.g. "09"
  name: string;
  photos: number;
  // Photos whose faces sit near the top of the frame (same fix as the website)
  topCrop?: number[];
};

export const ALBUMS: Album[] = [
  { slug: 'wdgd-5-y2k', index: '09', name: 'WDGD 5: Y2K', photos: 6 },
  { slug: 'the-girls-trip', index: '08', name: "The Girl's Trip by AFTR.", photos: 6 },
  { slug: 'wdgd-4-detty-december', index: '07', name: 'WDGD4: Detty December', photos: 6 },
  { slug: '6mos-the-parte', index: '06', name: '6mos of AFTR. The Parté', photos: 6 },
  { slug: '6mos-the-games-night', index: '05', name: '6mos of AFTR. The Games Night', photos: 6, topCrop: [1] },
  { slug: 'aftr-x-fty-pop-up-parte', index: '04', name: 'AFTR. x FTY Pop Up Parté', photos: 6, topCrop: [1] },
  { slug: 'wdgd-3-afrobeats-vs-dancehall', index: '03', name: 'WDGD 3: Afrobeats vs Dancehall', photos: 6 },
  { slug: 'wdgd-2', index: '02', name: 'WDGD 2', photos: 6 },
  { slug: 'wdgd-1-launch-party', index: '01', name: 'WDGD 1: AFTR. Launch Party', photos: 6 },
];

export const getAlbum = (slug: string) => ALBUMS.find((a) => a.slug === slug);

const pad = (n: number) => String(n).padStart(2, '0');

export const photoUrl = (slug: string, n: number, size: 'thumb' | 'full' = 'full') =>
  `/media/gallery/${slug}/${size === 'thumb' ? 'thumb-' : ''}${pad(n)}.jpg`;

export const photoPosition = (album: Album, n: number) =>
  album.topCrop?.includes(n) ? 'center top' : 'center';
