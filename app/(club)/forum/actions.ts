'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../lib/supabase/server';
import { isChannel, isReportCategory } from '../../../lib/forum';

const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
const num = (f: FormData, k: string) => Number(f.get(k) || 0) || 0;

// Photo paths chosen in the PhotoPicker (the database also checks they're the member's own)
function photoList(f: FormData, max: number): string[] {
  try {
    const v = JSON.parse(String(f.get('photos') ?? '[]'));
    return Array.isArray(v) ? v.filter((p) => typeof p === 'string').slice(0, max) : [];
  } catch {
    return [];
  }
}

export type PostState = { error?: string };

// Every write below is also checked by the database: only The Club, The Inner
// Circle, the team and admins can post, and the author is always the signed-in member.

export async function createThread(_prev: PostState, form: FormData): Promise<PostState> {
  const channel = text(form, 'channel', 20);
  const title = text(form, 'title', 120);
  const body = text(form, 'body', 4000);
  const photos = photoList(form, 4);
  const options = form.get('add_poll') === 'on'
    ? [0, 1, 2, 3, 4, 5].map((i) => text(form, `poll_${i}`, 80)).filter(Boolean)
    : [];
  if (!isChannel(channel)) return { error: 'Pick a channel.' };
  if (title.length < 3) return { error: 'Give your post a title (at least 3 characters).' };
  if (body.length < 1) return { error: 'Write something in your post.' };
  if (form.get('add_poll') === 'on' && options.length < 2) return { error: 'A poll needs at least two options.' };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('forum_threads').insert({ channel, title, body, photos }).select('id').single();
  if (error || !data) {
    console.error('createThread failed', error);
    return { error: `That didn’t post. Please try again. (${error?.code ?? ''} ${error?.message ?? 'no details'})` };
  }
  if (options.length >= 2) {
    const { error: pollError } = await supabase.from('forum_polls').insert({ thread_id: data.id, options });
    if (pollError) console.error('poll failed', pollError);
  }
  revalidatePath('/forum');
  redirect(`/forum/${data.id}`);
}

export async function createReply(form: FormData) {
  const threadId = num(form, 'thread_id');
  const parentId = num(form, 'parent_id') || null;
  const body = text(form, 'body', 4000);
  if (!threadId || !body) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from('forum_replies').insert({ thread_id: threadId, body, parent_id: parentId });
  if (error) console.error('createReply failed', error);
  revalidatePath(`/forum/${threadId}`);
}

export async function updatePost(_prev: PostState, form: FormData): Promise<PostState> {
  const threadId = num(form, 'thread_id');
  const replyId = num(form, 'reply_id');
  const body = text(form, 'body', 4000);
  if (!body) return { error: 'Your post can’t be empty.' };
  const supabase = await supabaseServer();
  const { error } = replyId
    ? await supabase.from('forum_replies').update({ body }).eq('id', replyId)
    : await supabase.from('forum_threads').update({ body, title: text(form, 'title', 120) }).eq('id', threadId);
  if (error) return { error: `That didn’t save. (${error.message})` };
  revalidatePath(`/forum/${threadId}`);
  revalidatePath('/forum');
  redirect(`/forum/${threadId}${replyId ? `#reply-${replyId}` : ''}`);
}

export async function deletePost(form: FormData) {
  const threadId = num(form, 'thread_id');
  const replyId = num(form, 'reply_id');
  const supabase = await supabaseServer();
  if (replyId) {
    await supabase.from('forum_replies').delete().eq('id', replyId);
    revalidatePath(`/forum/${threadId}`);
    return;
  }
  await supabase.from('forum_threads').delete().eq('id', threadId);
  revalidatePath('/forum');
  redirect('/forum');
}

// Like or love (press again to take it back)
export async function toggleReaction(form: FormData) {
  const threadId = num(form, 'thread_id');
  const replyId = num(form, 'reply_id') || null;
  const kind = form.get('kind') === 'love' ? 'love' : 'like';
  const supabase = await supabaseServer();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims?.sub;
  if (!me || !threadId) return;
  let q = supabase.from('forum_reactions').delete().eq('thread_id', threadId).eq('user_id', me).eq('kind', kind);
  q = replyId ? q.eq('reply_id', replyId) : q.is('reply_id', null);
  const { data: removed } = await q.select('id');
  if (!removed?.length) {
    await supabase.from('forum_reactions').insert({ thread_id: threadId, reply_id: replyId, kind });
  }
  revalidatePath(`/forum/${threadId}`);
}

export async function votePoll(form: FormData) {
  const threadId = num(form, 'thread_id');
  const choice = Number(form.get('option'));
  if (!threadId || !Number.isInteger(choice)) return;
  const supabase = await supabaseServer();
  await supabase.from('forum_poll_votes').upsert({ thread_id: threadId, option_index: choice }, { onConflict: 'thread_id,user_id' });
  revalidatePath(`/forum/${threadId}`);
}

export async function clearVote(form: FormData) {
  const threadId = num(form, 'thread_id');
  const supabase = await supabaseServer();
  await supabase.from('forum_poll_votes').delete().eq('thread_id', threadId);
  revalidatePath(`/forum/${threadId}`);
}

// Report a post, reply, message or profile. A category is required; a reason is optional.
export async function submitReport(_prev: PostState, form: FormData): Promise<PostState> {
  const category = text(form, 'category', 30);
  if (!isReportCategory(category)) return { error: 'Choose what best describes the problem.' };
  const row: Record<string, unknown> = { category, reason: text(form, 'reason', 500) || null };
  const threadId = num(form, 'thread_id');
  const replyId = num(form, 'reply_id');
  const messageId = num(form, 'message_id');
  const profileId = text(form, 'profile_id', 40);
  if (messageId) row.message_id = messageId;
  else if (replyId) row.reply_id = replyId;
  else if (threadId) row.thread_id = threadId;
  else if (profileId) row.profile_id = profileId;
  else return { error: 'Nothing to report.' };

  const supabase = await supabaseServer();
  const { error } = await supabase.from('forum_reports').insert(row);
  if (error) return { error: `That didn’t send. Please try again. (${error.message})` };
  const params = new URLSearchParams(String(form.get('query') ?? ''));
  params.set('done', '1');
  redirect(`/report?${params.toString()}`);
}

// Admins only (the database refuses anyone else)
export async function hidePost(form: FormData) {
  const threadId = num(form, 'thread_id');
  const replyId = num(form, 'reply_id');
  const hide = form.get('hide') !== 'false';
  const supabase = await supabaseServer();
  await supabase.rpc('moderate_post', replyId ? { reply: replyId, hide } : { thread: threadId, hide });
  revalidatePath(`/forum/${threadId}`);
  revalidatePath('/forum');
}
