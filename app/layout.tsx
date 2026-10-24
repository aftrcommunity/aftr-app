import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AFTR. Community',
  // Discreet on purpose: this is what shows if a link is ever shared.
  description: 'A members-only social club for women — to dance, connect and belong.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'AFTR.', statusBarStyle: 'black-translucent' },
  icons: { icon: '/images/logo.png', apple: '/images/logo.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#130c17',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <div className="app-frame">{children}</div>
      </body>
    </html>
  );
}
