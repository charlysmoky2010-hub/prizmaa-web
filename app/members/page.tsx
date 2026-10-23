import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, REFRESH_COOKIE, resolveApprovedSession } from '../../lib/prizmaa/supabase-auth';
import SignOutButton from './signout-button';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const jar = await cookies();
  const session = await resolveApprovedSession(
    jar.get(ACCESS_COOKIE)?.value, jar.get(REFRESH_COOKIE)?.value
  );
  if (!session) redirect('/login');

  return <main style={{ minHeight: '100vh', background: '#09080d', color: '#f4f3f7', padding: '48px 24px', fontFamily: 'sans-serif' }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <p style={{ color: '#ccff00', fontWeight: 800, letterSpacing: 2 }}>PRIZMAA PRIVATE SPACE</p>
      <h1>Verified member area</h1>
      <p>This area is server-protected by Supabase Auth and an active, adult-verified membership check.</p>
      <p>Access class: <strong>{session.member.member_role}</strong></p>
      <p>Account: <strong>{session.user.email || session.user.id}</strong></p>
      <p>Your membership and verification status cannot be edited from the public client.</p>
      <SignOutButton />
    </div>
  </main>;
}
