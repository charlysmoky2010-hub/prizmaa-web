'use client';

import React, { useCallback, useEffect, useState } from 'react';
import './beta.css';

type Tab = 'discover' | 'matches' | 'messages' | 'profile';
type Intent = 'All' | 'Flirting' | 'Dating' | 'Relationship' | 'Hookup';
type Member = {
  id: string; nickname: string; age: number; city: string; intent: string;
  bio?: string; avatar_color?: string; avatar_icon?: string; role?: string;
  tags?: string; handle?: string; visible?: number | boolean; is_vip?: number | boolean;
  unread_count?: number;
};
type ChatMessage = { id: string; from_id: string; to_id: string; body: string; created_at: string; read_at?: string | null };
type ApiResult = { ok?: boolean; error?: string; profile?: Member; people?: Member[]; matches?: Member[]; messages?: ChatMessage[]; liked?: boolean; mutual?: boolean; };
type Form = { nickname: string; age: string; city: string; intent: string; bio: string; visible: boolean; avatar_color: string; role: string; tags: string };
const defaultForm: Form = { nickname: '', age: '25', city: '', intent: 'Dating', bio: '', visible: false, avatar_color: 'violet', role: 'Open', tags: '' };
const demoPeople: Member[] = [
  { id: 'demo-1', nickname: 'Alex', age: 29, city: 'Berlin', intent: 'Dating', bio: 'Architecture, late-night jazz and spontaneous weekend escapes.', avatar_color: 'rose', role: 'Open', tags: 'Art,Travel' },
  { id: 'demo-2', nickname: 'Noah', age: 34, city: 'Amsterdam', intent: 'Relationship', bio: 'Bookshops, good coffee and conversations that last.', avatar_color: 'violet', role: 'Open', tags: 'Books,Coffee' },
  { id: 'demo-3', nickname: 'Elias', age: 27, city: 'Cologne', intent: 'Flirting', bio: 'Design obsessive. Always curious, never boring.', avatar_color: 'mint', role: 'Open', tags: 'Design,Music' },
  { id: 'demo-4', nickname: 'Theo', age: 31, city: 'Münster', intent: 'Dating', bio: 'Soft heart, strong espresso and very bad puns.', avatar_color: 'copper', role: 'Open', tags: 'Fitness,Food' },
  { id: 'demo-5', nickname: 'Luca', age: 30, city: 'Milan', intent: 'Flirting', bio: 'Cinema, galleries, golden-hour walks.', avatar_color: 'blue', role: 'Open', tags: 'Cinema,Art' },
  { id: 'demo-6', nickname: 'Sam', age: 36, city: 'Hamburg', intent: 'Relationship', bio: 'Looking for connection, not just another scroll.', avatar_color: 'grape', role: 'Open', tags: 'Nature,Travel' },
];
const intents: Intent[] = ['All', 'Flirting', 'Dating', 'Relationship', 'Hookup'];
const reportReasons = ['Harassment', 'Fake profile', 'Underage concern', 'Non-consensual content', 'Other'];
const humanError: Record<string, string> = {
  PRIVATE_LOCAL_MVP_DISABLED: 'Private local development is not enabled.',
  PRIVATE_BETA_NOT_PUBLIC: 'Public registration is disabled until safety and storage review.',
  LOGIN_REQUIRED: 'Sign in to use this feature.',
  INVALID_LOGIN: 'Username or password is incorrect.',
  INVALID_REGISTRATION: 'Please use a unique 3–24 character username, a 12+ character password, and confirm you are an adult.',
  HANDLE_TAKEN: 'That username is already in use.',
  INVALID_PROFILE: 'Check your profile details. You must be 18+.',
  TARGET_UNAVAILABLE: 'This profile is not available.',
  MATCH_REQUIRED: 'Messages unlock after both people like each other.',
  RATE_LIMITED: 'Please wait before trying again.',
  PAYMENT_VERIFICATION_REQUIRED: 'Premium access cannot be activated until a verified payment integration exists.',
};

