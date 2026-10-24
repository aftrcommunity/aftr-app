'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../lib/supabase/server';

// Both checked by the database: only admins can moderate or resolve.
export async function handleReport(form: FormData) {
  const reportId = Number(form.get('report_id'));
  const threadId = Number(form.get('thread_id') || 0);
  const replyId = Number(form.get('reply_id') || 0);
  const remove = form.get('remove') === 'yes';
  const supabase = await supabaseServer();
  if (remove) {
    await supabase.rpc('moderate_post', replyId ? { reply: replyId, hide: true } : { thread: threadId, hide: true });
  }
  await supabase.rpc('resolve_report', { report: reportId });
  revalidatePath('/admin/reports');
  revalidatePath('/admin');
}
