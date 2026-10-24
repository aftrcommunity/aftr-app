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
    icons: [{ src: '/images/logo.png', sizes: '384x480', type: 'image/png' }],
  };
}
