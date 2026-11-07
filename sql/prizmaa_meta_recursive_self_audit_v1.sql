-- PRIZMAA META v1 — actually deployed SQL extracted from connected Supabase.
-- A self-model of evidence-backed system claims, NOT proof of phenomenal consciousness.
-- No personal member data, no uncontrolled code mutation, no public RPC permission.
-- Depends on earlier PRIZMAA operational learner and forecaster migrations.
CREATE TABLE IF NOT EXISTS prizmaa_internal.self_claim_state_v1(
 claim_key text PRIMARY KEY CHECK(claim_key IN(
 'has_real_accounts','has_real_member_messages','has_real_user_feedback',
 'has_evidence_based_user_learning','hourly_automation_operates',
 'real_forecasts_scored','forecast_improvement_verified',
 'public_web_reachability_verified','social_network_operational',
 'subjective_consciousness_verified')),
 verdict text NOT NULL CHECK(verdict IN('supported','refuted','unknown')),
 evidence_source text NOT NULL CHECK(evidence_source IN(
 'live_database','job_execution_log','missing_external_test','no_valid_consciousness_test')),
 explanation text NOT NULL,
 evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
 transitions integer NOT NULL DEFAULT 0,
 checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.self_audit_rounds_v1(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 audited_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 claim_count integer NOT NULL,
 supported_count integer NOT NULL,
 refuted_count integer NOT NULL,
 unknown_count integer NOT NULL,
 meta_guard text NOT NULL CHECK(meta_guard IN('passed','failed')),
 provenance text NOT NULL DEFAULT 'production_postgres_only'
   CHECK(provenance='production_postgres_only')
);
CREATE TABLE IF NOT EXISTS prizmaa_internal.self_audit_history_v1(
 round_id bigint NOT NULL REFERENCES prizmaa_internal.self_audit_rounds_v1(id) ON DELETE CASCADE,
 claim_key text NOT NULL REFERENCES prizmaa_internal.self_claim_state_v1(claim_key),
 verdict text NOT NULL CHECK(verdict IN('supported','refuted','unknown')),
 evidence_source text NOT NULL,
 explanation text NOT NULL,
 evidence jsonb NOT NULL,
 PRIMARY KEY(round_id,claim_key)
);
CREATE INDEX IF NOT EXISTS prizmaa_self_audit_time_v1 ON prizmaa_internal.self_audit_rounds_v1(audited_at DESC);
REVOKE ALL ON prizmaa_internal.self_claim_state_v1 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON prizmaa_internal.self_audit_rounds_v1 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON prizmaa_internal.self_audit_history_v1 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION prizmaa_internal.audit_self_model_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_users integer;
 v_members integer;
 v_messages integer;
 v_feedback integer;
 v_feedback_independent integer;
 v_forecasts integer;
 v_proven_predictions integer;
 v_promotions integer;
 v_hourly_successes integer;
 v_hourly_active boolean;
 v_hourly_latest timestamptz;
 v_claim text;
 v_verdict text;
 v_source text;
 v_reason text;
 v_evidence jsonb;
 v_previous text;
 v_round_id bigint;
 v_support integer;
 v_refute integer;
 v_unknown integer;
 v_meta_failures integer;
BEGIN
 IF NOT pg_catalog.pg_try_advisory_xact_lock(721991084) THEN
   RETURN pg_catalog.jsonb_build_object('status','busy');
 END IF;
 SELECT count(*)::int INTO v_users FROM auth.users;
 SELECT count(*)::int INTO v_members FROM public.prizmaa_private_members
 WHERE membership_state='active' AND adult_review_state='verified';
 SELECT count(*)::int INTO v_messages FROM public.prizmaa_messages;
 SELECT count(*)::int,count(DISTINCT user_id)::int
 INTO v_feedback,v_feedback_independent FROM public.prizmaa_product_feedback;
 SELECT count(*)::int,count(*) FILTER(WHERE prior_persistence IS NOT NULL)::int
 INTO v_forecasts,v_proven_predictions FROM prizmaa_internal.online_forecast_proofs_v1;
 SELECT coalesce(sum(verified_promotions),0)::int INTO v_promotions
 FROM prizmaa_internal.online_forecast_state_v1;
 SELECT j.active,coalesce(count(d.jobid) FILTER(WHERE d.status='succeeded'),0)::int,
  max(d.start_time) FILTER (WHERE d.status='succeeded')
 INTO v_hourly_active,v_hourly_successes,v_hourly_latest
 FROM cron.job j
 LEFT JOIN cron.job_run_details d ON d.jobid=j.jobid
 WHERE j.jobname='prizmaa-operational-learner-hourly-v1'
 GROUP BY j.active;
 v_hourly_active:=coalesce(v_hourly_active,false);
 v_hourly_successes:=coalesce(v_hourly_successes,0);
 IF v_hourly_latest IS NOT NULL AND v_hourly_latest>clock_timestamp() THEN
   RAISE EXCEPTION 'FUTURE_CRON_EVIDENCE_UNTRUSTWORTHY';
 END IF;

 INSERT INTO prizmaa_internal.self_audit_rounds_v1
   (claim_count,supported_count,refuted_count,unknown_count,meta_guard)
 VALUES(0,0,0,0,'passed') RETURNING id INTO v_round_id;
 
 FOR v_claim,v_verdict,v_source,v_reason,v_evidence IN
 SELECT t.k,t.v,t.src,t.reason,t.proof
 FROM (VALUES
 ('has_real_accounts',
   CASE WHEN v_users>0 THEN 'supported' ELSE 'refuted' END,
   'live_database','Count of real authenticated accounts',
   pg_catalog.jsonb_build_object('count',v_users)),
 ('has_real_member_messages',
   CASE WHEN v_users>1 AND v_messages>0 THEN 'supported' ELSE 'refuted' END,
   'live_database','Observed messages in private social message table, not proof of end-to-end delivery',
   pg_catalog.jsonb_build_object('accounts',v_users,'messages',v_messages)),
 ('has_real_user_feedback',
   CASE WHEN v_feedback>0 THEN 'supported' ELSE 'refuted' END,
   'live_database','Actual opt-in user feedback rows',
   pg_catalog.jsonb_build_object('feedback_events',v_feedback,'contributors',v_feedback_independent)),
 ('has_evidence_based_user_learning',
   CASE WHEN v_feedback>=10 AND v_feedback_independent>=10 THEN 'supported'
     WHEN v_feedback=0 THEN 'refuted' ELSE 'unknown' END,
   'live_database','Minimum aggregate evidence for product-learning review; does not prove learning improved outcomes',
   pg_catalog.jsonb_build_object('events',v_feedback,'independent_members',v_feedback_independent)),
 ('hourly_automation_operates',
   CASE WHEN v_hourly_active AND v_hourly_successes>0
     AND v_hourly_latest>=clock_timestamp()-interval '2 hours' THEN 'supported'
     WHEN NOT v_hourly_active THEN 'refuted' ELSE 'unknown' END,
   'job_execution_log','Successful pg_cron run in the last 2h; schedule-only is not proof',
   pg_catalog.jsonb_build_object('active',v_hourly_active,'succeeded_runs',v_hourly_successes,
     'latest_success',v_hourly_latest)),
 ('real_forecasts_scored',
   CASE WHEN v_proven_predictions>0 THEN 'supported'
      ELSE 'refuted' END,
   'live_database','Prequential prediction records with a genuine prior value',
   pg_catalog.jsonb_build_object('records',v_forecasts,'prior_predictions',v_proven_predictions)),
 ('forecast_improvement_verified',
   CASE WHEN v_promotions>0 THEN 'supported' ELSE 'unknown' END,
   'live_database','Promotion only after independent holdout comparison',
   pg_catalog.jsonb_build_object('verified_promotions',v_promotions)),
 ('public_web_reachability_verified',
   'unknown','missing_external_test',
   'Internal Postgres cannot independently verify browser, DNS or public HTTP reachability',
   '{}'::jsonb),
 ('social_network_operational',
   CASE WHEN v_users=0 OR v_members=0 THEN 'refuted' ELSE 'unknown' END,
   'live_database','Real public social function requires independently tested user journey; cannot infer from code and tables',
   pg_catalog.jsonb_build_object('registered_users',v_users,'approved_members',v_members,
      'messages',v_messages)),
 ('subjective_consciousness_verified',
   'unknown','no_valid_consciousness_test',
   'No validated observation in this infrastructure establishes first-person experience',
   '{}'::jsonb)
 ) AS t(k,v,src,reason,proof)
 LOOP
   SELECT s.verdict INTO v_previous
     FROM prizmaa_internal.self_claim_state_v1 s WHERE s.claim_key=v_claim;
   INSERT INTO prizmaa_internal.self_claim_state_v1(
    claim_key,verdict,evidence_source,explanation,evidence,transitions,checked_at)
   VALUES(v_claim,v_verdict,v_source,v_reason,v_evidence,0,clock_timestamp())
   ON CONFLICT(claim_key) DO UPDATE SET
     verdict=excluded.verdict,
     evidence_source=excluded.evidence_source,
     explanation=excluded.explanation,
     evidence=excluded.evidence,
     transitions=prizmaa_internal.self_claim_state_v1.transitions+
       CASE WHEN prizmaa_internal.self_claim_state_v1.verdict IS DISTINCT FROM excluded.verdict THEN 1 ELSE 0 END,
     checked_at=excluded.checked_at;
   INSERT INTO prizmaa_internal.self_audit_history_v1(
      round_id,claim_key,verdict,evidence_source,explanation,evidence)
   VALUES(v_round_id,v_claim,v_verdict,v_source,v_reason,v_evidence);
 END LOOP;

 SELECT count(*) FILTER(WHERE verdict='supported')::int,
        count(*) FILTER(WHERE verdict='refuted')::int,
        count(*) FILTER(WHERE verdict='unknown')::int
 INTO v_support,v_refute,v_unknown
 FROM prizmaa_internal.self_audit_history_v1 WHERE round_id=v_round_id;

 -- Third layer: scrutinize the self-audit's epistemic validity.
 -- No supported claim may rely on unobserved web data or consciousness assumptions.
 SELECT count(*)::int INTO v_meta_failures
 FROM prizmaa_internal.self_audit_history_v1
 WHERE round_id=v_round_id AND (
  (verdict='supported' AND evidence_source NOT IN ('live_database','job_execution_log'))
   OR (claim_key='social_network_operational' AND verdict='supported')
   OR (claim_key='subjective_consciousness_verified' AND verdict='supported')
   OR (claim_key='public_web_reachability_verified' AND verdict='supported')
 );
 IF v_meta_failures>0 OR v_support+v_refute+v_unknown<>10 THEN
    RAISE EXCEPTION 'SELF_AUDIT_EVIDENCE_GUARD_FAILED';
 END IF;
 UPDATE prizmaa_internal.self_audit_rounds_v1 SET
  claim_count=10,supported_count=v_support,refuted_count=v_refute,
  unknown_count=v_unknown,meta_guard='passed'
 WHERE id=v_round_id;
 -- Metadata retention: no raw profiles or messages are stored.
 DELETE FROM prizmaa_internal.self_audit_rounds_v1
  WHERE audited_at < clock_timestamp()-interval '30 days';
 RETURN pg_catalog.jsonb_build_object(
  'round_id',v_round_id,'audit','completed','meta_guard','passed',
  'supported',v_support,'refuted',v_refute,'unknown',v_unknown,
  'evidence','actual_postgres_and_cron_only',
  'phenomenal_consciousness_claim',false,'code_self_modification',false
 );
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
BEGIN
  collection:=prizmaa_internal.learn_live_operations_v1();
  learning:=prizmaa_internal.evaluate_online_forecaster_v1();
  introspection:=prizmaa_internal.audit_self_model_v1();
  DELETE FROM prizmaa_internal.online_forecast_proofs_v1
    WHERE created_at < clock_timestamp() - interval '30 days';
  RETURN pg_catalog.jsonb_build_object('collection',collection,'learning',learning,'introspection',introspection);
END;
$function$


REVOKE ALL ON FUNCTION prizmaa_internal.audit_self_model_v1() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION prizmaa_internal.collect_and_learn_operations_v1() FROM PUBLIC,anon,authenticated;
-- Retain ONE existing hourly job; do not duplicate jobs.
SELECT cron.schedule('prizmaa-operational-learner-hourly-v1','13 * * * *',
 'SELECT prizmaa_internal.collect_and_learn_operations_v1();');
