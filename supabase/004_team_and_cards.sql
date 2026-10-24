-- AFTR. Community — update 4: the AFTR. team, and details for membership cards
-- Run once in Supabase → SQL Editor → New query → Run (after 001, 002 and 003).
--
-- The team: marked by an admin in the review queue. Team members can use every
-- part of the app (including the Back Room) whatever their tier, carry a "Team"
-- badge in the Back Room, and get the team card. Being on the team does NOT make
-- someone an admin: only admins see applications and reports.

alter table public.profiles
  add column is_team boolean not null default false,
  add column team_title text check (char_length(team_title) <= 60),
  add column team_email text check (char_length(team_email) <= 120);

-- The Back Room: The Club, The Inner Circle, the team, and admins
create or replace function public.can_use_back_room() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select (status = 'approved' and (tier in ('club', 'inner_circle') or is_team)) or is_admin
      from public.profiles where id = auth.uid()
  ), false);
$$;

-- Team badge on Back Room posts
alter table public.forum_threads add column author_is_team boolean not null default false;
alter table public.forum_replies add column author_is_team boolean not null default false;

create or replace function public.forum_stamp_author() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(nullif(trim(p.display_name), ''), 'A member');
  new.author_is_team := coalesce(p.is_team, false);
  new.hidden := false;
  return new;
end;
$$;

-- Admins add or remove someone from the team (and approve them if needed)
create function public.set_team(member uuid, on_team boolean, title text default null, email text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only admins can change the team'; end if;
  update public.profiles
     set is_team = on_team,
         team_title = case when on_team then nullif(trim(title), '') else null end,
         team_email = case when on_team then nullif(trim(email), '') else null end,
         status = case when on_team and status = 'applicant' then 'approved' else status end,
         approved_at = case when on_team then coalesce(approved_at, now()) else approved_at end
   where id = member;
end;
$$;
revoke all on function public.set_team from public, anon;
grant execute on function public.set_team to authenticated;

-- Review queue: now includes team details
drop function if exists public.admin_applicants();
create function public.admin_applicants()
returns table (
  user_id uuid, email text, display_name text, status public.member_status, tier public.member_tier,
  paid_until date, member_number int, full_name text, contact text, instagram text,
  referred_by text, why_aftr text, submitted_at timestamptz, requested_tier public.member_tier,
  is_team boolean, team_title text, team_email text, notes text[]
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only the AFTR. team can see applications';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.status, p.tier, p.paid_until, p.member_number,
           a.full_name, a.contact, a.instagram, a.referred_by, a.why_aftr, a.submitted_at, a.requested_tier,
           p.is_team, p.team_title, p.team_email,
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

-- Your own full name, for your card (members can only ever read their own)
create function public.my_full_name() returns text
language sql stable security definer set search_path = '' as $$
  select full_name from public.applications where user_id = auth.uid();
$$;
grant execute on function public.my_full_name to authenticated;
