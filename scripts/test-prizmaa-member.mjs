import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runInNewContext } from "node:vm";
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

test("server constraints align with client profile limits",()=>{
 assert.equal(normalizeProfile({display_name:"x".repeat(36),location_label:"a".repeat(44),bio:"x"}).display_name.length,36);
 assert.throws(()=>normalizeProfile({display_name:"x".repeat(37)}));
 assert.throws(()=>normalizeProfile({display_name:"Valid",location_label:"x".repeat(45)}));
});
test("feedback requires consent, recognized area and bounded rating",async()=>{
 const {normalizeFeedback}=await import("../public/member/core.mjs");
 assert.deepEqual(normalizeFeedback("privacy",5,true),{area:"privacy",rating:5});
 assert.throws(()=>normalizeFeedback("privacy",5,false));
 assert.throws(()=>normalizeFeedback("sexual_orientation",5,true));
 assert.throws(()=>normalizeFeedback("privacy",6,true));
});
test("consent UI and owner scoped feedback deletion exist",()=>{
 const html=read("public/member/index.html"),app=read("public/member/app.mjs");
 assert.match(html,/name="consent" required/);
 assert.match(app,/prizmaa_product_feedback/);
 assert.match(app,/feedback-delete/);
 assert.match(app,/user_id=eq\./);
 assert.ok(!app.includes("localStorage"));
});

function simulatedMemberBrowser({approved=true, feedbackOffline=false, profileDeletionWorks=true}={}) {
  const handlers=new Map(), nodes=new Map();
  const fields={
    "sign-in":{email:{value:""},password:{value:""}},
    "profile-form":{display_name:{value:""},location_label:{value:""},bio:{value:""}},
    "feedback-form":{area:{value:""},rating:{value:""},consent:{checked:false}}
  };
  const node=id=>{
    if(!nodes.has(id)){
      nodes.set(id,{
        hidden:false, disabled:false, textContent:"", value:"",
        classList:{toggle(){},contains(){return false;}},
        addEventListener(type,fn){handlers.set(id+":"+type,fn);},
        reset(){for(const field of Object.values(fields[id]||{})){if("value" in field)field.value="";if("checked" in field)field.checked=false;}},
        elements:{namedItem(name){return fields[id]?.[name]??null;}},
        focus(){}
      });
    }
    return nodes.get(id);
  };
  const document={
    title:"",hidden:false,body:{classList:{toggle(){},contains(){return false;}}},
    getElementById:node,addEventListener(){}
  };
  const user={id:"00000000-0000-4000-8000-000000000001",email:"private-tester@example.invalid"};
  const profile={user_id:user.id,display_name:"Private Tester",location_label:"Münsterland",bio:"Art",visible_in_discovery:false};
  let profileExists=true;
  const requested=[];
  const fetchMock=async(url,options={})=>{
    const path=new URL(url).pathname,method=options.method||"GET";
    requested.push({path,method});
    const respond=(json,status=200)=>({ok:status>=200&&status<300,status,json:async()=>json});
    if(path==="/auth/v1/token")return respond({access_token:"fake-in-memory-test-token"});
    if(path==="/auth/v1/user")return respond(user);
    if(path==="/rest/v1/prizmaa_private_members")
      return respond([{member_role:"tester",membership_state:approved?"active":"invited",adult_review_state:approved?"verified":"pending"}]);
    if(path==="/rest/v1/prizmaa_product_feedback")return feedbackOffline?respond(null,503):respond([]);
    if(path==="/rest/v1/prizmaa_private_profiles"){
      if(method==="DELETE"){if(profileDeletionWorks)profileExists=false;return respond(null,204);}
      return respond(profileExists?[profile]:[]);
    }
    throw Error("UNEXPECTED_TEST_REQUEST: "+path+" "+method);
  };
  const src=read("public/member/app.mjs").replace(/^import \{[^\n]+from "\.\/core\.mjs";\n/,"");
  assert.ok(!src.startsWith("import "),"ES module import must be replaced for isolated browser test");
  runInNewContext(src,{
    memberApproved,normalizeProfile,privateExport,
    normalizeFeedback:(area,rating,consent)=>({area,rating,consent}),
    document,window:{prompt:()=> "DELETE PROFILE",addEventListener(){}},
    fetch:fetchMock,URL,JSON,Error,Blob,setTimeout,encodeURIComponent
  },{timeout:2500});
  return {
    node,requested,
    async login(){
      fields["sign-in"].email.value=user.email;
      fields["sign-in"].password.value="not-a-real-password";
      await handlers.get("sign-in:submit")({preventDefault(){},currentTarget:node("sign-in")});
    },
    async deleteProfile(){
      await handlers.get("delete-btn:click")();
    }
  };
}

test("review-pending adult invitation remains signed in when optional feedback API fails",async()=>{
  const browser=simulatedMemberBrowser({approved:false,feedbackOffline:true});
  await browser.login();
  assert.equal(browser.node("private-area").hidden,false);
  assert.equal(browser.node("public-area").hidden,true);
  assert.equal(browser.node("profile-form").hidden,true);
  assert.match(browser.node("member-notice").textContent,/verified adult invitation/i);
  assert.match(browser.node("feedback-status").textContent,/temporarily unavailable/i);
  assert.doesNotMatch(browser.node("auth-status").textContent,/Sign-in could not/i);
  assert.ok(!browser.requested.some(x=>x.path==="/rest/v1/prizmaa_private_profiles"),"unreviewed members cannot open profile");
});

test("profile deletion never claims success after HTTP 204 when profile remains",async()=>{
  const browser=simulatedMemberBrowser({approved:true,profileDeletionWorks:false});
  await browser.login();
  assert.equal(browser.node("private-area").hidden,false);
  await browser.deleteProfile();
  assert.match(browser.node("profile-status").textContent,/could not be verified/i);
  assert.doesNotMatch(browser.node("profile-status").textContent,/was deleted/i);
  assert.equal(browser.node("profile-form").elements.namedItem("display_name").value,"Private Tester");
  assert.equal(browser.requested.filter(x=>x.path==="/rest/v1/prizmaa_private_profiles").at(-1).method,"GET");
});

test("profile deletion confirms owner-only readback before reporting success",async()=>{
  const browser=simulatedMemberBrowser({approved:true,profileDeletionWorks:true});
  await browser.login();
  await browser.deleteProfile();
  assert.match(browser.node("profile-status").textContent,/profile was deleted/i);
  assert.equal(browser.node("profile-form").elements.namedItem("display_name").value,"");
});
