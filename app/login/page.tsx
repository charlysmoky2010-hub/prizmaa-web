'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), cache: 'no-store',
      });
      if (!response.ok) {
        setMessage(response.status === 503
          ? 'Member access is not configured on this deployment.'
          : 'Sign-in failed, or your invitation and adult review are not yet approved.');
        return;
      }
      window.location.replace('/members');
    } catch { setMessage('Connection failed. Please try again.'); }
    finally { setBusy(false); }
  }

  return <main style={{ minHeight: '100vh', background: '#09080d', color: '#f4f3f7', padding: '60px 20px', fontFamily: 'sans-serif' }}>
    <section style={{ maxWidth: 430, margin: 'auto', padding: 28, border: '1px solid #36313f', borderRadius: 12, background: '#14111b' }}>
      <Link href="/" style={{ color: '#ccff00', textDecoration: 'none' }}>✳ PRIZMAA</Link>
      <h1>Private member sign-in</h1>
      <p style={{ color: '#aaa6b8' }}>Invite-only. Membership and 18+ review are required beyond email authentication.</p>
      <form onSubmit={login} style={{ display: 'grid', gap: 14 }}>
        <label>Email
          <input name="email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginTop: 5, borderRadius: 6 }} />
        </label>
        <label>Password
          <input name="password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginTop: 5, borderRadius: 6 }} />
        </label>
        <button disabled={busy} type="submit" style={{ padding: 12, borderRadius: 6, border: 0, background: '#ccff00', color: '#111', fontWeight: 800, cursor: 'pointer' }}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
      {message && <p role="alert" style={{ color: '#ffc9c9' }}>{message}</p>}
      <p style={{ color: '#aaa6b8', fontSize: 13 }}>Accounts are not granted member access automatically. An administrator must approve both membership and adult-review status.</p>
    </section>
  </main>;
}
