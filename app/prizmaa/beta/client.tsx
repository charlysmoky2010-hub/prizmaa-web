"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  handle?: string;
  nickname: string;
  age: number;
  city: string;
  intent: string;
  bio?: string;
  visible?: number;
  avatar_color?: string;
  avatar_icon?: string;
  role?: string;
  tags?: string;
  is_vip?: number;
  unread_count?: number;
};
type ApiResult = { ok: true; profile?: Member; people?: Member[]; matches?: Member[]; messages?: ChatMessage[]; export?: unknown; mutual?: boolean };
type ChatMessage = { id: string; from_id: string; to_id: string; body: string; created_at: string; read_at: string | null };
type ProfileForm = { nickname: string; age: number; city: string; intent: string; bio: string; visible: boolean; avatar_color: string; avatar_icon: string; role: string; tags: string };
type Screen = "discover" | "matches" | "profile";

const INTENTS = ["Flirting", "Dating", "Relationship", "Hookup"] as const;
const AVATAR_COLORS = ["violet", "emerald", "rose", "blue", "amber"];
const emptyProfile: ProfileForm = { nickname: "", age: 18, city: "", intent: "Dating", bio: "", visible: false, avatar_color: "violet", avatar_icon: "prism", role: "Open", tags: "" };

async function api(op: string, data?: Record<string, unknown>): Promise<ApiResult> {
  const url = "/api/prizmaa/core";
  const response = await fetch(data === undefined ? `${url}?op=${encodeURIComponent(op)}` : url, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify({ op, ...data }),
  });
  const payload: { ok?: boolean; error?: string } = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "REQUEST_FAILED");
  return payload as ApiResult;
}

function initials(name: string) { return name.trim().slice(0, 2).toUpperCase() || "✦"; }
function Avatar({person, large = false}: {person: Member; large?: boolean}) {
  const hue: Record<string, string> = { violet: "#aa74ff", emerald: "#64e3b2", rose: "#fd8bab", blue: "#8dbbff", amber: "#e5c071" };
  return <span className={large ? "prizmaa-avatar large" : "prizmaa-avatar"} style={{ "--avatar-color": hue[person.avatar_color || "violet"] || "#aa74ff" } as React.CSSProperties} aria-hidden="true">{initials(person.nickname)}</span>;
}

