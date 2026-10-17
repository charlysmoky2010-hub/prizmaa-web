"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import "../member/member.css";
import "./connections.css";

type Match = { user_id: string; display_name: string; location_label: string; bio: string };
type Message = { message_id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type PageStatus = "checking" | "authorized" | "denied" | "unavailable";

export default function PrizmaaConnectionsPage() {
  const [status,setStatus] = useState<PageStatus>("checking");
  const [matches,setMatches] = useState<Match[]>([]);
  const [active,setActive] = useState<Match | null>(null);
  const [messages,setMessages] = useState<Message[]>([]);
  const [draft,setDraft] = useState("");
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [reportOpen,setReportOpen] = useState(false);
  const [reportReason,setReportReason] = useState("harassment");
  const [reportDetails,setReportDetails] = useState("");

  const refreshMatches = useCallback(async () => {
    const response = await fetch("/api/social/connections?view=matches", { credentials:"same-origin", cache:"no-store" });
    if (!response.ok) throw new Error("match_read");
    const data = await response.json();
    if (!Array.isArray(data.matches)) throw new Error("match_format");
    setMatches(data.matches);
    return data.matches as Match[];
  },[]);
  const refreshThread = useCallback(async (id:string) => {
    const response = await fetch("/api/social/connections?view=thread&peer="+encodeURIComponent(id), { credentials:"same-origin", cache:"no-store" });
    if (!response.ok) throw new Error("thread_read");
    const data = await response.json();
    if (!Array.isArray(data.messages)) throw new Error("thread_format");
    setMessages(data.messages);
  },[]);

  useEffect(() => {
    async function check() {
      try {
        const auth = await fetch("/api/social/auth", { credentials:"same-origin", cache:"no-store" });
        if (!auth.ok) { setStatus("denied"); return; }
        await refreshMatches();
        setStatus("authorized");
      } catch { setStatus("unavailable"); }
    }
    void check();
  },[refreshMatches]);

  async function selectMatch(match: Match) {
    setNotice(""); setActive(match); setMessages([]); setReportOpen(false);
    try { await refreshThread(match.user_id); }
    catch { setNotice("Chat history could not be loaded. Nothing was sent."); }
  }

  async function post(action: string, peer: string, more: Record<string,string>={}) {
    const response = await fetch("/api/social/connections", {
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action,peer,...more})
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || "action_failed");
  }

  async function send(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active || !draft.trim() || busy) return;
    setBusy(true); setNotice("");
    try {
      await post("message",active.user_id,{body:draft.trim()});
      setDraft("");
      await refreshThread(active.user_id);
    } catch(e) { setNotice("Message was not confirmed: "+ (e instanceof Error?e.message:"connection")); }
    finally {setBusy(false);}
  }
  async function block() {
    if (!active || busy) return;
    if (!window.confirm("Block this member? The mutual match and conversation access will end. This cannot be undone automatically.")) return;
    const id=active.user_id;
    setBusy(true);setNotice("");
    try {
      await post("block",id);
      setActive(null);setMessages([]);await refreshMatches();
      setNotice("Member blocked. Both likes were revoked.");
    } catch { setNotice("Block was not confirmed. Please try again."); }
    finally {setBusy(false);}
  }
  async function report(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active || busy) return;
    setBusy(true);setNotice("");
    try {
      await post("report",active.user_id,{reason:reportReason,details:reportDetails});
      setReportOpen(false);setReportDetails("");
      setNotice("Report stored privately. This pilot does not yet have an active moderation response service.");
    } catch { setNotice("The report could not be stored."); }
    finally {setBusy(false);}
  }

  return <div className="pz-member">
    <header className="pz-head">
      <a href="/prizmaa/member" className="pz-logo">PRIZMAA<span>✦</span></a>
      <span className="pz-beta">18+ · RESTRICTED PILOT</span>
    </header>
    <main className="pz-social">
      <div className="pz-social-top">
        <div><p className="pz-overline">PRIVATE SOCIAL CONNECTIONS</p><h1>Mutual connections.</h1><p>Only people who have chosen each other can exchange messages.</p></div>
        <a href="/prizmaa/member" className="pz-secondary">My profile ↗</a>
      </div>
      {status==="checking" ? <div className="pz-card"><p>Checking approved membership…</p></div> :
       status==="denied" ? <div className="pz-card"><h2>Private beta access only</h2><p>No invitations or public registrations are being issued while the platform is still in development.</p><a className="pz-secondary" href="/prizmaa/member">Return to PRIZMAA</a></div> :
       status==="unavailable" ? <div className="pz-card"><h2>Unable to verify access</h2><p>Service unavailable. No private information has been disclosed.</p></div> :
       <div className="pz-social-grid">
         <section className="pz-card pz-social-list">
           <h2>Matches <span className="pz-counter">{matches.length}</span></h2>
           <p className="pz-note">Profiles are never searchable publicly here. A match requires reciprocal, explicit interest.</p>
           {matches.length===0 ? <div className="pz-empty"><span aria-hidden="true">✧</span><h3>No matches yet</h3><p>We are building the product before inviting real members. This list contains no fabricated profiles.</p></div>
            : <div className="pz-match-stack">{matches.map(m=><button type="button" className={"pz-match "+(active?.user_id===m.user_id?"selected":"")} key={m.user_id} onClick={()=>void selectMatch(m)}><span className="pz-avatar">{m.display_name.slice(0,1).toUpperCase()}</span><span><strong>{m.display_name}</strong><small>{m.location_label || "Private location"}</small></span><span aria-hidden="true">↗</span></button>)}</div>}
         </section>
         <section className="pz-card pz-chat">
           {active ? <>
             <div className="pz-chat-head"><div><p className="pz-overline">MUTUAL CONNECTION</p><h2>{active.display_name}</h2><p className="pz-note">{active.bio || "No public bio"}</p></div><button className="pz-secondary" type="button" disabled={busy} onClick={()=>void block()}>Block</button></div>
             <div className="pz-messages" aria-live="polite">{messages.length===0?<p className="pz-note">No messages yet. You may start a conversation only with mutual consent.</p> : messages.map(message=><div className="pz-message" key={message.message_id}><p>{message.body}</p><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time></div>)}</div>
             <form className="pz-chat-send" onSubmit={send}><label htmlFor="pz-text-message" className="pz-overline">MESSAGE</label><textarea id="pz-text-message" value={draft} maxLength={1000} onChange={e=>setDraft(e.target.value)} placeholder="Write a respectful message…" required/><button type="submit" className="pz-action" disabled={busy || !draft.trim()}>{busy?"Sending…":"Send message"} <span>→</span></button></form>
             <button type="button" className="pz-text-button" onClick={()=>setReportOpen(v=>!v)}>Report a safety concern</button>
             {reportOpen && <form className="pz-report" onSubmit={report}>
               <label>Reason<select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="fake_profile">Fake profile</option><option value="unsafe_behavior">Unsafe behaviour</option><option value="other">Other</option></select></label>
               <label>Details<textarea maxLength={400} value={reportDetails} onChange={e=>setReportDetails(e.target.value)} /></label>
               <p className="pz-note">Reports are stored privately but no moderation team is active during the pilot.</p>
               <button className="pz-secondary" type="submit" disabled={busy}>Store report</button>
             </form>}
           </> : <div className="pz-empty pz-chat-placeholder"><span aria-hidden="true">✦</span><h2>Your conversations, your consent.</h2><p>Messages are available only for verified mutual matches. No profiles are invented to fill this screen.</p></div>}
         </section>
       </div>}
      {notice && <p className="pz-alert" role="status">{notice}</p>}
      <p className="pz-note">This is an access-controlled development environment, not a publicly operating dating platform. Discovery, support coverage, age verification and payments remain unavailable.</p>
    </main>
  </div>;
}
