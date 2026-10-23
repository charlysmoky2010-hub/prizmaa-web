import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, clearSessionCookies, revokeAccess } from '../../../../lib/prizmaa/supabase-auth';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'FORBIDDEN_ORIGIN' }, { status: 403 });
  }
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const revoked = access ? await revokeAccess(access) : false;
  const response = NextResponse.json({ signedOutLocally: true, remoteRevoked: revoked });
  clearSessionCookies(response);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
