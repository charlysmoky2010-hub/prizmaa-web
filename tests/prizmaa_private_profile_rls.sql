-- PRIZMAA private membership RLS regression (transaction-only).
-- Run with SQL-editor owner privileges in an explicitly authorized test environment.
-- Synthetic identities are never real members and are ALWAYS rolled back.
-- This tests PostgreSQL policies, NOT Supabase Auth password login or adult verification.
-- Do not use actual member identity or credentials in this file.
BEGIN;

INSERT INTO auth.users (id,instance_id,aud,role,email,raw_app_meta_data,created_at,updated_at)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prizmaa-fixture-a@invalid.example','{"provider":"email","providers":["email"]}',now(),now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prizmaa-fixture-b@invalid.example','{"provider":"email","providers":["email"]}',now(),now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prizmaa-fixture-c@invalid.example','{"provider":"email","providers":["email"]}',now(),now());

-- States below simulate preapproved testing fixtures. No actual adult check is implied.
INSERT INTO public.prizmaa_private_members (user_id,membership_state,adult_review_state)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','verified'),
       ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','active','verified'),
       ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','invited','pending');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
INSERT INTO public.prizmaa_private_profiles (user_id,display_name,bio)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test A','Initial');
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.prizmaa_private_profiles
    WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND visible_in_discovery=false)<>1
 THEN RAISE EXCEPTION 'FAIL: profile not private by default'; END IF;
END $test$;
UPDATE public.prizmaa_private_profiles SET bio='Owner updated'
WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
INSERT INTO public.prizmaa_private_profiles (user_id,display_name,visible_in_discovery)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Test B',true);
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.prizmaa_private_profiles
     WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>0
 THEN RAISE EXCEPTION 'FAIL: B can read A'; END IF;
END $test$;

SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $test$
BEGIN
 BEGIN
  INSERT INTO public.prizmaa_private_profiles(user_id,display_name)
  VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Test C');
  RAISE EXCEPTION 'FAIL: pending invite created a profile';
 EXCEPTION
   WHEN insufficient_privilege THEN NULL;
 END;
END $test$;

SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.prizmaa_private_profiles WHERE user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')<>0
 THEN RAISE EXCEPTION 'FAIL: A can see opted-in B without discovery policy'; END IF;
 IF (SELECT count(*) FROM public.prizmaa_private_profiles
  WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND bio='Owner updated')<>1
 THEN RAISE EXCEPTION 'FAIL: own update not persisted'; END IF;
END $test$;
WITH cross_account AS (
 UPDATE public.prizmaa_private_profiles SET bio='Unauthorized'
 WHERE user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' RETURNING user_id
)
SELECT CASE WHEN (SELECT count(*) FROM cross_account)=0 THEN 'PASS' ELSE 'FAIL' END AS denied_cross_account_update,
       (SELECT count(*) FROM public.prizmaa_private_profiles
        WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND bio='Owner updated') AS own_updated_rows,
       (SELECT count(*) FROM public.prizmaa_private_profiles WHERE user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') AS visible_other_rows;

ROLLBACK;
-- All synthetic rows are removed by the rollback.
