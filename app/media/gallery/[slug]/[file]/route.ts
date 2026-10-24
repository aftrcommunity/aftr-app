import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getAlbum } from '../../../../../lib/gallery';
import { supabaseServer } from '../../../../../lib/supabase/server';

// Serves gallery photos from /private so they are never public static files.
// Only approved members get a photo; everyone else gets 401.

const FILE = /^(thumb-)?\d{2}\.jpg$/;

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await ctx.params;
  if (!getAlbum(slug) || !FILE.test(file)) return new Response('Not found', { status: 404 });

  // Members-only check, done by the database's own rule (is_approved_member)
  const supabase = await supabaseServer();
  const { data: ok } = await supabase.rpc('is_approved_member');
  if (ok !== true) return new Response('Members only', { status: 401 });

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
