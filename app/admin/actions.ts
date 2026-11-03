'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../lib/supabase/server';
import { sendRenewalReminder, sendWelcome } from '../../lib/email';

const DECISIONS = ['approved', 'waitlisted', 'declined', 'suspended'] as const;
const TIERS = ['community', 'club', 'inner_circle'] as const;

const backTo = (form: FormData, note?: string) => {
  const b = String(form.get('back') || '/admin');
  const url = b.startsWith('/admin') ? b : '/admin';
  if (!note) return url;
  return `${url}${url.includes('?') ? '&' : '?'}note=${encodeURIComponent(note)}`;
};

// Calls the database's review_application(), which itself refuses anyone who isn't an admin.
// When someone is approved for the first time, they get a welcome email.
export async function review(form: FormData) {
  const decision = String(form.get('decision'));
  const tier = String(form.get('tier') || 'community');
  const paidUntil = String(form.get('paid_until') || '') || null;
  const note = String(form.get('note') || '').trim().slice(0, 1000) || null;
  const member = String(form.get('user_id'));
  const wasApproved = form.get('prev_status') === 'approved';
  if (!DECISIONS.includes(decision as (typeof DECISIONS)[number]) || !TIERS.includes(tier as (typeof TIERS)[number])) return;

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('review_application', {
    applicant: member,
    decision,
    new_tier: tier,
    paid_until_date: paidUntil,
    note,
  });
  revalidatePath('/admin');
  if (error) redirect(backTo(form, `That didn’t save: ${error.message}`));

  if (decision === 'approved' && !wasApproved) {
    const { data } = await supabase.rpc('admin_member_contact', { member });
    const c = (data ?? [])[0] as { email: string; display_name: string | null; tier: string } | undefined;
    if (c?.email) {
      const sent = await sendWelcome(c.email, c.display_name, c.tier);
      redirect(backTo(form, sent.ok ? `Approved, and a welcome email went to ${c.email}.` : `Approved. ${sent.error}`));
    }
  }
  redirect(backTo(form, decision === 'approved' ? 'Saved.' : undefined));
}

// Add or remove someone from the AFTR. team (database refuses non-admins)
export async function setTeam(form: FormData) {
  const supabase = await supabaseServer();
  await supabase.rpc('set_team', {
    member: String(form.get('user_id')),
    on_team: form.get('is_team') === 'on',
    title: String(form.get('team_title') || '').slice(0, 60) || null,
    email: String(form.get('team_email') || '').slice(0, 120) || null,
  });
  revalidatePath('/admin');
  redirect(backTo(form, 'Team details saved.'));
}

// Email a renewal reminder to one member
export async function remindRenewal(form: FormData) {
  const member = String(form.get('user_id'));
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc('admin_member_contact', { member });
  const c = (data ?? [])[0] as { email: string; display_name: string | null; tier: string; paid_until: string | null } | undefined;
  if (!c?.email || !c.paid_until) redirect('/admin/renewals?note=No email or paid-until date for this member.');
  const sent = await sendRenewalReminder(c.email, c.display_name, c.tier, c.paid_until);
  if (sent.ok) await supabase.rpc('mark_renewal_reminded', { member });
  revalidatePath('/admin/renewals');
  redirect(`/admin/renewals?note=${encodeURIComponent(sent.ok ? `Reminder sent to ${c.email}.` : (sent.error ?? 'Email failed.'))}`);
}
