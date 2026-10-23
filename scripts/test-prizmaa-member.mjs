import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { memberApproved, normalizeProfile, privateExport } from "../public/member/core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

test("only approved and adult-reviewed invited members can write profiles", () => {
  assert.equal(memberApproved({membership_state:"active",adult_review_state:"verified"}),true);
  for (const m of [null,{membership_state:"invited",adult_review_state:"verified"},{membership_state:"active",adult_review_state:"pending"}]) {
    assert.equal(memberApproved(m),false);
  }
});
test("profile is private regardless of user supplied visibility", () => {
  const p=normalizeProfile({display_name:"  Alex ",location_label:"NRW",bio:"Art",visible_in_discovery:true});
  assert.equal(p.visible_in_discovery,false);
  assert.equal(p.display_name,"Alex");
});
test("precise location and postal codes are rejected", () => {
  for (const location_label of ["48143","52.11,7.55","123 street"]) {
    assert.throws(()=>normalizeProfile({display_name:"Alex",location_label}));
  }
});
test("bound profile content", () => {
  assert.throws(()=>normalizeProfile({display_name:"A"}));
  assert.throws(()=>normalizeProfile({display_name:"Alex",bio:"x".repeat(401)}));
  assert.equal(normalizeProfile({display_name:"Alex",bio:"x".repeat(400)}).bio.length,400);
});
test("own-data export excludes password/session token", () => {
  const blob=privateExport({id:"u",email:"fake@example.invalid"},{member_role:"tester",membership_state:"active",adult_review_state:"verified"},null);
  assert.equal(blob.identity.email,"fake@example.invalid");
  assert.equal(blob.profile,null);
  assert.equal(JSON.stringify(blob).includes("password"),false);
});
test("HTML enforces same origin scripts, no inline and restricted Supabase connect", () => {
  const html=read("public/member/index.html");
  assert.match(html,/default-src &#39;none&#39;|default-src 'none'/);
  assert.match(html,/script-src 'self'/);
  assert.match(html,/connect-src https:\/\/iyxmfiyvikrbfrscsaja\.supabase\.co/);
  assert.doesNotMatch(html,/<script>(.*?)<\/script>/);
});
test("browser adapter has no signup, token storage, tracking or service secrets", () => {
  const app=read("public/member/app.mjs");
  for(const prohibited of ["/auth/v1/signup","localStorage","sessionStorage","service_role","analytics","trackEvent"])assert.ok(!app.includes(prohibited),prohibited);
  assert.ok(app.includes("/auth/v1/user"));
  assert.ok(app.includes("/rest/v1/prizmaa_private_profiles"));
});
