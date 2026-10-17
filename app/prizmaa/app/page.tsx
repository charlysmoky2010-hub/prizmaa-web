'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type CulturalNode = {
  id: string;
  title: string;
  category: 'ARCHIVE' | 'STUDIO' | 'COMMUNITY' | 'EXHIBITION';
  region: string;
  city: string;
  disciplines: string;
  description: string;
  accessibility: string;
  status: 'VERIFIED' | 'DEMONSTRATION';
};

const NODES: CulturalNode[] = [
  {
    id: 'node-01',
    title: 'Living Ebru Studio & Archive',
    category: 'STUDIO',
    region: 'DE_WEST',
    city: 'Western Germany',
    disciplines: 'Traditional Paper Marbling, Queer Abstraction, Mineral Pigments',
    description: 'Illustrative studio archive (creator identity withheld). Dedicated to classical Ottoman/Turkish paper marbling (Ebru) reimagined through contemporary queer visual abstraction and non-binary color fluidity.',
    accessibility: 'Step-free studio access, tactile workshops, quiet sessions available upon request.',
    status: 'VERIFIED',
  },
  {
    id: 'node-02',
    title: 'Schwules Museum & Research Archive',
    category: 'ARCHIVE',
    region: 'DE_BERLIN',
    city: 'Berlin',
    disciplines: 'Queer History, Archival Research, Photography, Visual Culture',
    description: 'One of the world’s foremost independent institutions for preserving, curating, and exhibiting LGBTQ+ artistic, social, and political histories across Central Europe.',
    accessibility: 'Full wheelchair accessibility, elevator, gender-neutral restrooms, plain language audio guides.',
    status: 'VERIFIED',
  },
  {
    id: 'node-03',
    title: 'IHLIA LGBTI Heritage & Documentation Center',
    category: 'ARCHIVE',
    region: 'NL_AMSTERDAM',
    city: 'Amsterdam',
    disciplines: 'Literature, Oral History, Periodical Archives, International Research',
    description: 'The largest LGBTI archive in Europe, housing over 100,000 items covering Dutch, Mediterranean, and global queer literature, activist ephemera, and photography.',
    accessibility: 'Housed within OBA Oosterdok; fully accessible, assistive listening systems available.',
    status: 'DEMONSTRATION',
  },
  {
    id: 'node-04',
    title: 'Homoculture Lab & Visual Arts Circle',
    category: 'COMMUNITY',
    region: 'GR_THESSALONIKI',
    city: 'Thessaloniki',
    disciplines: 'Moving Image, Feminist Zines, Mediterranean Queer Theory',
    description: 'An independent grassroots cultural space hosting open seminars, experimental cinema screenings, and community discussions on queer aesthetics across the Aegean and Balkans.',
    accessibility: 'Street-level entrance, Greek & English subtitled screenings, relaxed seating area.',
    status: 'DEMONSTRATION',
  },
  {
    id: 'node-05',
    title: 'SPoD & Queer Cultural Documentation Initiative',
    category: 'COMMUNITY',
    region: 'TR_ISTANBUL',
    city: 'Istanbul / Kadıköy',
    disciplines: 'Legal Advocacy, Grassroots Solidarity, Oral History Archives',
    description: 'Civil rights and cultural collective fostering safe public dialogues, artistic exhibitions, and community legal support in an increasingly restrictive administrative climate.',
    accessibility: 'Discreet meeting environment, virtual attendance options for high-risk participants.',
    status: 'DEMONSTRATION',
  },
  {
    id: 'node-06',
    title: 'De Pijp Cultural & Residency Salon',
    category: 'EXHIBITION',
    region: 'NL_AMSTERDAM',
    city: 'Amsterdam',
    disciplines: 'Visual Arts, Contemporary Design, Public Programming',
    description: 'A neighborhood salon celebrating queer cross-disciplinary makers, hosting seasonal pop-up exhibitions and international creative residencies.',
    accessibility: 'Ground floor exhibition space with sensory-friendly morning hours.',
    status: 'DEMONSTRATION',
  },
];

type Exhibition = {
  id: string;
  title: string;
  artist: string;
  medium: string;
  region: string;
  description: string;
  status: 'VERIFIED' | 'DEMONSTRATION';
};

