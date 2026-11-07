-- PRIZMAA SAFE SELF-REPAIR REALITY GATE — READ ONLY
-- 1) The running SQL is real and protected:
SELECT
  has_function_privilege('anon','prizmaa_internal.govern_safe_repairs_v1(boolean)','EXECUTE') AS anon_can_repair,
  has_function_privilege('authenticated','prizmaa_internal.govern_safe_repairs_v1(boolean)','EXECUTE') AS member_can_repair;
-- 2) Examine actual observed production blockers, not fictional users:
SELECT r.run_id,r.recorded_at,r.context,r.detected,r.attempted,r.verified,r.reverted,r.blocked,
  e.fault_key,e.permitted_action,e.outcome,e.before_state,e.after_state
FROM prizmaa_internal.repair_governor_runs_v1 r
JOIN prizmaa_internal.repair_governor_evidence_v1 e USING(run_id)
ORDER BY r.run_id DESC,e.evidence_id DESC LIMIT 30;
-- 3) Separate *controlled canary* verification from real-world fixes:
SELECT context,sum(verified) AS verified,sum(reverted) AS rolled_back,sum(blocked) AS blocked,
  count(*) AS runs FROM prizmaa_internal.repair_governor_runs_v1 GROUP BY context;
-- 4) Confirm test fixture was restored to healthy:
SELECT state,force_verification_failure FROM prizmaa_internal.repair_canary_only_v1;
-- 5) Confirm there are no unearned live real-world repair successes:
SELECT count(*) FILTER(WHERE r.context='live' AND e.outcome='verified_repair') AS real_repairs_verified,
  count(*) FILTER(WHERE r.context='controlled_canary' AND e.outcome='verified_repair') AS canary_repairs_verified,
  count(*) FILTER(WHERE r.context='controlled_canary' AND e.outcome='rolled_back') AS test_rollbacks
FROM prizmaa_internal.repair_governor_runs_v1 r
JOIN prizmaa_internal.repair_governor_evidence_v1 e USING(run_id);
-- 6) Existing bounded hourly job; only its own schedule, no new jobs.
SELECT jobname,schedule,command,active FROM cron.job
WHERE jobname='prizmaa-operational-learner-hourly-v1';
