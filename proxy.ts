import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, resolveApprovedSession, setSessionCookies, clearSessionCookies } from './lib/prizmaa/supabase-auth';

export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith('/api/member/');
  const session = await resolveApprovedSession(
    request.cookies.get(ACCESS_COOKIE)?.value,
    request.cookies.get(REFRESH_COOKIE)?.value,
  );
  if (!session) {
    const response = isApi
      ? NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    clearSessionCookies(response);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  if (session.rotated) {
    // Update both sides; server components must see the refreshed access token.
    request.cookies.set(ACCESS_COOKIE, session.rotated.access_token);
    request.cookies.set(REFRESH_COOKIE, session.rotated.refresh_token);
  }
  const response = NextResponse.next({ request });
  if (session.rotated) setSessionCookies(response, session.rotated);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/members/:path*', '/api/member/:path*'] };
