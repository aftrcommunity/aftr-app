-- AFTR. Community — update 3: The Back Room (members' forum)
-- Run once in Supabase → SQL Editor → New query → Run (after 001 and 002).
--
-- Who can use it: approved members on The Club or The Inner Circle, plus admins.
-- Members can post, reply, delete their own posts and report anything.
-- Admins can remove any post and see reports. Reports are never visible to other members.

-- Who may read and post in the Back Room
create function public.can_use_back_room() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select (status = 'approved' and tier in ('club', 'inner_circle')) or is_admin
      from public.profiles where id = auth.uid()
  ), false);
$$;

-- ── Threads ──────────────────────────────────────────────────────────────
create table public.forum_threads (
  id bigint generated always as identity primary key,
  channel text not null check (channel in ('general', 'events', 'rooms-recs', 'work', 'care')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_name text,
  reply_count int not null default 0,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  hidden boolean not null default false
);
alter table public.forum_threads enable row level security;
create index forum_threads_activity on public.forum_threads (last_activity_at desc);

-- ── Replies ──────────────────────────────────────────────────────────────
create table public.forum_replies (
  id bigint generated always as identity primary key,
  thread_id bigint not null references public.forum_threads (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_name text,
  created_at timestamptz not null default now(),
  hidden boolean not null default false
);
alter table public.forum_replies enable row level security;
create index forum_replies_thread on public.forum_replies (thread_id, created_at);

-- ── Reports ──────────────────────────────────────────────────────────────
create table public.forum_reports (
  id bigint generated always as identity primary key,
  thread_id bigint references public.forum_threads (id) on delete cascade,
  reply_id bigint references public.forum_replies (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  check (thread_id is not null or reply_id is not null)
);
alter table public.forum_reports enable row level security;

-- Stamp the author's nickname on every post (members can't read each other's profiles)
-- and stop anyone posting as someone else.
create function public.forum_stamp_author() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.author_id := auth.uid();
  new.author_name := coalesce(nullif(trim((select display_name from public.profiles where id = auth.uid())), ''), 'A member');
  new.hidden := false;
  return new;
end;
$$;
create trigger forum_threads_stamp before insert on public.forum_threads
  for each row execute function public.forum_stamp_author();
create trigger forum_replies_stamp before insert on public.forum_replies
  for each row execute function public.forum_stamp_author();

-- Keep each thread's reply count and "last active" time up to date
create function public.forum_bump_thread() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads set reply_count = reply_count + 1, last_activity_at = now() where id = new.thread_id;
  elsif tg_op = 'DELETE' then
    update public.forum_threads set reply_count = greatest(reply_count - 1, 0) where id = old.thread_id;
  end if;
  return null;
end;
$$;
create trigger forum_replies_bump after insert or delete on public.forum_replies
  for each row execute function public.forum_bump_thread();

-- ── Rules ────────────────────────────────────────────────────────────────
create policy "members read visible threads" on public.forum_threads
  for select to authenticated using (public.can_use_back_room() and (not hidden or public.is_admin()));
create policy "members start threads" on public.forum_threads
  for insert to authenticated with check (public.can_use_back_room());
create policy "authors and admins delete threads" on public.forum_threads
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "members read visible replies" on public.forum_replies
  for select to authenticated using (
    public.can_use_back_room() and (not hidden or public.is_admin())
    and exists (select 1 from public.forum_threads t where t.id = thread_id)
  );
create policy "members reply" on public.forum_replies
  for insert to authenticated with check (
    public.can_use_back_room() and exists (select 1 from public.forum_threads t where t.id = thread_id)
  );
create policy "authors and admins delete replies" on public.forum_replies
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "members report" on public.forum_reports
  for insert to authenticated with check (public.can_use_back_room());
create policy "admins read reports" on public.forum_reports
  for select to authenticated using (public.is_admin());

grant select, insert, delete on public.forum_threads, public.forum_replies to authenticated;
grant insert, select on public.forum_reports to authenticated;

-- Admin tools: hide/unhide a post, mark a report resolved
create function public.moderate_post(thread bigint default null, reply bigint default null, hide boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only the AFTR. team can moderate'; end if;
  if thread is not null then update public.forum_threads set hidden = hide where id = thread; end if;
  if reply is not null then update public.forum_replies set hidden = hide where id = reply; end if;
end;
$$;

create function public.resolve_report(report bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only the AFTR. team can resolve reports'; end if;
  update public.forum_reports set resolved = true where id = report;
end;
$$;

-- Reports with what was reported, for the review queue
create function public.admin_reports()
returns table (id bigint, created_at timestamptz, reason text, thread_id bigint, reply_id bigint,
               title text, excerpt text, author_name text, hidden boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only the AFTR. team can see reports'; end if;
  return query
    select r.id, r.created_at, r.reason, coalesce(r.thread_id, rp.thread_id), r.reply_id,
           t.title, left(coalesce(rp.body, t.body), 280), coalesce(rp.author_name, t.author_name),
           coalesce(rp.hidden, t.hidden)
      from public.forum_reports r
      left join public.forum_replies rp on rp.id = r.reply_id
      left join public.forum_threads t on t.id = coalesce(r.thread_id, rp.thread_id)
     where not r.resolved
     order by r.created_at desc;
end;
$$;

revoke all on function public.moderate_post, public.resolve_report, public.admin_reports from public, anon;
grant execute on function public.moderate_post, public.resolve_report, public.admin_reports to authenticated;
