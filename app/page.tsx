'use client';

import React, { useState } from 'react';

export default function PrizmaLandingPage() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) return;
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      });
      if (res.ok) {
        setWaitlistStatus('ok');
        setEmail('');
      } else {
        setWaitlistStatus('err');
      }
    } catch {
      setWaitlistStatus('err');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#09080d',
      color: '#f4f3f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      lineHeight: 1.5,
      overflowX: 'hidden',
    }}>
      {/* Glow Effects */}
      <div style={{
        position: 'fixed',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(255, 59, 121, 0.15) 0%, rgba(120, 115, 245, 0.08) 50%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* NAVIGATION BAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(9, 8, 13, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff3b79 0%, #7928ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
              color: '#fff',
              boxShadow: '0 0 15px rgba(255, 59, 121, 0.4)',
            }}>
              P
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px', color: '#fff' }}>
                PRIZMAA
              </span>
              <span style={{ fontSize: '10px', color: '#ff3b79', fontWeight: 700, marginLeft: '6px', letterSpacing: '1px' }}>
                18+
              </span>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#nasil-calisir" style={{ fontSize: '13px', color: '#a1a0ab', textDecoration: 'none', fontWeight: 500 }}>
              Nasıl Çalışır?
            </a>
            <a href="#gizlilik" style={{ fontSize: '13px', color: '#a1a0ab', textDecoration: 'none', fontWeight: 500 }}>
              Gizlilik
            </a>
            <a href="#fiyat" style={{ fontSize: '13px', color: '#a1a0ab', textDecoration: 'none', fontWeight: 500 }}>
              Founder Pass
            </a>
            <a
              href="https://temporary-nimble-ocarina-hawzibi.vercel.app/prizmaa/beta"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Web App'i Aç ↗
            </a>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        {/* Live Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 59, 121, 0.12)',
          border: '1px solid rgba(255, 59, 121, 0.3)',
          marginBottom: '28px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff3b79', boxShadow: '0 0 10px #ff3b79' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', color: '#ff8eb4', textTransform: 'uppercase' }}>
            ERKEKLER İÇİN GİZLİ QUEER RADAR &bull; CANLI BETA
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(44px, 7vw, 84px)',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-2px',
          margin: '0 auto 24px',
          maxWidth: '900px',
        }}>
          AZ LAF.<br />
          <span style={{
            background: 'linear-gradient(90deg, #ff3b79 0%, #ff8eb4 40%, #7928ca 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            GERÇEK KİMYA.
          </span>
        </h1>

        {/* Lead */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: '#a8a6b5',
          maxWidth: '680px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Ghosting'e, sahte botlara ve saatlerce süren boş muhabbetlere son. 
          Ne aradığını bilen erkekler için tasarlanmış, <b>tam gizlilik odaklı</b> yeni nesil tanışma ve buluşma ağı.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '50px',
        }}>
          <a
            href="https://temporary-nimble-ocarina-hawzibi.vercel.app/prizmaa/beta"
            style={{
              padding: '16px 32px',
              fontSize: '15px',
              fontWeight: 800,
              color: '#fff',
              background: 'linear-gradient(90deg, #ff3b79 0%, #d946ef 100%)',
              borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(255, 59, 121, 0.4)',
              transition: 'transform 0.2s',
            }}
          >
            🚀 Web App'i Başlat (Ücretsiz Gir)
          </a>

          <a
            href="https://buy.stripe.com/5kQ28r884dC670T9b36Na2f"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '16px 28px',
              fontSize: '15px',
              fontWeight: 800,
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>💎 Founder Pass (€9.99)</span>
            <span style={{ fontSize: '11px', color: '#ff8eb4' }}>Ömür Boyu ↗</span>
          </a>
        </div>

        {/* Privacy Pill */}
        <div style={{ fontSize: '12px', color: '#737080' }}>
          🔒 E-posta zorunlu değil &bull; GPS yayını yok &bull; 100% DSGVO / GDPR Uyumlu
        </div>
      </section>

      {/* VISUAL SHOWCASE MOCKUP (GRID PREVIEW) */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1000px',
        margin: '0 auto 100px',
        padding: '0 24px',
      }}>
        <div style={{
          backgroundColor: '#121118',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(255, 59, 121, 0.15)',
        }}>
          {/* Mockup Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
                CANLI RADAR AKIŞI (YAKINDAKİLER)
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#ff3b79', fontWeight: 800 }}>
              ⚡ 6 ERKEK ÇEVRİMİÇİ
            </span>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {[
              {
                name: 'Alex_M',
                distance: '150m',
                intent: 'Right now. Coffee first or straight to it.',
                tags: ['RIGHT NOW', 'DISCREET'],
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                badge: '⚡ BOOST',
                color: '#d946ef',
              },
              {
                name: 'Kaan_Berlin',
                distance: '320m',
                intent: 'Drinks & late night walk. Good chemistry.',
                tags: ['DRINKS', 'DATE'],
                img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
                badge: null,
                color: '#fff',
              },
              {
                name: 'Sam_Raw',
                distance: '900m',
                intent: 'Cruising park area right now. Hit me up.',
                tags: ['CRUISING', 'OUTDOORS'],
                img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
                badge: '👑 VIP',
                color: '#ccff00',
              },
              {
                name: 'Marcus_92',
                distance: '1.2km',
                intent: 'Host available. Leather / gear welcome.',
                tags: ['HOSTING', 'GEAR'],
                img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
                badge: '⚡ BOOST',
                color: '#d946ef',
              },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  height: '260px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: p.badge ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: p.badge ? `0 0 15px ${p.color}33` : 'none',
                }}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                }} />

                {/* Top Badges */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  right: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: '#ccff00',
                  }}>
                    {p.distance}
                  </span>
                  {p.badge && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      backgroundColor: p.color,
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Bottom Info */}
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: '#fff', marginBottom: '2px' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#c3bfce', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                    {p.intent}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {p.tags.map((t, idx) => (
                      <span key={idx} style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        color: '#a1a0ab',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE PILLARS (NASIL ÇALIŞIR) */}
      <section id="nasil-calisir" style={{
        maxWidth: '1100px',
        margin: '0 auto 100px',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#ff3b79', textTransform: 'uppercase' }}>
            FARKLILIKLAR
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-1px', margin: '10px 0' }}>
            Neden Diğer Uygulamalardan Farklı?
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              num: '01',
              title: 'Net Niyetler, Sıfır Vakit Kaybı',
              desc: 'Hemen buluşma mı, kahve & sohbet mi, yoksa uzun vadeli mi? Herkes niyetini açıkça belirtir. "Naber, ne arıyorsun?" sorularıyla saatlerce vakit kaybetmezsin.',
              icon: '🎯',
            },
            {
              num: '02',
              title: 'Discreet by Design (Tam Gizlilik)',
              desc: 'Konumunu sokağına kadar ifşa eden haritalar yok. Evini veya işini kimse göremez. Şehir düzeyinde, radar mantığıyla güvenli ve anonim gezinirsin.',
              icon: '🛡️',
            },
            {
              num: '03',
              title: 'Karşılıklı İzin (Mutual Consent)',
              desc: 'İstemediğin fotoğraflar veya spam mesajlar gelen kutunu dolduramaz. Sohbet yalnızca iki taraf da birbirini karşılıklı onayladığında açılır.',
              icon: '🔒',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#121118',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff3b79', letterSpacing: '1px', marginBottom: '8px' }}>
                {item.num}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#9d9aa8', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOUNDER PASS MONETIZATION (FIYATLANDIRMA) */}
      <section id="fiyat" style={{
        maxWidth: '900px',
        margin: '0 auto 100px',
        padding: '0 24px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 59, 121, 0.15) 0%, rgba(121, 40, 202, 0.15) 100%)',
          border: '1px solid rgba(255, 59, 121, 0.4)',
          borderRadius: '24px',
          padding: '48px 36px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
            backgroundColor: '#ff3b79',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '20px',
            textTransform: 'uppercase',
          }}>
            SINIRLI KURUCU ÜYELİK
          </span>

          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, margin: '20px 0 10px', color: '#fff' }}>
            PRIZMAA Lifetime Founder Pass
          </h2>

          <p style={{ fontSize: '16px', color: '#d0cdd9', maxWidth: '560px', margin: '0 auto 24px' }}>
            Bir kere öde, ömür boyu VIP ol. Aylık abonelik ücretleri başlamadan önce ilk 100 kurucu üye arasına katıl.
          </p>

          <div style={{
            fontSize: '56px',
            fontWeight: 900,
            color: '#fff',
            marginBottom: '8px',
          }}>
            €9.99
            <span style={{ fontSize: '16px', color: '#a1a0ab', fontWeight: 500 }}> / Tek Seferlik</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            margin: '24px 0 32px',
            fontSize: '13px',
            color: '#fff',
          }}>
            <div>✓ Seni Kimlerin Beğendiğini Gör</div>
            <div>✓ Sınırsız Mesajlaşma</div>
            <div>✓ Hayalet (Gizli) Mod</div>
            <div>✓ Profilini 1-Tıkla Öne Çıkar</div>
          </div>

          <a
            href="https://buy.stripe.com/5kQ28r884dC670T9b36Na2f"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '18px 40px',
              fontSize: '16px',
              fontWeight: 900,
              color: '#fff',
              background: 'linear-gradient(90deg, #ff3b79 0%, #7928ca 100%)',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(255, 59, 121, 0.5)',
            }}
          >
            💳 Stripe ile Güvenli Satın Al (€9.99) ↗
          </a>

          <div style={{ fontSize: '11px', color: '#888496', marginTop: '16px' }}>
            🔒 256-Bit SSL Şifreli Ödeme &bull; Apple Pay, Google Pay, Kredi Kartı Destekli
          </div>
        </div>
      </section>

      {/* WAITLIST / HABERDAR OL */}
      <section style={{
        maxWidth: '600px',
        margin: '0 auto 100px',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          Şehrindeki Lansmandan Haberdar Ol
        </h3>
        <p style={{ fontSize: '14px', color: '#9d9aa8', marginBottom: '24px' }}>
          Prizma yakında yeni şehirlerde açılıyor. E-postanı bırak, ilk açılan bölgede öncelik kazan.
        </p>

        <form onSubmit={handleWaitlist} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            required
            placeholder="E-posta adresin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: '14px 18px',
              fontSize: '15px',
              borderRadius: '10px',
              backgroundColor: '#15141c',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              outline: 'none',
            }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888496', textAlign: 'left', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ accentColor: '#ff3b79' }}
            />
            <span>Yalnızca şehir lansman duyuruları için saklanmasını onaylıyorum.</span>
          </label>

          <button
            type="submit"
            disabled={waitlistStatus === 'loading' || !email || !consent}
            style={{
              padding: '14px',
              fontSize: '14px',
              fontWeight: 800,
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              cursor: (!email || !consent) ? 'not-allowed' : 'pointer',
              opacity: (!email || !consent) ? 0.5 : 1,
            }}
          >
            {waitlistStatus === 'loading' ? 'Kaydediliyor...' : 'Listeye Katıl'}
          </button>

          {waitlistStatus === 'ok' && (
            <p style={{ fontSize: '13px', color: '#4ade80', marginTop: '6px' }}>✓ E-postan kaydedildi, teşekkürler!</p>
          )}
          {waitlistStatus === 'err' && (
            <p style={{ fontSize: '13px', color: '#f87171', marginTop: '6px' }}>Bir hata oluştu, lütfen tekrar deneyin.</p>
          )}
        </form>
      </section>

      {/* FOOTER & LEGAL SHIELD */}
      <footer id="gizlilik" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#07060a',
        padding: '40px 24px',
        fontSize: '12px',
        color: '#716e7e',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>🔞 18+ Nur für Erwachsene (Sadece Yetişkinler)</span>
            <span>&bull;</span>
            <a href="https://charlysmoky2010-hub.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: '#a1a0ab', textDecoration: 'none' }}>
              Impressum (§ 5 DDG)
            </a>
            <span>&bull;</span>
            <a href="https://charlysmoky2010-hub.github.io/offers.html" target="_blank" rel="noopener noreferrer" style={{ color: '#a1a0ab', textDecoration: 'none' }}>
              Datenschutz (DSGVO Art. 9)
            </a>
            <span>&bull;</span>
            <span>BGB § 356(5) Konform</span>
          </div>
          <div>
            PRIZMAA &copy; 2026 &bull; Tüm Hakları Saklıdır &bull; Privacy-First Queer Dating Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
