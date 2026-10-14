'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Pillar = {
  num: string;
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
};

const PILLARS: Pillar[] = [
  {
    num: '01',
    id: 'discover',
    name: 'DISCOVER',
    tagline: 'Curated Cultural Directory',
    description: 'A verified index of queer-friendly cultural organizations, artist initiatives, grassroots community centers, and historical archives across Berlin, Amsterdam, Thessaloniki, Istanbul, and Münsterland.',
    icon: '🧭',
  },
  {
    num: '02',
    id: 'culture',
    name: 'CULTURE',
    tagline: 'Digital Exhibitions & Moving Image',
    description: 'A professional presentation environment for independent artists. Featuring video art archives, experimental cinema, traditional paper marbling (Ebru), and critical queer theory.',
    icon: '🎨',
  },
  {
    num: '03',
    id: 'community',
    name: 'COMMUNITY',
    tagline: 'Sovereign Collaborative Circles',
    description: 'Organized around shared disciplines, artistic practices, reading groups, and voluntary mutual aid. Prioritizing strict consent, moderation, and member safety.',
    icon: '👥',
  },
  {
    num: '04',
    id: 'opportunities',
    name: 'OPPORTUNITIES',
    tagline: 'Residencies, Grants & Open Calls',
    description: 'A dedicated noticeboard for creative fellowships, artistic commissions, academic conferences, and independent project funding opportunities across Europe and the Mediterranean.',
    icon: '💼',
  },
  {
    num: '05',
    id: 'experiences',
    name: 'EXPERIENCES',
    tagline: 'Living Ebru Workshops & Screenings',
    description: 'Physical and hybrid workshops, cultural travel experiences, and masterclasses. Bridging UNESCO-recognized traditional Ebru craft with contemporary queer artistic dialogue.',
    icon: '✨',
  },
  {
    num: '06',
    id: 'studio',
    name: 'CREATOR STUDIO',
    tagline: 'Portfolio & Professional Availability',
    description: 'Sovereign artist portfolio spaces that communicate creative offerings, commissions, and curatorial projects without algorithmic manipulation or intrusive ad networks.',
    icon: '🏛️',
  },
  {
    num: '07',
    id: 'partner',
    name: 'PARTNER SPACE',
    tagline: 'Institutional Collaborations',
    description: 'A structured gateway for galleries, universities, independent venues, and cultural organizers to host workshops, sponsor fellowships, and coordinate joint exhibitions.',
    icon: '🤝',
  },
];

