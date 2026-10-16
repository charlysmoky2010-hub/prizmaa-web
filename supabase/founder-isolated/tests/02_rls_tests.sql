-- RLS integration tests run as a real unprivileged PostgreSQL role.
-- The two UUIDs below are not real people; they are synthetic test subjects.
\set ON_ERROR_STOP on

INSERT INTO auth.users(id) VALUES
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222');
INSERT INTO public.prizmaa_private_members
 (user_id,member_role,membership_state,adult_review_state)
VALUES
('11111111-1111-4111-8111-111111111111','founder','active','verified'),
('22222222-2222-4222-8222-222222222222','tester','active','verified');
INSERT INTO public.prizmaa_private_profiles(user_id,display_name,visible_in_discovery)
 VALUES('22222222-2222-4222-8222-222222222222','Synthetic Beta',true);

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

DO $test$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.prizmaa_private_members;
  IF n != 1 THEN RAISE EXCEPTION 'SECURITY FAIL: private member list leaked % rows',n; END IF;
  SELECT count(*) INTO n FROM public.prizmaa_private_profiles;
  IF n != 0 THEN RAISE EXCEPTION 'SECURITY FAIL: other profile leaked % rows',n; END IF;
  RAISE NOTICE 'PASS: authenticated account cannot read another member or profile';
END $test$;

INSERT INTO public.prizmaa_private_profiles(user_id,display_name)
 VALUES('11111111-1111-4111-8111-111111111111','Synthetic Founder');
DO $test$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.prizmaa_private_profiles WHERE visible_in_discovery=true;
  IF n != 0 THEN RAISE EXCEPTION 'SECURITY FAIL: someone else visible in discovery'; END IF;
  SELECT count(*) INTO n FROM public.prizmaa_private_profiles WHERE visible_in_discovery=false;
  IF n != 1 THEN RAISE EXCEPTION 'SECURITY FAIL: founder default visibility not private'; END IF;
  RAISE NOTICE 'PASS: own new profile is private by default';
END $test$;

DO $test$
BEGIN
  BEGIN
    INSERT INTO public.prizmaa_private_profiles(user_id,display_name)
      VALUES ('22222222-2222-4222-8222-222222222222','Imposter');
    RAISE EXCEPTION 'SECURITY FAIL: inserted another user profile';
  EXCEPTION WHEN insufficient_privilege OR unique_violation THEN
    RAISE NOTICE 'PASS: cannot create or replace another account profile';
  END;
END $test$;

DO $test$
DECLARE changed int;
BEGIN
  DELETE FROM public.prizmaa_private_profiles
    WHERE user_id='22222222-2222-4222-8222-222222222222';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed != 0 THEN RAISE EXCEPTION 'SECURITY FAIL: deleted another user profile'; END IF;
  RAISE NOTICE 'PASS: another person cannot delete someone else profile';
END $test$;

DO $test$
BEGIN
  BEGIN
    UPDATE public.prizmaa_private_members SET member_role='founder'
      WHERE user_id='22222222-2222-4222-8222-222222222222';
    RAISE EXCEPTION 'SECURITY FAIL: client has membership edit rights';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: clients cannot change server-owned access roles';
  END;
END $test$;

-- Updating ownership must not turn one user's record into someone else's record.
DO $test$
BEGIN
  BEGIN
    UPDATE public.prizmaa_private_profiles
      SET user_id='22222222-2222-4222-8222-222222222222'
      WHERE user_id='11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'SECURITY FAIL: profile ownership reassignment';
  EXCEPTION WHEN insufficient_privilege OR unique_violation THEN
    RAISE NOTICE 'PASS: ownership reassignment rejected';
  END;
END $test$;

RESET ROLE;
UPDATE public.prizmaa_private_members SET membership_state='suspended'
WHERE user_id='11111111-1111-4111-8111-111111111111';
SET ROLE authenticated;
DO $test$
BEGIN
  BEGIN
    UPDATE public.prizmaa_private_profiles SET bio='This should fail'
      WHERE user_id='11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'SECURITY FAIL: suspended member updated their profile';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: suspended member cannot update profile';
  END;
END $test$;

-- A suspended member must retain the ability to delete their own profile.
DELETE FROM public.prizmaa_private_profiles
WHERE user_id='11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.prizmaa_private_profiles;
  IF n != 0 THEN RAISE EXCEPTION 'SECURITY FAIL: suspended member cannot remove own profile'; END IF;
  RAISE NOTICE 'PASS: suspended member can delete own profile';
END $test$;
RESET ROLE;

-- Auth deletion must cascade across the private membership and profile.
DELETE FROM auth.users WHERE id='22222222-2222-4222-8222-222222222222';
DO $test$
DECLARE a int; b int;
BEGIN
  SELECT count(*) INTO a FROM public.prizmaa_private_members WHERE user_id='22222222-2222-4222-8222-222222222222';
  SELECT count(*) INTO b FROM public.prizmaa_private_profiles WHERE user_id='22222222-2222-4222-8222-222222222222';
  IF a != 0 OR b != 0 THEN RAISE EXCEPTION 'SECURITY FAIL: auth user deletion left data behind'; END IF;
  RAISE NOTICE 'PASS: account deletion cascades through member and profile';
END $test$;
