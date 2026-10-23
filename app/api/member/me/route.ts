import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, resolveApprovedSession, setSessionCookies } from '../../../../lib/prizmaa/supabase-auth';

export async function GET(request: NextRequest) {
  const session = await resolveApprovedSession(
    request.cookies.get(ACCESS_COOKIE)?.value,
    request.cookies.get(REFRESH_COOKIE)?.value,
  );
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const response = NextResponse.json({
    userId: session.user.id, memberRole: session.member.member_role, state: 'active', adultVerified: true,
  });
  if (session.rotated) setSessionCookies(response, session.rotated);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
