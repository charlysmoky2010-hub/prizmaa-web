-- PRIZMAA / PRIVATE REPAIR GOVERNOR, deployed schema source.
-- All regular runs use govern_safe_repairs_v1(false). The controlled test canary
-- is isolated, explicitly labelled, and never touched by the hourly runtime.
-- This does NOT create conscious AI, members, a public web service, or autonomous
-- software edits. It only repairs allowlisted private derived diagnostics.
CREATE TABLE IF NOT EXISTS prizmaa_internal.repair_governor_runs_v1 (
 run_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 context text NOT NULL CHECK(context IN ('live','controlled_canary')),
 detected integer NOT NULL DEFAULT 0,
 attempted integer NOT NULL DEFAULT 0,
 verified integer NOT NULL DEFAULT 0,
 reverted integer NOT NULL DEFAULT 0,
 blocked integer NOT NULL DEFAULT 0,
 result text NOT NULL DEFAULT 'running' CHECK(result IN('running','completed','degraded'))
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.repair_governor_evidence_v1 (
 evidence_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 run_id bigint NOT NULL REFERENCES prizmaa_internal.repair_governor_runs_v1(run_id) ON DELETE CASCADE,
 fault_key text NOT NULL CHECK(fault_key IN (
 'missing_real_members','unverified_public_reachability','stale_quality_rollup',
 'incomplete_self_model','controlled_canary_fault')),
 permitted_action text NOT NULL CHECK(permitted_action IN(
 'none','refresh_aggregate','refresh_claim_model','repair_canary')),
 before_state jsonb NOT NULL DEFAULT '{}'::jsonb,
 after_state jsonb NOT NULL DEFAULT '{}'::jsonb,
 outcome text NOT NULL CHECK(outcome IN('blocked','verified_repair','rolled_back','not_verified')),
 observed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.repair_governor_rule_state_v1 (
 rule_key text PRIMARY KEY CHECK(rule_key IN('stale_quality_rollup','incomplete_self_model')),
 consecutive_failures integer NOT NULL DEFAULT 0,
 disabled_until timestamptz,
 last_verified_at timestamptz,
 last_outcome text NOT NULL DEFAULT 'never_run'
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.repair_canary_only_v1 (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 state text NOT NULL DEFAULT 'healthy' CHECK(state IN('healthy','broken')),
 force_verification_failure boolean NOT NULL DEFAULT false
);
INSERT INTO prizmaa_internal.repair_canary_only_v1(singleton,state,force_verification_failure)
 VALUES(true,'healthy',false) ON CONFLICT(singleton) DO NOTHING;
REVOKE ALL ON prizmaa_internal.repair_governor_runs_v1,
 prizmaa_internal.repair_governor_evidence_v1,
 prizmaa_internal.repair_governor_rule_state_v1,
 prizmaa_internal.repair_canary_only_v1 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION prizmaa_internal.govern_safe_repairs_v1(p_test_canary boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_now timestamptz:=clock_timestamp();
 v_run bigint;
 v_detected integer:=0;
 v_attempted integer:=0;
 v_verified integer:=0;
 v_rolled_back integer:=0;
 v_blocked integer:=0;
 v_approved int;
 v_quality_count int;
 v_quality_oldest timestamptz;
 v_claim_count int;
 v_prev_claim_count int;
 v_latest_audit timestamptz;
 v_new_audit timestamptz;
 v_rule text;
 v_action text;
 v_before jsonb;
 v_after jsonb;
 v_ok boolean;
 v_error text;
 v_c_state text;
 v_force boolean;
 v_disabled_until timestamptz;
BEGIN
 IF NOT pg_catalog.pg_try_advisory_xact_lock(721991085) THEN
   RETURN pg_catalog.jsonb_build_object('status','busy','repairs',0);
 END IF;
 INSERT INTO prizmaa_internal.repair_governor_runs_v1(context)
 VALUES(CASE WHEN p_test_canary THEN 'controlled_canary' ELSE 'live' END)
 RETURNING run_id INTO v_run;
 -- Honest unblockable issue. This function MUST NOT fabricate accounts or invite users.
 SELECT count(*)::int INTO v_approved FROM public.prizmaa_private_members
 WHERE membership_state='active' AND adult_review_state='verified';
 IF v_approved=0 THEN
   v_detected:=v_detected+1;v_blocked:=v_blocked+1;
   INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
     run_id,fault_key,permitted_action,before_state,after_state,outcome)
   VALUES(v_run,'missing_real_members','none',
      pg_catalog.jsonb_build_object('verified_members',0),
      pg_catalog.jsonb_build_object('reason','requires_real_consenting_adult_invitation'),
      'blocked');
 END IF;
 v_detected:=v_detected+1;v_blocked:=v_blocked+1;
 INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
  run_id,fault_key,permitted_action,before_state,after_state,outcome)
 VALUES(v_run,'unverified_public_reachability','none',
  '{}'::jsonb,pg_catalog.jsonb_build_object('reason','independent_http_observation_missing'),'blocked');

 -- Allowlist: rebuild ONLY aggregate internal rollup when demonstrably absent/stale.
 SELECT count(*)::int,min(checked_at) INTO v_quality_count,v_quality_oldest
 FROM prizmaa_internal.feedback_quality_rollup;
 IF v_quality_count<>6 OR v_quality_oldest IS NULL OR v_quality_oldest<v_now-interval '27 hours' THEN
   v_detected:=v_detected+1;
   v_rule:='stale_quality_rollup';v_action:='refresh_aggregate';
   SELECT disabled_until INTO v_disabled_until
     FROM prizmaa_internal.repair_governor_rule_state_v1 WHERE rule_key=v_rule;
   IF v_disabled_until IS NOT NULL AND v_disabled_until>v_now THEN
      v_blocked:=v_blocked+1;
      INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
       run_id,fault_key,permitted_action,before_state,after_state,outcome)
      VALUES(v_run,v_rule,'none',pg_catalog.jsonb_build_object('oldest',v_quality_oldest,'rows',v_quality_count),
       pg_catalog.jsonb_build_object('circuit_open_until',v_disabled_until),'blocked');
   ELSE
    v_attempted:=v_attempted+1;
    v_before:=pg_catalog.jsonb_build_object('rows',v_quality_count,'oldest',v_quality_oldest);
    v_ok:=false;
    BEGIN
      PERFORM prizmaa_internal.refresh_feedback_quality_v1();
      SELECT count(*)=6 AND min(checked_at)>=v_now
        AND count(*) FILTER (WHERE state NOT IN('insufficient_evidence','investigate','watch','healthy'))=0
        INTO v_ok FROM prizmaa_internal.feedback_quality_rollup;
      IF NOT coalesce(v_ok,false) THEN RAISE EXCEPTION 'QUALITY_REPAIR_POSTCONDITION_FAILED'; END IF;
    EXCEPTION WHEN OTHERS THEN
      v_ok:=false;
    END;
    SELECT count(*)::int,min(checked_at) INTO v_quality_count,v_quality_oldest
    FROM prizmaa_internal.feedback_quality_rollup;
    v_after:=pg_catalog.jsonb_build_object('rows',v_quality_count,'oldest',v_quality_oldest);
    IF v_ok THEN v_verified:=v_verified+1;ELSE v_rolled_back:=v_rolled_back+1;END IF;
    INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
      run_id,fault_key,permitted_action,before_state,after_state,outcome)
    VALUES(v_run,v_rule,v_action,v_before,v_after,
      CASE WHEN v_ok THEN 'verified_repair' ELSE 'rolled_back' END);
    INSERT INTO prizmaa_internal.repair_governor_rule_state_v1(
       rule_key,consecutive_failures,disabled_until,last_verified_at,last_outcome)
    VALUES(v_rule,CASE WHEN v_ok THEN 0 ELSE 1 END,
      CASE WHEN v_ok THEN NULL ELSE v_now+interval '1 hour' END,
      CASE WHEN v_ok THEN v_now ELSE NULL END,CASE WHEN v_ok THEN 'verified' ELSE 'rolled_back' END)
    ON CONFLICT(rule_key) DO UPDATE SET
       consecutive_failures=CASE WHEN v_ok THEN 0 ELSE
          prizmaa_internal.repair_governor_rule_state_v1.consecutive_failures+1 END,
       disabled_until=CASE WHEN v_ok THEN NULL ELSE v_now+interval '1 hour' END,
       last_verified_at=CASE WHEN v_ok THEN v_now ELSE
          prizmaa_internal.repair_governor_rule_state_v1.last_verified_at END,
       last_outcome=excluded.last_outcome;
   END IF;
 END IF;

 -- Allowlist: reconstruct self-audit snapshot only if missing or too old.
 SELECT count(*)::int INTO v_claim_count FROM prizmaa_internal.self_claim_state_v1;
 SELECT max(audited_at) INTO v_latest_audit FROM prizmaa_internal.self_audit_rounds_v1
 WHERE meta_guard='passed';
 IF v_claim_count<>10 OR v_latest_audit IS NULL OR v_latest_audit<v_now-interval '3 hours' THEN
   v_detected:=v_detected+1;v_rule:='incomplete_self_model';
   SELECT disabled_until INTO v_disabled_until
     FROM prizmaa_internal.repair_governor_rule_state_v1 WHERE rule_key=v_rule;
   IF v_disabled_until IS NOT NULL AND v_disabled_until>v_now THEN
     v_blocked:=v_blocked+1;
     INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
        run_id,fault_key,permitted_action,before_state,after_state,outcome)
     VALUES(v_run,v_rule,'none',pg_catalog.jsonb_build_object('claims',v_claim_count),
        pg_catalog.jsonb_build_object('circuit_open_until',v_disabled_until),'blocked');
   ELSE
     v_attempted:=v_attempted+1;
     v_before:=pg_catalog.jsonb_build_object('claims',v_claim_count,'latest_audit',v_latest_audit);
     v_ok:=false;
     BEGIN
       PERFORM prizmaa_internal.audit_self_model_v1();
       SELECT count(*)=10 INTO v_ok FROM prizmaa_internal.self_claim_state_v1;
       SELECT max(audited_at) INTO v_new_audit FROM prizmaa_internal.self_audit_rounds_v1
         WHERE meta_guard='passed';
       IF NOT coalesce(v_ok,false) OR v_new_audit<v_now THEN
         RAISE EXCEPTION 'SELF_MODEL_POSTCONDITION_FAILED';
       END IF;
     EXCEPTION WHEN OTHERS THEN v_ok:=false;
     END;
     SELECT count(*)::int INTO v_claim_count FROM prizmaa_internal.self_claim_state_v1;
     v_after:=pg_catalog.jsonb_build_object('claims',v_claim_count);
     IF v_ok THEN v_verified:=v_verified+1;ELSE v_rolled_back:=v_rolled_back+1;END IF;
     INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
        run_id,fault_key,permitted_action,before_state,after_state,outcome)
     VALUES(v_run,v_rule,'refresh_claim_model',v_before,v_after,
       CASE WHEN v_ok THEN 'verified_repair' ELSE 'rolled_back' END);
     INSERT INTO prizmaa_internal.repair_governor_rule_state_v1(
       rule_key,consecutive_failures,disabled_until,last_verified_at,last_outcome)
     VALUES(v_rule,CASE WHEN v_ok THEN 0 ELSE 1 END,
       CASE WHEN v_ok THEN NULL ELSE v_now+interval '1 hour' END,
       CASE WHEN v_ok THEN v_now ELSE NULL END,
       CASE WHEN v_ok THEN 'verified' ELSE 'rolled_back' END)
     ON CONFLICT(rule_key) DO UPDATE SET
       consecutive_failures=CASE WHEN v_ok THEN 0 ELSE
        prizmaa_internal.repair_governor_rule_state_v1.consecutive_failures+1 END,
       disabled_until=CASE WHEN v_ok THEN NULL ELSE v_now+interval '1 hour' END,
       last_verified_at=CASE WHEN v_ok THEN v_now ELSE
        prizmaa_internal.repair_governor_rule_state_v1.last_verified_at END,
       last_outcome=excluded.last_outcome;
   END IF;
 END IF;

 -- Controlled fault-injection canary only; never part of hourly production schedule.
 IF p_test_canary THEN
  SELECT state,force_verification_failure INTO v_c_state,v_force
   FROM prizmaa_internal.repair_canary_only_v1 WHERE singleton=true FOR UPDATE;
  IF v_c_state='broken' THEN
    v_detected:=v_detected+1;v_attempted:=v_attempted+1;v_ok:=false;
    BEGIN
      UPDATE prizmaa_internal.repair_canary_only_v1 SET state='healthy' WHERE singleton=true;
      IF v_force THEN RAISE EXCEPTION 'CANARY_FORCED_POSTCONDITION_FAILURE'; END IF;
      SELECT state='healthy' INTO v_ok FROM prizmaa_internal.repair_canary_only_v1 WHERE singleton=true;
      IF NOT coalesce(v_ok,false) THEN RAISE EXCEPTION 'CANARY_POSTCONDITION_FAILED'; END IF;
    EXCEPTION WHEN OTHERS THEN v_ok:=false;
    END;
    IF v_ok THEN v_verified:=v_verified+1;ELSE v_rolled_back:=v_rolled_back+1;END IF;
    INSERT INTO prizmaa_internal.repair_governor_evidence_v1(
       run_id,fault_key,permitted_action,before_state,after_state,outcome)
    VALUES(v_run,'controlled_canary_fault','repair_canary',
      pg_catalog.jsonb_build_object('state_before',v_c_state,'forced_failure',v_force),
      (SELECT pg_catalog.jsonb_build_object('state_after',state)
         FROM prizmaa_internal.repair_canary_only_v1 WHERE singleton=true),
      CASE WHEN v_ok THEN 'verified_repair' ELSE 'rolled_back' END);
  END IF;
 END IF;
 UPDATE prizmaa_internal.repair_governor_runs_v1 SET
   detected=v_detected,attempted=v_attempted,verified=v_verified,
   reverted=v_rolled_back,blocked=v_blocked,
   result=CASE WHEN v_rolled_back>0 THEN 'degraded' ELSE 'completed' END
 WHERE run_id=v_run;
 DELETE FROM prizmaa_internal.repair_governor_runs_v1
 WHERE recorded_at<clock_timestamp()-interval '30 days';
 RETURN pg_catalog.jsonb_build_object(
  'run_id',v_run,'context',CASE WHEN p_test_canary THEN 'controlled_canary' ELSE 'live' END,
  'detected',v_detected,'attempted',v_attempted,'verified',v_verified,
  'rolled_back',v_rolled_back,'blocked',v_blocked,'external_actions',0,
  'changed_user_data',false,'code_self_modification',false);
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
  introspection jsonb;
  remediation jsonb;
BEGIN
  collection:=prizmaa_internal.learn_live_operations_v1();
  learning:=prizmaa_internal.evaluate_online_forecaster_v1();
  introspection:=prizmaa_internal.audit_self_model_v1();
  remediation:=prizmaa_internal.govern_safe_repairs_v1(false);
  DELETE FROM prizmaa_internal.online_forecast_proofs_v1
    WHERE created_at < clock_timestamp() - interval '30 days';
  RETURN pg_catalog.jsonb_build_object('collection',collection,'learning',learning,'introspection',introspection,'repair_governor',remediation);
END;
$function$


REVOKE ALL ON FUNCTION prizmaa_internal.govern_safe_repairs_v1(boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION prizmaa_internal.collect_and_learn_operations_v1() FROM PUBLIC,anon,authenticated;
SELECT cron.schedule('prizmaa-operational-learner-hourly-v1','13 * * * *',
  'SELECT prizmaa_internal.collect_and_learn_operations_v1();');
