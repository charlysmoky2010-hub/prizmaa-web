import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const sql=readFileSync(resolve(root,"sql/prizmaa_bounded_self_repair_v1.sql"),"utf8");
const proof=readFileSync(resolve(root,"sql/prizmaa_repair_live_truth_check.sql"),"utf8");

test("production cron runs the repair governor without test canary",()=>{
  assert.match(sql,/remediation:=prizmaa_internal\.govern_safe_repairs_v1\(false\)/);
  assert.match(sql,/SELECT prizmaa_internal\.collect_and_learn_operations_v1\(\)/);
  assert.match(sql,/p_test_canary boolean DEFAULT false/);
});
test("forbid direct mutation of member data or DDL from autonomous fix",()=>{
  for(const disallowed of [
    /UPDATE\s+public\./i,/DELETE\s+FROM\s+public\./i,
    /INSERT\s+INTO\s+public\./i,/UPDATE\s+auth\./i,
    /EXECUTE\s+FORMAT\s*\(/i,/ALTER\s+TABLE\s+public\./i,
    /DROP\s+TABLE/i,/MERGE\s+INTO\s+public\./i
  ]) assert.doesNotMatch(sql,disallowed);
});
test("allowlist only private derived rollups and self-audit",()=>{
  assert.match(sql,/refresh_feedback_quality_v1\(\)/);
  assert.match(sql,/audit_self_model_v1\(\)/);
  assert.match(sql,/27 hours/);
  assert.match(sql,/count\(\*\)=10/);
  assert.match(sql,/disabled_until/);
  assert.match(sql,/consecutive_failures/);
});
test("rollback and verification are explicit rather than claimed",()=>{
  assert.match(sql,/EXCEPTION WHEN OTHERS THEN/);
  assert.match(sql,/CANARY_FORCED_POSTCONDITION_FAILURE/);
  assert.match(sql,/repair_canary_only_v1/);
  assert.match(sql,/rolled_back/);
  assert.match(proof,/real_repairs_verified/);
  assert.match(proof,/test_rollbacks/);
});
test("unresolvable blockers never create or invite people",()=>{
  assert.match(sql,/missing_real_members/);
  assert.match(sql,/requires_real_consenting_adult_invitation/);
  assert.match(sql,/independent_http_observation_missing/);
  assert.doesNotMatch(sql,/auth\.admin|createUser|sendInvitation|sendMail/);
});
test("no untrusted public role can invoke privileged repair function",()=>{
  assert.match(sql,/REVOKE ALL ON FUNCTION prizmaa_internal\.govern_safe_repairs_v1\(boolean\) FROM PUBLIC,anon,authenticated/);
  assert.match(proof,/has_function_privilege\('anon'/);
  assert.match(proof,/has_function_privilege\('authenticated'/);
});
