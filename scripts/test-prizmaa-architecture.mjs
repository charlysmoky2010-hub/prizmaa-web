import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {privateThreadQuery} from "../lib/prizmaa/member-api.ts";
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

const home=read("app/page.tsx");
test("site root and /prizmaa point to one member application",()=>{
  assert.match(home,/redirect\('\/prizmaa\/app'\)/);
  assert.match(root,/redirect\('\/prizmaa\/app'\)/);
});

test("private messages request scopes BOTH users before applying the newest-100 limit",()=>{
  const alice="11111111-1111-4111-8111-111111111111";
  const bob="22222222-2222-4222-8222-222222222222";
  const path=privateThreadQuery(alice,bob);
  assert.ok(path.startsWith("/rest/v1/prizmaa_messages?"));
  const q=new URL("https://invalid.example"+path).searchParams;
  assert.equal(q.get("or"),"(and(sender_id.eq."+alice+",recipient_id.eq."+bob+"),and(sender_id.eq."+bob+",recipient_id.eq."+alice+"))");
  assert.equal(q.get("order"),"created_at.desc");
  assert.equal(q.get("limit"),"100");
  assert.equal(q.get("select"),"message_id,sender_id,recipient_id,body,created_at");
  assert.throws(()=>privateThreadQuery(alice,alice));
  assert.throws(()=>privateThreadQuery("not-a-uuid",bob));
  assert.throws(()=>privateThreadQuery(alice,bob,101));
  assert.throws(()=>privateThreadQuery(alice,bob,0));
  assert.match(page,/privateThreadQuery\(session\.userId,p\.user_id\)/);
  assert.match(page,/\[\.\.\.rows\]\.reverse\(\)/);
  assert.doesNotMatch(page,/sender_id\.eq\."\+\s*session\.userId/);
});
