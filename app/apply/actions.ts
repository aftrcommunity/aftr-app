'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase/server';

export type ApplyState = { error?: string };

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max);

export async function submitApplication(_prev: ApplyState, form: FormData): Promise<ApplyState> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/join');

  const fullName = clean(form.get('full_name'), 80);
  const displayName = clean(form.get('display_name'), 40);
  const contact = clean(form.get('contact'), 80);
  const instagram = clean(form.get('instagram'), 60);
  const referredBy = clean(form.get('referred_by'), 80);
  const why = clean(form.get('why_aftr'), 1000);
  const agreed = form.get('agree') === 'yes';
  const tierPick = String(form.get('requested_tier') ?? 'community');
  const requestedTier = ['community', 'club', 'inner_circle'].includes(tierPick) ? tierPick : 'community';

  if (fullName.length < 2) return { error: 'Please add your name.' };
  if (displayName.length < 1) return { error: 'Please add a nickname — it’s how the app greets you.' };
  if (contact.length < 5) return { error: 'Please add a phone or WhatsApp number we can reach you on.' };
  if (why.length < 10) return { error: 'Tell us a little more about why you’d like to join (a sentence or two is fine).' };
  if (!agreed) return { error: 'Please agree to the Safer Spaces Policy to apply.' };

  const { error } = await supabase.from('applications').insert({
    user_id: user.id,
    full_name: fullName,
    contact,
    instagram: instagram || null,
    referred_by: referredBy || null,
    why_aftr: why,
    requested_tier: requestedTier,
    agreed_policy_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === '23505') redirect('/pending'); // already applied
    return { error: 'Something went wrong saving your application. Please try again.' };
  }

  if (displayName) await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);
  redirect('/pending');
}
