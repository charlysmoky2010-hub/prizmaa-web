-- PRIZMAA META v1 — REALITY GATE, READ-ONLY.
-- Re-run in Supabase SQL Editor. Claims are based on current real project evidence.
-- No mock users and no artificial data. SQL does NOT assert subjective consciousness.

SELECT claim_key,verdict,evidence_source,explanation,evidence,transitions,checked_at
FROM prizmaa_internal.self_claim_state_v1 ORDER BY claim_key;

-- Shows independent history for introspection and its second-order evaluator.
SELECT id,audited_at,claim_count,supported_count,refuted_count,unknown_count,
       meta_guard,provenance
FROM prizmaa_internal.self_audit_rounds_v1 ORDER BY id DESC LIMIT 10;

-- Meta-level fail-closed assertions: all known-true claims must have observable data.
SELECT
  count(*)::integer AS total_claims,
  count(*) FILTER(WHERE verdict='supported')::integer AS supported,
  count(*) FILTER(WHERE verdict='refuted')::integer AS refuted,
  count(*) FILTER(WHERE verdict='unknown')::integer AS unknown,
  count(*) FILTER(WHERE verdict='supported' AND evidence_source NOT IN
     ('live_database','job_execution_log'))::integer AS unwarranted_positive_claims,
  count(*) FILTER(WHERE claim_key='subjective_consciousness_verified' AND verdict='supported')::integer AS fabricated_consciousness_claims,
  count(*) FILTER(WHERE claim_key='public_web_reachability_verified' AND verdict='supported')::integer AS unverified_web_success_claims
FROM prizmaa_internal.self_claim_state_v1;

-- Raw noninvented counterfacts.
SELECT
 (SELECT count(*)::integer FROM auth.users) AS users,
 (SELECT count(*)::integer FROM public.prizmaa_private_members WHERE membership_state='active' AND adult_review_state='verified') AS approved_members,
 (SELECT count(*)::integer FROM public.prizmaa_messages) AS messages,
 (SELECT count(*)::integer FROM public.prizmaa_product_feedback) AS feedback,
 (SELECT count(*)::integer FROM prizmaa_internal.online_forecast_proofs_v1 WHERE prior_persistence IS NOT NULL) AS real_prior_predictions,
 (SELECT coalesce(sum(verified_promotions),0)::integer FROM prizmaa_internal.online_forecast_state_v1) AS verified_model_improvements;

-- The SAME hourly job executes sensor, forecasting, self-claims and meta-guard.
SELECT j.jobid,j.jobname,j.active,j.command,
 (SELECT count(*)::integer FROM cron.job_run_details r
  WHERE r.jobid=j.jobid AND r.status='succeeded') AS successful_autonomous_runs
FROM cron.job j WHERE j.jobname='prizmaa-operational-learner-hourly-v1';

-- No anonymous/user permission to invoke private metacognitive function.
SELECT
 has_function_privilege('anon','prizmaa_internal.audit_self_model_v1()','EXECUTE') AS anon_allowed,
 has_function_privilege('authenticated','prizmaa_internal.audit_self_model_v1()','EXECUTE') AS normal_member_allowed;
