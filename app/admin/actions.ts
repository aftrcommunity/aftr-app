'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../lib/supabase/server';

const DECISIONS = ['approved', 'waitlisted', 'declined', 'suspended'] as const;
const TIERS = ['community', 'club', 'inner_circle'] as const;

// Calls the database's review_application(), which itself refuses anyone who isn't an admin.
export async function review(form: FormData) {
  const decision = String(form.get('decision'));
  const tier = String(form.get('tier') || 'community');
  const paidUntil = String(form.get('paid_until') || '') || null;
  const note = String(form.get('note') || '').trim().slice(0, 1000) || null;
  if (!DECISIONS.includes(decision as (typeof DECISIONS)[number]) || !TIERS.includes(tier as (typeof TIERS)[number])) return;

  const supabase = await supabaseServer();
  await supabase.rpc('review_application', {
    applicant: String(form.get('user_id')),
    decision,
    new_tier: tier,
    paid_until_date: paidUntil,
    note,
  });
  revalidatePath('/admin');
}
