"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./social-entry.module.css";

type WorldKey = "afterdark" | "creative" | "slow";
type ExperienceKey = "discover" | "circles" | "connect";

const WORLDS: Record<WorldKey, {
  index: string; eyebrow: string; name: string; tagline: string;
  note: string; symbol: string; signal: string;
}> = {
  afterdark: {
    index: "01", eyebrow: "THE NIGHT", name: "After dark",
    tagline: "Be seen on your own terms.",
    note: "Music, nightlife and the freedom to show up as yourself.",
    symbol: "✳", signal: "ELECTRIC / MAGENTA"
  },
  creative: {
    index: "02", eyebrow: "THE CULTURE", name: "Creative minds",
    tagline: "Find your kind of strange.",
    note: "Art, design, films and the conversations that go somewhere.",
    symbol: "✺", signal: "ULTRAVIOLET / BLUE"
  },
  slow: {
    index: "03", eyebrow: "THE CONNECTION", name: "Slow connections",
    tagline: "There is no rush here.",
    note: "Friendship, coffee, gentle conversation. Connection without the performance.",
    symbol: "✧", signal: "MINT / AURORA"
  }
};

const EXPERIENCES: Record<ExperienceKey, {
  name: string; title: string; description: string; count: string;
}> = {
  discover: {
    name: "Discover", count: "01 / 03",
    title: "People before pixels.",
    description: "Explore through shared interests and broad regions — not a precise GPS dot. Real member discovery opens only after safety and data systems are production-ready."
  },
  circles: {
    name: "Circles", count: "02 / 03",
    title: "Find your people.",
    description: "Small, moderated spaces for music, art and everyday life. The goal is belonging, not another endless timeline."
  },
  connect: {
    name: "Connect", count: "03 / 03",
    title: "Your yes means something.",
    description: "A private conversation should start with mutual consent. Blocking, reporting and control of visibility belong at the foundation."
  }
};

const WORLD_KEYS: WorldKey[] = ["afterdark", "creative", "slow"];
const EXPERIENCE_KEYS: ExperienceKey[] = ["discover", "circles", "connect"];