export default function PrizmaaCulturalLanding() {
  const [camouflage, setCamouflage] = useState(false);
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryOrg, setInquiryOrg] = useState('');
  const [inquiryType, setInquiryType] = useState('WORKSHOP');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  // Emergency ESC key camouflage toggle for privacy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCamouflage((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryEmail) return;
    setInquirySubmitted(true);
  };

  // CAMOUFLAGE MODE (Emergency Academic / Botanical Note Disguise)
  if (camouflage) {
    return (
      <main style={{
        minHeight: '100vh',
        backgroundColor: '#faf8f5',
        color: '#2e2a27',
        fontFamily: 'serif',
        padding: '60px 24px',
        maxWidth: '800px',
        margin: '0 auto',
        lineHeight: 1.8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #dcd5cc', paddingBottom: '16px', marginBottom: '32px' }}>
          <span style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7a7065' }}>
            Notebook // Traditional Turkish Ebru Paper Marbling Studies
          </span>
          <button
            onClick={() => setCamouflage(false)}
            style={{ background: 'none', border: '1px solid #dcd5cc', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
          >
            Restore Interface (ESC)
          </button>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'normal', marginBottom: '16px' }}>
          Pigment Viscosity & Ox Gall Ratios on Tragacanth Gum Bath
        </h1>
        <p>
          The behavior of mineral earth pigments (iron oxides, ochre, lapis lazuli) upon an aqueous tragacanth (kitre) substrate is fundamentally governed by surface tension reduction through ox gall (sığır ödü). In natural paper marbling, each drop expands radially, displacing the preceding ring of color into concentric laminar boundaries.
        </p>
        <p style={{ marginTop: '16px' }}>
          Field notes recorded at Studio Emsdetten / Münsterland (2026). Archival reference on 120gsm acid-free Hahnemühle cotton paper.
        </p>
      </main>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#09080d',
      color: '#f4f3f7',
      fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      overflowX: 'hidden',
    }}>
      {/* Top Banner: Verification Protocol Notice */}
      <div style={{
        backgroundColor: '#0f0e15',
        borderBottom: '1px solid #1f1d28',
        padding: '8px 20px',
        fontSize: '11px',
        color: '#8e8b9e',
        fontFamily: 'var(--font-geist-mono), monospace',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ccff00', boxShadow: '0 0 8px #ccff00' }} />
          <span>ARGON PROTOCOL // FAIL-CLOSED VERIFIED CULTURAL LEDGER</span>
          <span style={{ color: '#444254' }}>&bull;</span>
          <span style={{ color: '#ccff00' }}>2 VERIFIED ARCHIVES</span>
          <span style={{ color: '#444254' }}>&bull;</span>
          <span style={{ color: '#00f0ff' }}>ZERO COMMERCIAL AD-TRACKING</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setCamouflage(true)}
            style={{
              background: 'transparent',
              border: '1px solid #2e2c38',
              color: '#a19ea0',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
            title="Switch instant camouflage disguise (ESC)"
          >
            🛡️ Camouflage (ESC)
          </button>
          <span>GERMANY &bull; NETHERLANDS &bull; GREECE &bull; TÜRKİYE</span>
        </div>
      </div>

      {/* Main Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(9, 8, 13, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo & Manifesto Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#121118',
              border: '1px solid #ccff00',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
              color: '#ccff00',
              boxShadow: '0 0 15px rgba(204, 255, 0, 0.2)',
            }}>
              ✳
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px', color: '#fff' }}>
                PRIZMAA
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-geist-mono), monospace',
                color: '#8e8b9e',
                marginLeft: '10px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>
                BEYOND IDENTITY. INTO POSSIBILITY.
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#pillars" style={{ fontSize: '13px', color: '#a1a0ab', textDecoration: 'none', fontWeight: 600 }}>
              7 Pillars
            </a>
            <a href="#archives" style={{ fontSize: '13px', color: '#a1a0ab', textDecoration: 'none', fontWeight: 600 }}>
              Living Ebru &amp; Moving Image
            </a>
            <a href="#shield" style={{ fontSize: '13px', color: '#a1a0ab', textDecoration: 'none', fontWeight: 600 }}>
              Sovereignty &amp; Shield
            </a>
            <a href="#partner" style={{ fontSize: '13px', color: '#ccff00', textDecoration: 'none', fontWeight: 700 }}>
              Institutional Partner Space
            </a>
            <Link
              href="/prizmaa/app"
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontWeight: 700,
                color: '#000',
                backgroundColor: '#ccff00',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
              }}
            >
              LAUNCH DIRECTORY ↗
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 24px 80px',
      }}>
        {/* Glow ambient accent */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(204, 255, 0, 0.08) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '4px',
          backgroundColor: '#121118',
          border: '1px solid #292833',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '11px',
          color: '#00f0ff',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          <span>INDEPENDENT CULTURAL INSTITUTION</span>
          <span style={{ color: '#444254' }}>&bull;</span>
          <span>NO ALGORITHMIC HOOKUP MARKETPLACE</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(44px, 6vw, 76px)',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-2px',
          margin: '0 0 28px',
          maxWidth: '960px',
        }}>
          An independent digital city for <span style={{ color: '#ccff00' }}>queer culture</span>, creativity &amp; opportunity.
        </h1>

        <p style={{
          fontSize: 'clamp(17px, 2vw, 20px)',
          color: '#a8a6b5',
          maxWidth: '820px',
          margin: '0 0 44px',
          lineHeight: 1.6,
          fontWeight: 300,
        }}>
          PRIZMAA is not a hookup app or conventional dating platform. We provide an international cultural infrastructure connecting LGBTQ+ artists, researchers, grassroots community spaces, and verified cultural initiatives across Germany, the Netherlands, Greece, the Mediterranean, and Türkiye.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '60px',
        }}>
          <Link
            href="/prizmaa/app"
            style={{
              padding: '16px 32px',
              fontSize: '14px',
              fontWeight: 800,
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#000',
              backgroundColor: '#ccff00',
              borderRadius: '6px',
              textDecoration: 'none',
              letterSpacing: '0.5px',
              boxShadow: '0 0 25px rgba(204, 255, 0, 0.25)',
            }}
          >
            EXPLORE CULTURAL DIRECTORY ↗
          </Link>

          <a
            href="#archives"
            style={{
              padding: '16px 28px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#fff',
              backgroundColor: '#121118',
              border: '1px solid #2e2c38',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            VIEW LIVING ART ARCHIVES ↓
          </a>

          <a
            href="#partner"
            style={{
              padding: '16px 28px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#00f0ff',
              backgroundColor: 'transparent',
              border: '1px solid #00f0ff44',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            HOST WORKSHOP // PARTNER
          </a>
        </div>

        {/* Epistemic Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          borderTop: '1px solid #1f1d28',
          paddingTop: '32px',
        }}>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', letterSpacing: '1px', textTransform: 'uppercase' }}>
              01. SUSTAINABLE DESIGN
            </div>
            <div style={{ fontSize: '13px', color: '#d0cdd9', marginTop: '4px' }}>
              Zero battery-draining continuous polling. WCAG 2.2 AA contrast. Minimal bundle footprint.
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', letterSpacing: '1px', textTransform: 'uppercase' }}>
              02. SOVEREIGN PRIVACY
            </div>
            <div style={{ fontSize: '13px', color: '#d0cdd9', marginTop: '4px' }}>
              Local-first WebCrypto identity. No precise GPS broadcast. Designed for resilience in restrictive regions.
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: '#a1a0ab', letterSpacing: '1px', textTransform: 'uppercase' }}>
              03. ETHICAL MONETIZATION
            </div>
            <div style={{ fontSize: '13px', color: '#d0cdd9', marginTop: '4px' }}>
              Institutional venue partnerships &amp; voluntary patron support. No paywalls on basic human connection.
            </div>
          </div>
        </div>
      </section>

      {/* 7 PILLARS SECTION */}
      <section id="pillars" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '100px 24px',
        borderTop: '1px solid #181722',
      }}>
        <div style={{ marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', letterSpacing: '2px', textTransform: 'uppercase' }}>
            ARCHITECTURE OF BELONGING
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', margin: '8px 0 16px' }}>
            The Seven Core Pillars of PRIZMAA
          </h2>
          <p style={{ color: '#8e8b9e', maxWidth: '700px', fontSize: '15px' }}>
            A connected digital ecosystem engineered to support queer artists, independent organizers, cultural institutions, and researchers.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {PILLARS.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: '#0f0e15',
                border: '1px solid #1f1d28',
                borderRadius: '8px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>{p.icon}</span>
                  <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '11px', color: '#ccff00', fontWeight: 800 }}>
                    PILLAR {p.num}
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                  {p.name}
                </h3>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', marginBottom: '14px' }}>
                  {p.tagline}
                </div>
                <p style={{ fontSize: '13px', color: '#a8a6b5', lineHeight: 1.6 }}>
                  {p.description}
                </p>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1a1924' }}>
                <Link
                  href="/prizmaa/app"
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontWeight: 700,
                    color: '#ccff00',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  EXPLORE {p.name} ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED AUTHENTIC ARCHIVES (FOUNDER'S LIVING WORKS) */}
      <section id="archives" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '100px 24px',
        borderTop: '1px solid #181722',
      }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', backgroundColor: '#14131c', border: '1px solid #ccff0033', borderRadius: '4px', marginBottom: '12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ccff00' }} />
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', letterSpacing: '1px' }}>
              ARGON VERIFIED ARTISTIC RECORD // LEVEL 5 PROOF
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', margin: '4px 0 16px' }}>
            Living Ebru Heritage &amp; Moving Image Theory
          </h2>
          <p style={{ color: '#8e8b9e', maxWidth: '750px', fontSize: '15px' }}>
            Curated works and masterclass formats rooted in the verified creative research of founder Yusuf Şen (Master of Arts in Video Art &amp; Graphic Design).
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}>
          {/* Work 1: Ebru */}
          <div style={{
            backgroundColor: '#0f0e15',
            border: '1px solid #292833',
            borderRadius: '10px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', marginBottom: '16px' }}>
                <span>TRADITIONAL CRAFT &bull; UNESCO HERITAGE</span>
                <span>VERIFIED</span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                The Dissolution of Form: Living Ebru Collection
              </h3>
              <p style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', marginBottom: '16px' }}>
                Traditional Marbling &bull; Mineral Pigments on Tragacanth &bull; Studio Emsdetten
              </p>
              <p style={{ fontSize: '13px', color: '#b5b2c2', lineHeight: 1.7 }}>
                Reinterpreting 15th-century classical Turkish paper marbling through contemporary queer abstraction. Rather than rigid geometric motifs, colors expand organically across the fluid gum bath, reflecting the fluidity, vulnerability, and non-linear nature of human identity.
              </p>
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#13121a', borderRadius: '6px', fontSize: '12px', color: '#a8a6b5' }}>
                <strong style={{ color: '#fff' }}>Workshop Availability:</strong> 3-hour physical masterclass for cultural institutions, museums, and community centers. All materials prepared according to classical guild methods (ox gall, earth pigments, horsehair brushes).
              </div>
            </div>
            <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #1a1924', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e' }}>
                Artist: Yusuf Şen
              </span>
              <a href="#partner" style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', fontWeight: 700 }}>
                Request Booking Inquiries ↗
              </a>
            </div>
          </div>

          {/* Work 2: Video Art Thesis */}
          <div style={{
            backgroundColor: '#0f0e15',
            border: '1px solid #292833',
            borderRadius: '10px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', marginBottom: '16px' }}>
                <span>MOVING IMAGE &bull; ACADEMIC RESEARCH</span>
                <span>VERIFIED</span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                Queer Pictorial Language in Moving Image
              </h3>
              <p style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', marginBottom: '16px' }}>
                Master of Arts Thesis &bull; Experimental Video &bull; Temporal Disruption
              </p>
              <p style={{ fontSize: '13px', color: '#b5b2c2', lineHeight: 1.7 }}>
                An academic and artistic investigation into how queer bodies resist surveillance and normative narrative structures in cinema and digital media. Utilizing slow-motion chromatic dissolution, haptic visuality, and deconstructed audio landscapes to subvert binary viewing gazes.
              </p>
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#13121a', borderRadius: '6px', fontSize: '12px', color: '#a8a6b5' }}>
                <strong style={{ color: '#fff' }}>Screening &amp; Lecture:</strong> 90-minute curated presentation with moderated discourse on contemporary Mediterranean and European queer moving image archives.
              </div>
            </div>
            <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #1a1924', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e' }}>
                Curated by PRIZMAA Arts Board
              </span>
              <a href="#partner" style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', fontWeight: 700 }}>
                Request Academic Dossier ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SOVEREIGNTY & CENSORSHIP SHIELD (TURKEY & RESTRICTIVE REGIONS) */}
      <section id="shield" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '100px 24px',
        borderTop: '1px solid #181722',
      }}>
        <div style={{
          backgroundColor: '#0f0e15',
          border: '1px solid #1f1d28',
          borderRadius: '12px',
          padding: '48px 36px',
        }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', letterSpacing: '2px', textTransform: 'uppercase' }}>
            FAIL-CLOSED RESILIENCE
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-1px', margin: '8px 0 16px' }}>
            Built for High-Risk Jurisdictions &amp; Anti-Censorship
          </h2>
          <p style={{ color: '#a8a6b5', maxWidth: '780px', fontSize: '15px', lineHeight: 1.7 }}>
            Queer community members in countries with restrictive digital censorship or aggressive surveillance (such as Türkiye or regions under conservative oversight) face real legal and physical risks. PRIZMAA is engineered from first principles to minimize vulnerability:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '36px',
          }}>
            <div style={{ backgroundColor: '#13121a', padding: '24px', borderRadius: '8px', border: '1px solid #22202c' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔐</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Local WebCrypto Keys</h3>
              <p style={{ fontSize: '13px', color: '#8e8b9e', lineHeight: 1.6 }}>
                Identity cryptographic seeds are stored exclusively in your browser storage. No centralized phone numbers, passport records, or unencrypted identity logs.
              </p>
            </div>

            <div style={{ backgroundColor: '#13121a', padding: '24px', borderRadius: '8px', border: '1px solid #22202c' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>⌨️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Emergency ESC Disguise</h3>
              <p style={{ fontSize: '13px', color: '#8e8b9e', lineHeight: 1.6 }}>
                Tapping the ESC key or the camouflage icon instantly replaces the interface with a traditional academic treatise on mineral paper marbling pigments.
              </p>
            </div>

            <div style={{ backgroundColor: '#13121a', padding: '24px', borderRadius: '8px', border: '1px solid #22202c' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚫</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Zero Geolocation Broadcast</h3>
              <p style={{ fontSize: '13px', color: '#8e8b9e', lineHeight: 1.6 }}>
                We never require exact GPS device permissions or publish exact meter distances to nearby members. Participation is organized by self-selected city nodes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL PARTNER SPACE & PATRONAGE */}
      <section id="partner" style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '100px 24px',
        borderTop: '1px solid #181722',
      }}>
        <div style={{
          backgroundColor: '#121118',
          border: '1px solid #2e2c38',
          borderRadius: '16px',
          padding: '48px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#ccff00',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              backgroundColor: '#1c1a24',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid #ccff0044',
            }}>
              PILLAR 07 // PARTNER SPACE
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, margin: '16px 0 8px' }}>
              Host a Workshop or Institutional Collaboration
            </h2>
            <p style={{ color: '#8e8b9e', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
              Cultural organizations, galleries, universities, and independent venues are invited to book physical Ebru masterclasses or sponsor community initiatives.
            </p>
          </div>

          {inquirySubmitted ? (
            <div style={{
              backgroundColor: '#0f1712',
              border: '1px solid #22c55e',
              padding: '24px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#86efac',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '13px',
            }}>
              ✓ INQUIRY RECEIVED. We will reach out with the official workshop curriculum and booking dossier within 48 hours.
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e', marginBottom: '6px' }}>
                    ORGANIZATION / VENUE NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stroetmanns Fabrik / VHS Münster"
                    value={inquiryOrg}
                    onChange={(e) => setInquiryOrg(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#09080d',
                      border: '1px solid #2e2c38',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e', marginBottom: '6px' }}>
                    OFFICIAL CONTACT EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@institution.org"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#09080d',
                      border: '1px solid #2e2c38',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e', marginBottom: '6px' }}>
                  INQUIRY TYPE
                </label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#09080d',
                    border: '1px solid #2e2c38',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="WORKSHOP">Living Ebru Hands-on Workshop (3-Hour Masterclass)</option>
                  <option value="SCREENING">Video Art Screening &amp; Theory Discourse (90-Min)</option>
                  <option value="PARTNERSHIP">Cultural Directory Partner Verification</option>
                  <option value="GRANT">Fellowship / Residency Collaboration</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  backgroundColor: '#ccff00',
                  color: '#000',
                  fontWeight: 800,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                SUBMIT INSTITUTIONAL INQUIRY ↗
              </button>
            </form>
          )}

          {/* Patron Support Option */}
          <div style={{
            marginTop: '36px',
            paddingTop: '28px',
            borderTop: '1px solid #1f1d28',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                Independent Patron &amp; Supporter Contribution
              </div>
              <div style={{ fontSize: '12px', color: '#8e8b9e', marginTop: '2px' }}>
                Voluntary one-time patronage to fund independent server infrastructure and art grants.
              </div>
            </div>
            <a
              href="https://buy.stripe.com/5kQ28r884dC670T9b36Na2f"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontWeight: 800,
                color: '#fff',
                backgroundColor: '#1b1924',
                border: '1px solid #3d3a4d',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Patron Support (€9.99) ↗
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER & LEGAL COMPLIANCE */}
      <footer style={{
        borderTop: '1px solid #181722',
        backgroundColor: '#07060a',
        padding: '60px 24px',
        fontSize: '12px',
        color: '#6e6b7c',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#ccff00', display: 'inline-block' }} />
              <span style={{ fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>PRIZMAA</span>
              <span style={{ color: '#444254' }}>&bull;</span>
              <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '11px', color: '#8e8b9e' }}>
                BEYOND IDENTITY. INTO POSSIBILITY.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '11px' }}>
              <Link href="/prizmaa/app" style={{ color: '#a1a0ab' }}>Platform Directory</Link>
              <a href="https://charlysmoky2010-hub.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: '#a1a0ab' }}>
                Impressum (§ 5 DDG)
              </a>
              <a href="https://charlysmoky2010-hub.github.io/offers.html" target="_blank" rel="noopener noreferrer" style={{ color: '#a1a0ab' }}>
                Datenschutz (DSGVO Art. 9)
              </a>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #14131c',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '11px',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}>
            <span>PRIZMAA &copy; 2026 &bull; Independent Queer Cultural Ecosystem</span>
            <span>Founder &amp; Artistic Direction: Yusuf Şen &bull; PHI-BRAIN &times; ARGON PROTOCOL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