const EXHIBITIONS: Exhibition[] = [
  {
    id: 'ex-01',
    title: 'The Dissolution of Form: Living Ebru Collection',
    artist: 'Independent contributor',
    medium: 'Mineral Earth Pigments & Ox Gall on Aqueous Tragacanth Substrate',
    region: 'Germany',
    description: 'Reinterpreting 15th-century Turkish marbling through fluid queer abstraction. Colors disperse without boundary constraints, embodying identity beyond imposed binary grids.',
    status: 'VERIFIED',
  },
  {
    id: 'ex-02',
    title: 'Queer Pictorial Language in Moving Image',
    artist: 'Independent contributor (research archive)',
    medium: 'Experimental Video, Temporal Disruption & Soundscape',
    region: 'Europe',
    description: 'Academic and visual research into how the queer body resists disciplinary surveillance through temporal deceleration, chromatic saturation, and deconstructed cinematic grammar.',
    status: 'VERIFIED',
  },
  {
    id: 'ex-03',
    title: 'Aegean Light & Transnational Margins',
    artist: 'Collaborative Mediterranean Circle',
    medium: '35mm Film Photography & Hand-printed Silver Gelatin',
    region: 'Thessaloniki / Izmir',
    description: 'Visual chronicles of shared maritime heritage, migration, and hidden queer meeting grounds across the Aegean coastline.',
    status: 'DEMONSTRATION',
  },
];

type Opportunity = {
  id: string;
  title: string;
  organizer: string;
  type: string;
  region: string;
  deadline: string;
  stipend: string;
  description: string;
};

const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-01',
    title: 'Queer Moving Image & Archival Fellowship 2027',
    organizer: 'Trans-European Cultural Exchange',
    type: 'Research Fellowship',
    region: 'Berlin / Amsterdam',
    deadline: 'December 15, 2026',
    stipend: '€2,400 / month + Studio',
    description: 'Three-month residency supporting researchers and artists examining queer memory, film theory, and independent video archives in Western and Southern Europe.',
  },
  {
    id: 'opp-02',
    title: 'Traditional Craft & Contemporary Form Residency',
    organizer: 'Münsterland Regional Arts Initiative',
    type: 'Production Residency',
    region: 'Münsterland / Emsdetten',
    deadline: 'January 30, 2027',
    stipend: '€1,800 + Material Grant',
    description: 'Inviting artists working at the intersection of heritage craft (textiles, marbling, ceramic) and contemporary non-normative community practices.',
  },
];

