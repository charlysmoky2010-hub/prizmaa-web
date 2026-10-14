"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getOrCreateLocalIdentity, emergencyPurgeAll, setCamouflageMode, isCamouflageActive, type P2PIdentity } from "@/lib/prizmaa/p2p-shield";

type Profile = {
  id: string;
  handle?: string;
  nickname: string;
  age: number;
  city: string;
  intent: string;
  bio: string;
  visible?: number;
  avatar_color?: string;
  avatar_icon?: string;
  role?: string;
  tags?: string;
  unread_count?: number;
  is_vip?: number;
};

type Message = { id: string; from_id: string; to_id: string; body: string; created_at: string; read_at?: string };
type Section = "discover" | "matches" | "likes" | "profile" | "safety";

const intents = ["Hookup", "Flirting", "Dating", "Relationship"];
const reasons = ["Harassment", "Fake profile", "Underage concern", "Non-consensual content", "Other"];
const avatarIcons = [
  { id: "prism", symbol: "✳", label: "Prism" },
  { id: "flame", symbol: "🔥", label: "Flame" },
  { id: "star", symbol: "✦", label: "Star" },
  { id: "spark", symbol: "⚡", label: "Spark" },
  { id: "mirror", symbol: "🪞", label: "Mirror" },
  { id: "moon", symbol: "☾", label: "Moon" }
];
const avatarColors = [
  { id: "violet", hex: "#8b5cf6", label: "Violet" },
  { id: "rose", hex: "#f43f5e", label: "Rose" },
  { id: "amber", hex: "#f59e0b", label: "Amber" },
  { id: "emerald", hex: "#10b981", label: "Emerald" },
  { id: "cyan", hex: "#06b6d4", label: "Cyan" },
  { id: "indigo", hex: "#6366f1", label: "Indigo" }
];
const roles = ["Open", "Top", "Vers", "Bottom", "Side", "Discreet"];
const availableTags = ["Art", "Design", "Nightlife", "Coffee", "PrEP Aware", "Quiet", "Travel", "Fitness", "Tech", "Cinema"];

const endpoint = "/api/prizmaa/core";

async function api(op: string, payload?: Record<string, unknown>) {
  const req = payload
    ? { method: "POST", credentials: "same-origin" as RequestCredentials, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, ...payload }) }
    : { credentials: "same-origin" as RequestCredentials };
  const url = payload ? endpoint : endpoint + "?op=" + encodeURIComponent(op);
  const res = await fetch(url, req);
  const obj = await res.json();
  if (!res.ok || !obj.ok) throw Error(obj.error || "REQUEST_FAILED");
  return obj;
}

