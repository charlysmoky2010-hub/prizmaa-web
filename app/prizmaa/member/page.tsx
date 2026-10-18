"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import "./member.css";

type Profile = { user_id: string; display_name: string; location_label: string; bio: string; visible_in_discovery: boolean; updated_at: string };
type Mode = "checking" | "signed_out" | "signed_in";

export default function PrizmaaMember() {
  const [mode, setMode] = useState<Mode>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const auth = await fetch("/api/social/auth", { cache: "no-store", credentials: "same-origin" });
      if (!auth.ok) { setMode("signed_out"); return; }
      const current = await auth.json();
      setAccount(String(current.email || ""));
      const response = await fetch("/api/social/profile", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) {
        setNotice("Your private profile could not be loaded. Nothing was published.");
        setMode("signed_in"); return;
      }
      const data = await response.json();
      const person = data.profile as Profile | null;
      setProfile(person);
      setName(person?.display_name || "");
      setRegion(person?.location_label || "");
      setBio(person?.bio || "");
      setMode("signed_in");
    } catch { setMode("signed_out"); setNotice("Connection unavailable. Please try again."); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/social/auth", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error === "INVITATION_OR_ADULT_REVIEW_REQUIRED"
          ? "This private beta requires an approved invitation and adult eligibility review."
          : data.error === "BACKEND_NOT_CONFIGURED" ? "The private beta is not yet connected to its member backend."
          : "Login not available. Check your invitation and credentials.");
        return;
      }
      setPassword("");
      await load();
    } catch { setNotice("Secure login is temporarily unavailable."); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(""); setBusy(true);
    try {
      const response = await fetch("/api/social/profile", {
        method: profile ? "PATCH" : "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name, location_label: region, bio,
          ...(profile ? {} : { visible_in_discovery: false })
        })
      });
      const data = await response.json();
      if (!response.ok) { setNotice("Profile not saved: " + (data.error || "Please try again.")); return; }
      setProfile(data.profile as Profile);
      setNotice("Saved securely. Your profile is not available in a public directory.");
    } catch { setNotice("Connection interrupted. Changes were not confirmed."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/social/auth", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" })
      });
      if (!response.ok) { setNotice("Sign out failed. Please try again."); return; }
      setProfile(null); setPassword(""); setAccount(""); setMode("signed_out");
    } catch { setNotice("Sign out failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="pz-member">
    <header className="pz-head">
      <a href="/prizmaa/member" className="pz-logo" aria-label="PRIZMAA member home">PRIZMAA<span>✦</span></a>
      <span className="pz-beta">18+ · PRIVATE BETA</span>
    </header>
    <main className="pz-main">
      <section>
        <div className="pz-overline">QUEER CONNECTIONS · REAL PEOPLE · PRIVACY FIRST</div>
        <h1 className="pz-hero">Meet. Flirt.<br/><em>Belong.</em></h1>
        <p className="pz-intro">A space for gay adults to connect on their own terms. Personal profiles, mutual consent and a community built around respect — without selling sensitive identities to advertisers.</p>
        <div className="pz-mini"><span>18+ only</span><span>Private by default</span><span>Invitation-based beta</span><span>No location tracking</span></div>
        <p className="pz-note">Private matching and messaging infrastructure is under restricted test. Public discovery, community groups, advertisements and payments are not enabled. No fabricated members or activity.</p>
      </section>
      <section className="pz-card" aria-live="polite">
        {mode === "checking" ? <><h2>Checking private access…</h2><p>Your session is being verified.</p></> :
         mode === "signed_out" ? <>
          <div className="pz-overline">INVITED MEMBERS</div>
          <h2>Welcome back.</h2>
          <p>Sign in with an existing, approved account. New public registration is not enabled.</p>
          <form className="pz-form" onSubmit={signIn}>
            <label>Email address <input type="email" value={email} autoComplete="username" maxLength={254} required onChange={e=>setEmail(e.target.value)} /></label>
            <label>Password <input type="password" value={password} autoComplete="current-password" minLength={8} maxLength={128} required onChange={e=>setPassword(e.target.value)} /></label>
            <button type="submit" className="pz-action" disabled={busy}>{busy?"Verifying…":"Sign in securely"} <span>→</span></button>
          </form>
          <p className="pz-note">Public sign-up remains disabled until age checks and moderation are ready.</p>
         </> :
         <>
          <div className="pz-account"><div><div className="pz-overline">PRIVATE MEMBER PROFILE</div><h2>Your PRIZMAA space</h2></div><button type="button" className="pz-secondary" onClick={signOut} disabled={busy}>Sign out</button></div>
          <p className="pz-state">Authorized session: {account}</p>
          <p><a className="pz-secondary" href="/prizmaa/connections">View mutual matches &amp; private messages →</a></p>
          <form className="pz-form" onSubmit={save}>
            <label>Display name <input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={36} required autoComplete="off" /></label>
            <label>General area (optional) <input value={region} onChange={e=>setRegion(e.target.value)} maxLength={44} autoComplete="off" /></label>
            <label>About you (optional) <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={400}/></label>
            <button type="submit" className="pz-action" disabled={busy}>{busy?"Saving…":profile?"Save private profile":"Create private profile"} <span>→</span></button>
          </form>
          <p className="pz-note">Your profile starts hidden. Public discovery is disabled in this pilot.</p>
         </>}
        {notice && <p className="pz-alert" role="status">{notice}</p>}
      </section>
    </main>
    <footer className="pz-footer">PRIZMAA · Protected product preview. No public directory, third-party advertising trackers or live checkout. Adult eligibility must be established before account approval.</footer>
  </div>;
}
