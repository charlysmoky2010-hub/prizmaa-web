-- PRIZMAA / REAL ONLINE OPERATIONAL LEARNING (2026-10-23)
-- Reproducible source for the actually deployed private Postgres function.
-- This updates incremental numeric baselines from REAL pg_stat_database counters,
-- not from invented members. It is NOT a self-training LLM, self-healing agent,
-- or proof of user adoption. No secrets, user identities or message bodies.
-- Deploy in existing Supabase project with schema prizmaa_internal and pg_cron.

CREATE TABLE IF NOT EXISTS prizmaa_internal.operational_model_v1 (
 metric text PRIMARY KEY CHECK(metric IN
 ('auth_users','approved_members','feedback_events','database_commits_per_minute',
 'database_deadlocks_per_minute','profile_rls_enabled','daily_job_active')),
 samples integer NOT NULL DEFAULT 0 CHECK(samples>=0),
 running_mean double precision NOT NULL DEFAULT 0,
 running_m2 double precision NOT NULL DEFAULT 0 CHECK(running_m2>=0),
 last_counter numeric,
 last_sample_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.operational_observations_v1 (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 metric text NOT NULL REFERENCES prizmaa_internal.operational_model_v1(metric),
 value double precision, baseline_prior double precision,
 deviation_score double precision, evidence_samples integer NOT NULL CHECK(evidence_samples>=0),
 assessment text NOT NULL CHECK(assessment IN
 ('baseline_started','learning','ordinary','unusual_deviation','insufficient_interval','counter_reset','safety_violation')),
 source text NOT NULL DEFAULT 'observed_postgres',
 CONSTRAINT operational_source_real CHECK(source='observed_postgres')
);
CREATE INDEX IF NOT EXISTS operational_observations_time_idx
 ON prizmaa_internal.operational_observations_v1(recorded_at DESC);
REVOKE ALL ON prizmaa_internal.operational_model_v1 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON prizmaa_internal.operational_observations_v1 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION prizmaa_internal.learn_live_operations_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_db_commits numeric;
  v_db_deadlocks numeric;
  v_metric text;
  v_gauge numeric;
  v_counter numeric;
  v_value double precision;
  v_period double precision;
  v_score double precision;
  v_delta double precision;
  v_m2 double precision;
  v_mean double precision;
  v_assessment text;
  v_first boolean;
  v_row prizmaa_internal.operational_model_v1%ROWTYPE;
  v_processed integer := 0;
  v_changed integer := 0;
BEGIN
  SELECT d.xact_commit::numeric, d.deadlocks::numeric
  INTO v_db_commits,v_db_deadlocks
  FROM pg_catalog.pg_stat_database d WHERE d.datname=pg_catalog.current_database();
  IF v_db_commits IS NULL THEN RAISE EXCEPTION 'DATABASE_STATS_UNAVAILABLE'; END IF;

  FOR v_metric,v_gauge,v_counter IN
    SELECT 'auth_users'::text, (SELECT count(*)::numeric FROM auth.users),NULL::numeric
    UNION ALL SELECT 'approved_members', (SELECT count(*)::numeric FROM public.prizmaa_private_members
      WHERE membership_state='active' AND adult_review_state='verified'),NULL::numeric
    UNION ALL SELECT 'feedback_events', (SELECT count(*)::numeric FROM public.prizmaa_product_feedback),NULL::numeric
    UNION ALL SELECT 'profile_rls_enabled', (SELECT CASE WHEN c.relrowsecurity THEN 1::numeric ELSE 0::numeric END
      FROM pg_catalog.pg_class c WHERE c.oid='public.prizmaa_private_profiles'::pg_catalog.regclass),NULL::numeric
    UNION ALL SELECT 'daily_job_active', (SELECT CASE WHEN EXISTS(SELECT 1 FROM cron.job WHERE jobname='prizmaa-feedback-quality-daily-v1' AND active) THEN 1::numeric ELSE 0::numeric END),NULL::numeric
    UNION ALL SELECT 'database_commits_per_minute', NULL::numeric,v_db_commits
    UNION ALL SELECT 'database_deadlocks_per_minute',NULL::numeric,v_db_deadlocks
  LOOP
    INSERT INTO prizmaa_internal.operational_model_v1(metric)
    VALUES(v_metric) ON CONFLICT(metric) DO NOTHING;
    SELECT * INTO v_row FROM prizmaa_internal.operational_model_v1
      WHERE metric=v_metric FOR UPDATE;
    v_first := v_row.last_sample_at IS NULL;
    v_score := NULL;
    v_value := NULL;
    IF v_counter IS NULL THEN
      v_value := v_gauge::double precision;
      v_assessment := CASE WHEN v_first THEN 'baseline_started' ELSE 'learning' END;
    ELSIF v_first THEN
      v_assessment := 'baseline_started';
    ELSE
      v_period := EXTRACT(EPOCH FROM (v_now-v_row.last_sample_at))::double precision;
      IF v_counter < v_row.last_counter THEN
        v_assessment:='counter_reset';
      ELSIF v_period<1.0 THEN
        v_assessment:='insufficient_interval';
      ELSE
        v_value := ((v_counter-v_row.last_counter)*60/v_period)::double precision;
        v_assessment := 'learning';
      END IF;
    END IF;

    IF v_metric IN ('profile_rls_enabled','daily_job_active') AND v_value=0 THEN
      v_assessment := 'safety_violation';
    ELSIF v_value IS NOT NULL AND v_row.samples>=5 THEN
      v_score := abs(v_value-v_row.running_mean) /
        GREATEST(pg_catalog.sqrt(v_row.running_m2/GREATEST(v_row.samples-1,1)),0.25);
      v_assessment := CASE WHEN v_score>=3 THEN 'unusual_deviation' ELSE 'ordinary' END;
    END IF;

    INSERT INTO prizmaa_internal.operational_observations_v1(
      metric,value,baseline_prior,deviation_score,evidence_samples,assessment)
    VALUES (v_metric,v_value,
      CASE WHEN v_row.samples=0 THEN NULL ELSE v_row.running_mean END,
      v_score,v_row.samples,v_assessment);

    IF v_value IS NOT NULL THEN
      v_delta:=v_value-v_row.running_mean;
      v_mean:=v_row.running_mean+v_delta/(v_row.samples+1);
      v_m2:=GREATEST(0,v_row.running_m2+v_delta*(v_value-v_mean));
      UPDATE prizmaa_internal.operational_model_v1 SET
        samples=v_row.samples+1,running_mean=v_mean,running_m2=v_m2,
        last_counter=v_counter,last_sample_at=v_now,updated_at=v_now
      WHERE metric=v_metric;
    ELSE
      UPDATE prizmaa_internal.operational_model_v1 SET
        last_counter=v_counter,last_sample_at=v_now,updated_at=v_now
      WHERE metric=v_metric;
    END IF;
    v_processed := v_processed+1;
    IF v_assessment IN ('unusual_deviation','safety_violation') THEN v_changed:=v_changed+1; END IF;
  END LOOP;
  DELETE FROM prizmaa_internal.operational_observations_v1 WHERE recorded_at < v_now-interval '30 days';
  RETURN pg_catalog.jsonb_build_object(
    'source','actual_postgres_counters','captured_at',v_now,
    'metrics',v_processed,'anomalies',v_changed,
    'self_training','incremental_running_mean_variance',
    'real_user_learning',false,
    'automatic_code_deployment',false
  );
END;
$function$


REVOKE ALL ON FUNCTION prizmaa_internal.learn_live_operations_v1() FROM PUBLIC,anon,authenticated;
-- Unique job name avoids an unbounded stack of schedulers:
SELECT cron.schedule('prizmaa-operational-learner-hourly-v1','13 * * * *',
 'SELECT prizmaa_internal.learn_live_operations_v1();');
