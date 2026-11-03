-- AFTR. Community — update 5: safer reporting, mute and block, replies to replies,
-- reactions, editing, polls, photos, profiles, direct messages, notifications,
-- and renewals. Run once in Supabase → SQL Editor → New query → Run (after 001–004).
--
-- Everything here is part of the Back Room, so it's for The Club, The Inner Circle,
-- the team and admins (can_use_back_room). Direct messages are private to the two
-- people in them: admins can't read them. A reported message is copied into the
-- report so the team can review just that message.

-- ── Helpers ──────────────────────────────────────────────────────────────

-- Can this person use the Back Room (same rule as can_use_back_room, for anyone)
create function public.back_room_member(member uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select (status = 'approved' and (tier in ('club', 'inner_circle') or is_team)) or is_admin
      from public.profiles where id = member
  ), false);
$$;

create function public.nickname_of(member uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(trim(display_name), ''), 'A member') from public.profiles where id = member;
$$;

-- ── Mute and block ───────────────────────────────────────────────────────
-- Mute: you stop seeing their posts and replies. They aren't told.
-- Block: as mute, plus no messages either way and you can't see each other's profiles or posts.
create table public.member_mutes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  muted_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, muted_id),
  check (user_id <> muted_id)
);
create table public.member_blocks (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);
alter table public.member_mutes enable row level security;
alter table public.member_blocks enable row level security;
create policy "own mutes" on public.member_mutes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own blocks" on public.member_blocks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.member_mutes, public.member_blocks to authenticated;

create function public.is_blocked_between(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.member_blocks
                  where (user_id = x and blocked_id = y) or (user_id = y and blocked_id = x));
$$;

-- Everyone whose posts I shouldn't see: muted by me, blocked by me, or who blocked me
create function public.hidden_people() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select muted_id from public.member_mutes where user_id = auth.uid()
  union select blocked_id from public.member_blocks where user_id = auth.uid()
  union select user_id from public.member_blocks where blocked_id = auth.uid();
$$;

-- ── Photos (Supabase Storage) ────────────────────────────────────────────
-- One private bucket. Each member uploads into a folder named after their own id.
-- Only Back Room members can view, and the app only ever shows short-lived links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-media', 'member-media', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "back room members view member photos" on storage.objects
  for select to authenticated using (bucket_id = 'member-media' and public.can_use_back_room());
create policy "members upload into their own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'member-media' and public.can_use_back_room()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "members delete their own photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'member-media' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Every photo path a member saves must be in their own folder
create function public.own_photo_paths(paths text[]) returns boolean
language sql stable set search_path = '' as $$
  select coalesce(bool_and(p like auth.uid()::text || '/%'), true) from unnest(paths) as p;
$$;

-- ── Back Room posts: photos, editing, replies to replies ─────────────────
alter table public.forum_threads
  add column photos text[] not null default '{}' check (cardinality(photos) <= 4),
  add column edited_at timestamptz;
alter table public.forum_replies
  add column parent_id bigint references public.forum_replies (id) on delete cascade,
  add column edited_at timestamptz;
create index forum_replies_parent on public.forum_replies (parent_id);

create or replace function public.forum_stamp_author() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(nullif(trim(p.display_name), ''), 'A member');
  new.author_is_team := coalesce(p.is_team, false);
  new.hidden := false;
  new.edited_at := null;
  return new;
end;
$$;

-- Photos on a thread must be the author's own uploads
create function public.forum_check_photos() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not public.own_photo_paths(new.photos) then raise exception 'Photos must be your own uploads'; end if;
  return new;
end;
$$;
create trigger forum_threads_photos before insert or update of photos on public.forum_threads
  for each row execute function public.forum_check_photos();

