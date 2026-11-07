"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./experience.module.css";

type Language = "en" | "tr" | "de";
type Space = "flirt" | "friends" | "circles" | "experiences";

const copy = {
  en: {
    menu:"Explore", values:"Our promise", sign:"Member sign in", eyebrow:"18+ · INVITE-ONLY DESIGN PREVIEW",
    headlineA:"More than a match.",headlineB:"A place to belong.",
    intro:"A new world for queer connection—where flirting, friendships, shared passions and real-life experiences meet. Designed for privacy. Built around consent.",
    discover:"Explore the experience", private:"Private member area", disclaimer:"Design preview only · No members, messages or events are being shown.",
    preview:"INTERACTIVE EXPERIENCE", window:"PRIZMAA / YOUR SPACE", you:"Made for your kind of connection",
    choose:"Explore a space", select:"Choose a space to discover its planned experience.",
    nothing:"No live profiles, connections or events are displayed in this design preview.",
    privateByDefault:"Private by default", noTrack:"No precise-location tracking", invite:"Invitation required",
    modes:{
      flirt:{name:"Flirt",label:"Mutual attraction",title:"Chemistry, with consent.",description:"A thoughtful space for romantic discovery. Conversations unlock only for approved mutual connections.",first:"Mutual interest",second:"Control your visibility",third:"Block or report"},
      friends:{name:"Friends",label:"Real connections",title:"Friendship is the beginning.",description:"Find common ground through interests and conversation, without turning every interaction into a date.",first:"Shared interests",second:"Friendship-first",third:"Choose your pace"},
      circles:{name:"Circles",label:"Find your people",title:"A community that feels like yours.",description:"Interest-based circles for art, travel, music and queer culture. Community groups are a future concept, not an active directory.",first:"Common passions",second:"Community boundaries",third:"Private participation"},
      experiences:{name:"Experiences",label:"Beyond the screen",title:"The moments worth meeting for.",description:"A home for future workshops, cultural gatherings and local experiences. No real events are listed or bookable yet.",first:"Thoughtful gatherings",second:"Opt-in participation",third:"No fabricated events"}
    },
    journeyEyebrow:"DESIGNED FOR REAL CONNECTION", journeyTitle:"Choose how you want to connect.",journeyBody:"Different intentions deserve different paths. Select a space above to explore the proposed product journey.",next:"PRODUCT JOURNEY",one:"Discover",two:"Choose",three:"Connect",step1:"Explore an intention, not a catalogue of strangers.",step2:"Decide when and how much of yourself to share.",step3:"Connect only through verified permission and mutual consent.",
    valuesEyebrow:"OUR PRINCIPLES",valuesTitle:"Privacy is not a premium feature.",valuesBody:"Safety features must be available to every member. We are not selling user identities, intimate messages or sensitive personal data.",
    value1:"Visible on your terms",value1body:"Profiles start hidden. No public directory and no exact GPS coordinates.",
    value2:"Consent is structural",value2body:"Mutual connections, blocking and reporting are enforced server-side before any social release.",
    value3:"No pretend community",value3body:"No invented people, fake matches, fabricated ratings or fictional activity counters.",
    release:"REALITY CHECK", releaseTitle:"A vision in progress—not a live dating service.",releaseBody:"The private application has real authentication and protected profile infrastructure, but account onboarding and live two-person messaging have not passed release testing. Registration and public discovery are not open.",
    cta:"Enter invite-only workspace",footer:"PRIZMAA · Concept experience · No public signup · No user data in this preview",
    privacy:"Privacy", path:"How it works", notice:"All four modules are design concepts. The actual private member application is separate."
  },
  tr: {
    menu:"Keşfet",values:"İlkelerimiz",sign:"Üye girişi",eyebrow:"18+ · DAVETLİ TASARIM ÖNİZLEMESİ",
    headlineA:"Bir eşleşmeden fazlası.",headlineB:"Ait olabileceğin bir yer.",
    intro:"Flörtü, dostluğu, ortak tutkuları ve gerçek yaşam deneyimlerini buluşturan yeni bir queer sosyal dünya. Mahremiyet için tasarlandı. Karşılıklı rıza üzerine kuruldu.",
    discover:"Deneyimi keşfet",private:"Özel üye alanı",disclaimer:"Yalnızca tasarım önizlemesi · Gerçek üyeler, mesajlar veya etkinlikler gösterilmiyor.",
    preview:"ETKİLEŞİMLİ DENEYİM",window:"PRIZMAA / SENİN ALANIN",you:"Sana uygun bağlantılar için",
    choose:"Bir alan keşfet",select:"Planlanan deneyimini görmek istediğin alanı seç.",
    nothing:"Bu tasarım önizlemesinde gerçek profiller, eşleşmeler veya etkinlikler görüntülenmez.",
    privateByDefault:"Varsayılan gizlilik",noTrack:"Kesin konum takibi yok",invite:"Davet gerekiyor",
    modes:{
      flirt:{name:"Flört",label:"Karşılıklı çekim",title:"Kimya, ama rızayla.",description:"Romantik keşif için özenli bir alan. Sohbetler ancak onaylı ve karşılıklı bağlantılarda açılabilir.",first:"Karşılıklı ilgi",second:"Görünürlüğünü yönet",third:"Engelle veya bildir"},
      friends:{name:"Dostluk",label:"Gerçek bağlar",title:"Her şey dostlukla başlayabilir.",description:"Her tanışmayı randevuya dönüştürmeden ortak ilgi alanları ve sohbet üzerinden insanlarla bağ kur.",first:"Ortak ilgi alanları",second:"Dostluk öncelikli",third:"Kendi hızında"},
      circles:{name:"Çevreler",label:"Topluluğunu bul",title:"Kendin gibi hissedebileceğin bir çevre.",description:"Sanat, seyahat, müzik ve queer kültürü etrafında topluluklar. Henüz gerçek bir topluluk dizini değil.",first:"Ortak tutkular",second:"Topluluk sınırları",third:"Özel katılım"},
      experiences:{name:"Deneyimler",label:"Ekranın ötesinde",title:"Birlikte yaşanmaya değer anlar.",description:"Gelecekteki atölyeler, kültürel buluşmalar ve yerel deneyimler için alan. Şimdilik gerçek etkinlik veya rezervasyon yok.",first:"Özenli buluşmalar",second:"Gönüllü katılım",third:"Uydurma etkinlik yok"}
    },
    journeyEyebrow:"GERÇEK BAĞLAR İÇİN TASARLANDI",journeyTitle:"Nasıl tanışmak istediğini sen seç.",journeyBody:"Farklı niyetler farklı yolları hak eder. Planlanan kullanıcı yolculuğunu görmek için yukarıdan bir alan seç.",next:"DENEYİM AKIŞI",one:"Keşfet",two:"Karar ver",three:"Bağ kur",step1:"Yabancıların listesini değil, niyetini keşfet.",step2:"Ne zaman ve ne kadar paylaşacağına karar ver.",step3:"Yalnızca doğrulanmış izin ve karşılıklı rızayla bağ kur.",
    valuesEyebrow:"İLKELERİMİZ",valuesTitle:"Mahremiyet premium özellik değildir.",valuesBody:"Güvenlik araçları bütün üyelere açık olmalı. Kimlik, özel mesaj veya hassas kişisel verileri satmıyoruz.",
    value1:"Görünürlük senin kararın",value1body:"Profiller gizli başlar. Herkese açık dizin ve kesin GPS koordinatı yok.",
    value2:"Rıza sistemin temelinde",value2body:"Karşılıklı bağlantılar, engelleme ve bildirme sunucu tarafında denetlenir.",
    value3:"Sahte topluluk yok",value3body:"Uydurma insanlar, sahte eşleşmeler, puanlar ya da etkinlik sayaçları yok.",
    release:"GERÇEKLİK KONTROLÜ",releaseTitle:"Gelişmekte olan bir vizyon—canlı flört hizmeti değil.",releaseBody:"Özel uygulamada gerçek kimlik doğrulama ve korumalı profil altyapısı var; ancak üyelik açılışı ve iki kişi arasında canlı mesajlaşma testleri tamamlanmadı. Kayıt ve herkese açık keşif kapalı.",
    cta:"Davetli üye alanına git",footer:"PRIZMAA · Konsept deneyim · Herkese açık kayıt yok · Önizlemede kullanıcı verisi yok",
    privacy:"Gizlilik",path:"Nasıl çalışır",notice:"Dört alan da tasarım konseptidir. Gerçek özel üye uygulaması ayrı bir alandadır."
  },
  de: {
    menu:"Entdecken",values:"Unsere Werte",sign:"Mitglieder-Login",eyebrow:"18+ · DESIGN-VORSCHAU NUR AUF EINLADUNG",
    headlineA:"Mehr als ein Match.",headlineB:"Ein Ort, an dem du dazugehört.",
    intro:"Ein neuer Ort für queere Verbindungen: Flirts, Freundschaften, gemeinsame Interessen und Erlebnisse im echten Leben. Mit Privatsphäre und gegenseitigem Einverständnis im Mittelpunkt.",
    discover:"Erlebnis entdecken",private:"Privater Mitgliederbereich",disclaimer:"Nur Design-Vorschau · Keine echten Mitglieder, Nachrichten oder Veranstaltungen werden angezeigt.",
    preview:"INTERAKTIVE VORSCHAU",window:"PRIZMAA / DEIN RAUM",you:"Verbindungen auf deine Art",
    choose:"Bereich auswählen",select:"Wähle einen Bereich, um das geplante Erlebnis kennenzulernen.",
    nothing:"In dieser Design-Vorschau werden keine echten Profile, Verbindungen oder Events gezeigt.",
    privateByDefault:"Standardmäßig privat",noTrack:"Kein genauer Standort",invite:"Einladung erforderlich",
    modes:{
      flirt:{name:"Flirt",label:"Gegenseitige Anziehung",title:"Chemie mit Einverständnis.",description:"Raum für romantische Begegnungen. Nachrichten sind erst nach einer bestätigten gegenseitigen Verbindung möglich.",first:"Gegenseitiges Interesse",second:"Sichtbarkeit steuern",third:"Blockieren oder melden"},
      friends:{name:"Freunde",label:"Echte Verbindungen",title:"Freundschaft als Anfang.",description:"Menschen über gemeinsame Interessen und Gespräche kennenlernen, ohne dass jedes Treffen ein Date sein muss.",first:"Gemeinsame Interessen",second:"Freundschaft zuerst",third:"Dein Tempo"},
      circles:{name:"Communities",label:"Deine Menschen finden",title:"Ein Kreis, der sich richtig anfühlt.",description:"Interessengruppen rund um Kunst, Reisen, Musik und queere Kultur. Noch kein aktives Verzeichnis.",first:"Gemeinsame Leidenschaften",second:"Klare Grenzen",third:"Private Teilnahme"},
      experiences:{name:"Erlebnisse",label:"Jenseits des Bildschirms",title:"Momente, die verbinden.",description:"Ein Ort für zukünftige Workshops, kulturelle Treffen und lokale Erlebnisse. Noch keine buchbaren Events.",first:"Achtsame Begegnungen",second:"Freiwillige Teilnahme",third:"Keine erfundenen Events"}
    },
    journeyEyebrow:"FÜR ECHTE VERBINDUNGEN",journeyTitle:"Du entscheidest, wie du dich verbindest.",journeyBody:"Unterschiedliche Absichten verdienen eigene Wege. Wähle oben einen Bereich, um den geplanten Ablauf zu sehen.",next:"DEIN WEG",one:"Entdecken",two:"Entscheiden",three:"Verbinden",step1:"Entdecke eine Absicht statt einer Liste Fremder.",step2:"Bestimme, wann und wie viel du teilen möchtest.",step3:"Verbinde dich nur mit bestätigter Zustimmung auf beiden Seiten.",
    valuesEyebrow:"UNSERE GRUNDSÄTZE",valuesTitle:"Privatsphäre ist kein Premium-Feature.",valuesBody:"Sicherheitsfunktionen gehören allen. Wir verkaufen keine Identitäten, intimen Nachrichten oder sensiblen persönlichen Daten.",
    value1:"Sichtbar zu deinen Bedingungen",value1body:"Profile beginnen privat. Kein öffentliches Verzeichnis und keine GPS-Koordinaten.",
    value2:"Zustimmung als Grundprinzip",value2body:"Gegenseitige Verbindungen, Blockieren und Melden werden vor dem sozialen Start serverseitig gesichert.",
    value3:"Keine erfundene Community",value3body:"Keine erfundenen Menschen, falschen Matches, Bewertungen oder Aktivitätszahlen.",
    release:"REALITÄTSCHECK",releaseTitle:"Eine Vision im Aufbau – noch kein Dating-Dienst.",releaseBody:"Die private App hat echte Authentifizierung und geschützte Profil-Infrastruktur. Der Zugang für neue Mitglieder und Nachrichten zwischen zwei Personen sind jedoch noch nicht vollständig getestet. Öffentliche Registrierung und Entdeckung sind deaktiviert.",
    cta:"Zum privaten Mitgliederbereich",footer:"PRIZMAA · Konzept-Vorschau · Keine öffentliche Registrierung · Keine Nutzerdaten in der Vorschau",
    privacy:"Datenschutz",path:"So funktioniert es",notice:"Alle vier Bereiche sind Design-Konzepte. Die tatsächliche private Mitglieder-App befindet sich in einem separaten Bereich."
  }
} as const;

