/* PRIZMAA private founder: real auth and owner-scoped data. No tracking, no self registration. */
"use strict";
(()=>{
const cfg=Object.freeze(window.PRIZMA_CONFIG||{});
const host=String(cfg.url||"");
const key=String(cfg.publishableKey||"");
const deletion=String(cfg.deleteEndpoint||"");
const ready=/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(host)&&key.startsWith("sb_publishable_");
const $=id=>document.getElementById(id);
let jwt=null,person=null,membership=null,profile=null,busy=false;
function say(message,ok=false){const n=$("notice");n.textContent=message;n.classList.toggle("good",ok);n.hidden=false}
function lock(v){busy=v;["loginButton","saveButton","exportButton","logoutButton"].forEach(id=>{const x=$(id);if(x)x.disabled=v});$("deleteButton").disabled=v||$("deleteConfirm").value!=="DELETE MY ACCOUNT"}
function clear(){jwt=null;person=null;membership=null;profile=null;$("loginPanel").hidden=false;$("accountPanel").hidden=true;$("setupPanel").hidden=true;$("profileForm").hidden=true;$("loginForm").reset();$("profileForm").reset();$("deleteConfirm").value="";$("deleteButton").disabled=true}
async function call(url,method="GET",body,token){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),18000);
 try{const res=await fetch(url,{method,mode:"cors",credentials:"omit",cache:"no-store",headers:{"apikey":key,...(token?{"Authorization":"Bearer "+token}:{}),...(body===undefined?{}:{"content-type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:abort.signal});
 const data=await res.text();let result;try{result=data?JSON.parse(data):null}catch{result=null}
 if(!res.ok)throw Error("REQUEST_REJECTED_"+res.status);return result
 }finally{clearTimeout(timer)}
}
async function refresh(){
 const rows=await call(host+"/rest/v1/prizmaa_private_profiles?select=user_id,display_name,location_label,bio,visible_in_discovery&user_id=eq."+encodeURIComponent(person.id),"GET",undefined,jwt);
 profile=Array.isArray(rows)&&rows.length===1?rows[0]:null;
 $("displayVisibility").textContent="Not publicly discoverable";
 $("displayName").value=profile?.display_name||"";$("city").value=profile?.location_label||"";$("bio").value=profile?.bio||"";$("visible").checked=Boolean(profile?.visible_in_discovery)
}
async function enter(token,invite=false){
 const identity=await call(host+"/auth/v1/user","GET",undefined,token);
 if(!identity?.id||!identity.email||identity.is_anonymous)throw Error("INVALID_IDENTITY");
 const results=await call(host+"/rest/v1/prizmaa_private_members?select=user_id,member_role,membership_state,adult_review_state&user_id=eq."+encodeURIComponent(identity.id),"GET",undefined,token);
 if(!Array.isArray(results)||results.length!==1)throw Error("INVITATION_REQUIRED");
 jwt=token;person={id:identity.id,email:identity.email};membership=results[0];
 $("loginPanel").hidden=true;$("accountPanel").hidden=false;$("setupPanel").hidden=!invite;
 $("displayEmail").textContent=person.email;
 $("displayRole").textContent=membership.member_role==="founder"?"Founder · free":"Invited tester · free";
 const approved=membership.membership_state==="active"&&membership.adult_review_state==="verified";
 $("displayReview").textContent=approved?"Approved":"Awaiting administrator review";
 $("pendingNotice").hidden=approved;$("profileForm").hidden=!approved;
 await refresh();say(invite?"Invitation accepted; choose a password for future sign-ins.":"Signed in to your real private PRIZMAA account.",true);
}
$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();if(busy)return;if(!ready){say("Account service is not yet configured. Nothing was transmitted.");return}
 lock(true);try{const value=await call(host+"/auth/v1/token?grant_type=password","POST",{email:$("email").value.trim(),password:$("password").value});
 if(!value?.access_token)throw Error("NO_TOKEN");await enter(value.access_token);$("password").value="";
 }catch{clear();say("Sign-in could not be completed. PRIZMAA membership requires a verified invitation.")}finally{lock(false)}
});
$("setupForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!jwt||busy)return;
 const password=$("newPassword").value;
 if(password.length<12||password!==$("confirmPassword").value){say("Use at least 12 matching password characters.");return}
 lock(true);try{await call(host+"/auth/v1/user","PUT",{password},jwt);$("setupForm").reset();$("setupPanel").hidden=true;say("Password set. Your privacy and adult review status are unchanged.",true)}
 catch{say("Password update was not confirmed.")}finally{lock(false)}
});
$("profileForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!jwt||!person||busy)return;
 if(membership.membership_state!=="active"||membership.adult_review_state!=="verified"){say("Profile editing requires verified active membership.");return}
 const name=$("displayName").value.trim();if(name.length<2||name.length>36){say("Display name must be 2–36 characters.");return}
 const input={display_name:name,location_label:$("city").value.trim().slice(0,44),bio:$("bio").value.trim().slice(0,400),visible_in_discovery:$("visible").checked};
 lock(true);try{
 const endpoint=host+"/rest/v1/prizmaa_private_profiles";
 if(profile)await call(endpoint+"?user_id=eq."+encodeURIComponent(person.id),"PATCH",input,jwt);
 else await call(endpoint,"POST",{user_id:person.id,...input},jwt);
 await refresh();say("Your profile was saved in the isolated database. Other members cannot read it.",true)
 }catch{say("The database did not confirm the profile save.")}finally{lock(false)}
});
$("exportButton").addEventListener("click",async()=>{
 if(!jwt||!person||busy)return;lock(true);
 try{await refresh();
 const content=JSON.stringify({exported_at:new Date().toISOString(),account_email:person.email,membership,profile},null,2);
 const object=URL.createObjectURL(new Blob([content],{type:"application/json"}));
 const el=document.createElement("a");el.href=object;el.download="prizmaa-private-profile.json";document.body.append(el);el.click();el.remove();URL.revokeObjectURL(object);
 say("Your own membership and profile export was generated in this browser.",true)
 }catch{say("Data export was not completed.")}finally{lock(false)}
});
$("logoutButton").addEventListener("click",async()=>{
 const old=jwt;clear();say("Signed out from this browser tab.",true);
 if(old)try{await call(host+"/auth/v1/logout","POST",{},old)}catch{}
});
$("deleteConfirm").addEventListener("input",()=>{$("deleteButton").disabled=busy||$("deleteConfirm").value!=="DELETE MY ACCOUNT"});
$("deleteButton").addEventListener("click",async()=>{
 if(!jwt||busy||$("deleteConfirm").value!=="DELETE MY ACCOUNT")return;
 if(!deletion.startsWith(host+"/functions/v1/")){say("Deletion service is not active; no deletion attempted.");return}
 if(!window.confirm("Permanently delete your authenticated account and private profile? This cannot be undone."))return;
 lock(true);try{await call(deletion,"POST",{},jwt);clear();say("Account deletion confirmed by the server. You are signed out.",true)}
 catch{say("Deletion was not confirmed. Your account is NOT marked deleted.")}finally{lock(false)}
});
async function fromInvitation(){
 const p=new URLSearchParams(location.hash.replace(/^#/,""));
 const token=p.get("access_token");
 if(token||p.get("error"))history.replaceState(null,"",location.pathname);
 if(!token){if(p.get("error"))say("Invitation link was not accepted.");return}
 if(!ready){say("Account service is not yet configured.");return}
 lock(true);try{await enter(token,p.get("type")==="invite"||p.get("type")==="recovery")}
 catch{clear();say("This invitation is not authorized for the PRIZMAA founder project.")}
 finally{lock(false)}
}
if(!ready)say("Private account service configuration is pending. Please do not enter personal data yet.");
else void fromInvitation();
})();