export default function PrizmaaPlatformDirectory() {
  const [activeTab, setActiveTab] = useState<'nodes' | 'exhibitions' | 'opportunities' | 'privacy'>('nodes');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [camouflage, setCamouflage] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CulturalNode | null>(null);

  // ESC key instant camouflage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCamouflage((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredNodes = useMemo(() => {
    return NODES.filter((n) => {
      if (selectedRegion !== 'ALL' && n.region !== selectedRegion) return false;
      if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = n.title.toLowerCase().includes(q);
        const mCity = n.city.toLowerCase().includes(q);
        const mDesc = n.description.toLowerCase().includes(q);
        const mDisc = n.disciplines.toLowerCase().includes(q);
        if (!mTitle && !mCity && !mDesc && !mDisc) return false;
      }
      return true;
    });
  }, [selectedRegion, selectedCategory, searchQuery]);

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
          The behavior of mineral earth pigments (iron oxides, ochre, lapis lazuli) upon an aqueous tragacanth (kitre) substrate is fundamentally governed by surface tension reduction through ox gall (sığır ödü).
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
      lineHeight: 1.5,
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(9, 8, 13, 0.95)',
        borderBottom: '1px solid #1f1d28',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: '#fff',
              fontWeight: 900,
              fontSize: '18px',
            }}>
              <span style={{ color: '#ccff00' }}>✳</span>
              PRIZMAA
            </Link>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#8e8b9e',
              letterSpacing: '1px',
              borderLeft: '1px solid #292833',
              paddingLeft: '12px',
            }}>
              CULTURAL DIRECTORY &amp; ARCHIVE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setCamouflage(true)}
              style={{
                background: 'transparent',
                border: '1px solid #2e2c38',
                color: '#8e8b9e',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              🛡️ Discreet Disguise (ESC)
            </button>

            <Link
              href="/"
              style={{
                fontSize: '12px',
                color: '#ccff00',
                textDecoration: 'none',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontWeight: 700,
              }}
            >
              ← Back to Manifesto
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        borderBottom: '1px solid #1a1924',
        backgroundColor: '#0c0b11',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'nodes', label: '1. Cultural Directory (Nodes)', count: filteredNodes.length },
            { id: 'exhibitions', label: '2. Exhibitions & Research', count: EXHIBITIONS.length },
            { id: 'opportunities', label: '3. Fellowships & Open Calls', count: OPPORTUNITIES.length },
            { id: 'privacy', label: '4. Privacy & Anti-Censorship', count: null },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #ccff00' : '2px solid transparent',
                  padding: '16px 4px',
                  color: isActive ? '#ccff00' : '#8e8b9e',
                  fontSize: '12px',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {tab.count !== null && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: isActive ? '#ccff0022' : '#171620',
                    color: isActive ? '#ccff00' : '#6e6b7c',
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* TAB 1: CULTURAL DIRECTORY */}
        {activeTab === 'nodes' && (
          <div>
            {/* Filter Bar */}
            <div style={{
              backgroundColor: '#0f0e15',
              border: '1px solid #1f1d28',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '32px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search space, city, or discipline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: '#09080d',
                    border: '1px solid #2e2c38',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    minWidth: '240px',
                    outline: 'none',
                  }}
                />

                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  style={{
                    backgroundColor: '#09080d',
                    border: '1px solid #2e2c38',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Regions</option>
                  <option value="DE_WEST">Germany: Münsterland / West</option>
                  <option value="DE_BERLIN">Germany: Berlin</option>
                  <option value="NL_AMSTERDAM">Netherlands: Amsterdam</option>
                  <option value="GR_THESSALONIKI">Greece: Thessaloniki</option>
                  <option value="TR_ISTANBUL">Türkiye: Istanbul</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    backgroundColor: '#09080d',
                    border: '1px solid #2e2c38',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="ARCHIVE">Archives &amp; Research</option>
                  <option value="STUDIO">Ateliers &amp; Studios</option>
                  <option value="COMMUNITY">Community Spaces</option>
                  <option value="EXHIBITION">Exhibition Salons</option>
                </select>
              </div>

              <div style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e' }}>
                EXPLAINABLE CRITERIA &bull; NO LOCATION TRACKING
              </div>
            </div>

            {/* Nodes Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '20px',
            }}>
              {filteredNodes.map((n) => (
                <article
                  key={n.id}
                  style={{
                    backgroundColor: '#0f0e15',
                    border: '1px solid #1f1d28',
                    borderRadius: '8px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontWeight: 800,
                        backgroundColor: '#1b1924',
                        color: '#00f0ff',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        letterSpacing: '1px',
                      }}>
                        {n.category}
                      </span>

                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-geist-mono), monospace',
                        color: n.status === 'VERIFIED' ? '#ccff00' : '#8e8b9e',
                        border: `1px solid ${n.status === 'VERIFIED' ? '#ccff0044' : '#292833'}`,
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}>
                        {n.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                      {n.title}
                    </h3>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', marginBottom: '12px' }}>
                      📍 {n.city}
                    </div>

                    <p style={{ fontSize: '13px', color: '#b2afbe', lineHeight: 1.6, marginBottom: '16px' }}>
                      {n.description}
                    </p>

                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#8e8b9e', marginBottom: '12px' }}>
                      <strong>Disciplines:</strong> {n.disciplines}
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid #1a1924',
                    paddingTop: '14px',
                    marginTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '10px', color: '#6e6b7c', fontFamily: 'var(--font-geist-mono), monospace' }}>
                      ♿ {n.accessibility.slice(0, 36)}...
                    </span>
                    <button
                      onClick={() => setSelectedNode(n)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ccff00',
                        fontSize: '11px',
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Details &amp; Access ↗
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EXHIBITIONS & MOVING IMAGE */}
        {activeTab === 'exhibitions' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {EXHIBITIONS.map((e) => (
              <div
                key={e.id}
                style={{
                  backgroundColor: '#0f0e15',
                  border: '1px solid #22202c',
                  borderRadius: '8px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', marginBottom: '12px' }}>
                    <span>{e.artist}</span>
                    <span style={{ color: e.status === 'VERIFIED' ? '#ccff00' : '#8e8b9e' }}>{e.status}</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>{e.title}</h3>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', marginBottom: '14px' }}>
                    {e.medium} &bull; {e.region}
                  </div>
                  <p style={{ fontSize: '13px', color: '#b5b2c2', lineHeight: 1.6 }}>{e.description}</p>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1a1924' }}>
                  <Link
                    href="/#partner"
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      color: '#ccff00',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Inquire for Screening / Exhibition Booking ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: OPPORTUNITIES & FELLOWSHIPS */}
        {activeTab === 'opportunities' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {OPPORTUNITIES.map((o) => (
              <div
                key={o.id}
                style={{
                  backgroundColor: '#0f0e15',
                  border: '1px solid #1f1d28',
                  borderRadius: '8px',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00' }}>
                    {o.organizer} &bull; {o.region}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff' }}>
                    DEADLINE: {o.deadline}
                  </span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{o.title}</h3>
                <div style={{ fontSize: '12px', color: '#8e8b9e', marginBottom: '14px', fontFamily: 'var(--font-geist-mono), monospace' }}>
                  Stipend / Support: <strong style={{ color: '#fff' }}>{o.stipend}</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#b5b2c2', lineHeight: 1.6 }}>{o.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PRIVACY & RESILIENCE */}
        {activeTab === 'privacy' && (
          <div style={{
            backgroundColor: '#0f0e15',
            border: '1px solid #1f1d28',
            borderRadius: '8px',
            padding: '36px',
            maxWidth: '860px',
          }}>
            <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '16px' }}>
              Sovereign Privacy Architecture &amp; Anti-Censorship
            </h2>
            <p style={{ fontSize: '14px', color: '#b5b2c2', lineHeight: 1.7, marginBottom: '24px' }}>
              PRIZMAA implements fail-closed privacy by design. We recognize that in jurisdictions with active anti-LGBTQ+ surveillance or restrictive laws, participating in queer cultural platforms can carry real risks.
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ backgroundColor: '#13121a', padding: '16px', borderRadius: '6px' }}>
                <strong style={{ color: '#ccff00', display: 'block', marginBottom: '4px' }}>1. No Precise Geolocation</strong>
                <p style={{ fontSize: '12px', color: '#8e8b9e', margin: 0 }}>
                  We never query GPS coordinates. You explore nodes by selecting regional hubs voluntarily.
                </p>
              </div>

              <div style={{ backgroundColor: '#13121a', padding: '16px', borderRadius: '6px' }}>
                <strong style={{ color: '#00f0ff', display: 'block', marginBottom: '4px' }}>2. Emergency Camouflage Key</strong>
                <p style={{ fontSize: '12px', color: '#8e8b9e', margin: 0 }}>
                  Tapping the ESC key immediately disguises the page as a scholarly text on traditional paper marbling pigments.
                </p>
              </div>

              <div style={{ backgroundColor: '#13121a', padding: '16px', borderRadius: '6px' }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>3. Zero Advertising Networks</strong>
                <p style={{ fontSize: '12px', color: '#8e8b9e', margin: 0 }}>
                  No Meta Pixel, no Google Ads telemetry, and no data broker cookies.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Node Detail Modal */}
      {selectedNode && (
        <div
          role="presentation"
          onClick={() => setSelectedNode(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#121118',
              border: '1px solid #2e2c38',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              padding: '32px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#8e8b9e',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            <span style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: '#ccff00', letterSpacing: '1px' }}>
              {selectedNode.category} // {selectedNode.status}
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: '8px 0 4px' }}>
              {selectedNode.title}
            </h2>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: '#00f0ff', marginBottom: '16px' }}>
              📍 {selectedNode.city}
            </div>

            <p style={{ fontSize: '14px', color: '#b5b2c2', lineHeight: 1.7, marginBottom: '20px' }}>
              {selectedNode.description}
            </p>

            <div style={{ backgroundColor: '#09080d', padding: '16px', borderRadius: '6px', fontSize: '12px', marginBottom: '20px' }}>
              <div style={{ color: '#8e8b9e', marginBottom: '6px' }}><strong>Disciplines:</strong> {selectedNode.disciplines}</div>
              <div style={{ color: '#8e8b9e' }}><strong>Accessibility:</strong> {selectedNode.accessibility}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccff00',
                  color: '#000',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontWeight: 800,
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}