const icons: Record<Space,string> = {flirt:"♥",friends:"✳",circles:"◌",experiences:"✦"};
const order: Space[] = ["flirt","friends","circles","experiences"];

export default function PrizmaaExperience() {
  const [lang,setLang]=useState<Language>("en");
  const [active,setActive]=useState<Space>("flirt");
  const t=copy[lang], mode=t.modes[active];
  return <main className={styles.shell} lang={lang}>
    <a className={styles.skip} href="#content">Skip to main content</a>
    <div className={styles.aura} aria-hidden="true" />
    <header className={styles.header}>
      <Link href="/prizmaa" className={styles.logo}><span className={styles.logoMark}>✳</span> PRIZMAA<span className={styles.dot}>.</span></Link>
      <nav className={styles.navigation} aria-label="Main navigation">
        <a href="#explore">{t.menu}</a><a href="#values">{t.values}</a>
        <Link href="/prizmaa/app" className={styles.navSign}>{t.sign} <span aria-hidden="true">↗</span></Link>
      </nav>
      <div className={styles.languages} role="group" aria-label="Select language">
        {(["en","tr","de"] as const).map(l=><button key={l} type="button" onClick={()=>setLang(l)} aria-pressed={lang===l} className={lang===l?styles.langActive:styles.lang}>{l.toUpperCase()}</button>)}
      </div>
    </header>
    <section className={styles.hero} id="content">
      <div className={styles.heroCopy}>
        <div className={styles.eyebrow}><span className={styles.liveDot}/> {t.eyebrow}</div>
        <h1>{t.headlineA}<br/><em>{t.headlineB}</em></h1>
        <p className={styles.intro}>{t.intro}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#explore">{t.discover}<span aria-hidden="true">↗</span></a>
          <Link className={styles.secondary} href="/prizmaa/app">{t.private}</Link>
        </div>
        <p className={styles.disclaimer}>{t.disclaimer}</p>
        <div className={styles.benefits}>
          <span>✧ {t.privateByDefault}</span><span>◎ {t.noTrack}</span><span>⌑ {t.invite}</span>
        </div>
      </div>
      <div className={styles.browserArea} id="explore">
        <div className={styles.ambient} aria-hidden="true"/>
        <div className={styles.browser}>
          <div className={styles.windowbar}>
            <div className={styles.windowDots} aria-hidden="true"><i/><i/><i/></div>
            <span>{t.window}</span><span className={styles.windowLabel}>DESIGN V2</span>
          </div>
          <div className={styles.browserBody}>
            <p className={styles.browserEyebrow}>{t.preview}</p>
            <h2>{t.you}</h2>
            <p className={styles.browserPrompt}>{t.select}</p>
            <div className={styles.tabrow} role="tablist" aria-label={t.choose}>
              {order.map(key=><button role="tab" type="button" aria-selected={active===key} aria-controls="space-preview" id={"tab-"+key} key={key} className={active===key?styles.tabActive:styles.tab} onClick={()=>setActive(key)}><span aria-hidden="true">{icons[key]}</span>{t.modes[key].name}</button>)}
            </div>
            <section className={styles.modePane} id="space-preview" role="tabpanel" aria-labelledby={"tab-"+active} key={active}>
              <div className={styles.orbit} aria-hidden="true"><span className={styles.orbitOne}/><span className={styles.orbitTwo}/><span className={styles.orbitCore}>{icons[active]}</span></div>
              <p className={styles.modeLabel}>{mode.label}</p>
              <h3>{mode.title}</h3>
              <p className={styles.modeDescription}>{mode.description}</p>
              <div className={styles.modePoints}><span>✓ {mode.first}</span><span>✓ {mode.second}</span><span>✓ {mode.third}</span></div>
            </section>
            <div className={styles.emptyState}><span aria-hidden="true">⌁</span><p>{t.nothing}</p></div>
          </div>
        </div>
        <div className={styles.stamp} aria-hidden="true"><span>PRIVACY</span><strong>FIRST</strong></div>
      </div>
    </section>
    <div className={styles.ticker} aria-hidden="true"><span>CONNECTION</span><span>✳</span><span>CONSENT</span><span>✳</span><span>COMMUNITY</span><span>✳</span><span>BELONGING</span></div>
    <section className={styles.journey} id="how-it-works">
      <div className={styles.journeyTop}><div><span className={styles.sectionEyebrow}>{t.journeyEyebrow}</span><h2>{t.journeyTitle}</h2></div><p>{t.journeyBody}</p></div>
      <div className={styles.spaceGrid}>{order.map((key,i)=><button key={key} className={active===key?styles.spaceCardActive:styles.spaceCard} type="button" aria-pressed={active===key} onClick={()=>{setActive(key);document.getElementById("explore")?.scrollIntoView({behavior:"smooth",block:"center"});}}><span className={styles.cardTop}><span>0{i+1}</span><span aria-hidden="true">↗</span></span><span className={styles.cardIcon}>{icons[key]}</span><strong>{t.modes[key].name}</strong><small>{t.modes[key].label}</small></button>)}</div>
      <div className={styles.journeyNote}><span>{t.next}</span><p>{t.notice}</p></div>
      <div className={styles.steps}>
        <div><span>01 / {t.one}</span><p>{t.step1}</p></div>
        <div><span>02 / {t.two}</span><p>{t.step2}</p></div>
        <div><span>03 / {t.three}</span><p>{t.step3}</p></div>
      </div>
    </section>
    <section id="values" className={styles.values}>
      <div className={styles.valuesHead}><span className={styles.sectionEyebrow}>{t.valuesEyebrow}</span><h2>{t.valuesTitle}</h2><p>{t.valuesBody}</p></div>
      <div className={styles.valueCards}><article><span>◉</span><h3>{t.value1}</h3><p>{t.value1body}</p></article><article><span>◇</span><h3>{t.value2}</h3><p>{t.value2body}</p></article><article><span>✳</span><h3>{t.value3}</h3><p>{t.value3body}</p></article></div>
    </section>
    <section id="privacy" className={styles.release}>
      <div><span className={styles.sectionEyebrow}>{t.release}</span><h2>{t.releaseTitle}</h2><p>{t.releaseBody}</p></div>
      <Link className={styles.releaseLink} href="/prizmaa/app">{t.cta}<span aria-hidden="true">↗</span></Link>
    </section>
    <footer className={styles.footer}><Link href="/prizmaa" className={styles.logo}><span className={styles.logoMark}>✳</span> PRIZMAA<span className={styles.dot}>.</span></Link><p>{t.footer}</p><a href="#content">↑ TOP</a></footer>
  </main>;
}
