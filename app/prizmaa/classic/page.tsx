import Link from "next/link";
import styles from "../welcome.module.css";

const features = [
  {
    number: "01",
    title: "Connections with consent",
    description:
      "A connection becomes available only after both people agree. No public member directory or surprise exposure.",
    symbol: "◇",
  },
  {
    number: "02",
    title: "Private conversations",
    description:
      "One-to-one messages are designed around verified invitations, mutual connections and account-level access rules.",
    symbol: "◎",
  },
  {
    number: "03",
    title: "Your space, your rules",
    description:
      "Set a display name and broad region, keep your profile private, block contacts and report unsafe behaviour.",
    symbol: "✳",
  },
] as const;

export default function PrizmaaWelcome() {
  return (
    <main className={styles.page} id="top">
      <a className={styles.skip} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <Link href="/prizmaa" className={styles.wordmark} aria-label="PRIZMAA home">
          <span aria-hidden="true" className={styles.mark}>✳</span>
          PRIZMAA<span className={styles.wordmarkDot}>.</span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/prizmaa/experience">Interactive design</Link>
          <a href="#privacy">Privacy</a>
          <Link className={styles.navLogin} href="/prizmaa/app">
            Member sign in <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>

      <section className={styles.hero} id="main-content" aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            <span className={styles.pulse} aria-hidden="true" />
            18+ · INVITE-ONLY PRIVATE BETA
          </p>
          <h1 id="hero-title">Closer to people.<br /><em>Closer to yourself.</em></h1>
          <p className={styles.lead}>
            PRIZMAA is a private social space being built for gay men to meet,
            connect and have meaningful conversations—without giving up control
            of their identity or visibility.
          </p>
          <p className={styles.german}>Ein Ort für echte Begegnungen. In deinem Tempo.</p>
          <div className={styles.actions}>
            <Link href="/prizmaa/app" className={styles.primary}>
              Private beta sign in <span aria-hidden="true">↗</span>
            </Link>
            <a href="#how-it-works" className={styles.secondary}>
              Explore the vision <span aria-hidden="true">↓</span>
            </a>
            <Link href="/prizmaa/experience" className={styles.secondary}>Explore interactive V2 ↗</Link>
          </div>
          <p className={styles.availability}>
            Invitations only. Registration and public discovery are not open.
            Service availability is not yet verified.
          </p>
        </div>

        <div className={styles.previewArea}>
          <div className={styles.halo} aria-hidden="true" />
          <section className={styles.preview} aria-label="Non-interactive product concept preview">
            <div className={styles.previewTop}>
              <span className={styles.previewIdentity}>
                <span className={styles.previewMark} aria-hidden="true">✳</span>
                PRIZMAA <small>/ SPACE</small>
              </span>
              <span className={styles.previewLabel}>PRODUCT CONCEPT</span>
            </div>
            <div className={styles.previewHero}>
              <span className={styles.previewTag}>YOUR OWN SPACE</span>
              <h2>Be seen.<br /><em>On your terms.</em></h2>
              <p>Real connections begin with choice.</p>
              <div className={styles.rings} aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
            <div className={styles.previewRows}>
              <div className={styles.previewRow}>
                <div className={styles.rowIcon} aria-hidden="true">◇</div>
                <div>
                  <strong>Profile visibility</strong>
                  <small>Private by default</small>
                </div>
                <span className={styles.lock}>PRIVATE</span>
              </div>
              <div className={styles.previewRow}>
                <div className={styles.rowIcon} aria-hidden="true">↔</div>
                <div>
                  <strong>Connections</strong>
                  <small>Mutual agreement required</small>
                </div>
                <span className={styles.rowArrow} aria-hidden="true">↗</span>
              </div>
              <div className={styles.previewRow}>
                <div className={styles.rowIcon} aria-hidden="true">✉</div>
                <div>
                  <strong>Conversations</strong>
                  <small>Member-only, access controlled</small>
                </div>
                <span className={styles.rowArrow} aria-hidden="true">↗</span>
              </div>
            </div>
            <p className={styles.previewFoot}>
              Interface illustration · Not real profiles, activity or messages
            </p>
          </section>
        </div>
      </section>

      <section className={styles.marquee} aria-label="Product values">
        <span>CONNECTION</span><i aria-hidden="true">✳</i>
        <span>CONSENT</span><i aria-hidden="true">✳</i>
        <span>PRIVACY</span><i aria-hidden="true">✳</i>
        <span>BELONGING</span>
      </section>

      <section className={styles.section} id="how-it-works" aria-labelledby="works-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionTag}>THE WAY WE CONNECT</p>
          <h2 id="works-title">More than a match.<br /><em>A place to belong.</em></h2>
          <p>Dating, friendship and conversation belong in one thoughtful experience. These features are in private-beta development, not a claim of live public availability.</p>
        </div>
        <div className={styles.cards}>
          {features.map((feature) => (
            <article className={styles.card} key={feature.number}>
              <div className={styles.cardTop}>
                <span className={styles.cardNumber}>{feature.number}</span>
                <span className={styles.cardSymbol} aria-hidden="true">{feature.symbol}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.privacySection} id="privacy" aria-labelledby="privacy-title">
        <div className={styles.privacyGraphic} aria-hidden="true">
          <span className={styles.privacyOrbit} />
          <span className={styles.privacyCore}>✳</span>
        </div>
        <div className={styles.privacyCopy}>
          <p className={styles.sectionTag}>SAFETY IS NOT AN AFTERTHOUGHT</p>
          <h2 id="privacy-title">Your identity is yours.<br /><em>Always.</em></h2>
          <p>
            No exact GPS location is requested. Profiles begin hidden from discovery.
            An invited account must pass adult membership review before social actions
            become available. Blocking and reporting are part of the beta design.
          </p>
          <p className={styles.privacyCaveat}>
            Age-review operations, moderation response times and end-to-end live
            conversations have not yet been validated. This is a protected beta,
            not an unrestricted public service.
          </p>
          <Link className={styles.textLink} href="/prizmaa/app">
            Go to private member area <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className={styles.lastCall} aria-labelledby="last-call-title">
        <span className={styles.lastGlyph} aria-hidden="true">✳</span>
        <p className={styles.sectionTag}>A NEW KIND OF CONNECTION</p>
        <h2 id="last-call-title">Come as you are.</h2>
        <p>PRIZMAA is growing carefully, starting with an invitation-only beta for adults 18+.</p>
        <Link href="/prizmaa/app" className={styles.primary}>
          Already invited? Sign in <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/prizmaa" className={styles.wordmark}>
          <span aria-hidden="true" className={styles.mark}>✳</span>
          PRIZMAA<span className={styles.wordmarkDot}>.</span>
        </Link>
        <p>Private-beta concept · No public registration, invented members or simulated conversations.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
