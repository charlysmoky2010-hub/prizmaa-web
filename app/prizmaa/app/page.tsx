"use client";

import { useState } from "react";
import styles from "./app.module.css";
import {
  login, logout, ownData, ownId, verified, cleanProfile, assertUUID, saveDownload, privateThreadQuery,
  type Session, type Member, type Profile, type Rating, type Match, type Message,
  type ReportReason
} from "@/lib/prizmaa/member-api";

type Tab = "profile" | "connections" | "feedback" | "safety";
const FEEDBACK_AREAS = ["onboarding","profile","privacy","navigation","accessibility","reliability"] as const;
const SAFE_REPORT_REASONS: ReportReason[] = ["harassment","spam","fake_profile","unsafe_behavior","other"];

export default function PrizmaaMemberApp() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [session,setSession]=useState<Session|null>(null);
  const [member,setMember]=useState<Member|null>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [ratings,setRatings]=useState<Rating[]>([]);
  const [matches,setMatches]=useState<Match[]>([]);
  const [peer,setPeer]=useState<Match|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [draft,setDraft]=useState("");
  const [displayName,setDisplayName]=useState("");
  const [region,setRegion]=useState("");
  const [bio,setBio]=useState("");
  const [feedbackArea,setFeedbackArea]=useState<(typeof FEEDBACK_AREAS)[number]>("privacy");
  const [feedbackRating,setFeedbackRating]=useState(3);
  const [feedbackConsent,setFeedbackConsent]=useState(false);
  const [reportReason,setReportReason]=useState<ReportReason>("harassment");
  const [tab,setTab]=useState<Tab>("profile");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("Invite-only beta · No public sign-ups or public discovery.");
  const [error,setError]=useState(false);
  const [covered,setCovered]=useState(false);
  const approved=verified(member);

  function flash(text:string,fail=false){setMessage(text);setError(fail);}
  function clearSession(){
    setSession(null);setMember(null);setProfile(null);setRatings([]);setMatches([]);setPeer(null);
    setMessages([]);setPassword("");setDraft("");setFeedbackConsent(false);setTab("profile");
  }
  async function task(action:()=>Promise<void>) {
    if(busy)return;
    setBusy(true);setError(false);
    try{await action();}catch(cause){
      flash(cause instanceof Error?cause.message:"This action was not verified. Please try again.",true);
    }finally{setBusy(false);}
  }
  async function loginMember(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    await task(async()=>{
      const s=await login(email,password);
      setPassword("");
      const id=ownId(s);
      const [memberRows,profileRows,feedbackRows]=await Promise.all([
        ownData<Member[]>(s,"/rest/v1/prizmaa_private_members?select=member_role,membership_state,adult_review_state&user_id=eq."+id),
        ownData<Profile[]>(s,"/rest/v1/prizmaa_private_profiles?select=*&user_id=eq."+id),
        ownData<Rating[]>(s,"/rest/v1/prizmaa_product_feedback?select=feedback_id,area,rating,created_at&user_id=eq."+id+"&limit=600")
      ]);
      setSession(s);setMember(memberRows[0]||null);
      const p=profileRows[0]||null;
      setProfile(p);setRatings(feedbackRows);
      setDisplayName(p?.display_name||"");setRegion(p?.location_label||"");setBio(p?.bio||"");
      flash(verified(memberRows[0]||null)?
        "Authenticated private workspace. Your profile is hidden from public discovery.":
        "Authenticated, but verified adult invitation is required. Personal editing is locked.");
    });
  }
  async function saveProfile(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!session||!approved)return;
    await task(async()=>{
      const payload={...cleanProfile(displayName,region,bio),user_id:session.userId};
      const rows=await ownData<Profile[]>(session,
        "/rest/v1/prizmaa_private_profiles?on_conflict=user_id",
        {method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(payload)});
      const p=rows[0];
      if(!p||p.user_id!==session.userId||p.visible_in_discovery!==false)
        throw Error("The private profile write was not confirmed.");
      setProfile(p);flash("Private profile saved in Supabase. Discovery remains disabled.");
    });
  }
  async function refreshConnections(){
    if(!session||!approved)return;
    await task(async()=>{
      const rows=await ownData<Match[]>(session,"/rest/v1/rpc/prizmaa_my_matches");
      if(!Array.isArray(rows))throw Error("Match verification failed.");
      setMatches(rows);setPeer(null);setMessages([]);
      flash(rows.length===0?
        "No mutual connections. Public discovery is intentionally disabled in this beta.":
        "Your mutual, authorized connections were loaded.");
    });
  }
  async function openConversation(p:Match){
    if(!session||!approved)return;
    await task(async()=>{
      assertUUID(p.user_id);
      if(!matches.some(m=>m.user_id===p.user_id))throw Error("This connection is not verified.");
      const rows=await ownData<Message[]>(session,privateThreadQuery(session.userId,p.user_id));
      if(!Array.isArray(rows)||rows.some(m=>
        !((m.sender_id===session.userId&&m.recipient_id===p.user_id)||
          (m.sender_id===p.user_id&&m.recipient_id===session.userId))))
        throw Error("Conversation data could not be safely verified.");
      setPeer(p);
      setMessages([...rows].reverse());
      flash("Latest 100 messages for this authorized conversation loaded. Database RLS protects access.");
    });
  }
  async function sendMessage(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!session||!peer||!approved)return;
    await task(async()=>{
      const body=draft.trim();
      if(body.length<1||body.length>1000)throw Error("Messages must be 1–1000 characters.");
      if(!matches.some(m=>m.user_id===peer.user_id))throw Error("Connection is no longer available.");
      const rows=await ownData<Message[]>(session,"/rest/v1/prizmaa_messages",
        {method:"POST",headers:{Prefer:"return=representation"},
        body:JSON.stringify({sender_id:session.userId,recipient_id:assertUUID(peer.user_id),body})});
      const saved=rows[0];
      if(!saved||saved.sender_id!==session.userId||saved.recipient_id!==peer.user_id)throw Error("Send not confirmed.");
      setMessages(previous=>[...previous,saved]);setDraft("");flash("Message stored. No public chat was opened.");
    });
  }
  async function blockPeer(){
    if(!session||!peer||!approved||!window.confirm("Block this connection? This will prevent further contact."))return;
    await task(async()=>{
      const rows=await ownData<{blocker_id:string;blocked_id:string}[]>(session,"/rest/v1/prizmaa_blocks",
        {method:"POST",headers:{Prefer:"return=representation"},
        body:JSON.stringify({blocker_id:session.userId,blocked_id:assertUUID(peer.user_id)})});
      if(!rows.some(b=>b.blocker_id===session.userId&&b.blocked_id===peer.user_id))
        throw Error("Block could not be confirmed.");
      setMatches(prev=>prev.filter(m=>m.user_id!==peer.user_id));
      setPeer(null);setMessages([]);flash("Connection blocked. Messaging access is revoked by database policy.");
    });
  }
  async function reportPeer(){
    if(!session||!peer||!approved||!window.confirm("Submit this safety report to PRIZMAA?"))return;
    await task(async()=>{
      const rows=await ownData<{report_id:string;reporter_id:string}[]>(session,"/rest/v1/prizmaa_reports",
        {method:"POST",headers:{Prefer:"return=representation"},
        body:JSON.stringify({reporter_id:session.userId,reported_id:assertUUID(peer.user_id),reason:reportReason,details:""})});
      if(!rows[0]?.report_id||rows[0]?.reporter_id!==session.userId)
        throw Error("Safety report was not confirmed.");
      flash("Report recorded. A human moderation response is not automated in this beta.");
    });
  }
  async function sendFeedback(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!session||!approved)return;
    await task(async()=>{
      if(!feedbackConsent)throw Error("Feedback requires explicit opt-in.");
      if(!FEEDBACK_AREAS.includes(feedbackArea)||!Number.isInteger(feedbackRating)||feedbackRating<1||feedbackRating>5)
        throw Error("Feedback rating is invalid.");
      const rows=await ownData<(Rating & {user_id:string})[]>(session,"/rest/v1/prizmaa_product_feedback",
        {method:"POST",headers:{Prefer:"return=representation"},
        body:JSON.stringify({user_id:session.userId,area:feedbackArea,rating:feedbackRating})});
      if(rows.length!==1||rows[0].user_id!==session.userId)throw Error("Feedback was not confirmed.");
      setRatings(prev=>[{...rows[0]},...prev]);setFeedbackConsent(false);
      flash("Opt-in rating stored. No private messages are used for model training.");
    });
  }
  async function exportOwnData(){
    if(!session)return;
    await task(async()=>{
      const id=ownId(session);
      const [ownProfile,ownFeedback]=await Promise.all([
        ownData<Profile[]>(session,"/rest/v1/prizmaa_private_profiles?select=*&user_id=eq."+id),
        ownData<Rating[]>(session,"/rest/v1/prizmaa_product_feedback?select=feedback_id,area,rating,created_at&user_id=eq."+id+"&limit=600")
      ]);
      saveDownload("prizmaa-private-profile-feedback.json",{exported_at:new Date().toISOString(),
        scope:"profile_and_feedback_only",email:session.email,profile:ownProfile[0]||null,feedback:ownFeedback});
      flash("Private profile and feedback download created locally. This is not a full account export.");
    });
  }
  async function deleteProfile(){
    if(!session||!approved||!window.confirm("Permanently delete your private profile? Your login account will remain."))return;
    await task(async()=>{
      const id=ownId(session);
      await ownData<null>(session,"/rest/v1/prizmaa_private_profiles?user_id=eq."+id,{method:"DELETE"});
      const check=await ownData<Profile[]>(session,"/rest/v1/prizmaa_private_profiles?select=user_id&user_id=eq."+id);
      if(check.length!==0)throw Error("Profile deletion has not been verified.");
      setProfile(null);setDisplayName("");setRegion("");setBio("");
      flash("Private profile deletion verified. Account deletion requires a separate controlled process.");
    });
  }
  async function deleteFeedback(){
    if(!session||!approved||!window.confirm("Delete your voluntary feedback records?"))return;
    await task(async()=>{
      const id=ownId(session);
      await ownData<null>(session,"/rest/v1/prizmaa_product_feedback?user_id=eq."+id,{method:"DELETE"});
      const check=await ownData<Rating[]>(session,"/rest/v1/prizmaa_product_feedback?select=feedback_id&user_id=eq."+id);
      if(check.length)throw Error("Feedback deletion was not verified.");
      setRatings([]);flash("Your voluntary ratings have been deleted.");
    });
  }
  async function signOut(){
    const s=session;clearSession();flash("Signed out. Access tokens were not stored in browser storage.");
    if(s)try{await logout(s);}catch{flash("Local session cleared; remote session revocation could not be verified.",true);}
  }
  return (
    <main className={styles.shell}>
      {covered?<div className={styles.cover} role="dialog" aria-modal="true">
        <h1>Workspace notes</h1><p>Quiet space for notes and planning.</p>
        <button onClick={()=>setCovered(false)}>Return to PRIZMAA</button>
      </div>:null}
      <header className={styles.header}>
        <a className={styles.brand} href="/prizmaa/app"><span>✳</span> PRIZMAA <small>PRIVATE ALPHA</small></a>
        <button className={styles.ghost} type="button" onClick={()=>setCovered(true)}>Quick hide ↗</button>
      </header>
      <section className={styles.intro}>
        <p className={styles.overline}>18+ · Invite only · Social connection, not a hookup chat</p>
        <h1>Be visible <em>only on your terms.</em></h1>
        <p>One authenticated workspace for your identity, private profile, consenting connections and safety. No fictional members, hidden location tracking or public directory.</p>
      </section>
      <section aria-live="polite" role="status" className={error?styles.error:styles.notice}>{message}</section>
      {!session?(
        <div className={styles.columns}>
          <section className={styles.panel}>
            <h2>Sign in</h2><p>Only invited, reviewed adults can access the private social workspace. Self-registration is disabled.</p>
            <form onSubmit={loginMember} className={styles.form}>
              <label>Email <input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} maxLength={240}/></label>
              <label>Password <input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8}/></label>
              <button type="submit" disabled={busy}>{busy?"Checking…":"Sign in securely"}</button>
            </form>
            <p className={styles.fine}>Token stays in memory only. Refreshing the page ends this browser session. There is no public registration or pretend onboarding.</p>
          </section>
          <section className={styles.panel}>
            <h2>What is actually available?</h2>
            <p>Private membership and profile storage use Supabase authentication and row-level security. Matching and messages are permitted only under server-side mutual-consent rules.</p>
            <div className={styles.rule}/><p><strong>Public discovery is OFF.</strong> Adult review and moderation are not automated. This is not a public launch.</p>
            <p className={styles.fine}>This Next.js route replaces the disconnected cultural-demo interface. The former UI is preserved separately for reference.</p>
          </section>
        </div>
      ):(
        <>
          <div className={styles.accountLine}>
            <span>Signed in: <strong>{session.email}</strong></span>
            <span className={styles.state}>{approved?"Verified invited member":"Review required"}</span>
            <button className={styles.ghost} type="button" onClick={signOut}>Sign out</button>
          </div>
          {!approved?(
            <section className={styles.panel}>
              <h2>Membership review is required</h2>
              <p>Your identity is authenticated, but an active adult-reviewed invitation is missing. Profile changes, connections and messages remain locked.</p>
              <p className={styles.fine}>This application cannot issue invitations or approve its own members. Only authorized human review may change membership status.</p>
            </section>
          ):(
            <>
              <nav className={styles.tabs} aria-label="Member workspace">
                {([
                  ["profile","My profile"],["connections","Connections"],["feedback","Feedback"],["safety","My controls"]
                ] as const).map(([id,label])=><button className={tab===id?styles.tabActive:styles.tab}
                  key={id} onClick={()=>setTab(id)} aria-current={tab===id?"page":undefined}>{label}</button>)}
              </nav>
              {tab==="profile"?(
                <div className={styles.columns}>
                  <section className={styles.panel}>
                    <h2>Private profile</h2><p>Only you can access or update this profile. Discovery is locked off in the database.</p>
                    <form className={styles.form} onSubmit={saveProfile}>
                      <label>Chosen name <input required value={displayName} onChange={e=>setDisplayName(e.target.value)} minLength={2} maxLength={36}/></label>
                      <label>General region (optional) <input value={region} onChange={e=>setRegion(e.target.value)} maxLength={44} placeholder="Münsterland — never an address"/></label>
                      <label>About me (optional) <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={400} rows={5}/></label>
                      <p className={styles.privacy}>🔒 Visibility: PRIVATE · No coordinates or identity traits are requested.</p>
                      <button disabled={busy} type="submit">Save private profile</button>
                    </form>
                  </section>
                  <section className={styles.panel}>
                    <h2>Privacy status</h2><p className={styles.state}>{profile?"Profile stored":"No profile yet"}</p>
                    <p>Supabase enforces owner-only read/write access. Even a modified browser cannot publish this profile through the current API.</p>
                    <p className={styles.fine}>Age verification is an invite-review state, not a facial scanner or a self-attested checkbox.</p>
                  </section>
                </div>
              ):null}
              {tab==="connections"?(
                <div className={styles.columns}>
                  <section className={styles.panel}>
                    <h2>Mutual connections</h2><p>Connections are read from the real privacy-scoped database function. Public member discovery and unsolicited contact remain disabled.</p>
                    <button disabled={busy} onClick={refreshConnections}>Refresh authorized connections</button>
                    <div className={styles.stack}>
                      {matches.length===0?<p className={styles.fine}>No connections available. Nothing has been fabricated.</p>:
                      matches.map(p=><button className={styles.connection} key={p.user_id} onClick={()=>openConversation(p)} disabled={busy}>
                        <strong>{p.display_name}</strong><span>{p.location_label||"Region private"}</span>
                      </button>)}
                    </div>
                  </section>
                  <section className={styles.panel}>
                    <h2>{peer?peer.display_name:"Private conversation"}</h2>
                    {!peer?<p>No conversation selected. Messaging requires a confirmed mutual connection.</p>:(
                      <>
                        <div className={styles.messages}>
                          {messages.length===0?<p className={styles.fine}>No messages in this authorized conversation.</p>:
                          messages.map(msg=><p className={msg.sender_id===session.userId?styles.sent:styles.received} key={msg.message_id}>{msg.body}</p>)}
                        </div>
                        <form className={styles.form} onSubmit={sendMessage}>
                          <label>Message <textarea value={draft} maxLength={1000} rows={3} onChange={e=>setDraft(e.target.value)}/></label>
                          <button type="submit" disabled={busy||!draft.trim()}>Send securely</button>
                        </form>
                        <div className={styles.row}>
                          <button className={styles.ghost} disabled={busy} onClick={blockPeer}>Block connection</button>
                        </div>
                        <label className={styles.reportLabel}>Report reason
                          <select value={reportReason} onChange={e=>setReportReason(e.target.value as ReportReason)}>
                            {SAFE_REPORT_REASONS.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
                          </select>
                        </label>
                        <button className={styles.ghost} disabled={busy} onClick={reportPeer}>Submit report</button>
                      </>
                    )}
                  </section>
                </div>
              ):null}
              {tab==="feedback"?(
                <div className={styles.columns}>
                  <section className={styles.panel}>
                    <h2>Help shape PRIZMAA</h2><p>Voluntary product-quality ratings only. Private chats and personal orientation are never submitted for learning.</p>
                    <form className={styles.form} onSubmit={sendFeedback}>
                      <label>Product area <select value={feedbackArea} onChange={e=>setFeedbackArea(e.target.value as typeof feedbackArea)}>
                        {FEEDBACK_AREAS.map(x=><option key={x} value={x}>{x}</option>)}
                      </select></label>
                      <label>Experience <select value={feedbackRating} onChange={e=>setFeedbackRating(Number(e.target.value))}>
                        {[1,2,3,4,5].map(x=><option value={x} key={x}>{x} / 5</option>)}
                      </select></label>
                      <label className={styles.consent}><input type="checkbox" required checked={feedbackConsent} onChange={e=>setFeedbackConsent(e.target.checked)}/>
                        I consent to storing this account-linked rating for up to 90 days. I can remove it myself.</label>
                      <button disabled={busy||!feedbackConsent}>Send optional rating</button>
                    </form>
                  </section>
                  <section className={styles.panel}><h2>My feedback</h2>
                    <p>Saved ratings: <strong>{ratings.length}</strong></p>
                    {ratings.slice(0,8).map(x=><p className={styles.item} key={x.feedback_id}>{x.area}: {x.rating}/5</p>)}
                    <button className={styles.ghost} onClick={deleteFeedback} disabled={busy||ratings.length===0}>Delete my ratings</button>
                  </section>
                </div>
              ):null}
              {tab==="safety"?(
                <div className={styles.columns}>
                  <section className={styles.panel}><h2>Data & account controls</h2>
                    <p>Download your private profile and optional product ratings. Full account export and account deletion are not automated in this alpha.</p>
                    <div className={styles.stack}>
                      <button className={styles.ghost} disabled={busy} onClick={exportOwnData}>Export profile and ratings</button>
                      <button className={styles.danger} disabled={busy||!profile} onClick={deleteProfile}>Delete my private profile</button>
                      <button className={styles.ghost} onClick={signOut}>Sign out</button>
                    </div>
                  </section>
                  <section className={styles.panel}><h2>Abuse prevention</h2>
                    <p>Mutual-match restrictions, block lists and report creation are enforced by server-side row security. Moderation staffing, age reviews and safety-response SLAs have not been verified.</p>
                    <p className={styles.privacy}>Never share an exact address or private identification data on PRIZMAA.</p>
                  </section>
                </div>
              ):null}
            </>
          )}
        </>
      )}
      <footer className={styles.footer}>PRIZMAA · Private alpha · English alpha · German localization pending · No public onboarding · No synthetic members · No claims of autonomous consciousness.</footer>
    </main>
  );
}
