import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AFTR. Community',
    short_name: 'AFTR.', // home-screen label: phones cut off longer names
    description: 'A members-only social club for women.',
    start_url: '/',
    display: 'standalone',
    background_color: '#130c17',
    theme_color: '#130c17',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
