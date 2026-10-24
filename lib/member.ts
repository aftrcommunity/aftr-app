import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export type Status = 'applicant' | 'approved' | 'waitlisted' | 'declined' | 'suspended';
export type Tier = 'community' | 'club' | 'inner_circle';

export type Profile = {
  id: string;
  display_name: string | null;
  status: Status;
  tier: Tier;
  paid_until: string | null;
  member_number: number;
  is_admin: boolean;
  approved_at?: string | null;
  // Added in update 4 (may be missing until 004_team_and_cards.sql has been run)
  is_team?: boolean;
  team_title?: string | null;
  team_email?: string | null;
};

export const TIER_LABEL: Record<Tier, string> = {
  community: 'The Community',
  club: 'The Club',
  inner_circle: 'The Inner Circle',
};

// Who is signed in, their profile, and whether they've applied.
export async function getMember() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, applied: false };

  const [{ data: profile }, { data: application }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('applications').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  return { supabase, user, profile: profile as Profile | null, applied: !!application };
}

// Where a signed-in person belongs, based on their status.
export function homeFor(profile: Profile | null, applied: boolean) {
  if (profile?.status === 'approved') return '/home';
  if (!applied && profile?.status === 'applicant') return '/apply';
  return '/pending';
}

// For the members-only screens: send anyone else to the right place.
export async function requireApprovedMember() {
  const m = await getMember();
  if (!m.user) redirect('/login');
  if (m.profile?.status !== 'approved') redirect(homeFor(m.profile, m.applied));
  return m as typeof m & { profile: Profile };
}

export const initials = (name: string | null | undefined, fallback = 'A') =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || fallback;
