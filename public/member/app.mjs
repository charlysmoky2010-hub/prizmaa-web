import { memberApproved, normalizeProfile, privateExport, normalizeFeedback } from "./core.mjs";
const BASE = "https://iyxmfiyvikrbfrscsaja.supabase.co";
const PUBLISHABLE = "sb_publishable_atY2p6cb7N0qpQrhCngO6A_LrSdBCDw";
const byId = (id) => document.getElementById(id);
const state = { token: null, user: null, member: null, profile: null, feedback: [] };
const authStatus = byId("auth-status"), profileStatus = byId("profile-status");
const notice = (el,text,error=false) => { el.textContent=text; el.classList.toggle("error", error); };
const setHidden = (id,yes) => { byId(id).hidden=!!yes; };
function reset() {
  state.token=null; state.user=null; state.member=null; state.profile=null;state.feedback=[];
  setHidden("private-area",true);setHidden("public-area",false);
  byId("profile-form").hidden=true;byId("feedback-form").hidden=true;
  byId("feedback-delete").disabled=true;byId("feedback-form").reset();
  byId("export-btn").disabled=true;byId("delete-btn").disabled=true;
  byId("sign-in").reset();byId("profile-form").reset();
  notice(authStatus,"Invite-only beta. No public accounts or profiles are shown.");
}
async function api(path, options={}) {
  const headers = { "apikey": PUBLISHABLE, "content-type":"application/json" };
  if(state.token) headers.authorization="Bearer "+state.token;
  const res = await fetch(BASE+path, { ...options,headers:{...headers,...(options.headers||{})},cache:"no-store",credentials:"omit",redirect:"error" });
  if(!res.ok) throw Error("REQUEST_REJECTED");
  if(res.status===204)return null;
  return res.json();
}
async function loadPrivate() {
  const u = await api("/auth/v1/user");
  if(!u || !u.id) throw Error("INVALID_SESSION");
  state.user={id:u.id,email:u.email};
  const id=encodeURIComponent(u.id);
  const rows=await api("/rest/v1/prizmaa_private_members?select=member_role,membership_state,adult_review_state&user_id=eq."+id);
  state.member=Array.isArray(rows)?rows[0]||null:null;
  setHidden("public-area",true);setHidden("private-area",false);
  byId("account-email").textContent="Signed in: "+(u.email||"private member");
  const approved=memberApproved(state.member);
  byId("member-state").textContent=approved?"Verified invited member":"Invitation review required";
  byId("member-notice").textContent=approved?"Your profile is private and only editable by you.":"A verified adult invitation is required. Profile access and public discovery remain blocked.";
  byId("profile-form").hidden=!approved;
  byId("feedback-form").hidden=!approved;
  byId("feedback-delete").disabled=false;
  const feedbackRows=await api("/rest/v1/prizmaa_product_feedback?select=feedback_id,area,rating,created_at&user_id=eq."+id+"&order=created_at.desc&limit=600");
  state.feedback=Array.isArray(feedbackRows)?feedbackRows:[];
  notice(byId("feedback-status"),"Stored ratings on this account: "+state.feedback.length+" (no free-text responses).");
  byId("export-btn").disabled=false;
  byId("delete-btn").disabled=!approved;
  if(approved) {
    const prof=await api("/rest/v1/prizmaa_private_profiles?select=user_id,display_name,location_label,bio,visible_in_discovery,updated_at&user_id=eq."+id);
    state.profile=Array.isArray(prof)?prof[0]||null:null;
    const form=byId("profile-form");
    form.elements.namedItem("display_name").value=state.profile?.display_name||"";
    form.elements.namedItem("location_label").value=state.profile?.location_label||"";
    form.elements.namedItem("bio").value=state.profile?.bio||"";
    notice(profileStatus,state.profile?"Private profile loaded. Discovery stays disabled.":"No profile yet. Create one privately.");
  } else {
    state.profile=null;
    notice(profileStatus,"Private profile editing requires verified invitation review.");
  }
}
byId("sign-in").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const btn=byId("login-btn");btn.disabled=true;
  notice(authStatus,"Checking your invitation…");
  const form=e.currentTarget;
  const email=String(form.elements.namedItem("email").value||"").trim();
  const password=String(form.elements.namedItem("password").value||"");
  try {
    const auth=await api("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
    if(!auth?.access_token)throw Error("LOGIN_FAILED");
    state.token=auth.access_token;
    form.elements.namedItem("password").value="";
    await loadPrivate();
  } catch {
    reset();
    notice(authStatus,"Sign-in could not be completed. Check your invitation, credentials and connection.",true);
  } finally { btn.disabled=false; }
});
byId("profile-form").addEventListener("submit",async(e)=>{
  e.preventDefault();if(!state.token||!state.user||!memberApproved(state.member))return;
  const form=e.currentTarget;
  const btn=byId("save-btn");btn.disabled=true;
  try {
    const fields={display_name:form.elements.namedItem("display_name").value,location_label:form.elements.namedItem("location_label").value,bio:form.elements.namedItem("bio").value};
    const payload={...normalizeProfile(fields),user_id:state.user.id};
    const rows=await api("/rest/v1/prizmaa_private_profiles?on_conflict=user_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(payload)});
    state.profile=Array.isArray(rows)?rows[0]||null:null;
    if(!state.profile || state.profile.user_id!==state.user.id || state.profile.visible_in_discovery!==false)throw Error("NOT_CONFIRMED");
    notice(profileStatus,"Saved to private authenticated storage. Public discovery remains OFF.");
  }catch(err){
    const kind=String(err?.message||"");
    notice(profileStatus,kind==="NAME_LENGTH"?"Use a name of 2–36 characters.":kind==="LOCATION_UNSAFE"?"Use a general region, not a postal code or coordinates.":kind==="BIO_LENGTH"?"Bio must be under 400 characters.":"Save was not confirmed. No public profile was created.",true);
  }finally{btn.disabled=false;}
});
byId("feedback-form").addEventListener("submit",async(e)=>{
  e.preventDefault();
  if(!state.token||!state.user||!memberApproved(state.member))return;
  const form=e.currentTarget,btn=byId("feedback-btn");
  btn.disabled=true;
  try{
    const data=normalizeFeedback(form.elements.namedItem("area").value,form.elements.namedItem("rating").value,form.elements.namedItem("consent").checked);
    const rows=await api("/rest/v1/prizmaa_product_feedback",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...data,user_id:state.user.id})});
    if(!Array.isArray(rows)||rows.length!==1||rows[0].user_id!==state.user.id)throw Error("NOT_CONFIRMED");
    state.feedback.unshift({feedback_id:rows[0].feedback_id,area:data.area,rating:data.rating,created_at:rows[0].created_at});
    form.reset();
    notice(byId("feedback-status"),"Thank you. Your optional rating was recorded. No profile or private conversations were analyzed.");
  }catch(err){
    const m=String(err?.message||"");
    notice(byId("feedback-status"),m==="FEEDBACK_CONSENT_REQUIRED"?"Please choose whether to opt in.":m==="FEEDBACK_AREA_INVALID"||m==="FEEDBACK_RATING_INVALID"?"Choose a valid area and rating.":"This rating was not confirmed. You may have already rated this area today.",true);
  }finally{btn.disabled=false;}
});
byId("feedback-delete").addEventListener("click",async()=>{
  if(!state.token||!state.user)return;
  if(window.prompt("Type DELETE FEEDBACK to erase your optional product ratings.")!=="DELETE FEEDBACK")return;
  const btn=byId("feedback-delete");btn.disabled=true;
  try{
    await api("/rest/v1/prizmaa_product_feedback?user_id=eq."+encodeURIComponent(state.user.id),{method:"DELETE"});
    state.feedback=[];
    notice(byId("feedback-status"),"Your ratings were deleted. Aggregated historical quality signals are not user identifiable.");
  }catch{notice(byId("feedback-status"),"Feedback deletion could not be confirmed.",true);}finally{btn.disabled=false;}
});
byId("export-btn").addEventListener("click",async()=>{
  if(!state.token||!state.user)return;
  try {
    const own=await api("/rest/v1/prizmaa_product_feedback?select=feedback_id,area,rating,created_at&user_id=eq."+encodeURIComponent(state.user.id)+"&order=created_at.desc&limit=600");
    if(!Array.isArray(own))throw Error("EXPORT_UNVERIFIED");
    state.feedback=own;
  } catch { notice(byId("feedback-status"),"Export was stopped because the feedback history could not be verified.",true); return; }
  const report={...privateExport(state.user,state.member,state.profile),optional_feedback:state.feedback};
  const data=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(data);
  const a=document.createElement("a");a.href=url;a.download="prizmaa-my-private-data.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
byId("delete-btn").addEventListener("click",async()=>{
  if(!state.token||!state.user||!memberApproved(state.member))return;
  if(window.prompt("Type DELETE PROFILE to remove your private profile. Your login account remains.")!=="DELETE PROFILE")return;
  byId("delete-btn").disabled=true;
  try{
    await api("/rest/v1/prizmaa_private_profiles?user_id=eq."+encodeURIComponent(state.user.id),{method:"DELETE"});
    state.profile=null;byId("profile-form").reset();
    notice(profileStatus,"Your private profile was deleted; login membership remains.");
  }catch{
    notice(profileStatus,"Deletion could not be verified. Please try again.",true);
  }finally{byId("delete-btn").disabled=false;}
});
byId("logout-btn").addEventListener("click",async()=>{
  try{if(state.token)await api("/auth/v1/logout",{method:"POST"});}catch{}
  reset();
});
function cover(on){
  document.body.classList.toggle("covered",on);
  document.title=on?"Notes":"PRIZMAA · Private Workspace";
  if(on)byId("restore").focus();
}
byId("quickhide").addEventListener("click",()=>cover(true));
byId("restore").addEventListener("click",()=>cover(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();cover(!document.body.classList.contains("covered"));}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)cover(true);});
window.addEventListener("pagehide",()=>{state.token=null;state.user=null;state.member=null;state.profile=null;state.feedback=[];});
reset();
