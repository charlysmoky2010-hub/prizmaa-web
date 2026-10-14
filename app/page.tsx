'use client';
import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  async function submit() {
    setStatus('idle');
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, consent }),
    });
    setStatus(res.ok ? 'ok' : 'err');
    if (res.ok) setEmail('');
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 20% 20%, #3b1d6e 0%, #0b0b1a 55%, #05050d 100%)',
      color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 24,
    }}>
      <div style={{
        maxWidth: 520, width: '100%', padding: 40, borderRadius: 24,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)', textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 56, margin: 0, letterSpacing: 4,
          background: 'linear-gradient(90deg,#ff6ec4,#7873f5,#4adede)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>PRIZMA</h1>
        <p style={{ fontSize: 18, color: '#c9c9e0', lineHeight: 1.5, marginTop: 16 }}>
          Ghosting'e son. Güvenilirliğe göre eşleşen yeni nesil queer dating & network ağı.
        </p>

        <a
          href="/prizmaa/beta"
          style={{
            display: 'block',
            marginTop: 20,
            padding: '16px 24px',
            fontSize: 17,
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: 14,
            color: '#fff',
            background: 'linear-gradient(90deg,#ff6ec4,#7873f5,#4adede)',
            boxShadow: '0 8px 24px rgba(120,115,245,0.4)',
            transition: 'transform 0.15s ease',
          }}
        >
          🚀 Web App'i Başlat (Canlı Beta)
        </a>

        <div style={{ marginTop: 24, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: '#e0e0ff' }}>
          💎 <b>Founder Pass Aktif:</b> Ömür boyu VIP & Seni Beğenenleri Gör — <b>€9.99</b>
        </div>

        <div style={{ margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>veya e-posta listesi</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <input
          type="email"
          placeholder="E-posta adresin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', padding: 14, fontSize: 16, marginTop: 20, boxSizing: 'border-box',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(0,0,0,0.35)', color: '#fff', outline: 'none',
          }}
        />
        <label style={{ display: 'block', marginTop: 14, fontSize: 13, color: '#a8a8c8', textAlign: 'left' }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{' '}
          E-postamın yalnızca lansman bilgisi için saklanmasını kabul ediyorum.
        </label>
        <button
          onClick={submit}
          disabled={!email || !consent}
          style={{
            marginTop: 20, width: '100%', padding: 14, fontSize: 17, fontWeight: 600,
            border: 'none', borderRadius: 12, color: '#fff',
            cursor: !email || !consent ? 'not-allowed' : 'pointer',
            opacity: !email || !consent ? 0.5 : 1,
            background: 'linear-gradient(90deg,#ff6ec4,#7873f5)',
          }}
        >
          Listeye katıl
        </button>
        {status === 'ok' && <p style={{ color: '#6ee7a0' }}>Kaydedildi, teşekkürler.</p>}
        {status === 'err' && <p style={{ color: '#ff7a8a' }}>Bir hata oldu, tekrar dene.</p>}
      </div>
    </main>
  );
}
