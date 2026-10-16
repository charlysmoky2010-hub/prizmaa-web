import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const root="founder-portal/";
const html=readFileSync(root+"index.html","utf8");
const js=readFileSync(root+"founder.js","utf8");
const edge=readFileSync(root+"edge/prizmaa-founder-delete/index.ts","utf8");
test("private founder UI is real auth, not simulated profile cards",()=>{
 assert.match(html,/Sign in to your account/);
 assert.match(html,/NO PUBLIC SIGNUPS/);
 assert.match(html,/Account deletion/);
 assert.doesNotMatch(html,/fictional profiles|fake profile card/i);
 assert.match(js,/auth\/v1\/token\?grant_type=password/);
 assert.match(js,/prizmaa_private_members\?select=/);
 assert.match(js,/prizmaa_private_profiles\?select=/);
 assert.match(js,/Authorization/);
 assert.doesNotMatch(js,/auth\/v1\/signup|signUp\(|create_user:\s*true/);
});
test("privacy hard gates remain enabled",()=>{
 assert.match(js,/window.PRIZMA_CONFIG/);
 assert.match(js,/NOT_INVITED|INVITATION_REQUIRED/);
 assert.match(js,/member_role|adult_review_state/);
 assert.match(js,/membership_state===?"active"|membership_state\s*!==\s*"active"/);
 assert.match(js,/verified/);
 assert.match(js,/DELETE MY ACCOUNT/);
 assert.doesNotMatch(js,/localStorage\s*\.|sessionStorage\s*\.|navigator\.sendBeacon|gtag\(/);
});
test("account deletion is caller-authenticated and constrained to owner",()=>{
 assert.match(edge,/auth\.getUser\(token\)/);
 assert.match(edge,/auth\.admin\.deleteUser\(user\.id\)/);
 assert.match(edge,/origin_not_allowed/);
 assert.match(edge,/trusted\.has\(origin\)/);
 assert.match(edge,/method!=="POST"/);
 assert.match(edge,/remaining\.data\?\.length/);
 assert.doesNotMatch(edge,/deleteUser\(.*body\.|deleteUser\(.*req\./);
});
test("no embedded secrets or user information",()=>{
 for(const source of [html,js,edge]){
  assert.doesNotMatch(source,/sb_secret_[A-Za-z0-9_-]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']/);
  assert.doesNotMatch(source,/charlysmoky2010@gmail\.com/);
 }
});
