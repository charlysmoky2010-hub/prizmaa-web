"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./social-entry.module.css";

type View = "discover" | "circles" | "messages";

const VIEWS: Record<View, { tab: string; title: string; description: string; symbol: string }> = {
  discover: {
    tab: "Discover",
    title: "Find your kind of people.",
    description: "Discover people through shared interests, not exact-location tracking. No public member list until privacy and identity systems are ready.",
    symbol: "✳",
  },
  circles: {
    tab: "Circles",
    title: "Belong to something.",
    description: "Art, music, travel, local meet-ups and everyday conversation. Community spaces will require real moderation and member controls.",
    symbol: "◎",
  },
  messages: {
    tab: "Messages",
    title: "A conversation starts with consent.",
    description: "Private conversations are planned around mutual connection, with clear block and report controls.",
    symbol: "↗",
  },
};

const STEPS = [
  { number: "01 / DISCOVER", title: "More than a profile", body: "Chosen names, interests and broad regions help people connect. Sensitive identity details should remain optional." },
  { number: "02 / CONNECT", title: "Consent first", body: "A connection opens a conversation only after both sides agree. No unsolicited member messaging." },
  { number: "03 / BELONG", title: "People, not a feed", body: "Interest-based circles and real-world social opportunities, designed to make connections beyond endless scrolling." },
];

export default function PrizmaaSocialGateway() {
  const [view, setView] = useState<View>("discover");
  const [hidden, setHidden] = useState(true);
  const current = VIEWS[view];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.top}>
          <Link href="/prizmaa" className={styles.brand} aria-label="PRIZMAA social home">
            <span className={styles.mark} aria-hidden="true">✳</span> PRIZMAA
          </Link>
          <nav className={styles.nav} aria-label="Primary navigation">
            <a href="#how">The idea</a>
            <a href="#privacy">Safety</a>
            <Link href="/prizmaa/app">Cultural archive ↗</Link>
          </nav>
        </header>

        <section className={styles.hero} aria-labelledby="main-title">
          <div>
            <span className={styles.stage}>18+ · Under development · Not open for registration</span>
            <h1 id="main-title">More human.<br /><em>More you.</em></h1>
            <p className={styles.eyebrow}>A new space for gay men to connect</p>
            <p className={styles.lead}>Not another endless swipe. PRIZMAA is being built for friendship, community, authentic connection and the freedom to belong — on your own terms.</p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#how">Explore the concept &nbsp; ↗</a>
              <a className={styles.secondary} href="#privacy">How privacy comes first</a>
            </div>
            <p className={styles.disclaimer}>Product concept preview. Member registration, real-time discovery and messaging are not publicly available. No example shown here represents a real member.</p>
          </div>
          <div className={styles.showcase}>
            <div className={styles.halo} aria-hidden="true" />
            <div className={styles.preview} aria-label="Interactive product concept, not connected to member data">
              <div className={styles.previewHead}>
                <span><strong>✳ PRIZMAA</strong> &nbsp; / &nbsp; EXPERIENCE PREVIEW</span>
                <div className={styles.dots} aria-hidden="true"><span /><span /><span /></div>
              </div>
              <div className={styles.previewTabs} aria-label="Explore planned PRIZMAA experiences">
                {(Object.keys(VIEWS) as View[]).map((key) => (
                  <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)}>
                    {VIEWS[key].tab}
                  </button>
                ))}
              </div>
              <div className={styles.cardArt} aria-hidden="true">
                <div className={styles.orbit}><span>{current.symbol}</span></div>
              </div>
              <div aria-live="polite" aria-atomic="true">
                <h2 className={styles.viewTitle}>{current.title}</h2>
                <p className={styles.viewText}>{current.description}</p>
              </div>
              <div className={styles.visibility}>
                <span>Illustrative profile setting</span>
                <button type="button" onClick={() => setHidden((value) => !value)}
                  aria-label={hidden ? "Set illustrative profile to visible" : "Set illustrative profile to hidden"}>
                  {hidden ? "◉ Hidden" : "◉ Visible"}
                </button>
              </div>
              <p className={styles.footnote}>Interactive design only. The privacy toggle does not save personal data.</p>
            </div>
          </div>
        </section>

        <section id="how" className={styles.benefits} aria-labelledby="how-title">
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>A different social experience</span>
            <h2 id="how-title">Connection without the performance.</h2>
            <p>We are designing a social platform, not a copy of a dating app. Every feature should make it easier to meet, talk and build community without sacrificing personal safety.</p>
          </div>
          <div className={styles.grid}>
            {STEPS.map((step) => (
              <article className={styles.tile} key={step.number}>
                <span className={styles.number}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="privacy" className={styles.trust} aria-labelledby="privacy-title">
          <div>
            <span className={styles.eyebrow}>Built carefully, not rushed</span>
            <h2 id="privacy-title">Privacy is a product feature.</h2>
            <p>Before public accounts open, PRIZMAA needs persistent protected storage, independently tested account permissions, age assurance, a moderation process and clear data protection practices. We will not pretend those are already finished.</p>
          </div>
          <ul className={styles.rules}>
            <li>Profiles private by default</li>
            <li>No exact GPS location or distance exposure</li>
            <li>Consent required before messaging</li>
            <li>Accessible block, report, export and delete controls</li>
            <li>No fabricated profiles, activity or testimonials</li>
          </ul>
        </section>

        <footer className={styles.footer}>
          <span>© PRIZMAA · An independent social space in development · Adults 18+</span>
          <span><Link href="/prizmaa/app">Explore the existing cultural archive →</Link></span>
        </footer>
      </div>
    </main>
  );
}
