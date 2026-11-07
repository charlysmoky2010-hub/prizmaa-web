import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {privateThreadQuery, loadMemberWorkspace} from "../lib/prizmaa/member-api.ts";
const read=p=>readFileSync(resolve(process.cwd(),p),"utf8");
const page=read("app/prizmaa/app/page.tsx");
const adapter=read("lib/prizmaa/member-api.ts");
const root=read("app/prizmaa/page.tsx");
const layout=read("app/prizmaa/layout.tsx");
const legacy=read("app/prizmaa/showcase/page.tsx");

test("one canonical application path, not old detached cultural demo",()=>{
  assert.match(root,/function PrizmaaWelcome/);
  assert.match(root,/href="\/prizmaa\/app"/);
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
const welcomeCss=read("app/prizmaa/welcome.module.css");
test("the homepage opens the safe landing and preserves restricted member access",()=>{
  assert.match(home,/redirect\(["']\/prizmaa["']\)/);
  assert.match(root,/function PrizmaaWelcome/);
  assert.match(root,/href="\/prizmaa\/app"/);
  assert.doesNotMatch(root,/\/auth\/v1\/signup/);
  assert.doesNotMatch(root,/localStorage|sessionStorage|service_role|sb_secret_/);
});
test("landing honestly describes availability and has no fictional users",()=>{
  assert.match(root,/18\+.*INVITE-ONLY PRIVATE BETA/);
  assert.match(root,/Registration and public discovery are not open/);
  assert.match(root,/Service availability is not yet verified/);
  assert.match(root,/Interface illustration · Not real profiles, activity or messages/);
  assert.match(root,/Age-review operations, moderation response times/);
  assert.match(root,/Connections with consent/);
  assert.match(root,/Private conversations/);
  assert.doesNotMatch(root,/Join now|Sign up now|members online|active users/i);
});
test("responsive landing and basic accessibility stay in the product",()=>{
  assert.match(root,/Skip to content/);
  assert.match(root,/aria-label="Main navigation"/);
  assert.match(root,/id="how-it-works"/);
  assert.match(root,/id="privacy"/);
  assert.match(welcomeCss,/@media \(max-width: 620px\)/);
  assert.match(welcomeCss,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(welcomeCss,/focus-visible/);
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

test("pending adult invitations never fetch private data; optional feedback failure cannot invalidate membership",async()=>{
  const previous=globalThis.fetch;
  const userId="11111111-1111-4111-8111-111111111111";
  const session={userId,accessToken:"mock-token-for-test",email:"preview@example.invalid"};
  const requests=[];
  let review="pending";
  let feedbackOffline=false;
  let profileOffline=false;
  globalThis.fetch=async (url)=>{
    const pathname=new URL(String(url)).pathname;
    requests.push(pathname);
    if(pathname==="/rest/v1/prizmaa_private_members")
      return new Response(JSON.stringify([{member_role:"tester",membership_state:"active",adult_review_state:review}]),{status:200,headers:{"content-type":"application/json"}});
    if(pathname==="/rest/v1/prizmaa_private_profiles")
      return profileOffline?new Response("Unavailable",{status:503}):
        new Response(JSON.stringify([{user_id:userId,display_name:"Tester",location_label:"",bio:"",visible_in_discovery:false}]),{status:200,headers:{"content-type":"application/json"}});
    if(pathname==="/rest/v1/prizmaa_product_feedback")
      return feedbackOffline?new Response("Unavailable",{status:503}):
        new Response("[]",{status:200,headers:{"content-type":"application/json"}});
    throw Error("Unexpected endpoint: "+pathname);
  };
  try {
    const pending=await loadMemberWorkspace(session);
    assert.equal(pending.member?.adult_review_state,"pending");
    assert.equal(pending.profile,null);
    assert.deepEqual(requests,["/rest/v1/prizmaa_private_members"],"pending members must never read restricted profile data");

    review="verified"; feedbackOffline=true;requests.length=0;
    const verifiedWithFeedbackOutage=await loadMemberWorkspace(session);
    assert.equal(verifiedWithFeedbackOutage.member?.adult_review_state,"verified");
    assert.equal(verifiedWithFeedbackOutage.profile?.user_id,userId);
    assert.equal(verifiedWithFeedbackOutage.profileUnavailable,false);
    assert.equal(verifiedWithFeedbackOutage.feedbackUnavailable,true);
    assert.deepEqual(verifiedWithFeedbackOutage.ratings,[]);
    assert.ok(requests.includes("/rest/v1/prizmaa_private_profiles"));
    assert.ok(requests.includes("/rest/v1/prizmaa_product_feedback"));

    profileOffline=true;feedbackOffline=false;requests.length=0;
    const verifiedWithProfileOutage=await loadMemberWorkspace(session);
    assert.equal(verifiedWithProfileOutage.member?.adult_review_state,"verified");
    assert.equal(verifiedWithProfileOutage.profile,null);
    assert.equal(verifiedWithProfileOutage.profileUnavailable,true);
    assert.equal(verifiedWithProfileOutage.feedbackUnavailable,false);
  }finally{globalThis.fetch=previous;}
});