-- Replies to replies: one level deep (a reply to a reply joins that conversation)
create function public.forum_reply_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
declare par public.forum_replies;
begin
  if new.parent_id is not null then
    select * into par from public.forum_replies where id = new.parent_id;
    if par.id is null or par.thread_id <> new.thread_id then
      raise exception 'You can only reply to a reply in the same conversation';
    end if;
    if par.parent_id is not null then new.parent_id := par.parent_id; end if;
  end if;
  return new;
end;
$$;
create trigger forum_replies_parent before insert on public.forum_replies
  for each row execute function public.forum_reply_parent();

-- Editing your own posts: only the title and words change, and "edited" is shown
create function public.forum_thread_edited() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.body is distinct from old.body or new.title is distinct from old.title then new.edited_at := now(); end if;
  return new;
end;
$$;
create function public.forum_reply_edited() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.body is distinct from old.body then new.edited_at := now(); end if;
  return new;
end;
$$;
create trigger forum_threads_edited before update on public.forum_threads
  for each row execute function public.forum_thread_edited();
create trigger forum_replies_edited before update on public.forum_replies
  for each row execute function public.forum_reply_edited();

create policy "authors edit their threads" on public.forum_threads
  for update to authenticated using (author_id = auth.uid() and public.can_use_back_room())
  with check (author_id = auth.uid());
create policy "authors edit their replies" on public.forum_replies
  for update to authenticated using (author_id = auth.uid() and public.can_use_back_room())
  with check (author_id = auth.uid());
grant update (title, body) on public.forum_threads to authenticated;
grant update (body) on public.forum_replies to authenticated;

-- ── Reactions (like and love) ────────────────────────────────────────────
create table public.forum_reactions (
  id bigint generated always as identity primary key,
  thread_id bigint not null references public.forum_threads (id) on delete cascade,
  reply_id bigint references public.forum_replies (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('like', 'love')),
  created_at timestamptz not null default now()
);
create unique index forum_reactions_once on public.forum_reactions (user_id, thread_id, coalesce(reply_id, 0), kind);
create index forum_reactions_thread on public.forum_reactions (thread_id);
alter table public.forum_reactions enable row level security;
create policy "members see reactions" on public.forum_reactions
  for select to authenticated using (public.can_use_back_room());
create policy "members react" on public.forum_reactions
  for insert to authenticated with check (user_id = auth.uid() and public.can_use_back_room());
create policy "members undo their reactions" on public.forum_reactions
  for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.forum_reactions to authenticated;