export default function BetaClient() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [profile, setProfile] = useState<Member | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [auth, setAuth] = useState({handle:"", nickname:"", age:"", password:"", adult:false, acceptRules:false});
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [screen, setScreen] = useState<Screen>("discover");
  const [people, setPeople] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Member[]>([]);
  const [filters, setFilters] = useState({search:"", intent:"All"});
  const [selected, setSelected] = useState<Member | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    let mounted = true;
    void api("me").then(async result => {
      if (!mounted || !result.profile) return;
      setProfile(result.profile);
      setForm(fromProfile(result.profile));
      const [p, m] = await Promise.all([api("people"), api("matches")]);
      if (mounted) { setPeople(p.people || []); setMatches(m.matches || []); }
    }).catch(() => { /* Local prototype may have no current session. */ })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function run(work: () => Promise<void>) {
    setBusy(true); setFeedback("");
    try { await work(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "REQUEST_FAILED"); }
    finally { setBusy(false); }
  }
  function fromProfile(p: Member): ProfileForm {
    return { nickname:p.nickname, age:p.age, city:p.city || "", intent:p.intent, bio:p.bio || "", visible:p.visible === 1, avatar_color:p.avatar_color || "violet", avatar_icon:p.avatar_icon || "prism", role:p.role || "Open", tags:p.tags || "" };
  }
  async function refreshMembers(search=filters.search, intent=filters.intent) {
    const query = new URLSearchParams({op:"people",q:search,intent});
    const response = await fetch("/api/prizmaa/core?" + query, {cache:"no-store", credentials:"same-origin"});
    const payload: {ok?:boolean; error?:string; people?:Member[]} = await response.json();
    if(!response.ok || !payload.ok) throw new Error(payload.error || "DISCOVERY_FAILED");
    setPeople(payload.people || []);
  }
  async function refreshMatches() { const r=await api("matches"); setMatches(r.matches || []); }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const r = await api(mode, mode === "signup" ? {
        handle:auth.handle, nickname:auth.nickname, age:Number(auth.age),
        password:auth.password, adult:auth.adult, acceptRules:auth.acceptRules,
      } : {handle:auth.handle, password:auth.password});
      if (r.profile) {
        setProfile(r.profile);
        setForm(fromProfile(r.profile));
        setAuth(a => ({...a,password:""}));
        await Promise.all([refreshMembers(),refreshMatches()]);
      }
    });
  }
  async function signOut() {
    await run(async () => {
      await api("logout", {});
      setProfile(null); setSelected(null); setPeople([]); setMatches([]); setMessages([]); setMessage("");
    });
  }
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const r=await api("profile", {...form});
      if(r.profile){setProfile(r.profile);setForm(fromProfile(r.profile));}
      setFeedback("PROFIL_GESPEICHERT");
    });
  }
  async function like(person: Member) {
    await run(async () => {
      const r=await api("like",{target:person.id});
      await Promise.all([refreshMembers(),refreshMatches()]);
      setFeedback(r.mutual ? "MATCH_VERIFIED" : "LIKE_SAVED");
    });
  }
  async function openChat(person:Member) {
    await run(async () => {
      // A chat is fetched only with an explicit target, never via unrelated data.
      const response=await fetch("/api/prizmaa/core?op=chat&with="+encodeURIComponent(person.id),{credentials:"same-origin",cache:"no-store"});
      const result:{ok?:boolean;error?:string;messages?:ChatMessage[]}=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"CHAT_UNAVAILABLE");
      setSelected(person);setMessages(result.messages||[]);
      await refreshMatches();
    });
  }
  async function send(event:React.FormEvent) {
    event.preventDefault();if(!selected||!message.trim())return;
    await run(async () => {
      await api("message",{target:selected.id,text:message});
      setMessage("");
      const response=await fetch("/api/prizmaa/core?op=chat&with="+encodeURIComponent(selected.id),{credentials:"same-origin",cache:"no-store"});
      const result:{ok?:boolean;error?:string;messages?:ChatMessage[]}=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"CHAT_UNAVAILABLE");
      setMessages(result.messages||[]);
      await refreshMatches();
    });
  }
  async function block(person:Member) {
    if(!window.confirm("Diese Person blockieren? Bestehende Matches werden aufgehoben."))return;
    await run(async () => {
      await api("block",{target:person.id});
      setSelected(null);await Promise.all([refreshMembers(),refreshMatches()]);
      setFeedback("BLOCK_SAVED");
    });
  }
  async function report(person:Member) {
    if(!reportReason){setFeedback("Bitte zuerst einen Meldegrund wählen.");return;}
    if(!window.confirm("Profil melden und gleichzeitig blockieren?"))return;
    await run(async () => {
      await api("report",{target:person.id,reason:reportReason});
      setSelected(null);setReportReason("");
      await Promise.all([refreshMembers(),refreshMatches()]);
      setFeedback("REPORT_SAVED");
    });
  }
  async function exportData() {
    await run(async () => {
      const result=await api("export");
      const blob=new Blob([JSON.stringify(result.export,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;link.download="prizmaa-my-data.json";link.click();
      URL.revokeObjectURL(url);
    });
  }
  async function deleteAccount() {
    const phrase=window.prompt("Permanente Kontolöschung. Gib DELETE MY ACCOUNT ein:");
    if(phrase!=="DELETE MY ACCOUNT")return;
    await run(async () => {
      await api("delete_account",{confirm:phrase});
      setProfile(null);setSelected(null);setPeople([]);setMatches([]);setMessages([]);
    });
  }

  return <main className="prizmaa-beta">
    <div className="prizmaa-wrap">
      <header className="prizmaa-nav">
        <span className="prizmaa-logotype">PRIZMAA<span>✦</span></span>
        <span className="prizmaa-chip">18+ · PRIVATE LOCAL BETA</span>
        {profile ? <button type="button" className="prizmaa-button secondary" onClick={()=>void signOut()} disabled={busy}>Abmelden</button> : null}
      </header>
      <section className="prizmaa-hero">
        <div className="prizmaa-orb" aria-hidden="true"><i/><i/><i/></div>
        <div>
          <p className="prizmaa-eyebrow">Connection is more than a swipe</p>
          <h1>Find your people.<br/><em>Keep your boundaries.</em></h1>
          <p className="prizmaa-lead">Ein geschützter Raum für erwachsene schwule und queere Männer: Kennenlernen, Flirten, echte Gespräche – mit Kontrolle über die eigene Sichtbarkeit.</p>
          <div className="prizmaa-rules"><span>Opt-in Sichtbarkeit</span><span>Chats nach Match</span><span>Blockieren &amp; Melden</span></div>
        </div>
      </section>
      {feedback && <p role="status" className="prizmaa-feedback">{feedback}</p>}
      {loading ? <p className="prizmaa-panel">Lokale Sitzung wird geprüft …</p> : !profile ? (
        <section className="prizmaa-panel prizmaa-auth" aria-label="Mitgliedszugang">
          <div><p className="prizmaa-eyebrow">LOCAL DEVELOPMENT</p><h2>Dein Raum beginnt hier.</h2><p className="prizmaa-muted">Nur für lokale Entwicklung. Keine öffentlichen Konten, keine echten Altersnachweise und kein bezahlter Zugang.</p></div>
          <div>
            <div className="prizmaa-tabbar">
              <button type="button" aria-pressed={mode==="signup"} onClick={()=>setMode("signup")}>Registrieren</button>
              <button type="button" aria-pressed={mode==="login"} onClick={()=>setMode("login")}>Anmelden</button>
            </div>
            <form className="prizmaa-form" onSubmit={e=>void signIn(e)}>
              <label>Benutzername<input autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={auth.handle} onChange={e=>setAuth({...auth,handle:e.target.value})}/></label>
              {mode==="signup" && <>
                <label>Gewählter Anzeigename<input required minLength={2} maxLength={36} value={auth.nickname} onChange={e=>setAuth({...auth,nickname:e.target.value})}/></label>
                <label>Alter<input type="number" min={18} max={90} required value={auth.age} onChange={e=>setAuth({...auth,age:e.target.value})}/></label>
              </>}
              <label>Passwort<input autoComplete={mode==="signup"?"new-password":"current-password"} required type="password" minLength={mode==="signup"?12:1} value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label>
              {mode==="signup" && <>
                <label className="prizmaa-check"><input type="checkbox" checked={auth.adult} onChange={e=>setAuth({...auth,adult:e.target.checked})}/> Ich bestätige, dass ich mindestens 18 Jahre alt bin. (Keine unabhängige Altersprüfung)</label>
                <label className="prizmaa-check"><input type="checkbox" checked={auth.acceptRules} onChange={e=>setAuth({...auth,acceptRules:e.target.checked})}/> Ich akzeptiere die Regeln für Respekt, Einverständnis und Schutz der Privatsphäre.</label>
              </>}
              <button className="prizmaa-button primary" disabled={busy}>{mode==="signup"?"Privates Testkonto anlegen":"Anmelden"}</button>
            </form>
          </div>
        </section>
      ) : (
        <section className="prizmaa-dashboard">
          <div className="prizmaa-member-head"><div><p className="prizmaa-eyebrow">WELCOME BACK</p><h2>Hallo, {profile.nickname} <span>✦</span></h2></div><span className="prizmaa-visibility">{profile.visible===1?"Profil sichtbar":"Profil privat"}</span></div>
          <nav className="prizmaa-tabbar" aria-label="Mitgliederbereiche">
            <button aria-pressed={screen==="discover"} onClick={()=>setScreen("discover")}>Entdecken</button>
            <button aria-pressed={screen==="matches"} onClick={()=>setScreen("matches")}>Verbindungen {matches.length ? "("+matches.length+")":""}</button>
            <button aria-pressed={screen==="profile"} onClick={()=>setScreen("profile")}>Mein Profil</button>
          </nav>
          {screen==="discover" && <>
            <div className="prizmaa-filters">
              <label>Suche<input aria-label="Nickname, Stadt oder Beschreibung" placeholder="Name, Stadt oder Interesse" value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})}/></label>
              <label>Interesse<select value={filters.intent} onChange={e=>setFilters({...filters,intent:e.target.value})}><option>All</option>{INTENTS.map(x=><option key={x}>{x}</option>)}</select></label>
              <button type="button" className="prizmaa-button secondary" disabled={busy} onClick={()=>void run(()=>refreshMembers())}>Suchen</button>
            </div>
            <div className="prizmaa-grid">
              {people.length===0 ? <div className="prizmaa-panel prizmaa-empty">Noch keine sichtbaren Mitglieder gefunden. Es gibt keine erfundenen Profile; neue Profile bleiben standardmäßig privat.</div> : people.map(p=><article className="prizmaa-person" key={p.id}>
                <Avatar person={p} large/>
                <h3>{p.nickname}, {p.age}</h3><p className="prizmaa-muted">{p.city||"Region nicht angegeben"} · {p.intent}</p>
                <p className="prizmaa-bio">{p.bio||"Keine Beschreibung"}</p>
                <p className="prizmaa-tags">{p.tags||"Noch keine Interessen angegeben"}</p>
                <div className="prizmaa-card-actions"><button type="button" className="prizmaa-button primary" disabled={busy} onClick={()=>void like(p)}>♥ Gefällt mir</button><button type="button" className="prizmaa-button subtle" disabled={busy} onClick={()=>void block(p)}>Block</button></div>
                <div className="prizmaa-report"><select aria-label={"Meldegrund für "+p.nickname} value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="">Meldegrund wählen</option>{["Harassment","Fake profile","Underage concern","Non-consensual content","Other"].map(x=><option key={x}>{x}</option>)}</select><button type="button" onClick={()=>void report(p)} disabled={busy}>Melden</button></div>
              </article>)}
            </div>
          </>}
          {screen==="matches" && <div className="prizmaa-columns">
            <div className="prizmaa-panel"><h3>Gegenseitige Matches</h3><p className="prizmaa-muted">Ein Chat wird erst bei beiderseitigem Interesse freigeschaltet.</p>
              {matches.length===0?<p className="prizmaa-empty">Noch keine gegenseitigen Matches.</p>:matches.map(p=><button className="prizmaa-contact" key={p.id} type="button" onClick={()=>void openChat(p)} disabled={busy}><Avatar person={p}/><span>{p.nickname}{Number(p.unread_count)>0?<small> · {p.unread_count} neu</small>:null}</span> <span aria-hidden="true">↗</span></button>)}
            </div>
            <div className="prizmaa-panel prizmaa-chat">{selected ? <>
              <div className="prizmaa-contact"><Avatar person={selected}/><strong>{selected.nickname}</strong></div>
              <div className="prizmaa-messages" aria-live="polite">{messages.map(m=><p className={m.from_id===profile.id?"prizmaa-bubble mine":"prizmaa-bubble"} key={m.id}>{m.body}</p>)}{messages.length===0?<p className="prizmaa-muted">Schreib eure erste Nachricht.</p>:null}</div>
              <form className="prizmaa-send" onSubmit={e=>void send(e)}><input aria-label="Nachricht" maxLength={600} placeholder="Nachricht schreiben …" value={message} onChange={e=>setMessage(e.target.value)}/><button className="prizmaa-button primary" disabled={busy||!message.trim()}>Senden</button></form>
            </>:<div className="prizmaa-empty">Wähle ein Match, um eure Unterhaltung zu öffnen.</div>}</div>
          </div>}
          {screen==="profile" && <div className="prizmaa-columns">
            <form className="prizmaa-panel prizmaa-form" onSubmit={e=>void saveProfile(e)}><h3>Dein Profil</h3><p className="prizmaa-muted">Du bestimmst, wann andere dich entdecken können.</p>
              <label>Anzeigename<input required minLength={2} value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})}/></label>
              <label>Alter<input type="number" min={18} max={90} required value={form.age} onChange={e=>setForm({...form,age:Number(e.target.value)})}/></label>
              <label>Stadt (freiwillig)<input maxLength={44} value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
              <label>Absicht<select value={form.intent} onChange={e=>setForm({...form,intent:e.target.value})}>{INTENTS.map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Kurzprofil<textarea rows={3} maxLength={400} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></label>
              <label>Interessen (durch Komma getrennt)<input maxLength={140} value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/></label>
              <label>Profilfarbe<select value={form.avatar_color} onChange={e=>setForm({...form,avatar_color:e.target.value})}>{AVATAR_COLORS.map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="prizmaa-check"><input type="checkbox" checked={form.visible} onChange={e=>setForm({...form,visible:e.target.checked})}/> Mein Profil für andere angemeldete Testmitglieder sichtbar machen</label>
              <button className="prizmaa-button primary" disabled={busy}>Änderungen speichern</button>
            </form>
            <aside className="prizmaa-panel"><h3>Deine Daten. Deine Entscheidung.</h3><p className="prizmaa-muted">Keine präzise Standortverfolgung. Keine Werbetracker. Keine unabhängige Altersverifikation in dieser Entwicklungsversion.</p>
              <button type="button" className="prizmaa-button secondary" disabled={busy} onClick={()=>void exportData()}>Meine Daten exportieren</button>
              <p className="prizmaa-muted">PRIZMAA Plus ist pausiert. Es erfolgt keine Freischaltung ohne unabhängig bestätigten Zahlungsvorgang.</p>
              <button type="button" className="prizmaa-button danger" disabled={busy} onClick={()=>void deleteAccount()}>Konto dauerhaft löschen</button>
            </aside>
          </div>}
        </section>
      )}
      <footer className="prizmaa-footer"><span>PRIZMAA · Private software prototype</span><span>Keine öffentlich buchbare Mitgliedschaft · Kein bestätigter Umsatz</span></footer>
    </div>
  </main>;
}
