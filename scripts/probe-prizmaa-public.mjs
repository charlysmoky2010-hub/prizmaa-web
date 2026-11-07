#!/usr/bin/env node
/**
 * PRIZMAA: independent, read-only public runtime smoke test.
 *
 * Runs on a GitHub-hosted runner (not the author's laptop, ShipStatic, or Supabase).
 * No fake users, no account creation, no private credentials or user data.
 * If any request fails, the workflow FAILS rather than claiming the app works.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const app=readFileSync(resolve(root,"public/member/app.mjs"),"utf8");
const beta=process.env.PRIZMAA_BETA_URL || "https://hypnotic-tide-2ae4kz6.shipstatic.com";
const project="https://iyxmfiyvikrbfrscsaja.supabase.co";
const matches=app.match(/const PUBLISHABLE\s*=\s*"(sb_publishable_[A-Za-z0-9_-]+)"/);
if (!matches) throw Error("No public publishable Supabase key in the real beta client");
const publicKey=matches[1];
const checked=[];
const timeoutMs=12000;

async function request(name,url,opts={}){
  let response,body;
  try {
    response=await fetch(url,{...opts,redirect:"error",cache:"no-store",signal:AbortSignal.timeout(timeoutMs)});
    body=await response.text();
  } catch(e){
    checked.push({name,result:"FAILED",error:e?.cause?.code||e?.name||"NETWORK_ERROR"});
    return {ok:false,status:null,body:""};
  }
  checked.push({name,result:"RECEIVED",status:response.status,bytes:body.length});
  return {ok:response.ok,status:response.status,body,headers:response.headers};
}
function assert(name,test,reason){
  const item=checked.find(x=>x.name===name);
  if(!item)throw Error("Unregistered test "+name);
  if(!test){item.result="FAILED";item.reason=reason;}
  else item.result="PASSED";
}
function htmlPageOk(body,...markers){
  return typeof body==="string" && markers.every(m=>body.includes(m))
    && !body.startsWith("Internal Server Error");
}

const origin=new URL(beta);
if(origin.protocol!=="https:" || origin.username || origin.password || origin.search || origin.hash
  || !["hypnotic-tide-2ae4kz6.shipstatic.com"].includes(origin.hostname))
  throw Error("Only the explicitly reviewed PRIZMAA beta origin can be probed.");
const safeUrl=p=>new URL(p,origin).toString();

const page=await request("beta_home",safeUrl("/"));
assert("beta_home",page.ok && htmlPageOk(page.body,"PRIZMAA · Private Workspace","id=\"sign-in\"","id=\"private-area\""),
  "Expected real deployed sign-in UI, not an unrelated 200 response.");

const appJs=await request("beta_app_js",safeUrl("/app.mjs"));
assert("beta_app_js",appJs.ok && appJs.body.includes("/auth/v1/user")
  && appJs.body.includes("prizmaa_private_profiles"),"Expected authentication adapter and own-profile REST path.");

const core=await request("beta_core_js",safeUrl("/core.mjs"));
assert("beta_core_js",core.ok && core.body.includes("memberApproved")&&core.body.includes("visible_in_discovery: false"),
  "Required privacy rule is missing from served JS.");

const css=await request("beta_styles",safeUrl("/styles.css"));
assert("beta_styles",css.ok && css.body.includes(".card") && css.body.length>300,
  "CSS was not served as the intended stylesheet.");

const proof=await request("beta_proof",safeUrl("/proof.html"));
assert("beta_proof",proof.ok && htmlPageOk(proof.body,"Adaptive Learning Proof","Synthetic demonstration only"),
  "Proof page was not served with explicit synthetic-data disclosure.");

const proofJs=await request("beta_proof_js",safeUrl("/proof.mjs"));
assert("beta_proof_js",proofJs.ok && proofJs.body.includes("learnFromSyntheticRatings"),
  "The independent demo module cannot be loaded.");

const headers={"apikey":publicKey,"accept":"application/json"};
const health=await request("supabase_auth_health",project+"/auth/v1/health",{headers});
assert("supabase_auth_health",health.status===200 &&
  (health.body.includes("GoTrue")||health.body.includes('"version"')),
  "Supabase public Auth health did not return an expected, functioning health response.");

for(const table of ["prizmaa_private_members","prizmaa_private_profiles"]){
  const n="anonymous_"+table;
  const result=await request(n,project+"/rest/v1/"+table+"?select=user_id&limit=1",{headers});
  const forbidden=[401,403].includes(result.status);
  const safeEmpty=result.status===200 && /^\s*\[\s*\]\s*$/.test(result.body);
  assert(n,forbidden||safeEmpty,
    "Anonymous access failed safely ONLY for 401/403 or an empty RLS result; any other response is not verified.");
}
const failed=checked.filter(t=>t.result!=="PASSED");
for(const t of checked)console.log(JSON.stringify(t));
console.log(JSON.stringify({suite:"prizmaa-external-runtime-v1",attempted:checked.length,
  passed:checked.length-failed.length,failed:failed.length,
  authentication_end_to_end_tested:false,personal_data_accessed:false}));
if(failed.length){console.error("PRIZMAA external real-world availability NOT VERIFIED. No success claim.");process.exitCode=1;}