export default function Beta() {
  const [ready, setReady] = useState(false);
  const [systemError, setSystemError] = useState("");
  const [person, setPerson] = useState<Profile | null>(null);
  const [handle, setHandle] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(25);
  const [adult, setAdult] = useState(false);
  const [rules, setRules] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);

  const [section, setSection] = useState<Section>("discover");
  const [peers, setPeers] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [whoLiked, setWhoLiked] = useState<{ count: number; locked: boolean; people: Profile[] }>({ count: 0, locked: true, people: [] });
  const [activeChat, setActiveChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [hide, setHide] = useState(false);
  const [camouflaged, setCamouflaged] = useState(false);
  const [p2pId, setP2pId] = useState<P2PIdentity | null>(null);

  // Discovery filtering
  const [intentFilter, setIntentFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Profile edit fields
  const [pName, setPName] = useState("");
  const [pAge, setPAge] = useState(25);
  const [pCity, setPCity] = useState("");
  const [pIntent, setPIntent] = useState("Dating");
  const [pBio, setPBio] = useState("");
  const [pVisible, setPVisible] = useState(false);
  const [pAvatarColor, setPAvatarColor] = useState("violet");
  const [pAvatarIcon, setPAvatarIcon] = useState("prism");
  const [pRole, setPRole] = useState("Open");
  const [pTags, setPTags] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const updateCurrent = useCallback((p: Profile | null) => {
    setPerson(p);
    if (p) {
      setPName(p.nickname);
      setPAge(p.age);
      setPCity(p.city);
      setPIntent(p.intent);
      setPBio(p.bio);
      setPVisible(Boolean(p.visible));
      setPAvatarColor(p.avatar_color || "violet");
      setPAvatarIcon(p.avatar_icon || "prism");
      setPRole(p.role || "Open");
      setPTags(p.tags ? p.tags.split(",").filter(Boolean) : []);
    }
  }, []);

  const refresh = useCallback(async () => {
    const [p, m, l] = await Promise.all([api("people"), api("matches"), api("who_liked_me")]);
    setPeers(p.people);
    setMatches(m.matches);
    setWhoLiked(l);
  }, []);

  async function upgradeToVip() {
    await action("upgrade_vip", {}, async (r) => {
      updateCurrent(r.profile);
      await refresh();
      setNotice("🎉 Welcome to PRIZMAA Plus Founder! You can now see who liked your profile.");
      if (r.stripe_payment_link) {
        window.open(r.stripe_payment_link, "_blank");
      }
    });
  }

  useEffect(() => {
    Promise.all([api("health"), api("me")])
      .then(([_, me]) => {
        updateCurrent(me.profile);
        setReady(true);
        refresh().catch(() => {});
      })
      .catch(async () => {
        try {
          await api("health");
          setReady(true);
        } catch (e) {
          setSystemError(String(e));
          setReady(true);
        }
      });
  }, [refresh, updateCurrent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCamouflaged((prev) => {
          const next = !prev;
          setCamouflageMode(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    if (isCamouflageActive()) setCamouflaged(true);
    getOrCreateLocalIdentity().then(setP2pId).catch(() => {});
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live chat polling
  useEffect(() => {
    if (!activeChat) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(endpoint + "?op=chat&with=" + encodeURIComponent(activeChat.id));
        const d = await r.json();
        if (d.ok && Array.isArray(d.messages)) setMessages(d.messages);
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [activeChat]);

  async function action(op: string, payload: Record<string, unknown>, then?: (data: any) => void) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(op, payload);
      if (then) await then(result);
      else await refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function authenticate() {
    await action(
      registerMode ? "signup" : "login",
      { handle, nickname, password, age, adult, acceptRules: rules },
      async (r) => {
        updateCurrent(r.profile);
        setPassword("");
        setAdult(false);
        setRules(false);
        await refresh();
        setSection("profile");
        setNotice("Account opened locally. Profile visibility is OFF by default.");
      }
    );
  }

  async function saveProfile() {
    await action(
      "profile",
      {
        nickname: pName,
        age: pAge,
        city: pCity,
        intent: pIntent,
        bio: pBio,
        visible: pVisible,
        avatar_color: pAvatarColor,
        avatar_icon: pAvatarIcon,
        role: pRole,
        tags: pTags.join(",")
      },
      async (r) => {
        updateCurrent(r.profile);
        await refresh();
        setNotice("Your local profile was saved.");
      }
    );
  }

  async function like(id: string) {
    await action("like", { target: id }, async (r) => {
      await refresh();
      setNotice(
        r.mutual
          ? "It's a mutual match! You can now message each other."
          : r.liked
          ? "Like saved. Chat unlocks only if the other person likes you back."
          : "Like removed."
      );
    });
  }

  async function openChat(peer: Profile) {
    setActiveChat(peer);
    setSection("matches");
    setError("");
    try {
      const res = await fetch(endpoint + "?op=chat&with=" + encodeURIComponent(peer.id));
      const obj = await res.json();
      if (!res.ok) throw Error(obj.error);
      setMessages(obj.messages);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "CHAT_FAILED");
    }
  }

  async function sendMessage() {
    if (!activeChat || !draft.trim()) return;
    await action("message", { target: activeChat.id, text: draft }, async () => {
      setDraft("");
      const res = await fetch(endpoint + "?op=chat&with=" + encodeURIComponent(activeChat.id));
      const obj = await res.json();
      if (res.ok) setMessages(obj.messages);
    });
  }

  async function blockPeer(peer: Profile) {
    if (!window.confirm("Block " + peer.nickname + "? They will disappear from your results.")) return;
    await action("block", { target: peer.id }, async () => {
      setActiveChat(null);
      await refresh();
      setNotice("Account blocked. Mutual matches and likes were removed.");
    });
  }

  async function reportPeer(peer: Profile) {
    const reason = window.prompt("Reason: " + reasons.join(", "));
    if (!reason) return;
    await action("report", { target: peer.id, reason }, async () => {
      setActiveChat(null);
      await refresh();
      setNotice("Report stored locally; account also blocked.");
    });
  }

  async function logout() {
    await action("logout", {}, () => {
      updateCurrent(null);
      setPeers([]);
      setMatches([]);
      setActiveChat(null);
      setNotice("");
      setSection("discover");
    });
  }

  async function deleteAccount() {
    if (window.prompt("Type DELETE MY ACCOUNT to erase local account and messages") !== "DELETE MY ACCOUNT") return;
    await action("delete_account", { confirm: "DELETE MY ACCOUNT" }, () => {
      updateCurrent(null);
      setPeers([]);
      setMatches([]);
      setActiveChat(null);
      setSection("discover");
      setNotice("Local account deleted.");
    });
  }

  const toggleTag = (tag: string) => {
    setPTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const shown = peers.filter((p) => {
    if (intentFilter !== "All" && p.intent !== intentFilter) return false;
    if (tagFilter !== "All" && (!p.tags || !p.tags.split(",").includes(tagFilter))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.nickname.toLowerCase().includes(q);
      const matchCity = (p.city || "").toLowerCase().includes(q);
      const matchBio = (p.bio || "").toLowerCase().includes(q);
      const matchTags = (p.tags || "").toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchBio && !matchTags) return false;
    }
    return true;
  });

  if (camouflaged) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8f6f0", color: "#2d2a26", fontFamily: "Georgia, serif", padding: "30px 20px" }}>
        <div style={{ maxWidth: 700, margin: "auto", background: "#fff", padding: 36, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e6e2d8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #b58d59", paddingBottom: 16, marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#8c6d46", fontWeight: "bold" }}>Atölye Not Defteri</span>
              <h1 style={{ fontSize: 26, margin: "4px 0 0", color: "#1a1816" }}>Geleneksel Ebru &amp; Renk Harmonisi</h1>
            </div>
            <button
              onClick={() => { setCamouflaged(false); setCamouflageMode(false); }}
              style={{ background: "#f0ece1", border: "1px solid #d4ccb8", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#54493b" }}
            >
              Kilidi Aç ↩
            </button>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#4a453e" }}>
            Tekne hazırlığında kitre suyu kıvamı (1 litre ılık suya 25–30 gr kaliteli geven kitresi). Dinlendirme süresi: 24–48 saat tülbentten süzme.
          </p>

          <h3 style={{ fontSize: 17, margin: "24px 0 12px", color: "#8c6d46" }}>Pigment Karışımları &amp; Öd Oranları</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { name: "Lapis Lazuli (Mavi)", hex: "#2b4c7e", note: "3 damla öd / battal zemin" },
              { name: "Oksit Sarı (Toprak)", hex: "#c49a45", note: "2 damla öd / dağılma hızı yüksek" },
              { name: "Gül Kurusu (Kök Kırmızı)", hex: "#a3485e", note: "4 damla öd / ikinci katman" }
            ].map((c) => (
              <div key={c.name} style={{ background: "#faf8f5", border: "1px solid #ede8de", padding: 12, borderRadius: 8 }}>
                <div style={{ width: "100%", height: 32, background: c.hex, borderRadius: 4, marginBottom: 8 }} />
                <strong style={{ fontSize: 13, display: "block" }}>{c.name}</strong>
                <small style={{ fontSize: 11, color: "#7a7267" }}>{c.note}</small>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px dashed #d9d2c5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#8c8275" }}>Çalışma modu: Aktif kayıt defteri</span>
            <button
              onClick={() => {
                if (window.confirm("DİKKAT: Cihazdaki tüm veriler, oturumlar ve geçici kayıtlar anında tamamen silinsin mi?")) {
                  emergencyPurgeAll();
                  window.location.reload();
                }
              }}
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}
            >
              🧹 Tüm İzi ve Verileri Anında Sıfırla (Acil Temizle)
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="prz-gate">
        <div className="prz-gate-panel">Checking local PRIZMAA services…</div>
      </main>
    );
  }

  if (systemError) {
    return (
      <main className="prz-gate">
        <div className="prz-gate-panel">
          <h1>Private preview only.</h1>
          <p>The local account service is currently disabled. No data has been submitted.</p>
          <Link className="prz-primary" href="/prizmaa/app">
            View fictional profile demo ↗
          </Link>
        </div>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="prz-gate">
        <div className="prz-gate-panel prz-beta-auth">
          <Link className="prz-brand" href="/prizmaa">
            ✳ PRIZMAA.
          </Link>
          <span className="prz-overline">LOCAL PRIVATE MVP · ADULTS 18+</span>
          <h1>
            Real connection
            <br />
            <em>starts with intention.</em>
          </h1>
          <p>
            Test the actual account, match and private messaging workflow. This is a <strong>local development system</strong>,
            not a public dating service.
          </p>
          <div className="prz-beta-switch">
            <button className={!registerMode ? "active" : ""} onClick={() => setRegisterMode(false)}>
              Sign in
            </button>
            <button className={registerMode ? "active" : ""} onClick={() => setRegisterMode(true)}>
              Create test account
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void authenticate();
            }}
            className="prz-beta-form"
          >
            <label>
              Test username
              <input
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]{3,24}"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. sunset_demo"
              />
            </label>
            {registerMode && (
              <>
                <label>
                  Display name
                  <input required minLength={2} maxLength={36} value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <label>
                  Age (18+)
                  <input required type="number" min="18" max="90" value={age} onChange={(e) => setAge(Number(e.target.value))} />
                </label>
              </>
            )}
            <label>
              Test password (12+ chars)
              <input
                required
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete={registerMode ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {registerMode && (
              <>
                <label className="prz-check">
                  <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> I confirm I am 18 or older
                  (self-declaration only)
                </label>
                <label className="prz-check">
                  <input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} /> I accept consent-first
                  conduct and understand this is local testing only
                </label>
              </>
            )}
            <button className="prz-primary" type="submit" disabled={busy || (registerMode && (!adult || !rules))}>
              {busy ? "Working…" : registerMode ? "Create local test account ↗" : "Sign in ↗"}
            </button>
          </form>
          {error && (
            <p role="alert" className="prz-error">
              {error}
            </p>
          )}
          <Link className="prz-gate-exit" href="/prizmaa/app">
            Explore fictional profiles without creating an account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="prz-app-shell">
      <aside className="prz-sidebar">
        <Link href="/prizmaa" className="prz-brand">
          ✳ PRIZMAA.
        </Link>
        <button
          type="button"
          onClick={() => {
            setCamouflaged(true);
            setCamouflageMode(true);
          }}
          style={{
            margin: "12px 0 6px",
            padding: "8px 12px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: 8,
            color: "#fca5a5",
            fontSize: 11,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            width: "100%",
          }}
          title="Basıldığında ekranı hemen Ebru Sanat Not Defterine dönüştürür (ESC)"
        >
          <span>🚨 Acil Kamuflaj</span>
          <kbd style={{ background: "#450a0a", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>ESC</kbd>
        </button>
        <div className="prz-side-label">ZERO-HOST P2P · SIGNED IN</div>
        <div className="prz-side-menu">
          {(
            [
              { id: "discover", symbol: "◈", label: "Discover men" },
              { id: "matches", symbol: "♡", label: "Matches & chats" },
              { id: "likes", symbol: "⚡", label: "Liked you" },
              { id: "profile", symbol: "✳", label: "My profile" },
              { id: "safety", symbol: "♧", label: "Privacy & safety" }
            ] as const
          ).map((t) => (
            <button
              className={section === t.id ? "active" : ""}
              key={t.id}
              onClick={() => {
                setSection(t.id);
                setActiveChat(null);
                setError("");
              }}
            >
              {t.symbol} {t.label} {t.id === "matches" ? "(" + matches.length + ")" : t.id === "likes" && whoLiked.count > 0 ? "(" + whoLiked.count + ")" : ""}
            </button>
          ))}
        </div>
        <div className="prz-side-bottom">
          <div className="prz-side-quote">
            Mutual interest.
            <br />
            Mutual consent.
          </div>
          <div className="prz-side-disclaimer">
            PRIVATE LOCAL TEST · NOT PUBLIC
            <br />
            NO GPS · NO TRACKING
          </div>
        </div>
      </aside>

      <div className="prz-app-body">
        <header className="prz-app-top">
          <div className="prz-app-breadcrumb">PRIZMAA / {section.toUpperCase()}</div>
          <div className="prz-app-controls">
            <span className="prz-preview-pill">◉ LOCAL PRIVATE MVP</span>
            <button className="prz-icon-btn" title="Hide screen" onClick={() => setHide(true)}>
              ◩
            </button>
          </div>
        </header>

        <div className="prz-app-section">
          <span className="prz-overline">
            HELLO @{person.handle} {Boolean(person.is_vip) && <span style={{ background: "linear-gradient(135deg, #f43f5e, #d946ef)", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold", marginLeft: "6px" }}>★ PLUS FOUNDER</span>} · 18+ LOCAL TEST
          </span>
          <h1>
            {section === "discover"
              ? "Discover men."
              : section === "matches"
              ? "Your matches."
              : section === "likes"
              ? "Who liked you."
              : section === "profile"
              ? "Your profile."
              : "Stay in control."}
          </h1>
          <p className="prz-app-intro">
            {section === "discover"
              ? "Only opted-in local test accounts appear here. All interactions are genuine operations on your Mac's local database."
              : section === "matches"
              ? "A conversation opens only when both accounts have liked each other."
              : section === "likes"
              ? "See who wants to connect with you. With PRIZMAA Plus, match in one click."
              : section === "profile"
              ? "Choose what others can see. Customize your queer avatar, role, and vibes."
              : "Block, report, export your data, or permanently erase your test account."}
          </p>

          {error && (
            <div role="alert" className="prz-error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="prz-notice">
              {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {section === "discover" && (
            <>
              <div className="prz-filter-panel" style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#1c1424", padding: "16px", borderRadius: "8px", border: "1px solid #3d2847", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by nickname, city, or bio…"
                    style={{ flex: 1, minWidth: "200px", padding: "10px 14px", background: "#120c18", border: "1px solid #6b4168", borderRadius: "6px", color: "#fff" }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ background: "#4a2542", color: "#ffd0e2", border: 0, padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}>
                      Clear ✕
                    </button>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#e1bacc", letterSpacing: "1px", textTransform: "uppercase" }}>INTENTION</span>
                  <div className="prz-chip-list" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {["All", ...intents].map((t) => (
                      <button key={t} onClick={() => setIntentFilter(t)} className={intentFilter === t ? "selected" : ""}>
                        {t === "Hookup" ? "🔥 Hookup" : t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#e1bacc", letterSpacing: "1px", textTransform: "uppercase" }}>VIBES &amp; TAGS</span>
                  <div className="prz-chip-list" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {["All", ...availableTags].map((t) => (
                      <button key={t} onClick={() => setTagFilter(t)} className={tagFilter === t ? "selected" : ""}>
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="prz-section-heading">
                <h2>Visible test members</h2>
                <span>{shown.length} LOCAL ACCOUNTS</span>
              </div>

              {!shown.length && (
                <div className="prz-empty">
                  <h3>No matching test members</h3>
                  <p>Try clearing your filters or create a second test account in another window and opt into visibility.</p>
                  <button onClick={() => refresh()} className="prz-primary">
                    Refresh ↻
                  </button>
                </div>
              )}

              <div className="prz-profile-grid">
                {shown.map((g) => {
                  const colorHex = avatarColors.find((c) => c.id === g.avatar_color)?.hex || "#8b5cf6";
                  const iconSymbol = avatarIcons.find((i) => i.id === g.avatar_icon)?.symbol || "✳";
                  return (
                    <article className="prz-profile" key={g.id}>
                      <div
                        className="prz-profile-art"
                        style={{
                          background: `linear-gradient(135deg, ${colorHex} 0%, #1a0f26 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "150px",
                          borderRadius: "8px 8px 0 0",
                          position: "relative"
                        }}
                      >
                        <span style={{ fontSize: "48px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }}>{iconSymbol}</span>
                        {g.role && g.role !== "Open" && (
                          <span style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.75)", color: "#f8b7d8", fontSize: "10px", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                            {g.role}
                          </span>
                        )}
                      </div>
                      <div className="prz-profile-info">
                        <div className="prz-profile-name">
                          <h3>
                            {g.nickname}, {g.age}
                          </h3>
                        </div>
                        <div className="prz-profile-location">
                          {g.city || "City hidden"} · {g.intent}
                        </div>
                        {g.tags && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "8px 0" }}>
                            {g.tags
                              .split(",")
                              .filter(Boolean)
                              .map((t) => (
                                <span key={t} style={{ background: "#2e1f37", color: "#f8b7d8", fontSize: "10px", padding: "2px 6px", borderRadius: "3px" }}>
                                  #{t}
                                </span>
                              ))}
                          </div>
                        )}
                        <p>{g.bio || "No bio yet."}</p>
                        <div className="prz-profile-footer">
                          <button disabled={busy} onClick={() => like(g.id)}>
                            ♡ Like / unlike
                          </button>
                          <button onClick={() => blockPeer(g)}>Block</button>
                          <button onClick={() => reportPeer(g)}>Report</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {section === "matches" && (
            <div className="prz-beta-chat-layout">
              <div className="prz-beta-match-list">
                <h2>Mutual matches ({matches.length})</h2>
                <button className="prz-beta-refresh" onClick={() => refresh()}>
                  Refresh matches ↻
                </button>
                {matches.map((m) => (
                  <button className={activeChat?.id === m.id ? "active" : ""} key={m.id} onClick={() => openChat(m)}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <span>
                        ♡ {m.nickname}, {m.age}
                      </span>
                      {Boolean(m.unread_count && m.unread_count > 0) && (
                        <span style={{ background: "#f43f5e", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: "bold" }}>
                          {m.unread_count} new
                        </span>
                      )}
                    </div>
                    <small>
                      {m.city || "City hidden"} · {m.intent} {m.role && m.role !== "Open" ? `· ${m.role}` : ""}
                    </small>
                  </button>
                ))}
                {!matches.length && <p>No matches yet. Both members must like each other.</p>}
              </div>
              <div className="prz-beta-messages">
                {activeChat ? (
                  <>
                    <div className="prz-beta-thread-head">
                      <strong>
                        {activeChat.nickname} {activeChat.role && activeChat.role !== "Open" ? `(${activeChat.role})` : ""}
                      </strong>
                      <span>
                        <button onClick={() => blockPeer(activeChat)}>Block</button>
                        <button onClick={() => reportPeer(activeChat)}>Report</button>
                      </span>
                    </div>
                    <div className="prz-beta-thread">
                      {messages.length === 0 ? (
                        <p className="prz-app-intro">No messages yet. Say hello.</p>
                      ) : (
                        messages.map((m) => (
                          <div key={m.id} className={m.from_id === person.id ? "mine" : "theirs"}>
                            {m.body}
                            <small>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {m.from_id === person.id && (m.read_at ? " · Read" : " · Sent")}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                    <form
                      className="prz-beta-composer"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                    >
                      <input
                        maxLength={600}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Send a respectful message…"
                        aria-label="Message text"
                      />
                      <button disabled={busy || !draft.trim()}>Send ↗</button>
                    </form>
                  </>
                ) : (
                  <div className="prz-empty">
                    <h3>Select a mutual match</h3>
                    <p>Chat is unlocked only after two-sided consent to match.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {section === "likes" && (
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              {whoLiked.locked ? (
                <div style={{ background: "linear-gradient(135deg, #2b153b 0%, #150d1e 100%)", border: "1px solid #ff639c", borderRadius: "12px", padding: "36px", textAlign: "center", margin: "20px 0" }}>
                  <div style={{ fontSize: "54px", marginBottom: "12px" }}>🔥</div>
                  <h2 style={{ fontSize: "28px", color: "#fff", margin: "0 0 10px 0" }}>
                    {whoLiked.count > 0 ? `${whoLiked.count} men liked your profile!` : "See who likes your profile"}
                  </h2>
                  <p style={{ color: "#d8bdd2", fontSize: "14px", lineHeight: 1.6, maxWidth: "450px", margin: "0 auto 24px auto" }}>
                    Skip the guessing. With <strong>PRIZMAA Plus</strong>, see exactly who liked you, match with them in 1-click, and unlock stealth mode.
                  </p>
                  <button className="prz-primary" style={{ padding: "14px 28px", fontSize: "15px", background: "linear-gradient(135deg, #ff639c, #d946ef)", border: 0, fontWeight: "bold", cursor: "pointer" }} onClick={upgradeToVip} disabled={busy}>
                    ⚡ Get PRIZMAA Plus (9.99 € / Founder Pass) ↗
                  </button>
                  <small style={{ display: "block", color: "#b99fab", marginTop: "12px" }}>
                    Instant activation · Secure Stripe checkout · No recurring lock-in
                  </small>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "linear-gradient(135deg, #f43f5e, #d946ef)", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>★ PLUS ACTIVATED</span>
                      <h2 style={{ fontSize: "20px", margin: 0 }}>Men who liked you ({whoLiked.people.length})</h2>
                    </div>
                    <button className="prz-beta-refresh" onClick={() => refresh()}>Refresh ↻</button>
                  </div>
                  {!whoLiked.people.length ? (
                    <div className="prz-empty">
                      <h3>No pending likes</h3>
                      <p>When someone likes your profile, they will appear here instantly for 1-click matching.</p>
                    </div>
                  ) : (
                    <div className="prz-profile-grid">
                      {whoLiked.people.map((g) => (
                        <article className="prz-profile" key={g.id}>
                          <div style={{ background: avatarColors.find((c) => c.id === g.avatar_color)?.hex || "#8b5cf6", height: "130px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", borderRadius: "8px 8px 0 0" }}>
                            {avatarIcons.find((i) => i.id === g.avatar_icon)?.symbol || "✳"}
                          </div>
                          <div className="prz-profile-info">
                            <h3>{g.nickname}, {g.age}</h3>
                            <div className="prz-profile-location">{g.city || "City hidden"} · {g.intent} {g.role && g.role !== "Open" ? `· ${g.role}` : ""}</div>
                            <p>{g.bio || "No bio yet."}</p>
                            <div className="prz-profile-footer">
                              <button style={{ background: "linear-gradient(135deg, #ff639c, #d946ef)", color: "#fff", border: 0, fontWeight: "bold" }} onClick={() => like(g.id)}>
                                ♡ Match Back Instantly
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {section === "profile" && (
            <form
              className="prz-beta-profile"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile();
              }}
            >
              <label>
                Display name
                <input value={pName} minLength={2} maxLength={36} required onChange={(e) => setPName(e.target.value)} />
              </label>

              <label>
                Age
                <input type="number" min="18" max="90" value={pAge} onChange={(e) => setPAge(Number(e.target.value))} />
              </label>

              <label>
                City (optional, no geolocation)
                <input value={pCity} maxLength={44} onChange={(e) => setPCity(e.target.value)} placeholder="e.g. Köln, Berlin, Münster" />
              </label>

              <label>
                Looking for
                <select value={pIntent} onChange={(e) => setPIntent(e.target.value)}>
                  {intents.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label>
                Queer Identity / Role
                <select value={pRole} onChange={(e) => setPRole(e.target.value)}>
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#ebbed8" }}>Avatar Color &amp; Icon</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {avatarColors.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setPAvatarColor(c.id)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: c.hex,
                        border: pAvatarColor === c.id ? "3px solid #fff" : "1px solid rgba(255,255,255,0.3)",
                        cursor: "pointer"
                      }}
                      title={c.label}
                    />
                  ))}
                  <div style={{ display: "flex", gap: "6px", marginLeft: "10px" }}>
                    {avatarIcons.map((i) => (
                      <button
                        type="button"
                        key={i.id}
                        onClick={() => setPAvatarIcon(i.id)}
                        style={{
                          background: pAvatarIcon === i.id ? "#70385f" : "#2a1b32",
                          border: pAvatarIcon === i.id ? "1px solid #ff99c9" : "1px solid #4a2f58",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                      >
                        {i.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="prz-beta-full">
                <span style={{ fontSize: "13px", color: "#ebbed8", display: "block", marginBottom: "8px" }}>Vibes &amp; Community Tags</span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {availableTags.map((tag) => {
                    const isSelected = pTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          background: isSelected ? "#f43f5e" : "#261730",
                          color: isSelected ? "#fff" : "#d8bdd2",
                          border: isSelected ? "1px solid #f43f5e" : "1px solid #583764",
                          padding: "6px 12px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="prz-beta-full">
                About me
                <textarea maxLength={400} rows={4} value={pBio} onChange={(e) => setPBio(e.target.value)} placeholder="Share a few words about what you enjoy or what you're looking for…" />
              </label>

              <label className="prz-check prz-beta-full">
                <input type="checkbox" checked={pVisible} onChange={(e) => setPVisible(e.target.checked)} /> Opt in to being visible to
                other local test accounts
              </label>

              <button className="prz-primary" disabled={busy}>
                Save profile ↗
              </button>
              <p>Profiles are never sent to an external service by this development backend.</p>
            </form>
          )}

          {section === "safety" && (
            <div className="prz-safety-grid">
              <article style={{ border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.08)" }}>
                <h2 style={{ color: "#34d399" }}>🛡️ Sıfır-Sunucu P2P Güvenliği (Zero-Host)</h2>
                <p>
                  Bu sistemde merkezi bir sunucuda kimlik, sohbet veya konum verisi tutulmaz. Verileriniz yalnızca bu cihazda şifrelenir.
                </p>
                <div style={{ fontSize: 11, color: "#a7f3d0", fontFamily: "monospace", padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 6, margin: "10px 0" }}>
                  P2P Kimlik İzi: <b>{p2pId?.publicKeyFingerprint || "pz_ephemeral_client"}</b>
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af" }}>
                  ✓ Operatör sorumluluğu yok &bull; ✓ BTK/Mahkeme veritabanı talebi yapılamaz (veritabanı yok) &bull; ✓ Uçtan uca şifreli.
                </p>
              </article>
              <article style={{ border: "1px solid #ef4444", background: "rgba(239, 68, 68, 0.08)" }}>
                <h2 style={{ color: "#f87171" }}>🚨 Acil Panik &amp; Kamuflaj</h2>
                <p>
                  Biri telefonunuza bakarsa ekranı tek tıkla Ebru Sanat Not Defterine çevirin ya da tüm verileri sıfırlayın.
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCamouflaged(true);
                      setCamouflageMode(true);
                    }}
                    style={{ background: "#991b1b", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, fontWeight: "bold" }}
                  >
                    Ekranı Hemen Gizle (Kamuflaj) ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Cihazdaki tüm veriler ve oturumlar anında temizlensin mi?")) {
                        emergencyPurgeAll();
                        window.location.reload();
                      }
                    }}
                    style={{ background: "transparent", color: "#fca5a5", border: "1px solid #ef4444", padding: "8px 12px", borderRadius: 6 }}
                  >
                    🧹 Acil Veri İmhası (Sıfırla)
                  </button>
                </div>
              </article>
              <article>
                <h2>Screen privacy</h2>
                <p>Hide the entire application instantly.</p>
                <button onClick={() => setHide(true)}>Activate shield</button>
              </article>
              <article>
                <h2>Profile visibility</h2>
                <p>Default is hidden. Turn visibility off at any time under My profile.</p>
                <button onClick={() => setSection("profile")}>My profile ↗</button>
              </article>
              <article>
                <h2>GDPR Data Export</h2>
                <p>Download a complete JSON export of your local account, matches, and messages.</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(endpoint + "?op=export");
                      const data = await res.json();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `prizmaa-data-export-${person.handle}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setNotice("Your local data was exported successfully.");
                    } catch {
                      setError("Data export failed.");
                    }
                  }}
                >
                  Download my data (JSON) ↗
                </button>
              </article>
              <article>
                <h2>Sign out</h2>
                <p>End your authenticated session on this browser.</p>
                <button onClick={() => logout()}>Log out ↗</button>
              </article>
              <article>
                <h2>Delete my account</h2>
                <p>Permanently erase the local test account, matches and its messages. Cannot be undone.</p>
                <button onClick={() => deleteAccount()}>Delete local account ↗</button>
              </article>
            </div>
          )}
        </div>

        <footer className="prz-app-footer">
          PRIZMAA · PRIVATE TEST ENVIRONMENT <span>No public users, monetization, or verified ages</span>
        </footer>
      </div>

      <nav className="prz-mobile-nav">
        {(
          [
            { id: "discover", t: "Explore", symbol: "◈" },
            { id: "matches", t: "Matches", symbol: "♡" },
            { id: "likes", t: "Likes", symbol: "⚡" },
            { id: "profile", t: "Profile", symbol: "✳" },
            { id: "safety", t: "Safety", symbol: "♧" }
          ] as const
        ).map((x) => (
          <button
            key={x.id}
            onClick={() => {
              setSection(x.id);
              setActiveChat(null);
            }}
          >
            {x.symbol}
            <small>{x.t}</small>
          </button>
        ))}
      </nav>

      {hide && (
        <div className="prz-shield">
          <h1>Private screen</h1>
          <p>Your PRIZMAA content is hidden.</p>
          <button className="prz-primary" onClick={() => setHide(false)}>
            Reveal ↗
          </button>
        </div>
      )}
    </main>
  );
}
