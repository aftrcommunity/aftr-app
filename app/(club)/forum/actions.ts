'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../lib/supabase/server';
import { isChannel } from '../../../lib/forum';

const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);

export type PostState = { error?: string };

// Every write below is also checked by the database: only The Club, The Inner
// Circle and admins can post, and the author is always the signed-in member.

export async function createThread(_prev: PostState, form: FormData): Promise<PostState> {
  const channel = text(form, 'channel', 20);
  const title = text(form, 'title', 120);
  const body = text(form, 'body', 4000);
  if (!isChannel(channel)) return { error: 'Pick a channel.' };
  if (title.length < 3) return { error: 'Give your post a title (at least 3 characters).' };
  if (body.length < 1) return { error: 'Write something in your post.' };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('forum_threads').insert({ channel, title, body }).select('id').single();
  if (error || !data) return { error: 'That didn’t post. Please try again.' };
  revalidatePath('/forum');
  redirect(`/forum/${data.id}`);
}

export async function createReply(form: FormData) {
  const threadId = Number(form.get('thread_id'));
  const body = text(form, 'body', 4000);
  if (!threadId || !body) return;
  const supabase = await supabaseServer();
  await supabase.from('forum_replies').insert({ thread_id: threadId, body });
  revalidatePath(`/forum/${threadId}`);
}

export async function deletePost(form: FormData) {
  const threadId = Number(form.get('thread_id'));
  const replyId = Number(form.get('reply_id') || 0);
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

export async function reportPost(form: FormData) {
  const threadId = Number(form.get('thread_id'));
  const replyId = Number(form.get('reply_id') || 0);
  const supabase = await supabaseServer();
  await supabase.from('forum_reports').insert(replyId ? { reply_id: replyId } : { thread_id: threadId });
  redirect(`/forum/${threadId}?reported=1`);
}

// Admins only (the database refuses anyone else)
export async function hidePost(form: FormData) {
  const threadId = Number(form.get('thread_id'));
  const replyId = Number(form.get('reply_id') || 0);
  const hide = form.get('hide') !== 'false';
  const supabase = await supabaseServer();
  await supabase.rpc('moderate_post', replyId ? { reply: replyId, hide } : { thread: threadId, hide });
  revalidatePath(`/forum/${threadId}`);
  revalidatePath('/forum');
}
