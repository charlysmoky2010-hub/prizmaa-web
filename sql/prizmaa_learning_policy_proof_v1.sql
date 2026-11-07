-- Read-only reproducible proof against the deployed policy in Supabase SQL Editor.
-- Uses hypothetical aggregate values only: inserts NO members or ratings.
WITH scenarios(name,area,events,members,smoothed,expected) AS (
 VALUES
 ('no users','privacy',0,0,3.0,'insufficient_evidence'),
 ('one actor, 100 reports','privacy',100,1,1.0,'insufficient_evidence'),
 ('nine distinct','onboarding',9,9,1.0,'insufficient_evidence'),
 ('ten poor','accessibility',10,10,2.70,'human_review'),
 ('twelve medium','reliability',12,12,3.10,'watch'),
 ('fifteen positive','profile',15,15,4.2,'healthy'),
 ('severe privacy','privacy',50,24,1.7,'human_review'),
 ('healthy navigation','navigation',30,18,4.0,'healthy')
), verdicts AS(
 SELECT scenarios.*,
   prizmaa_internal.product_learning_policy_v1(area,events,members,smoothed) AS result
 FROM scenarios
)
SELECT name,expected,result->>'decision' AS observed,
       (result->>'decision'=expected AND result->>'automatic_code_changes'='false') AS passed,
       result->>'proposed_change' AS suggested_change
FROM verdicts;
-- Live snapshot, no simulated data:
SELECT (SELECT count(*) FROM auth.users) AS real_users,
       (SELECT count(*) FROM public.prizmaa_product_feedback) AS real_feedback,
       (SELECT count(*) FROM prizmaa_internal.product_learning_decisions_v1
        WHERE decision->>'review_required'='true') AS proposed_reviews;
