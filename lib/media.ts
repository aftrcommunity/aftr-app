import type { SupabaseClient } from '@supabase/supabase-js';

// Member photos live in the private "member-media" bucket. Every photo is saved
// twice: the full size (x.jpg) and a small copy for lists (x.sm.jpg).
export const BUCKET = 'member-media';
export const smallOf = (path: string) => path.replace(/\.jpg$/, '.sm.jpg');

export type Photo = { small: string; full: string };

// Short-lived links for a set of photo paths (only Back Room members are allowed them)
export async function photoLinks(supabase: SupabaseClient, paths: string[]): Promise<Map<string, Photo>> {
  const out = new Map<string, Photo>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return out;
  const all = unique.flatMap((p) => [p, smallOf(p)]);
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(all, 60 * 60 * 6);
  const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  for (const p of unique) {
    const full = url.get(p);
    if (full) out.set(p, { full, small: url.get(smallOf(p)) ?? full });
  }
  return out;
}
