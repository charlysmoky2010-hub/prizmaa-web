import assert from "node:assert/strict";
import { isPrivateBetaRuntime, VIP_UPGRADE_BLOCKED } from "../lib/prizmaa/security-policy.ts";

const local = {PRIZMAA_LOCAL_MVP:"1"};
assert.equal(isPrivateBetaRuntime(local,"localhost","localhost:3000"),true);
assert.equal(isPrivateBetaRuntime(local,"127.0.0.1","127.0.0.1:3000"),true);
assert.equal(isPrivateBetaRuntime(local,"[::1]","[::1]:3000"),true);
assert.equal(isPrivateBetaRuntime({},"localhost","localhost:3000"),false);
assert.equal(isPrivateBetaRuntime({VERCEL:"1",PRIZMAA_LOCAL_MVP:"1"},"localhost","localhost:3000"),false);
assert.equal(isPrivateBetaRuntime({ALLOW_PUBLIC_PREVIEW:"1",PRIZMAA_LOCAL_MVP:"1"},"localhost","localhost:3000"),false);
assert.equal(isPrivateBetaRuntime(local,"prizmaa.example","prizmaa.example"),false);
assert.equal(isPrivateBetaRuntime(local,"localhost","prizmaa.example"),false);
assert.equal(isPrivateBetaRuntime(local,"localhost","localhost.attacker.com"),false);
assert.equal(isPrivateBetaRuntime(local,"localhost","localhost:3000.evil"),false);
assert.equal(VIP_UPGRADE_BLOCKED.status,403);
assert.equal(VIP_UPGRADE_BLOCKED.error,"PAYMENT_PROOF_REQUIRED");
console.log("PRIZMAA_PRIVATE_BETA_SECURITY_TESTS: 12/12 PASS");
