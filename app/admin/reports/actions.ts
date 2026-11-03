'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../lib/supabase/server';

// Checked by the database: only admins can resolve. "Remove" hides the post,
// reply or message, and the person who reported it is told the outcome.
export async function handleReport(form: FormData) {
  const supabase = await supabaseServer();
  await supabase.rpc('resolve_report', {
    report: Number(form.get('report_id')),
    decision: form.get('remove') === 'yes' ? 'removed' : 'kept',
  });
  revalidatePath('/admin/reports');
  revalidatePath('/admin');
}
