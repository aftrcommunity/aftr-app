import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { VAPID_PUBLIC_KEY } from '../../../lib/push';

// Called by the database when a notification is created (see 006_push_and_privacy.sql).
// The database sends a private key with the request; push_payload() refuses anything
// without it, so nobody else can use this to send notifications.
export const runtime = 'nodejs';

type Row = {
  endpoint: string; p256dh: string; auth: string; previews: boolean; kind: string;
  actor_name: string | null; title: string | null; excerpt: string | null;
  thread_id: number | null; conversation_id: number | null;
};

// Lock-screen text. By default it says nothing about who or what, so a locked phone
// never shows anything private. Members can choose to show names and previews.
function message(r: Row) {
  const who = r.actor_name ?? 'Someone';
  const cut = (s: string | null) => (s && s.length > 110 ? `${s.slice(0, 110)}…` : s ?? '');
  switch (r.kind) {
    case 'message':
      return r.previews ? { title: who, body: cut(r.excerpt) } : { title: 'AFTR.', body: 'You have a new message' };
    case 'reply':
      return r.previews ? { title: `${who} replied`, body: cut(r.excerpt) } : { title: 'AFTR.', body: 'Someone replied to your post' };
    case 'reply_to_reply':
      return r.previews ? { title: `${who} replied to you`, body: cut(r.excerpt) } : { title: 'AFTR.', body: 'Someone replied to you in the Back Room' };
    case 'reaction':
      return r.previews ? { title: 'AFTR.', body: `${who} ${r.excerpt} your post` } : { title: 'AFTR.', body: 'Someone reacted to your post' };
    case 'report_outcome':
      return { title: 'AFTR.', body: 'We’ve reviewed your report' };
    default:
      return { title: 'AFTR.', body: 'You have a new notification' };
  }
}

export async function POST(req: Request) {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return Response.json({ ok: false, reason: 'VAPID_PRIVATE_KEY not set' });
  let id = 0;
  let key = '';
  try {
    const b = await req.json();
    id = Number(b.id);
    key = String(b.key ?? '');
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc('push_payload', { note: id, key });
  if (error) return new Response('Not allowed', { status: 403 });

  webpush.setVapidDetails('mailto:team@aftr.community', VAPID_PUBLIC_KEY, privateKey);
  const rows = (data ?? []) as Row[];
  await Promise.all(
    rows.map(async (r) => {
      const url = r.conversation_id ? `/messages/${r.conversation_id}` : r.thread_id ? `/forum/${r.thread_id}` : '/notifications';
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          JSON.stringify({ ...message(r), url, tag: r.conversation_id ? `conv-${r.conversation_id}` : undefined }),
          { TTL: 60 * 60 * 24 },
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await supabase.rpc('push_forget', { endpoint: r.endpoint, key });
      }
    }),
  );
  return Response.json({ ok: true, sent: rows.length });
}
