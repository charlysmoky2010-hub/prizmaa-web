-- Move privileged reads out of the exposed public API schema.
-- The public RPC is SECURITY INVOKER and delegates to a non-exposed helper.
-- Keep the explicit auth.uid() + verified mutual-consent checks.
create or replace function prizmaa_internal.my_matches()
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
revoke all on function prizmaa_internal.my_matches() from public,anon;
grant execute on function prizmaa_internal.my_matches() to authenticated;

-- Retain API signature so future clients do not have to change.
create or replace function public.prizmaa_my_matches()
returns table(user_id uuid,display_name text,location_label text,bio text)
language sql stable security invoker set search_path=''
as $$
  select m.user_id,m.display_name,m.location_label,m.bio
  from prizmaa_internal.my_matches() m;
$$;
revoke all on function public.prizmaa_my_matches() from public,anon;
grant execute on function public.prizmaa_my_matches() to authenticated;
