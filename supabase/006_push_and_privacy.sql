-- AFTR. Community — update 6: notifications on the lock screen, and a report
-- category for sharing the club outside it. Run once in Supabase → SQL Editor →
-- New query → Run (after 005).
--
-- How lock-screen notifications work: when the app creates a notification, the
-- database tells the app's server (via pg_net), which sends it to the member's
-- phone. Lock-screen text is kept general unless the member chooses to show
-- names and previews, so nothing private shows on a locked phone by default.

-- ── New report category ──────────────────────────────────────────────────
alter table public.forum_reports drop constraint if exists forum_reports_category_check;
alter table public.forum_reports add constraint forum_reports_category_check
  check (category in ('privacy', 'harassment', 'hate', 'sexual', 'violence', 'self_harm',
                      'false_info', 'spam', 'ip', 'illegal_sales'));

-- ── Phones that have turned on notifications ─────────────────────────────
create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  previews boolean not null default false,  -- show names and message text on the lock screen
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "own phones" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy "remove own phones" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
grant select, delete on public.push_subscriptions to authenticated;

-- Save this phone for the signed-in member (replaces it if someone else used this phone before)
create function public.save_push_subscription(endpoint_url text, key_p256dh text, key_auth text, show_previews boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  delete from public.push_subscriptions where endpoint = endpoint_url;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, previews)
  values (auth.uid(), endpoint_url, key_p256dh, key_auth, coalesce(show_previews, false));
end;
$$;
revoke all on function public.save_push_subscription from public, anon;
grant execute on function public.save_push_subscription to authenticated;

-- ── A private key shared between the database and the app's server ───────
-- Nobody can read this table through the app; only the functions below use it.
create table public.app_secrets (name text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from public, anon, authenticated;
insert into public.app_secrets (name, value)
values ('push_key', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

-- What to send for one notification (only with the key the database itself sent)
create function public.push_payload(note bigint, key text)
returns table (endpoint text, p256dh text, auth text, previews boolean, kind text, actor_name text,
               title text, excerpt text, thread_id bigint, conversation_id bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if key is distinct from (select value from public.app_secrets where name = 'push_key') then
    raise exception 'Not allowed';
  end if;
  return query
    select s.endpoint, s.p256dh, s.auth, s.previews, n.kind, n.actor_name, n.title, n.excerpt, n.thread_id, n.conversation_id
      from public.notifications n
      join public.push_subscriptions s on s.user_id = n.user_id
     where n.id = note;
end;
$$;

-- Forget a phone that has switched notifications off or no longer exists
create function public.push_forget(endpoint text, key text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if key is distinct from (select value from public.app_secrets where name = 'push_key') then
    raise exception 'Not allowed';
  end if;
  delete from public.push_subscriptions s where s.endpoint = push_forget.endpoint;
end;
$$;
revoke all on function public.push_payload, public.push_forget from public;
grant execute on function public.push_payload, public.push_forget to anon, authenticated;

-- ── Send each new notification to the member's phones ────────────────────
create extension if not exists pg_net;

create function public.push_on_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.push_subscriptions where user_id = new.user_id) then
    begin
      perform net.http_post(
        url := 'https://aftr-app-opal.vercel.app/api/push',
        body := jsonb_build_object('id', new.id, 'key', (select value from public.app_secrets where name = 'push_key')),
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    exception when others then
      -- Never let a phone notification problem stop the notification itself
      null;
    end;
  end if;
  return null;
end;
$$;
create trigger notifications_push after insert on public.notifications
  for each row execute function public.push_on_notification();

-- Report outcomes now mention the policy by name
create or replace function public.resolve_report(report bigint, decision text default 'kept') returns void
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
  values (r.reporter_id, 'report_outcome', 'The AFTR. team', decision,
          case decision
            when 'removed' then 'Thanks for your report. We reviewed it and removed it for breaking the AFTR. Safer Spaces Policy.'
            else 'Thanks for your report. We reviewed it and decided it doesn''t break the AFTR. Safer Spaces Policy, so it stays up. You can still mute or block the person.'
          end);
end;
$$;