export default function PrizmaaSocialUniverse() {
  const [world, setWorld] = useState<WorldKey>("afterdark");
  const [experience, setExperience] = useState<ExperienceKey>("discover");
  const [motionPaused, setMotionPaused] = useState(false);
  const currentWorld = WORLDS[world];
  const currentExperience = EXPERIENCES[experience];

  return (
    <main className={[
      styles.universe,
      world === "afterdark" ? styles.magenta : world === "creative" ? styles.ultraviolet : styles.aurora,
      motionPaused ? styles.motionPaused : ""
    ].join(" ")}>
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/prizmaa" className={styles.brand} aria-label="PRIZMAA home">
          <span className={styles.brandSymbol} aria-hidden="true">✳</span>
          <span>PRIZMAA</span>
          <span className={styles.brandSuffix}>SOCIAL UNIVERSE</span>
        </Link>
        <nav className={styles.topNav} aria-label="Main navigation">
          <a href="#spaces">Spaces</a>
          <a href="#experience">Experience</a>
          <a href="#safety">Our promise</a>
        </nav>
        <span className={styles.betaPill}>18+ <span aria-hidden="true">/</span> CONCEPT PREVIEW</span>
      </header>

      <section className={styles.hero} id="scene" aria-labelledby="prizmaa-title">
        <div className={styles.heroAtmosphere} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><span aria-hidden="true" className={styles.pulseDot} /> NOT ANOTHER SWIPE APP</p>
          <h1 id="prizmaa-title">
            FIND<br />
            YOUR<br />
            <span>FREQUENCY<span className={styles.period}>.</span></span>
          </h1>
          <p className={styles.heroTagline}>Your world. Your people. Your rules.</p>
          <p className={styles.heroDescription}>
            An entirely new social space for gay men — built for attraction, friendship,
            culture and belonging without losing control of your privacy.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.exploreButton} href="#spaces">
              Explore the universe <span aria-hidden="true">↗</span>
            </a>
            <button
              className={styles.motionButton}
              type="button"
              aria-pressed={motionPaused}
              onClick={() => setMotionPaused(value => !value)}
            >
              <span aria-hidden="true">{motionPaused ? "▶" : "Ⅱ"}</span>
              {motionPaused ? "Resume motion" : "Pause motion"}
            </button>
          </div>
        </div>

        <div className={styles.stageWrap} aria-label="Interactive concept visualization of PRIZMAA interest spaces">
          <div className={styles.spatialStage}>
            <div className={styles.deepGlow} aria-hidden="true" />
            <div className={styles.sceneGrid} aria-hidden="true" />
            <div className={styles.starfield} aria-hidden="true">
              {Array.from({ length: 22 }, (_, i) => <i key={i} />)}
            </div>
            <div className={styles.portal} aria-hidden="true">
              <div className={styles.portalBack} />
              <div className={styles.ringOuter} />
              <div className={styles.ringTilt} />
              <div className={styles.ringInner} />
              <div className={styles.core}>
                <span className={styles.coreShimmer} />
                <span className={styles.coreSymbol}>{currentWorld.symbol}</span>
              </div>
              <div className={styles.reflection} />
            </div>
            <div className={styles.spaceCoordinates} aria-hidden="true">
              <span>PRZ / SPECTRUM 001</span>
              <span>NO TRACKING · NO REAL MEMBER DATA</span>
            </div>
            <div className={styles.worldIndicator} aria-live="polite" aria-atomic="true">
              <small>NOW EXPLORING <span aria-hidden="true">↗</span></small>
              <strong>{currentWorld.name}</strong>
              <p>{currentWorld.tagline}</p>
              <span className={styles.worldSignal}>{currentWorld.signal}</span>
            </div>
            <div className={styles.worldControls} role="group" aria-label="Choose a visual world">
              {WORLD_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={styles.worldControl}
                  aria-pressed={world === key}
                  onClick={() => setWorld(key)}
                >
                  <span className={styles.worldControlDot} aria-hidden="true" />
                  <span>{WORLDS[key].index} / {WORLDS[key].name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.heroEdge} aria-hidden="true">
          <span>AN INDEPENDENT QUEER DIGITAL UNIVERSE</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>

      <section id="spaces" className={styles.spaces} aria-labelledby="spaces-title">
        <div className={styles.sectionTopline}>
          <span>01 — CHOOSE YOUR WORLD</span><span>THREE DIFFERENT FREQUENCIES</span>
        </div>
        <div className={styles.spacesHeading}>
          <h2 id="spaces-title">NOT EVERYONE<br /><em>VIBES ALIKE.</em></h2>
          <p>Choose the atmosphere that feels like you. This preview changes the world above; it does not search, identify or track real people.</p>
        </div>
        <div className={styles.spaceRows} role="group" aria-label="Select an interest space">
          {WORLD_KEYS.map((key) => (
            <button
              type="button" key={key}
              className={styles.spaceRow}
              aria-pressed={world === key}
              onClick={() => {
                setWorld(key);
                document.getElementById("scene")?.scrollIntoView({ behavior: motionPaused ? "instant" : "smooth" });
              }}
            >
              <span className={styles.rowIndex}>{WORLDS[key].index} / {WORLDS[key].eyebrow}</span>
              <strong>{WORLDS[key].name}</strong>
              <span className={styles.rowNote}>{WORLDS[key].note}</span>
              <span className={styles.rowArrow} aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section id="experience" className={styles.experience} aria-labelledby="experience-title">
        <div className={styles.sectionTopline}>
          <span>02 — THE HUMAN SIDE</span><span>PROPOSED PRODUCT EXPERIENCES</span>
        </div>
        <div className={styles.experienceBody}>
          <div className={styles.experienceIntro}>
            <p>BEYOND THE SCREEN</p>
            <h2 id="experience-title">REAL<br /><em>CONNECTION.</em></h2>
            <div className={styles.experienceNav} role="group" aria-label="Explore product features">
              {EXPERIENCE_KEYS.map(key => (
                <button key={key} type="button" aria-pressed={experience === key} onClick={() => setExperience(key)}>
                  <span>{EXPERIENCES[key].name}</span><span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.experienceDetail} aria-live="polite" aria-atomic="true">
            <span className={styles.experienceCount}>{currentExperience.count}</span>
            <span className={styles.experienceIcon} aria-hidden="true">{experience === "discover" ? "◌" : experience === "circles" ? "◎" : "↗"}</span>
            <h3>{currentExperience.title}</h3>
            <p>{currentExperience.description}</p>
            <span className={styles.experienceStatus}>DESIGN PRINCIPLE · NOT A LIVE MEMBER FEATURE</span>
          </div>
        </div>
      </section>

      <section id="safety" className={styles.safety} aria-labelledby="safety-title">
        <p className={styles.safetyOverline}>THE NON-NEGOTIABLE PART</p>
        <h2 id="safety-title">BE YOURSELF.<br /><span>KEEP YOUR CONTROL.</span></h2>
        <p>Public registration and messaging are intentionally closed while durable data storage,
          age assurance, moderation and privacy protections are being built and independently checked.
          No fictional profiles are presented as members. No paid membership is offered here.</p>
        <div className={styles.safetyBar}><span>PRIVATE BY DESIGN</span><span>CONSENT BEFORE CHAT</span><span>NO PRECISE LOCATION</span><span>18+</span></div>
      </section>

      <footer className={styles.footer}>
        <div><span className={styles.footerBrand}>✳ PRIZMAA</span><p>A social universe in development. No public accounts yet.</p></div>
        <Link href="/prizmaa/app">Existing cultural archive ↗</Link>
        <span>© PRIZMAA · 2026</span>
      </footer>
    </main>
  );
}