async function api(query: string, data?: Record<string, unknown>): Promise<ApiResult> {
  const url = '/api/prizmaa/core' + (data ? '' : query.startsWith('chat&with=') ? '?op=chat&with=' + encodeURIComponent(query.slice('chat&with='.length)) : '?op=' + encodeURIComponent(query));
  const response = await fetch(url, data ? {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ op: query, ...data }),
  } : { credentials: 'same-origin', cache: 'no-store' });
  const result = await response.json().catch(() => ({})) as ApiResult;
  if (!response.ok || !result.ok) throw new Error(result.error || 'REQUEST_FAILED');
  return result;
}
function Avatar({ person, large = false }: { person: Member; large?: boolean }) {
  const initial = person.nickname.trim().slice(0, 1).toUpperCase();
  return <div className={'pzb-avatar pzb-' + (person.avatar_color || 'violet') + (large ? ' pzb-avatar-lg' : '')} aria-label={'Illustrated avatar for ' + person.nickname}>
    <div className="pzb-halo" /><div className="pzb-figure"><div className="pzb-head" /><div className="pzb-shoulders" /></div><span className="pzb-initial">{initial}</span>
  </div>;
}
function Logo() {
  return <span className="pzb-logo"><span className="pzb-mark">P<span>✦</span></span><span>PRIZMAA<small>PRIVATE CONNECTIONS</small></span></span>;
}
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export default function PrizmaaDatingStudio() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tab, setTab] = useState<Tab>('discover');
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [me, setMe] = useState<Member | null>(null);
  const [profiles, setProfiles] = useState<Member[]>([]);
  const [connections, setConnections] = useState<Member[]>([]);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [intent, setIntent] = useState<Intent>('All');
  const [search, setSearch] = useState('');
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [signupAge, setSignupAge] = useState('25');
  const [accepted, setAccepted] = useState(false);
  const [profileForm, setProfileForm] = useState<Form>(defaultForm);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reportTarget, setReportTarget] = useState<Member | null>(null);
  const [reportReason, setReportReason] = useState(reportReasons[0]);

  const syncMe = useCallback(async () => {
    try {
      const r = await api('me');
      const u = r.profile ?? null;
      setMe(u);
      if (u) setProfileForm({
        nickname: u.nickname, age: String(u.age), city: u.city || '',
        intent: u.intent || 'Dating', bio: u.bio || '', visible: Boolean(u.visible),
        avatar_color: u.avatar_color || 'violet', role: u.role || 'Open', tags: u.tags || '',
      });
    } catch { setMe(null); }
  }, []);

  useEffect(() => {
    if (!ageConfirmed) return;
    let live = true;
    (async () => {
      try {
        const status = await api('health');
        if (!live) return;
        setEnabled(status.ok === true);
        if (status.ok) await syncMe();
      } catch { if (live) setEnabled(false); }
      finally { if (live) setChecking(false); }
    })();
    return () => { live = false; };
  }, [ageConfirmed, syncMe]);

  const refresh = useCallback(async () => {
    if (!enabled || !me) return;
    const [p, m] = await Promise.all([api('people'), api('matches')]);
    setProfiles(p.people || []);
    setConnections(m.matches || []);
  }, [enabled, me]);

  useEffect(() => { if (ageConfirmed && me) void refresh().catch(() => setNotice('Could not load profiles.')); }, [ageConfirmed, me, refresh]);

  async function perform(task: () => Promise<void>) {
    setBusy(true); setNotice('');
    try { await task(); }
    catch (e) { const code = e instanceof Error ? e.message : 'REQUEST_FAILED'; setNotice(humanError[code] || 'Could not complete this action (' + code + ').'); }
    finally { setBusy(false); }
  }

  function needAccount() { setNotice(enabled ? 'Sign in to connect with real people in the private beta.' : 'This is a design preview with fictional profiles. Real accounts are disabled.'); if (enabled && !me) setAuth('signup'); }

  async function openConversation(person: Member) {
    if (!me) { needAccount(); return; }
    await perform(async () => {
      const r = await api('chat&with=' + encodeURIComponent(person.id));
      setConversation(r.messages || []);
      setSelected(person);
      setTab('messages');
    });
  }
  async function toggleLike(person: Member) {
    if (!enabled || !me || !isUuid(person.id)) { needAccount(); return; }
    await perform(async () => {
      const r = await api('like', { target: person.id });
      await refresh();
      setNotice(r.mutual ? 'It’s a match! Say hello in Messages.' : r.liked ? 'Like sent privately.' : 'Like removed.');
    });
  }
  async function authSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!auth || !enabled) return;
    await perform(async () => {
      const r = auth === 'signup'
        ? await api('signup', { handle, nickname, password, age: Number(signupAge), adult: accepted, acceptRules: accepted })
        : await api('login', { handle, password });
      setMe(r.profile || null);
      await syncMe();
      setPassword(''); setAuth(null); setAccepted(false); setTab('discover');
    });
  }
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return needAccount();
    await perform(async () => {
      const r = await api('profile', {
        ...profileForm, age: Number(profileForm.age), visible: profileForm.visible,
      });
      if (r.profile) setMe(r.profile);
      setNotice('Profile saved. Visibility is ' + (profileForm.visible ? 'ON' : 'OFF') + '.');
      await refresh();
    });
  }
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !draft.trim()) return;
    await perform(async () => {
      await api('message', { target: selected.id, text: draft.trim() });
      const r = await api('chat&with=' + encodeURIComponent(selected.id));
      setConversation(r.messages || []); setDraft(''); await refresh();
    });
  }
  async function safetyAction(kind: 'block' | 'report', target: Member, reason?: string) {
    if (!me) return needAccount();
    await perform(async () => {
      await api(kind, { target: target.id, ...(reason ? { reason } : {}) });
      setReportTarget(null);
      if (selected?.id === target.id) { setSelected(null); setConversation([]); setTab('discover'); }
      await refresh();
      setNotice(kind === 'report' ? 'Report recorded locally and this person has been blocked.' : 'This person has been blocked.');
    });
  }
  async function signOut() {
    await perform(async () => { await api('logout', {}); setMe(null); setProfiles([]); setConnections([]); setConversation([]); setSelected(null); setTab('discover'); });
  }

  if (!ageConfirmed) return <main className="pzb-age-screen"><div className="pzb-age-aura" /><div className="pzb-age-card">
    <Logo /><span className="pzb-overline">A SPACE THAT SEES YOU</span>
    <h1>Real people.<br /><em>Real chemistry.</em></h1>
    <p>PRIZMAA is an adults-only space for gay men to explore connection on their own terms. What happens next should always be your choice.</p>
    <div className="pzb-age-terms"><strong>18+ only</strong><span>Confirm you are an adult to view the design studio. This preview has fictional examples, not online users. Age assurance and safeguarding remain required before public launch.</span></div>
    <button className="pzb-primary" onClick={() => setAgeConfirmed(true)}>I am 18 or older <span>↗</span></button>
    <button className="pzb-textbtn" onClick={() => { window.location.replace('about:blank'); }}>Leave this page</button>
  </div><div className="pzb-age-footer">PRIVATE BUILD · NOT OPEN TO PUBLIC REGISTRATION</div></main>;

  const preview = !enabled || !me;
  const shown = preview ? demoPeople.filter(p => (intent === 'All' || p.intent === intent) && (p.nickname + ' ' + p.city + ' ' + p.tags).toLowerCase().includes(search.toLowerCase())) : profiles.filter(p => (intent === 'All' || p.intent === intent) && (p.nickname + ' ' + p.city + ' ' + p.tags).toLowerCase().includes(search.toLowerCase()));
  const counts = {discover: shown.length, matches: me ? connections.length : 0, messages: connections.reduce((a, c) => a + Number(c.unread_count || 0), 0), profile: 0};
  const nav: {id: Tab; icon: string; title: string}[] = [
    { id: 'discover', icon: '◈', title: 'Discover' }, { id: 'matches', icon: '♡', title: 'Connections' },
    { id: 'messages', icon: '▣', title: 'Messages' }, { id: 'profile', icon: '◎', title: 'My profile' },
  ];
  return <main className="pzb-app">
    <aside className="pzb-rail">
      <Logo /><div className="pzb-rail-sub">DISCOVER YOUR FREQUENCY</div>
      <nav aria-label="Main navigation">{nav.map(n => <button key={n.id} className={'pzb-nav ' + (tab === n.id ? 'pzb-nav-active' : '')} onClick={() => { setTab(n.id); setNotice(''); }}><span className="pzb-nav-icon">{n.icon}</span>{n.title}{counts[n.id] > 0 && n.id !== 'discover' ? <small>{counts[n.id]}</small> : null}</button>)}</nav>
      <div className="pzb-rail-bottom"><span className="pzb-status-dot" />{enabled ? 'LOCAL TEST API' : 'DESIGN PREVIEW'}<p>Real accounts and payments are not available on this published preview.</p><button onClick={() => window.location.replace('about:blank')} className="pzb-exit">Quick exit ↗</button></div>
    </aside>
    <div className="pzb-body">
      <header className="pzb-top"><span className="pzb-breadcrumb">PRIZMAA <span>/</span> {tab.toUpperCase()}</span><div className="pzb-top-right"><span className="pzb-mode">{checking ? 'CHECKING...' : enabled ? 'PRIVATE LOCAL' : 'DESIGN MODE'}</span>{me ? <button className="pzb-user" onClick={() => setTab('profile')}><span>✦</span> {me.nickname}</button> : <button className="pzb-signin" onClick={() => enabled ? setAuth('login') : setNotice('Sign-in is disabled in this non-public preview.')}>Sign in ↗</button>}</div></header>
      <div className="pzb-stage">
        {notice && <div className="pzb-notice" role="status">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button></div>}
        {preview && <div className="pzb-preview-banner"><span>✳</span><div><strong>Design preview — no live members</strong><small>Example profiles are fictional. No likes, messages, or payments are sent from this preview.</small></div></div>}
        {tab === 'discover' && <>
          <section className="pzb-hero"><div className="pzb-hero-copy"><span className="pzb-overline"><i /> THE PRIZMAA CONNECTION ENGINE</span><h1>Find your<br /><em>frequency.</em></h1><p>More than a swipe. A space to meet people who move to your rhythm.</p><div className="pzb-hero-actions"><button className="pzb-primary" onClick={() => document.getElementById('pzb-discovery')?.scrollIntoView({behavior:'smooth'})}>Explore people ↗</button><span>PRIVATE BY DESIGN · 18+</span></div></div><div className="pzb-prism" aria-hidden="true"><div className="pzb-orbit pzb-orbit-one" /><div className="pzb-orbit pzb-orbit-two" /><div className="pzb-core"><span>✦</span></div><div className="pzb-prism-note">YOUR SIGNAL.<br />YOUR RULES.</div></div></section>
          <div className="pzb-section-head" id="pzb-discovery"><div><span className="pzb-overline">01 / YOUR PEOPLE</span><h2>Discover</h2><p>{preview ? 'Fictional profile designs for this prototype.' : 'Members who have opted into discovery.'}</p></div><span className="pzb-counter">{shown.length} {preview ? 'EXAMPLES' : 'PROFILES'}</span></div>
          <div className="pzb-filters"><div className="pzb-filter-scroll">{intents.map(i => <button className={intent===i?'active':''} key={i} onClick={()=>setIntent(i)}>{i}</button>)}</div><label className="pzb-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or city" aria-label="Search profiles" maxLength={80}/></label></div>
          {shown.length ? <div className="pzb-cards">{shown.map((person,index)=><article className="pzb-card" key={person.id}>
            <div className="pzb-portrait" onClick={()=>{if(!preview){setSelected(person);setTab('matches')} }}><Avatar person={person} large/><span className="pzb-card-index">0{index+1} / PRIZMAA</span><div className="pzb-profile-shine"/></div>
            <div className="pzb-card-content"><div className="pzb-member-header"><div><h3>{person.nickname}<span>, {person.age}</span></h3><div className="pzb-location">⌁ {person.city || 'Location hidden'}</div></div><span className="pzb-intent-pill">{person.intent}</span></div>
            <p>{person.bio || 'A connection starts with a conversation.'}</p><div className="pzb-tags">{(person.tags||'').split(',').filter(Boolean).slice(0,3).map(t=><span key={t}>{t.trim()}</span>)}</div>
            <div className="pzb-card-actions"><button disabled={busy} onClick={()=>void toggleLike(person)} className="pzb-like" aria-label={'Like '+person.nickname}>♡ <span>Connect</span></button><button onClick={()=>preview ? needAccount() : setReportTarget(person)} className="pzb-more" aria-label={'Safety options for '+person.nickname}>···</button></div></div>
          </article>)}</div>:<div className="pzb-empty"><span>✧</span><h3>No profiles to display</h3><p>Try another filter, or remember that local private beta profiles start hidden until their owners opt in.</p></div>}
        </>}
        {tab === 'matches' && <section className="pzb-inner"><span className="pzb-overline">02 / THE MUTUAL SPARK</span><h1>Your <em>connections.</em></h1><p>Two likes make a connection. No unsolicited messaging.</p>
          {!me ? <div className="pzb-empty"><span>♡</span><h3>No real connections in preview mode</h3><p>Matches only appear after two signed-in adults consent to connect in the local beta.</p><button className="pzb-primary" onClick={needAccount}>Learn about private beta ↗</button></div> :
          connections.length ? <div className="pzb-connection-grid">{connections.map(p=><article className="pzb-connection" key={p.id}><Avatar person={p}/><div><h3>{p.nickname}, {p.age}</h3><p>{p.city} · {p.intent}</p></div><button onClick={()=>void openConversation(p)}>Message ↗</button><button onClick={()=>setReportTarget(p)} aria-label="Safety options">···</button></article>)}</div> :
          <div className="pzb-empty"><span>♡</span><h3>The next chapter isn't written yet.</h3><p>When a person likes you back, your connection appears here.</p><button onClick={()=>setTab('discover')} className="pzb-primary">Discover people ↗</button></div>}
        </section>}
        {tab === 'messages' && <section className="pzb-inner"><span className="pzb-overline">03 / PRIVATE CONVERSATIONS</span><h1>Say <em>hello.</em></h1><p>Messages open only after mutual likes. Keep things respectful.</p><div className="pzb-chat-layout">
          <div className="pzb-chat-people">{me&&connections.length?connections.map(person=><button className={selected?.id===person.id?'active':''} key={person.id} onClick={()=>void openConversation(person)}><Avatar person={person}/><span>{person.nickname}<small>{person.city}</small></span>{Number(person.unread_count)>0?<b>{person.unread_count}</b>:null}</button>):<div className="pzb-chat-placeholder">No real conversations yet.</div>}</div>
          <div className="pzb-chat-panel">{me && selected ? <><div className="pzb-chat-title"><Avatar person={selected}/><strong>{selected.nickname}</strong><button onClick={()=>setReportTarget(selected)} aria-label="Block or report">Safety ···</button></div><div className="pzb-message-list">{conversation.length?conversation.map(c=><div className={'pzb-bubble '+(c.from_id===me.id?'own':'')} key={c.id}><p>{c.body}</p><time>{new Date(c.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div>):<div className="pzb-chat-placeholder">You matched. Start with a hello. ✦</div>}</div><form className="pzb-compose" onSubmit={e=>void sendMessage(e)}><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={600} placeholder="Write a respectful message..." aria-label="Message" required/><button disabled={busy||!draft.trim()} aria-label="Send message">↗</button></form></>:<div className="pzb-chat-placeholder"><span>✉</span><h3>A private space for two</h3><p>Select a real mutual match to start a conversation.</p></div>}</div>
        </div></section>}
        {tab === 'profile' && <section className="pzb-inner"><span className="pzb-overline">04 / YOU, ON YOUR TERMS</span><h1>Your <em>space.</em></h1><p>You decide what other people can see, and when.</p>{me ? <div className="pzb-profile-layout"><form className="pzb-profile-form" onSubmit={e=>void saveProfile(e)}>
        <div className="pzb-fields"><label>Display name<input maxLength={36} value={profileForm.nickname} onChange={e=>setProfileForm({...profileForm,nickname:e.target.value})} required/></label><label>Age<input type="number" min={18} max={90} value={profileForm.age} onChange={e=>setProfileForm({...profileForm,age:e.target.value})} required/></label><label>City (optional)<input maxLength={44} value={profileForm.city} onChange={e=>setProfileForm({...profileForm,city:e.target.value})} placeholder="You can leave this blank"/></label><label>Looking for<select value={profileForm.intent} onChange={e=>setProfileForm({...profileForm,intent:e.target.value})}>{intents.filter(x=>x!=='All').map(i=><option key={i}>{i}</option>)}</select></label><label>Avatar palette<select value={profileForm.avatar_color} onChange={e=>setProfileForm({...profileForm,avatar_color:e.target.value})}>{['violet','rose','mint','copper','blue','grape'].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Role / vibe<input maxLength={24} value={profileForm.role} onChange={e=>setProfileForm({...profileForm,role:e.target.value})}/></label></div>
        <label>About you<textarea value={profileForm.bio} onChange={e=>setProfileForm({...profileForm,bio:e.target.value})} maxLength={400} placeholder="Share a little about your interests..." /></label><label>Interests, separated by commas<input maxLength={140} value={profileForm.tags} onChange={e=>setProfileForm({...profileForm,tags:e.target.value})} placeholder="Music,Travel,Art"/></label>
        <label className="pzb-toggle"><input type="checkbox" checked={profileForm.visible} onChange={e=>setProfileForm({...profileForm,visible:e.target.checked})}/><span><strong>Visible in discovery</strong><small>Opt in to appear in other members' results.</small></span></label>
        <button disabled={busy} className="pzb-primary">Save profile ↗</button></form><aside className="pzb-profile-side"><Avatar person={{...me,...profileForm,age:Number(profileForm.age)}} large/><h3>{profileForm.nickname}</h3><p>@{me.handle}</p><span>{profileForm.visible?'VISIBLE AFTER SAVE':'HIDDEN AFTER SAVE'}</span><hr/><p>Local prototype only. No photos, precise GPS, analytics or email capture.</p><button onClick={()=>void signOut()}>Sign out</button></aside></div> :
        <div className="pzb-empty"><span>◎</span><h3>Make it yours</h3><p>A profile is yours to control. In this design preview no personal data is collected.</p><button className="pzb-primary" onClick={needAccount}>Private beta account ↗</button></div>}</section>}
        <footer className="pzb-footer"><div><strong>PRIZMAA</strong> — COME AS YOU ARE</div><span>DESIGN BUILD · 18+ · NOT A LIVE DATING SERVICE</span><button onClick={()=>window.location.replace('about:blank')}>Quick exit ↗</button></footer>
      </div>
    </div>
    <nav className="pzb-bottom-nav" aria-label="Mobile navigation">{nav.map(n=><button key={n.id} className={tab===n.id?'active':''} onClick={()=>{setTab(n.id);setNotice('')}}><span>{n.icon}</span><small>{n.title==='Connections'?'Matches':n.title}</small></button>)}</nav>
    {auth && enabled && <div className="pzb-modal-back" role="presentation" onMouseDown={()=>setAuth(null)}><div className="pzb-modal" role="dialog" aria-modal="true" aria-label={auth==='signup'?'Create local account':'Sign in'} onMouseDown={e=>e.stopPropagation()}><button className="pzb-close" onClick={()=>setAuth(null)} aria-label="Close">×</button><Logo/><h2>{auth==='signup'?'Join the circle.':'Welcome back.'}</h2><p>Private local test accounts only. No production accounts can be created.</p><form onSubmit={e=>void authSubmit(e)}><label>Username<input autoComplete="username" value={handle} onChange={e=>setHandle(e.target.value)} minLength={3} maxLength={24} required placeholder="your_handle"/></label>{auth==='signup'&&<><label>Display name<input value={nickname} onChange={e=>setNickname(e.target.value)} required maxLength={36}/></label><label>Age<input value={signupAge} onChange={e=>setSignupAge(e.target.value)} type="number" min={18} max={90} required/></label></>}<label>Password<input type="password" autoComplete={auth==='signup'?'new-password':'current-password'} minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required/></label>{auth==='signup'&&<label className="pzb-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required/><span>I am at least 18 and agree to follow community safety rules.</span></label>}<button className="pzb-primary" disabled={busy|| (auth==='signup'&&!accepted)}>{auth==='signup'?'Create local profile':'Sign in'} ↗</button></form><button className="pzb-switch" onClick={()=>setAuth(auth==='login'?'signup':'login')}>{auth==='login'?'New here? Create an account':'Already a member? Sign in'}</button></div></div>}
    {reportTarget && <div className="pzb-modal-back" role="presentation" onMouseDown={()=>setReportTarget(null)}><div className="pzb-modal" role="dialog" aria-modal="true" aria-label="Safety controls" onMouseDown={e=>e.stopPropagation()}><button className="pzb-close" onClick={()=>setReportTarget(null)} aria-label="Close">×</button><span className="pzb-overline">YOUR SAFETY MATTERS</span><h2>Safety controls</h2><p>For {reportTarget.nickname}. Blocking hides your profiles from each other and removes the connection.</p><button className="pzb-safety-btn" disabled={busy} onClick={()=>void safetyAction('block',reportTarget)}>Block member</button><label>Report reason<select value={reportReason} onChange={e=>setReportReason(e.target.value)}>{reportReasons.map(r=><option key={r}>{r}</option>)}</select></label><button className="pzb-safety-btn critical" disabled={busy} onClick={()=>void safetyAction('report',reportTarget,reportReason)}>Report and block</button><small>Reports stay in the local test database; a real moderation team is not active yet.</small></div></div>}
  </main>;
}
