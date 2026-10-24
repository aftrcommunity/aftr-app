import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getAlbum } from '../../../../../lib/gallery';

// Serves gallery photos from /private so they are never public static files.
//
// TODO (when logins land with Supabase): check the visitor's session here and
// return 401 unless they are an approved member. Until then this route is open,
// so do NOT deploy the app publicly before that check is in place.

const FILE = /^(thumb-)?\d{2}\.jpg$/;

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await ctx.params;
  if (!getAlbum(slug) || !FILE.test(file)) return new Response('Not found', { status: 404 });

  try {
    const data = await readFile(path.join(process.cwd(), 'private', 'gallery', slug, file));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/jpeg',
        // Members' photos: never cached by shared caches, never indexed.
        'Cache-Control': 'private, max-age=3600',
        'X-Robots-Tag': 'noindex, noimageindex',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
