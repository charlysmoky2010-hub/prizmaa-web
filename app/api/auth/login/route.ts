import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/prizmaa/same-origin';
import { approvedFromAccess, authConfigured, revokeAccess, setSessionCookies, signIn } from '../../../../lib/prizmaa/supabase-auth';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'FORBIDDEN_ORIGIN' }, { status: 403 });
  }
  if (!authConfigured()) {
    return NextResponse.json({ error: 'AUTH_NOT_CONFIGURED' }, { status: 503 });
  }
  if (Number(request.headers.get('content-length') || 0) > 4096) {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 413 });
  }
  let input: { email?: unknown; password?: unknown };
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }
  const email = typeof input?.email === 'string' ? input.email.trim() : '';
  const password = input?.password;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' || password.length < 1 || password.length > 1024) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS_OR_MEMBERSHIP' }, { status: 401 });
  }
  const tokens = await signIn(email, password);
  if (!tokens) return NextResponse.json({ error: 'INVALID_CREDENTIALS_OR_MEMBERSHIP' }, { status: 401 });
  const approved = await approvedFromAccess(tokens.access_token);
  if (!approved) {
    await revokeAccess(tokens.access_token);
    return NextResponse.json({ error: 'INVALID_CREDENTIALS_OR_MEMBERSHIP' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, memberRole: approved.member.member_role });
  setSessionCookies(response, tokens);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
