'use client';

export default function SignOutButton() {
  return <button type="button" onClick={async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }); } finally {
      window.location.replace('/login');
    }
  }} style={{ background: 'transparent', color: '#ccff00', border: '1px solid #777', borderRadius: 6, padding: '10px 16px', cursor: 'pointer' }}>
    Sign out
  </button>;
}
