import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/prizmaa/same-origin';
import { ACCESS_COOKIE, clearSessionCookies, revokeAccess } from '../../../../lib/prizmaa/supabase-auth';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'FORBIDDEN_ORIGIN' }, { status: 403 });
  }
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const revoked = access ? await revokeAccess(access) : false;
  const response = NextResponse.json({ signedOutLocally: true, remoteRevoked: revoked });
  clearSessionCookies(response);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
