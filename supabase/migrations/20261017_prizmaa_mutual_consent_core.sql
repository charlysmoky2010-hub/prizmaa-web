-- PRIZMAA CONSENT CORE v1: no account registration, no mock users.
-- RLS protects social graphs and chats; messaging requires two explicit likes.
-- This is infrastructure, not an announcement that public social features are safe to launch.
create schema if not exists prizmaa_internal;
revoke all on schema prizmaa_internal from public;
grant usage on schema prizmaa_internal to authenticated;

create table public.prizmaa_blocks (
  blocker_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  blocked_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  constraint prizmaa_block_not_self check(blocker_id <> blocked_id)
);
create index prizmaa_blocks_blocked_id_idx on public.prizmaa_blocks(blocked_id);
alter table public.prizmaa_blocks enable row level security;
revoke all on public.prizmaa_blocks from public,anon,authenticated;
grant select,delete on public.prizmaa_blocks to authenticated;
grant insert (blocker_id,blocked_id) on public.prizmaa_blocks to authenticated;

create or replace function prizmaa_internal.approved_member(p_user uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.prizmaa_private_members m
  where m.user_id=p_user and m.membership_state='active' and m.adult_review_state='verified');
$$;
revoke all on function prizmaa_internal.approved_member(uuid) from public;
grant execute on function prizmaa_internal.approved_member(uuid) to authenticated;

create policy prizmaa_block_read_own on public.prizmaa_blocks
for select to authenticated using (blocker_id = (select auth.uid()));
create policy prizmaa_block_add_own on public.prizmaa_blocks
for insert to authenticated with check (
  blocker_id = (select auth.uid()) and
  prizmaa_internal.approved_member(blocker_id)
);
create policy prizmaa_block_remove_own on public.prizmaa_blocks
for delete to authenticated using (blocker_id = (select auth.uid()));

create table public.prizmaa_likes (
  from_user_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  to_user_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(from_user_id,to_user_id),
  constraint prizmaa_like_not_self check(from_user_id <> to_user_id)
);
create index prizmaa_likes_target_idx on public.prizmaa_likes(to_user_id);
alter table public.prizmaa_likes enable row level security;
revoke all on public.prizmaa_likes from public,anon,authenticated;
grant select,delete on public.prizmaa_likes to authenticated;
grant insert(from_user_id,to_user_id) on public.prizmaa_likes to authenticated;

