-- PRIZMAA FOUNDER TRUST CORE v1
-- CLEAN-ROOM schema: deploy ONLY to a NEW dedicated Supabase project.
-- Not applied to existing titanius-spinoza or any customer database.
-- Before activation: disable open signup; configure invitation-only Supabase Auth;
-- set short JWT lifetime; review GDPR notices, DPA, moderation and age assurance.
BEGIN;

CREATE TABLE public.prizmaa_private_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'tester'
    CHECK (member_role IN ('founder','tester')),
  membership_state text NOT NULL DEFAULT 'invited'
    CHECK (membership_state IN ('invited','active','suspended')),
  adult_review_state text NOT NULL DEFAULT 'pending'
    CHECK (adult_review_state IN ('pending','verified','rejected')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  CHECK (membership_state <> 'active' OR adult_review_state = 'verified')
);

CREATE TABLE public.prizmaa_private_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.prizmaa_private_members(user_id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 36),
  location_label text NOT NULL DEFAULT '' CHECK (char_length(location_label) <= 44),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 400),
  visible_in_discovery boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- This is a privacy-first founder account, NOT yet a discovery or messaging service.
-- "visible_in_discovery" is deliberately not associated with any public policy.
-- Platform personnel must never auto-create profiles from old system data.
ALTER TABLE public.prizmaa_private_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizmaa_private_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizmaa_private_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.prizmaa_private_profiles FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.prizmaa_private_members FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.prizmaa_private_profiles FROM PUBLIC, anon, authenticated;

-- Both rows remain owner-only; role/status are server-controlled and immutable to clients.
GRANT SELECT ON TABLE public.prizmaa_private_members TO authenticated;
CREATE POLICY private_member_read_self ON public.prizmaa_private_members
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prizmaa_private_profiles TO authenticated;
CREATE POLICY private_profile_read_self ON public.prizmaa_private_profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY private_profile_insert_self ON public.prizmaa_private_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.prizmaa_private_members m
      WHERE m.user_id = (select auth.uid())
        AND m.membership_state = 'active'
        AND m.adult_review_state = 'verified'
    )
  );

CREATE POLICY private_profile_update_self ON public.prizmaa_private_profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.prizmaa_private_members m
      WHERE m.user_id = (select auth.uid())
        AND m.membership_state = 'active'
        AND m.adult_review_state = 'verified'
    )
  );

-- Privacy deletion remains possible even if the membership is suspended.
CREATE POLICY private_profile_delete_self ON public.prizmaa_private_profiles
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

COMMENT ON TABLE public.prizmaa_private_members IS 'Invite-only; membership and adult-review status are never writable by public clients.';
COMMENT ON TABLE public.prizmaa_private_profiles IS 'Private by default; no cross-user discovery access, no identity photographs, no coordinates or sexual orientation fields.';

COMMIT;
