-- PRIZMAA REALITY GATE / reproducible proof, read-only.
-- Run this in the project's Supabase SQL editor.
-- A row only proves a corresponding database fact; NOT a self-improving AGI or a public social site.
SELECT
  (SELECT count(*)::integer FROM auth.users) AS real_auth_users,
  (SELECT count(*)::integer FROM public.prizmaa_private_members) AS real_members,
  (SELECT count(*)::integer FROM public.prizmaa_messages) AS real_messages,
  (SELECT count(*)::integer FROM public.prizmaa_product_feedback) AS real_optin_feedback,
  (SELECT count(*)::integer FROM prizmaa_internal.online_forecast_proofs_v1) AS non_personal_forecast_proof_rows,
  (SELECT coalesce(sum(verified_promotions),0)::integer FROM prizmaa_internal.online_forecast_state_v1) AS verified_forecast_promotions;

-- Actual prequential forecasts. Prior predictions must exist independently of a reading.
SELECT observation_id,observed_at,metric,observed_value,
       prior_persistence,prior_ewma_slow,prior_ewma_fast,
       baseline_absolute_error,slow_absolute_error,fast_absolute_error,
       evidence_count,selection_after,verdict
FROM prizmaa_internal.online_forecast_proofs_v1
WHERE metric='database_commits_per_minute'
ORDER BY observation_id DESC LIMIT 10;

-- Is evidence strong enough to switch? No promotion until separate holdout wins.
SELECT metric,observations,compared,selected_model,candidate_model,
       round(persistence_total_abs_error::numeric,3) AS cumulative_baseline_error,
       round(fast_total_abs_error::numeric,3) AS cumulative_fast_error,
       round(slow_total_abs_error::numeric,3) AS cumulative_slow_error,
       holdout_samples,verified_promotions,rollbacks,next_forecast
FROM prizmaa_internal.online_forecast_state_v1 ORDER BY metric;

-- Verify the actual autonomous cron runner's logs, not just its configuration.
SELECT j.jobname,j.active,j.schedule,j.command,
 (SELECT count(*)::integer FROM cron.job_run_details d WHERE d.jobid=j.jobid AND d.status='succeeded') AS succeeded_runs,
 (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid=j.jobid AND d.status='succeeded') AS last_success
FROM cron.job j WHERE j.jobname='prizmaa-operational-learner-hourly-v1';

-- Can public roles execute the private algorithm? Both should be false.
SELECT
 has_function_privilege('anon','prizmaa_internal.evaluate_online_forecaster_v1()','EXECUTE') AS anon_can_retrain,
 has_function_privilege('authenticated','prizmaa_internal.evaluate_online_forecaster_v1()','EXECUTE') AS member_can_retrain;
