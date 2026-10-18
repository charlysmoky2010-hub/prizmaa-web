-- PRIZMAA consent/chat regression. Only synthetic UUIDs.
-- Reverts ALL fixture identities, likes, chats, blocks and reports at ROLLBACK.
BEGIN;
INSERT INTO auth.users(id,instance_id,aud,role,email,raw_app_meta_data,created_at,updated_at)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prizmaa-fixture-a@invalid.example','{"provider":"email","providers":["email"]}',now(),now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prizmaa-fixture-b@invalid.example','{"provider":"email","providers":["email"]}',now(),now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prizmaa-fixture-c@invalid.example','{"provider":"email","providers":["email"]}',now(),now());
-- Synthetic pre-approved fixtures are NOT age verification or real accounts.
INSERT INTO public.prizmaa_private_members(user_id,membership_state,adult_review_state)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active','verified'),
       ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','active','verified'),
       ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','invited','pending');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
INSERT INTO public.prizmaa_private_profiles(user_id,display_name,visible_in_discovery)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fixture A',true);
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
INSERT INTO public.prizmaa_private_profiles(user_id,display_name,visible_in_discovery)
VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fixture B',true);

-- A's single like must not grant permission to chat or view a match.
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
INSERT INTO public.prizmaa_likes(from_user_id,to_user_id)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
DO $test$
DECLARE sent boolean :=false;
BEGIN
 IF EXISTS(SELECT 1 FROM public.prizmaa_my_matches()) THEN
   RAISE EXCEPTION 'FAIL: unilateral like exposed match';
 END IF;
 BEGIN
   INSERT INTO public.prizmaa_messages(sender_id,recipient_id,body)
   VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Unwanted message');
   sent := true;
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 IF sent THEN RAISE EXCEPTION 'FAIL: unilateral like allowed chat'; END IF;
END $test$;

-- Mutual, explicit likes create an ephemeral computed match, never a fake public record.
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
INSERT INTO public.prizmaa_likes(from_user_id,to_user_id)
VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.prizmaa_my_matches()
     WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>1 THEN
  RAISE EXCEPTION 'FAIL: mutual like not visible as match';
 END IF;
END $test$;

-- Both participants can communicate. An unapproved third account cannot.
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
INSERT INTO public.prizmaa_messages(sender_id,recipient_id,body)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Consent-based hello');
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.prizmaa_messages
     WHERE body='Consent-based hello')<>1 THEN
   RAISE EXCEPTION 'FAIL: recipient cannot see mutual chat';
 END IF;
END $test$;
INSERT INTO public.prizmaa_reports(reporter_id,reported_id,reason,details)
VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','spam','Synthetic report');

SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $test$
DECLARE liked boolean := false;
BEGIN
 IF EXISTS(SELECT 1 FROM public.prizmaa_messages) THEN
    RAISE EXCEPTION 'FAIL: pending third user can read messages';
 END IF;
 IF EXISTS(SELECT 1 FROM public.prizmaa_my_matches()) THEN
    RAISE EXCEPTION 'FAIL: pending user sees matches';
 END IF;
 BEGIN
  INSERT INTO public.prizmaa_likes(from_user_id,to_user_id)
  VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  liked := true;
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 IF liked THEN RAISE EXCEPTION 'FAIL: pending user could like'; END IF;
END $test$;

-- A cannot view B's reports, despite being the reported user.
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
DO $test$
BEGIN
 IF EXISTS(SELECT 1 FROM public.prizmaa_reports) THEN
    RAISE EXCEPTION 'FAIL: reported member sees reporter';
 END IF;
END $test$;

-- Blocking dissolves BOTH consents. Unblocking must not recreate the match.
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
INSERT INTO public.prizmaa_blocks(blocker_id,blocked_id)
VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
DO $test$
BEGIN
 IF EXISTS(SELECT 1 FROM public.prizmaa_my_matches()) THEN
    RAISE EXCEPTION 'FAIL: blocked match persists';
 END IF;
 IF EXISTS(SELECT 1 FROM public.prizmaa_messages) THEN
    RAISE EXCEPTION 'FAIL: blocked chat visible';
 END IF;
END $test$;
DELETE FROM public.prizmaa_blocks
WHERE blocker_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' AND blocked_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DO $test$
BEGIN
 IF EXISTS(SELECT 1 FROM public.prizmaa_my_matches()) THEN
    RAISE EXCEPTION 'FAIL: unblocking resurrected consent';
 END IF;
END $test$;

SELECT 'PASS' AS consent_and_chat,
  (SELECT count(*) FROM public.prizmaa_likes) AS remaining_likes_after_block,
  (SELECT count(*) FROM public.prizmaa_my_matches()) AS remaining_matches_after_unblock,
  (SELECT count(*) FROM public.prizmaa_reports) AS own_report_access,
  (SELECT count(*) FROM public.prizmaa_messages) AS hidden_unmatched_chats;
ROLLBACK;