-- ── Polls ────────────────────────────────────────────────────────────────
create table public.forum_polls (
  thread_id bigint primary key references public.forum_threads (id) on delete cascade,
  options text[] not null check (cardinality(options) between 2 and 6),
  created_at timestamptz not null default now()
);
create table public.forum_poll_votes (
  thread_id bigint not null references public.forum_polls (thread_id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  option_index int not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
alter table public.forum_polls enable row level security;
alter table public.forum_poll_votes enable row level security;
create policy "members see polls" on public.forum_polls
  for select to authenticated using (public.can_use_back_room());
create policy "authors add a poll to their thread" on public.forum_polls
  for insert to authenticated with check (
    public.can_use_back_room()
    and exists (select 1 from public.forum_threads t where t.id = thread_id and t.author_id = auth.uid())
  );
-- Votes are private: you see your own; everyone sees totals through poll_results()
create policy "own vote" on public.forum_poll_votes for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_use_back_room());
grant select, insert on public.forum_polls to authenticated;
grant select, insert, update, delete on public.forum_poll_votes to authenticated;

create function public.poll_vote_check() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.option_index >= (select cardinality(options) from public.forum_polls where thread_id = new.thread_id) then
    raise exception 'That option doesn''t exist';
  end if;
  return new;
end;
$$;
create trigger forum_poll_votes_check before insert or update on public.forum_poll_votes
  for each row execute function public.poll_vote_check();

create function public.poll_results(thread bigint)
returns table (option_index int, votes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_use_back_room() then raise exception 'Back Room members only'; end if;
  return query select v.option_index, count(*) from public.forum_poll_votes v
                where v.thread_id = thread group by v.option_index;
end;
$$;

-- ── Profiles ─────────────────────────────────────────────────────────────
create table public.member_profiles (
  id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  bio text check (char_length(bio) <= 300),
  instagram text check (char_length(instagram) <= 60),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  listed boolean not null default true,         -- shown in the members list
  allow_messages boolean not null default true, -- other members can message you
  updated_at timestamptz not null default now()
);
alter table public.member_profiles enable row level security;
create policy "own profile" on public.member_profiles for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and public.own_photo_paths(photos));
grant select, insert, update on public.member_profiles to authenticated;

-- One member's profile, for other Back Room members (not if either has blocked the other)
create function public.member_profile(member uuid)
returns table (id uuid, display_name text, tier public.member_tier, is_team boolean, team_title text,
               member_number int, approved_at timestamptz, bio text, instagram text, photos text[],
               allow_messages boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_use_back_room() then raise exception 'Back Room members only'; end if;
  if not public.back_room_member(member) or public.is_blocked_between(auth.uid(), member) then return; end if;
  return query
    select p.id, coalesce(nullif(trim(p.display_name), ''), 'A member'), p.tier, p.is_team, p.team_title,
           p.member_number, p.approved_at, mp.bio, mp.instagram, coalesce(mp.photos, '{}'),
           coalesce(mp.allow_messages, true)
      from public.profiles p left join public.member_profiles mp on mp.id = p.id
     where p.id = member;
end;
$$;

-- The members list: everyone in the Back Room who hasn't hidden themselves
create function public.member_directory()
returns table (id uuid, display_name text, tier public.member_tier, is_team boolean, team_title text, photo text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_use_back_room() then raise exception 'Back Room members only'; end if;
  return query
    select p.id, coalesce(nullif(trim(p.display_name), ''), 'A member'), p.tier, p.is_team, p.team_title,
           (coalesce(mp.photos, '{}'))[1]
      from public.profiles p left join public.member_profiles mp on mp.id = p.id
     where public.back_room_member(p.id)
       and (coalesce(mp.listed, true) or p.id = auth.uid())
       and not public.is_blocked_between(auth.uid(), p.id)
     order by lower(coalesce(nullif(trim(p.display_name), ''), 'A member'));
end;
$$;

-- ── Direct messages ──────────────────────────────────────────────────────
create table public.conversations (
  id bigint generated always as identity primary key,
  member_a uuid not null references public.profiles (id) on delete cascade,
  member_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (member_a < member_b),
  unique (member_a, member_b)
);
create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  hidden boolean not null default false
);
create index messages_conversation on public.messages (conversation_id, created_at);
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create function public.in_conversation(conv bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversations c
                  where c.id = conv and auth.uid() in (c.member_a, c.member_b));
$$;
create function public.other_member(conv bigint) returns uuid
language sql stable security definer set search_path = '' as $$
  select case when c.member_a = auth.uid() then c.member_b else c.member_a end
    from public.conversations c where c.id = conv;
$$;

create policy "people in a conversation see it" on public.conversations
  for select to authenticated using (auth.uid() in (member_a, member_b));
create policy "people in a conversation read it" on public.messages
  for select to authenticated using (public.in_conversation(conversation_id) and not hidden);
create policy "people in a conversation write in it" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and public.can_use_back_room() and public.in_conversation(conversation_id)
    and not public.is_blocked_between(auth.uid(), public.other_member(conversation_id))
  );
grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

-- Start (or reopen) a conversation with another member
create function public.start_conversation(other uuid) returns bigint
language plpgsql security definer set search_path = '' as $$
declare a uuid; b uuid; conv bigint;
begin
  if not public.can_use_back_room() then raise exception 'Back Room members only'; end if;
  if other = auth.uid() then raise exception 'You can''t message yourself'; end if;
  if not public.back_room_member(other) or public.is_blocked_between(auth.uid(), other) then
    raise exception 'You can''t message this member';
  end if;
  a := least(auth.uid(), other); b := greatest(auth.uid(), other);
  select id into conv from public.conversations where member_a = a and member_b = b;
  if conv is null then
    if not coalesce((select allow_messages from public.member_profiles where id = other), true) then
      raise exception 'This member isn''t taking messages right now';
    end if;
    insert into public.conversations (member_a, member_b) values (a, b) returning id into conv;
  end if;
  return conv;
end;
$$;

create function public.mark_conversation_read(conv bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.in_conversation(conv) then return; end if;
  update public.messages set read_at = now()
   where conversation_id = conv and sender_id <> auth.uid() and read_at is null;
  update public.notifications set read_at = now()
   where user_id = auth.uid() and conversation_id = conv and read_at is null;
end;
$$;

-- Your conversations, newest first, with the other person's nickname and unread count
create function public.my_conversations()
returns table (id bigint, other_id uuid, other_name text, other_photo text, last_body text,
               last_at timestamptz, last_from_me boolean, unread bigint)
language sql stable security definer set search_path = '' as $$
  select c.id, o.other, public.nickname_of(o.other), (mp.photos)[1],
         lm.body, c.last_message_at, lm.sender_id = auth.uid(),
         (select count(*) from public.messages m
           where m.conversation_id = c.id and m.sender_id <> auth.uid() and m.read_at is null and not m.hidden)
    from public.conversations c
    cross join lateral (select case when c.member_a = auth.uid() then c.member_b else c.member_a end as other) o
    left join public.member_profiles mp on mp.id = o.other
    left join lateral (select m.body, m.sender_id from public.messages m
                        where m.conversation_id = c.id and not m.hidden
                        order by m.created_at desc limit 1) lm on true
   where auth.uid() in (c.member_a, c.member_b)
     and lm.body is not null
     and not public.is_blocked_between(auth.uid(), o.other)
   order by c.last_message_at desc;
$$;

-- ── Notifications (in the app) ───────────────────────────────────────────
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('reply', 'reply_to_reply', 'reaction', 'message', 'report_outcome')),
  actor_name text,
  thread_id bigint references public.forum_threads (id) on delete cascade,
  conversation_id bigint references public.conversations (id) on delete cascade,
  title text,
  excerpt text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
grant select on public.notifications to authenticated;

create function public.mark_notifications_read() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
   where user_id = auth.uid() and read_at is null and kind <> 'message';
$$;

-- Don't notify someone about a person they've muted or blocked (or who blocked them)
create function public.notify(recipient uuid, actor uuid, k text, thread bigint, conv bigint, t text, ex text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if recipient is null or recipient = actor then return; end if;
  if exists (select 1 from public.member_mutes where user_id = recipient and muted_id = actor)
     or public.is_blocked_between(recipient, actor) then return; end if;
  insert into public.notifications (user_id, kind, actor_name, thread_id, conversation_id, title, excerpt)
  values (recipient, k, public.nickname_of(actor), thread, conv, t, left(ex, 140));
end;
$$;
revoke all on function public.notify from public, anon, authenticated;

create function public.notify_on_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
declare th public.forum_threads; parent_author uuid;
begin
  select * into th from public.forum_threads where id = new.thread_id;
  if new.parent_id is not null then
    select author_id into parent_author from public.forum_replies where id = new.parent_id;
    perform public.notify(parent_author, new.author_id, 'reply_to_reply', th.id, null, th.title, new.body);
  end if;
  if parent_author is distinct from th.author_id then
    perform public.notify(th.author_id, new.author_id, 'reply', th.id, null, th.title, new.body);
  end if;
  return null;
end;
$$;
create trigger forum_replies_notify after insert on public.forum_replies
  for each row execute function public.notify_on_reply();

create function public.notify_on_reaction() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recipient uuid; th public.forum_threads;
begin
  select * into th from public.forum_threads where id = new.thread_id;
  if new.reply_id is not null then
    select author_id into recipient from public.forum_replies where id = new.reply_id;
  else
    recipient := th.author_id;
  end if;
  perform public.notify(recipient, new.user_id, 'reaction', th.id, null, th.title,
                        case new.kind when 'love' then 'loved' else 'liked' end);
  return null;
end;
$$;
create trigger forum_reactions_notify after insert on public.forum_reactions
  for each row execute function public.notify_on_reaction();

-- One unread "new message" notice per conversation, kept up to date
create function public.notify_on_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  select case when member_a = new.sender_id then member_b else member_a end into recipient
    from public.conversations where id = new.conversation_id;
  delete from public.notifications
   where user_id = recipient and conversation_id = new.conversation_id and read_at is null;
  perform public.notify(recipient, new.sender_id, 'message', null, new.conversation_id, null, new.body);
  return null;
end;
$$;
create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_on_message();

-- ── Reports: category, optional reason, and more things you can report ────
alter table public.forum_reports
  add column category text check (category in ('harassment', 'hate', 'sexual', 'violence', 'self_harm',
                                               'false_info', 'spam', 'ip', 'illegal_sales')),
  add column message_id bigint references public.messages (id) on delete set null,
  add column profile_id uuid references public.profiles (id) on delete cascade,
  add column reported_user uuid references public.profiles (id) on delete set null,
  add column snapshot text,
  add column outcome text check (outcome in ('removed', 'kept'));
alter table public.forum_reports drop constraint if exists forum_reports_check;
alter table public.forum_reports add constraint forum_reports_target
  check (thread_id is not null or reply_id is not null or message_id is not null or profile_id is not null) not valid;
alter table public.forum_reports add constraint forum_reports_category_required
  check (category is not null) not valid;

-- Fill in who made the report, who it's about, and a copy of a reported message
create function public.forum_report_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m public.messages;
begin
  new.reporter_id := auth.uid();
  new.resolved := false;
  new.outcome := null;
  if new.message_id is not null then
    select * into m from public.messages where id = new.message_id;
    if m.id is null or not public.in_conversation(m.conversation_id) or m.sender_id = auth.uid() then
      raise exception 'You can only report messages sent to you';
    end if;
    new.snapshot := m.body;
    new.reported_user := m.sender_id;
  elsif new.reply_id is not null then
    select author_id, thread_id into new.reported_user, new.thread_id from public.forum_replies where id = new.reply_id;
  elsif new.thread_id is not null then
    select author_id into new.reported_user from public.forum_threads where id = new.thread_id;
  elsif new.profile_id is not null then
    new.reported_user := new.profile_id;
  end if;
  return new;
end;
$$;
create trigger forum_reports_stamp before insert on public.forum_reports
  for each row execute function public.forum_report_stamp();

-- Reports for the review queue
drop function if exists public.admin_reports();
create function public.admin_reports()
returns table (id bigint, created_at timestamptz, category text, reason text, kind text,
               thread_id bigint, reply_id bigint, message_id bigint, profile_id uuid,
               title text, excerpt text, author_name text, hidden boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only the AFTR. team can see reports'; end if;
  return query
    select r.id, r.created_at, r.category, r.reason,
           case when r.message_id is not null or r.snapshot is not null then 'message'
                when r.profile_id is not null then 'profile'
                when r.reply_id is not null then 'reply' else 'post' end,
           r.thread_id, r.reply_id, r.message_id, r.profile_id,
           t.title,
           left(coalesce(r.snapshot, rp.body, t.body, mp.bio, ''), 400),
           coalesce(public.nickname_of(r.reported_user), rp.author_name, t.author_name),
           coalesce(m.hidden, rp.hidden, t.hidden, false)
      from public.forum_reports r
      left join public.forum_replies rp on rp.id = r.reply_id
      left join public.forum_threads t on t.id = coalesce(r.thread_id, rp.thread_id)
      left join public.messages m on m.id = r.message_id
      left join public.member_profiles mp on mp.id = r.profile_id
     where not r.resolved
     order by r.created_at desc;
end;
$$;

-- Close a report. The person who reported it is told what was decided.
drop function if exists public.resolve_report(bigint);
create function public.resolve_report(report bigint, decision text default 'kept') returns void
language plpgsql security definer set search_path = '' as $$
declare r public.forum_reports;
begin
  if not public.is_admin() then raise exception 'Only the AFTR. team can resolve reports'; end if;
  if decision not in ('removed', 'kept') then raise exception 'Unknown decision'; end if;
  update public.forum_reports set resolved = true, outcome = decision where id = report returning * into r;
  if decision = 'removed' then
    if r.message_id is not null then update public.messages set hidden = true where id = r.message_id;
    elsif r.reply_id is not null then update public.forum_replies set hidden = true where id = r.reply_id;
    elsif r.thread_id is not null then update public.forum_threads set hidden = true where id = r.thread_id;
    end if;
  end if;
  insert into public.notifications (user_id, kind, actor_name, title, excerpt)
  values (r.reporter_id, 'report_outcome', 'The AFTR. team',
          case decision when 'removed' then 'removed' else 'kept' end,
          case decision
            when 'removed' then 'Thanks for your report. We reviewed it and removed it for breaking the Safer Spaces Policy.'
            else 'Thanks for your report. We reviewed it and decided it doesn''t break the Safer Spaces Policy, so it stays up. You can still mute or block the person.'
          end);
end;
$$;

-- ── Renewals and emails (admins) ─────────────────────────────────────────
alter table public.profiles add column renewal_reminded_at timestamptz;

-- Paid members whose membership ends within 30 days, or has already ended
create function public.admin_renewals()
returns table (user_id uuid, email text, display_name text, full_name text, tier public.member_tier,
               paid_until date, reminded_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
    select p.id, u.email::text, p.display_name, a.full_name, p.tier, p.paid_until, p.renewal_reminded_at
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.applications a on a.user_id = p.id
     where p.status = 'approved' and p.tier in ('club', 'inner_circle')
       and p.paid_until is not null and p.paid_until <= current_date + 30
     order by p.paid_until;
end;
$$;

create function public.mark_renewal_reminded(member uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set renewal_reminded_at = now() where id = member;
end;
$$;

-- A member's email and details, so the app can send their welcome email
create function public.admin_member_contact(member uuid)
returns table (email text, display_name text, tier public.member_tier, status public.member_status, paid_until date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query select u.email::text, p.display_name, p.tier, p.status, p.paid_until
                 from public.profiles p join auth.users u on u.id = p.id where p.id = member;
end;
$$;

-- ── Who can run what ─────────────────────────────────────────────────────
revoke all on function
  public.back_room_member, public.nickname_of, public.is_blocked_between, public.hidden_people,
  public.own_photo_paths, public.poll_results, public.member_profile, public.member_directory,
  public.in_conversation, public.other_member, public.start_conversation, public.mark_conversation_read,
  public.my_conversations, public.mark_notifications_read, public.admin_reports, public.resolve_report,
  public.admin_renewals, public.mark_renewal_reminded, public.admin_member_contact
from public, anon;
grant execute on function
  public.back_room_member, public.nickname_of, public.is_blocked_between, public.hidden_people,
  public.own_photo_paths, public.poll_results, public.member_profile, public.member_directory,
  public.in_conversation, public.other_member, public.start_conversation, public.mark_conversation_read,
  public.my_conversations, public.mark_notifications_read, public.admin_reports, public.resolve_report,
  public.admin_renewals, public.mark_renewal_reminded, public.admin_member_contact
to authenticated;
