-- PRIZMAA ONLINE FORECASTER v1 — actual deployed PostgreSQL functions, exported 2026-10-23
-- Real project observations ONLY. No synthetic participants, no personal user content.
-- The online learner evaluates prior forecasts against subsequent real readings.
-- A new expert requires eight prior comparisons + 15% improvement to start its
-- prospective three-reading holdout. Promotion requires >10% holdout improvement.
-- Any promoted expert is automatically rolled back after three material errors.
-- No automatic source code mutation, member profiling or public SQL execution.
-- DEPENDENCY: sql/prizmaa_operational_learner_v1.sql.

-- Schema snapshot: private application schema, exact same table columns as production.
-- Running on an existing database does not overwrite learned state.
CREATE TABLE IF NOT EXISTS prizmaa_internal.online_forecast_state_v1(
  metric text PRIMARY KEY REFERENCES prizmaa_internal.operational_model_v1(metric),
  last_observation_id bigint NOT NULL DEFAULT 0,
  observations integer NOT NULL DEFAULT 0,
  compared integer NOT NULL DEFAULT 0,
  last_value double precision,
  ewma_slow double precision,
  ewma_fast double precision,
  persistence_total_abs_error double precision NOT NULL DEFAULT 0,
  slow_total_abs_error double precision NOT NULL DEFAULT 0,
  fast_total_abs_error double precision NOT NULL DEFAULT 0,
  selected_model text NOT NULL DEFAULT 'persistence' CHECK(selected_model IN('persistence','ewma_slow','ewma_fast')),
  candidate_model text CHECK(candidate_model IN('ewma_slow','ewma_fast')),
  holdout_samples integer NOT NULL DEFAULT 0,
  holdout_baseline_loss double precision NOT NULL DEFAULT 0,
  holdout_candidate_loss double precision NOT NULL DEFAULT 0,
  consecutive_regressions integer NOT NULL DEFAULT 0,
  rejected_until_comparison integer NOT NULL DEFAULT 0,
  verified_promotions integer NOT NULL DEFAULT 0,
  rollbacks integer NOT NULL DEFAULT 0,
  next_forecast double precision,
  updated_at timestamptz
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.online_forecast_proofs_v1(
  observation_id bigint PRIMARY KEY,
  metric text NOT NULL REFERENCES prizmaa_internal.operational_model_v1(metric),
  observed_at timestamptz NOT NULL,
  observed_value double precision NOT NULL,
  prior_persistence double precision,
  prior_ewma_slow double precision,
  prior_ewma_fast double precision,
  baseline_absolute_error double precision,
  slow_absolute_error double precision,
  fast_absolute_error double precision,
  selection_after text NOT NULL,
  evidence_count integer NOT NULL,
  verdict text NOT NULL CHECK(verdict IN('baseline','candidate_started','candidate_evaluating','promoted_on_holdout','candidate_rejected','promoted_active','rolled_back')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS prizmaa_online_proofs_at_v1 ON prizmaa_internal.online_forecast_proofs_v1(created_at DESC);
REVOKE ALL ON prizmaa_internal.online_forecast_state_v1 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON prizmaa_internal.online_forecast_proofs_v1 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION prizmaa_internal.evaluate_online_forecaster_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  sample record;
  st prizmaa_internal.online_forecast_state_v1%ROWTYPE;
  loss_p double precision;
  loss_s double precision;
  loss_f double precision;
  loss_candidate double precision;
  prior_p double precision;
  prior_s double precision;
  prior_f double precision;
  candidate text;
  outcome text;
  n_processed integer := 0;
  n_promoted integer := 0;
  n_rejected integer := 0;
  n_rollback integer := 0;
  n_gated integer := 0;
BEGIN
  -- Concurrency gate: prevent two learning cycles scoring the same sample.
  IF NOT pg_catalog.pg_try_advisory_xact_lock(721991083) THEN
    RETURN pg_catalog.jsonb_build_object('status','busy','processed',0);
  END IF;
  FOR sample IN
    SELECT o.id,o.metric,o.value,o.recorded_at
    FROM prizmaa_internal.operational_observations_v1 o
    WHERE o.value IS NOT NULL
      AND o.metric IN ('database_commits_per_minute','database_deadlocks_per_minute',
        'auth_users','approved_members','feedback_events')
      AND o.id > coalesce((SELECT x.last_observation_id
        FROM prizmaa_internal.online_forecast_state_v1 x
        WHERE x.metric=o.metric),0)
    ORDER BY o.id
  LOOP
    INSERT INTO prizmaa_internal.online_forecast_state_v1(metric)
      VALUES(sample.metric) ON CONFLICT(metric) DO NOTHING;
    SELECT * INTO st FROM prizmaa_internal.online_forecast_state_v1
      WHERE metric=sample.metric FOR UPDATE;
    outcome:='baseline';
    loss_p:=NULL;loss_s:=NULL;loss_f:=NULL;
    prior_p:=st.last_value;prior_s:=st.ewma_slow;prior_f:=st.ewma_fast;
    IF st.observations = 0 THEN
      st.last_value:=sample.value;
      st.ewma_slow:=sample.value;
      st.ewma_fast:=sample.value;
      st.next_forecast:=sample.value;
      st.observations:=1;
    ELSE
      loss_p:=abs(sample.value-st.last_value);
      loss_s:=abs(sample.value-st.ewma_slow);
      loss_f:=abs(sample.value-st.ewma_fast);
      st.persistence_total_abs_error:=st.persistence_total_abs_error+loss_p;
      st.slow_total_abs_error:=st.slow_total_abs_error+loss_s;
      st.fast_total_abs_error:=st.fast_total_abs_error+loss_f;
      st.compared:=st.compared+1;
      st.observations:=st.observations+1;

      -- Evaluate candidate only on subsequent, genuinely unseen measurements.
      IF st.candidate_model IS NOT NULL THEN
        loss_candidate:=CASE st.candidate_model
          WHEN 'ewma_slow' THEN loss_s ELSE loss_f END;
        st.holdout_samples:=st.holdout_samples+1;
        st.holdout_baseline_loss:=st.holdout_baseline_loss+loss_p;
        st.holdout_candidate_loss:=st.holdout_candidate_loss+loss_candidate;
        outcome:='candidate_evaluating';
        IF st.holdout_samples>=3 THEN
          IF st.holdout_baseline_loss>0 AND
            st.holdout_candidate_loss < 0.90*st.holdout_baseline_loss THEN
            st.selected_model:=st.candidate_model;
            st.verified_promotions:=st.verified_promotions+1;
            n_promoted:=n_promoted+1;
            outcome:='promoted_on_holdout';
          ELSE
            st.selected_model:='persistence';
            st.rejected_until_comparison:=st.compared+10;
            n_rejected:=n_rejected+1;
            outcome:='candidate_rejected';
          END IF;
          st.candidate_model:=NULL;
          st.holdout_samples:=0;
          st.holdout_baseline_loss:=0;
          st.holdout_candidate_loss:=0;
        END IF;
      ELSIF st.selected_model<>'persistence' THEN
        -- Rolling safety rollback if selected forecast loses to persistence 3 times.
        loss_candidate:=CASE st.selected_model
          WHEN 'ewma_slow' THEN loss_s ELSE loss_f END;
        IF loss_candidate > loss_p*1.10+0.000001 THEN
          st.consecutive_regressions:=st.consecutive_regressions+1;
        ELSE
          st.consecutive_regressions:=0;
        END IF;
        outcome:='promoted_active';
        IF st.consecutive_regressions >= 3 THEN
          st.selected_model:='persistence';
          st.rollbacks:=st.rollbacks+1;
          st.rejected_until_comparison:=st.compared+10;
          st.consecutive_regressions:=0;
          outcome:='rolled_back';
          n_rollback:=n_rollback+1;
        END IF;
      ELSIF st.compared>=8 AND st.compared>=st.rejected_until_comparison
        AND st.persistence_total_abs_error>0 THEN
        candidate:=NULL;
        IF st.slow_total_abs_error < 0.85*st.persistence_total_abs_error AND
          st.slow_total_abs_error<=st.fast_total_abs_error THEN
          candidate:='ewma_slow';
        ELSIF st.fast_total_abs_error < 0.85*st.persistence_total_abs_error THEN
          candidate:='ewma_fast';
        END IF;
        IF candidate IS NOT NULL THEN
          st.candidate_model:=candidate;
          st.holdout_samples:=0;
          st.holdout_baseline_loss:=0;
          st.holdout_candidate_loss:=0;
          outcome:='candidate_started';
          n_gated:=n_gated+1;
        END IF;
      END IF;
      st.ewma_slow:=0.20*sample.value+0.80*st.ewma_slow;
      st.ewma_fast:=0.70*sample.value+0.30*st.ewma_fast;
      st.last_value:=sample.value;
      st.next_forecast:=CASE st.selected_model
        WHEN 'ewma_slow' THEN st.ewma_slow
        WHEN 'ewma_fast' THEN st.ewma_fast
        ELSE st.last_value END;
    END IF;
    INSERT INTO prizmaa_internal.online_forecast_proofs_v1(
      observation_id,metric,observed_at,observed_value,
      prior_persistence,prior_ewma_slow,prior_ewma_fast,
      baseline_absolute_error,slow_absolute_error,fast_absolute_error,
      selection_after,evidence_count,verdict)
    VALUES(sample.id,sample.metric,sample.recorded_at,sample.value,
      prior_p,prior_s,prior_f,
      loss_p,loss_s,loss_f,
      st.selected_model,st.compared,outcome);
    st.last_observation_id:=sample.id;
    st.updated_at:=clock_timestamp();
    UPDATE prizmaa_internal.online_forecast_state_v1 SET
      last_observation_id=st.last_observation_id,
      observations=st.observations,
      compared=st.compared,
      last_value=st.last_value,
      ewma_slow=st.ewma_slow,
      ewma_fast=st.ewma_fast,
      persistence_total_abs_error=st.persistence_total_abs_error,
      slow_total_abs_error=st.slow_total_abs_error,
      fast_total_abs_error=st.fast_total_abs_error,
      selected_model=st.selected_model,
      candidate_model=st.candidate_model,
      holdout_samples=st.holdout_samples,
      holdout_baseline_loss=st.holdout_baseline_loss,
      holdout_candidate_loss=st.holdout_candidate_loss,
      consecutive_regressions=st.consecutive_regressions,
      rejected_until_comparison=st.rejected_until_comparison,
      verified_promotions=st.verified_promotions,
      rollbacks=st.rollbacks,
      next_forecast=st.next_forecast,
      updated_at=st.updated_at
    WHERE metric=sample.metric;
    n_processed:=n_processed+1;
  END LOOP;
  RETURN pg_catalog.jsonb_build_object(
    'status','evaluated',
    'real_observations_consumed',n_processed,
    'candidate_trials_started',n_gated,
    'verified_promotions',n_promoted,
    'rejected_candidates',n_rejected,
    'rollbacks',n_rollback,
    'autonomous_code_change',false,
    'personal_data_in_training',false);
END;
$function$

CREATE OR REPLACE FUNCTION prizmaa_internal.collect_and_learn_operations_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  collection jsonb;
  learning jsonb;
BEGIN
  collection:=prizmaa_internal.learn_live_operations_v1();
  learning:=prizmaa_internal.evaluate_online_forecaster_v1();
  DELETE FROM prizmaa_internal.online_forecast_proofs_v1
    WHERE created_at < clock_timestamp() - interval '30 days';
  RETURN pg_catalog.jsonb_build_object('collection',collection,'learning',learning);
END;
$function$


REVOKE ALL ON FUNCTION prizmaa_internal.evaluate_online_forecaster_v1() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION prizmaa_internal.collect_and_learn_operations_v1() FROM PUBLIC,anon,authenticated;
SELECT cron.schedule('prizmaa-operational-learner-hourly-v1','13 * * * *',
 'SELECT prizmaa_internal.collect_and_learn_operations_v1();');
