import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const read=p=>readFileSync(resolve(process.cwd(),p),"utf8");
const page=read("app/prizmaa/app/page.tsx");
const adapter=read("lib/prizmaa/member-api.ts");
const root=read("app/prizmaa/page.tsx");
const layout=read("app/prizmaa/layout.tsx");
const legacy=read("app/prizmaa/showcase/page.tsx");

test("one canonical application path, not old detached cultural demo",()=>{
  assert.match(root,/redirect\('\/prizmaa\/app'\)/);
  assert.match(page,/loginMember/);
  assert.match(page,/saveProfile/);
  assert.match(page,/refreshConnections/);
  assert.match(page,/sendMessage/);
  assert.match(page,/blockPeer/);
  assert.match(page,/reportPeer/);
  assert.match(page,/deleteProfile/);
  assert.match(page,/deleteFeedback/);
  assert.match(page,/exportOwnData/);
  assert.match(legacy,/CulturalNode/);
  assert.doesNotMatch(page,/const NODES\s*=/);
});
test("real Auth and protected PostgREST, no privileged keys or simulated success",()=>{
  assert.match(adapter,/\/auth\/v1\/token\?grant_type=password/);
  assert.match(adapter,/\/auth\/v1\/user/);
  assert.match(adapter,/sb_publishable_/);
  assert.match(page,/\/rest\/v1\/prizmaa_private_members/);
  assert.match(page,/\/rest\/v1\/prizmaa_private_profiles/);
  assert.match(page,/\/rest\/v1\/prizmaa_messages/);
  assert.match(page,/\/rest\/v1\/prizmaa_blocks/);
  assert.match(page,/\/rest\/v1\/prizmaa_reports/);
  assert.match(page,/\/rest\/v1\/rpc\/prizmaa_my_matches/);
  assert.doesNotMatch(page+adapter,/service_role|sb_secret_|localStorage|sessionStorage|createUser\(/);
});
test("only verified invite members reach social writes",()=>{
  assert.match(adapter,/membership_state === "active"/);
  assert.match(adapter,/adult_review_state === "verified"/);
  assert.match(page,/if\(!session\|\|!approved\)return;/);
  assert.match(page,/!matches\.some/);
  assert.match(page,/No connections available\. Nothing has been fabricated\./);
});
test("privacy and data ownership protected in client and DB rules",()=>{
  assert.match(adapter,/visible_in_discovery:false as const/);
  assert.match(page,/p\.visible_in_discovery!==false/);
  assert.match(page,/\/rest\/v1\/prizmaa_private_profiles\?on_conflict=user_id/);
  assert.match(page,/\/rest\/v1\/prizmaa_private_profiles\?user_id=eq\./);
  assert.match(adapter,/setTimeout\(\(\)=>URL\.revokeObjectURL/);
  assert.match(layout,/social community for gay adults/);
  assert.doesNotMatch(layout,/hookup app/);
});
test("consent, safety and honest incomplete-status disclosure visible",()=>{
  assert.match(page,/feedbackConsent/);
  assert.match(page,/window\.confirm\("Block this connection/);
  assert.match(page,/A human moderation response is not automated/);
  assert.match(page,/Self-registration is disabled/);
  assert.match(page,/Full account export and account deletion are not automated/);
});