create policy prizmaa_likes_view_sent on public.prizmaa_likes
for select to authenticated using (from_user_id=(select auth.uid()));
create policy prizmaa_likes_remove_sent on public.prizmaa_likes
for delete to authenticated using (from_user_id=(select auth.uid()));
create policy prizmaa_likes_add_approved_discoverable on public.prizmaa_likes
for insert to authenticated with check (
  from_user_id=(select auth.uid()) and
  prizmaa_internal.approved_member(from_user_id) and
  prizmaa_internal.approved_member(to_user_id) and
  exists(select 1 from public.prizmaa_private_profiles p where p.user_id=to_user_id and p.visible_in_discovery=true
    -- The target is normally hidden under self-only RLS. An explicit consent check below
    -- is provided through a SECURITY DEFINER function, not this subquery.
  )
);
-- Replace the insert policy to avoid RLS denying legitimate opt-in targets.
create or replace function prizmaa_internal.can_like(p_from uuid,p_to uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select p_from <> p_to and (select auth.uid())=p_from
   and prizmaa_internal.approved_member(p_from)
   and prizmaa_internal.approved_member(p_to)
   and exists(select 1 from public.prizmaa_private_profiles p where p.user_id=p_to and p.visible_in_discovery=true)
   and not exists(select 1 from public.prizmaa_blocks b
     where (b.blocker_id=p_from and b.blocked_id=p_to)
        or (b.blocker_id=p_to and b.blocked_id=p_from));
$$;
revoke all on function prizmaa_internal.can_like(uuid,uuid) from public;
grant execute on function prizmaa_internal.can_like(uuid,uuid) to authenticated;
drop policy prizmaa_likes_add_approved_discoverable on public.prizmaa_likes;
create policy prizmaa_likes_add_approved_discoverable on public.prizmaa_likes
for insert to authenticated with check (prizmaa_internal.can_like(from_user_id,to_user_id));

-- Blocking permanently dissolves both directions of likes; unblocking does not restore consent.
create or replace function prizmaa_internal.unlink_when_blocked()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  delete from public.prizmaa_likes
    where (from_user_id=new.blocker_id and to_user_id=new.blocked_id)
       or (from_user_id=new.blocked_id and to_user_id=new.blocker_id);
  return new;
end;
$$;
revoke all on function prizmaa_internal.unlink_when_blocked() from public;
create trigger prizmaa_unlink_on_block after insert on public.prizmaa_blocks
for each row execute function prizmaa_internal.unlink_when_blocked();

create or replace function prizmaa_internal.is_mutual(p_a uuid,p_b uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select p_a<>p_b and (select auth.uid()) in (p_a,p_b)
   and prizmaa_internal.approved_member(p_a) and prizmaa_internal.approved_member(p_b)
   and exists(select 1 from public.prizmaa_likes l where l.from_user_id=p_a and l.to_user_id=p_b)
   and exists(select 1 from public.prizmaa_likes l where l.from_user_id=p_b and l.to_user_id=p_a)
   and not exists(select 1 from public.prizmaa_blocks b
       where (b.blocker_id=p_a and b.blocked_id=p_b)
          or (b.blocker_id=p_b and b.blocked_id=p_a));
$$;
revoke all on function prizmaa_internal.is_mutual(uuid,uuid) from public;
grant execute on function prizmaa_internal.is_mutual(uuid,uuid) to authenticated;

create table public.prizmaa_messages (
  message_id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  recipient_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  body text not null check(char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint prizmaa_message_not_self check(sender_id<>recipient_id)
);
create index prizmaa_messages_thread_idx on public.prizmaa_messages(sender_id,recipient_id,created_at desc);
create index prizmaa_messages_received_idx on public.prizmaa_messages(recipient_id,created_at desc);
alter table public.prizmaa_messages enable row level security;
revoke all on public.prizmaa_messages from public,anon,authenticated;
grant select on public.prizmaa_messages to authenticated;
grant insert(sender_id,recipient_id,body) on public.prizmaa_messages to authenticated;

create or replace function prizmaa_internal.may_send(p_sender uuid,p_recipient uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select (select auth.uid())=p_sender and prizmaa_internal.is_mutual(p_sender,p_recipient)
    and (select count(*) from public.prizmaa_messages m
      where m.sender_id=p_sender and m.created_at > now()-interval '1 minute')<10;
$$;
revoke all on function prizmaa_internal.may_send(uuid,uuid) from public;
grant execute on function prizmaa_internal.may_send(uuid,uuid) to authenticated;
create policy prizmaa_message_view_mutual on public.prizmaa_messages
for select to authenticated using (
 (sender_id=(select auth.uid()) or recipient_id=(select auth.uid()))
 and prizmaa_internal.is_mutual(sender_id,recipient_id)
);
create policy prizmaa_message_send_mutual on public.prizmaa_messages
for insert to authenticated with check (
 sender_id=(select auth.uid()) and prizmaa_internal.may_send(sender_id,recipient_id)
);

create table public.prizmaa_reports (
  report_id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  reported_id uuid not null references public.prizmaa_private_members(user_id) on delete cascade,
  reason text not null check (reason in ('harassment','spam','fake_profile','unsafe_behavior','other')),
  details text not null default '' check (char_length(details)<=400),
  created_at timestamptz not null default now(),
  constraint prizmaa_report_not_self check(reporter_id<>reported_id)
);
create index prizmaa_reports_reporter_idx on public.prizmaa_reports(reporter_id,created_at desc);
alter table public.prizmaa_reports enable row level security;
revoke all on public.prizmaa_reports from public,anon,authenticated;
grant select on public.prizmaa_reports to authenticated;
grant insert(reporter_id,reported_id,reason,details) on public.prizmaa_reports to authenticated;
create policy prizmaa_reports_view_own on public.prizmaa_reports
for select to authenticated using (reporter_id=(select auth.uid()));
create policy prizmaa_reports_create_own on public.prizmaa_reports
for insert to authenticated with check (
 reporter_id=(select auth.uid()) and prizmaa_internal.approved_member(reporter_id)
);

-- Only matched, unblocked, approved participants may see one another's private profile.
-- This SECURITY DEFINER function checks the caller's UID; unapproved accounts get 0 rows.
create or replace function public.prizmaa_my_matches()
returns table(user_id uuid,display_name text,location_label text,bio text)
language sql stable security definer set search_path=''
as $$
  select p.user_id,p.display_name,p.location_label,p.bio
  from public.prizmaa_private_profiles p
  where prizmaa_internal.approved_member((select auth.uid()))
    and p.user_id<>(select auth.uid())
    and prizmaa_internal.is_mutual((select auth.uid()),p.user_id)
  order by p.user_id
  limit 100;
$$;
revoke all on function public.prizmaa_my_matches() from public,anon;
grant execute on function public.prizmaa_my_matches() to authenticated;

-- Intentionally absent: global discovery RPC, anonymous member listing, public signup,
-- media uploads, automated age verification claims, paid VIP privileges.
