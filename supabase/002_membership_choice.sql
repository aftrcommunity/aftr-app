-- AFTR. Community — update 2: applicants choose a membership tier when they apply
-- Run once in Supabase → SQL Editor → New query → Run (after 001_setup.sql).

-- The tier the applicant asked for (the tier she actually gets is still set by the team)
alter table public.applications
  add column requested_tier public.member_tier not null default 'community';

-- The review queue now shows which tier each person asked for
drop function if exists public.admin_applicants();

create function public.admin_applicants()
returns table (
  user_id uuid, email text, display_name text, status public.member_status, tier public.member_tier,
  paid_until date, member_number int, full_name text, contact text, instagram text,
  referred_by text, why_aftr text, submitted_at timestamptz, requested_tier public.member_tier, notes text[]
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only the AFTR. team can see applications';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.status, p.tier, p.paid_until, p.member_number,
           a.full_name, a.contact, a.instagram, a.referred_by, a.why_aftr, a.submitted_at, a.requested_tier,
           array(select n.note from public.application_notes n where n.user_id = p.id order by n.created_at)
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.applications a on a.user_id = p.id
     where a.user_id is not null or p.status <> 'applicant'
     order by (p.status = 'applicant') desc, a.submitted_at desc nulls last;
end;
$$;
revoke all on function public.admin_applicants from public, anon;
grant execute on function public.admin_applicants to authenticated;
