'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../lib/supabase/server';

const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
const back = (f: FormData, fallback: string) => {
  const b = String(f.get('back') ?? '');
  return b.startsWith('/') && !b.startsWith('//') ? b : fallback;
};

export type FormState = { error?: string; saved?: boolean };

// ── Mute and block ─────────────────────────────────────────────────────────
export async function mute(form: FormData) {
  const who = text(form, 'member', 40);
  const supabase = await supabaseServer();
  if (form.get('undo') === '1') await supabase.from('member_mutes').delete().eq('muted_id', who);
  else await supabase.from('member_mutes').insert({ muted_id: who });
  revalidatePath('/', 'layout');
  redirect(back(form, `/members/${who}`));
}

export async function block(form: FormData) {
  const who = text(form, 'member', 40);
  const supabase = await supabaseServer();
  if (form.get('undo') === '1') await supabase.from('member_blocks').delete().eq('blocked_id', who);
  else await supabase.from('member_blocks').insert({ blocked_id: who });
  revalidatePath('/', 'layout');
  redirect(back(form, '/members'));
}

// ── Your profile ───────────────────────────────────────────────────────────
export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const nickname = text(form, 'display_name', 40);
  if (!nickname) return { error: 'Add the name you’d like to be called.' };
  let photos: string[] = [];
  try {
    const v = JSON.parse(String(form.get('photos') ?? '[]'));
    photos = Array.isArray(v) ? v.filter((p) => typeof p === 'string').slice(0, 6) : [];
  } catch {}
  const instagram = text(form, 'instagram', 60).replace(/^@/, '');

  const supabase = await supabaseServer();
  const { data: c } = await supabase.auth.getClaims();
  const me = c?.claims?.sub;
  if (!me) return { error: 'Please sign in again.' };

  const { error: e1 } = await supabase.from('profiles').update({ display_name: nickname }).eq('id', me);
  const { error: e2 } = await supabase.from('member_profiles').upsert({
    id: me,
    bio: text(form, 'bio', 300) || null,
    instagram: instagram || null,
    photos,
    listed: form.get('listed') === 'on',
    allow_messages: form.get('allow_messages') === 'on',
    updated_at: new Date().toISOString(),
  });
  const error = e1 ?? e2;
  if (error) return { error: `That didn’t save. (${error.message})` };
  revalidatePath('/', 'layout');
  return { saved: true };
}

// ── Messages ───────────────────────────────────────────────────────────────
export async function startConversation(form: FormData) {
  const who = text(form, 'member', 40);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc('start_conversation', { other: who });
  if (error || !data) redirect(`/members/${who}?error=${encodeURIComponent(error?.message ?? 'Could not start a conversation')}`);
  redirect(`/messages/${data}`);
}

export async function sendMessage(form: FormData) {
  const conv = Number(form.get('conversation_id'));
  const body = text(form, 'body', 2000);
  if (!conv || !body) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from('messages').insert({ conversation_id: conv, body });
  if (error) console.error('sendMessage failed', error);
  revalidatePath(`/messages/${conv}`);
}
