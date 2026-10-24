-- AFTR. Community — database setup (run once in Supabase → SQL Editor → New query → Run)
--
-- What this creates
--   profiles          one row per person who signs in: display name, status, tier
--   applications      what each applicant tells us (one per person)
--   application_notes the team's private notes on applicants (admins only)
--   review_application()  the only way to approve / waitlist / decline someone
--
-- Privacy rules built in
--   * Row level security is ON for every table: nobody sees a row unless a rule allows it.
--   * Members can see their own profile and application, nothing else of anyone's.
--   * Only admins see applications and notes; notes are never shown to the applicant.
--   * Nobody can make themselves approved, change their tier or become an admin
--     from the app: those columns can only be changed by review_application().
--   * No orientation, gender identity, ID documents or home address are stored.

-- ── Types ────────────────────────────────────────────────────────────────
create type public.member_status as enum ('applicant', 'approved', 'waitlisted', 'declined', 'suspended');
create type public.member_tier as enum ('community', 'club', 'inner_circle');

-- ── Profiles ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  status public.member_status not null default 'applicant',
  tier public.member_tier not null default 'community',
  paid_until date,
  member_number serial unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.profiles enable row level security;

-- A profile row is created automatically the first time someone signs in.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers used by the rules below (security definer so they can read profiles safely)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create function public.is_approved_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select status = 'approved' from public.profiles where id = auth.uid()), false);
$$;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "edit own display name" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Members may only ever change their display name; everything else is admin-only.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ── Applications ─────────────────────────────────────────────────────────
create table public.applications (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  contact text not null check (char_length(contact) between 5 and 80),   -- phone / WhatsApp
  instagram text check (char_length(instagram) <= 60),
  referred_by text check (char_length(referred_by) <= 80),
  why_aftr text not null check (char_length(why_aftr) between 10 and 1000),
  agreed_policy_at timestamptz not null,
  submitted_at timestamptz not null default now()
);
alter table public.applications enable row level security;

create policy "submit own application" on public.applications
  for insert to authenticated with check (user_id = auth.uid());
create policy "read own application, admins read all" on public.applications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

grant select, insert on public.applications to authenticated;

-- ── Private team notes ───────────────────────────────────────────────────
create table public.application_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.application_notes enable row level security;

create policy "admins only" on public.application_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert on public.application_notes to authenticated;
grant usage on sequence public.application_notes_id_seq to authenticated;

-- ── Reviewing an applicant (admins only) ─────────────────────────────────
create function public.review_application(
  applicant uuid,
  decision public.member_status,
  new_tier public.member_tier default 'community',
  paid_until_date date default null,
  note text default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only the AFTR. team can review applications';
  end if;
  if decision not in ('approved', 'waitlisted', 'declined', 'suspended') then
    raise exception 'Unknown decision';
  end if;

  update public.profiles
     set status = decision,
         tier = new_tier,
         paid_until = paid_until_date,
         approved_at = case when decision = 'approved' then coalesce(approved_at, now()) else approved_at end
   where id = applicant;

  if note is not null and char_length(trim(note)) > 0 then
    insert into public.application_notes (user_id, author_id, note) values (applicant, auth.uid(), trim(note));
  end if;
end;
$$;
revoke all on function public.review_application from public, anon;
grant execute on function public.review_application to authenticated;

-- The review queue: every applicant with their sign-in email (admins only)
create function public.admin_applicants()
returns table (
  user_id uuid, email text, display_name text, status public.member_status, tier public.member_tier,
  paid_until date, member_number int, full_name text, contact text, instagram text,
  referred_by text, why_aftr text, submitted_at timestamptz, notes text[]
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only the AFTR. team can see applications';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.status, p.tier, p.paid_until, p.member_number,
           a.full_name, a.contact, a.instagram, a.referred_by, a.why_aftr, a.submitted_at,
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

-- ── Make yourself the first admin ────────────────────────────────────────
-- 1. Run everything above.
-- 2. Sign in to the app once with your own email.
-- 3. Replace the email below with yours, then run just these lines:
--
-- update public.profiles
--    set is_admin = true, status = 'approved', tier = 'inner_circle', approved_at = now()
--  where id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');
