import 'server-only';
import type { NextResponse } from 'next/server';

export const ACCESS_COOKIE = 'prizmaa_auth_access';
export const REFRESH_COOKIE = 'prizmaa_auth_refresh';

type Credentials = { access_token: string; refresh_token: string; expires_in: number };
type AuthUser = { id: string; email?: string };
type ApprovedMember = { user_id: string; member_role: 'founder' | 'tester'; membership_state: 'active'; adult_review_state: 'verified' };
export type ApprovedSession = { user: AuthUser; member: ApprovedMember; rotated: Credentials | null };

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.pathname !== '/') return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
export function authConfigured() { return config() !== null; }

async function callAuth(path: string, method: 'GET' | 'POST', access?: string, body?: object) {
  const cfg = config();
  if (!cfg) return null;
  try {
    return await fetch(cfg.url + '/auth/v1/' + path, {
      method,
      headers: {
        apikey: cfg.key,
        ...(access ? { Authorization: 'Bearer ' + access } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch { return null; }
}

function parseTokens(value: unknown): Credentials | null {
  if (!value || typeof value !== 'object') return null;
  const t = value as Partial<Credentials>;
  if (typeof t.access_token !== 'string' || !t.access_token || typeof t.refresh_token !== 'string' || !t.refresh_token) return null;
  return { access_token: t.access_token, refresh_token: t.refresh_token, expires_in: Math.min(3600, Math.max(1, Number(t.expires_in) || 3600)) };
}
async function tokenGrant(grant: 'password' | 'refresh_token', data: object) {
  const response = await callAuth('token?grant_type=' + grant, 'POST', undefined, data);
  if (!response?.ok) return null;
  try { return parseTokens(await response.json()); } catch { return null; }
}

export async function signIn(email: string, password: string) {
  return tokenGrant('password', { email, password });
}
async function refresh(token: string) {
  return tokenGrant('refresh_token', { refresh_token: token });
}
async function verifiedUser(access: string): Promise<AuthUser | null> {
  const response = await callAuth('user', 'GET', access);
  if (!response?.ok) return null;
  try {
    const user = await response.json() as Partial<AuthUser>;
    if (typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) return null;
    return { id: user.id, email: typeof user.email === 'string' ? user.email : undefined };
  } catch { return null; }
}

async function approvedMember(access: string, id: string): Promise<ApprovedMember | null> {
  const cfg = config();
  if (!cfg) return null;
  const params = new URLSearchParams({
    select: 'user_id,member_role,membership_state,adult_review_state',
    user_id: 'eq.' + id,
    limit: '1'
  });
  try {
    const response = await fetch(cfg.url + '/rest/v1/prizmaa_private_members?' + params.toString(), {
      method: 'GET',
      headers: { apikey: cfg.key, Authorization: 'Bearer ' + access, Accept: 'application/json' },
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length !== 1) return null;
    const member = rows[0] as Partial<ApprovedMember>;
    if (member.user_id !== id || member.membership_state !== 'active' || member.adult_review_state !== 'verified' ||
      (member.member_role !== 'founder' && member.member_role !== 'tester')) return null;
    return member as ApprovedMember;
  } catch { return null; }
}

export async function approvedFromAccess(access: string) {
  const user = await verifiedUser(access);
  if (!user) return null;
  const member = await approvedMember(access, user.id);
  return member ? { user, member } : null;
}

export async function resolveApprovedSession(access?: string, refreshToken?: string): Promise<ApprovedSession | null> {
  let effectiveAccess = access;
  let rotated: Credentials | null = null;
  let approved = effectiveAccess ? await approvedFromAccess(effectiveAccess) : null;
  if (!approved && refreshToken) {
    // Refresh only if the access token cannot identify an active, verified member.
    // A removed/suspended membership stays inaccessible after refreshing.
    rotated = await refresh(refreshToken);
    effectiveAccess = rotated?.access_token;
    approved = effectiveAccess ? await approvedFromAccess(effectiveAccess) : null;
  }
  return approved ? { ...approved, rotated } : null;
}

export function setSessionCookies(response: NextResponse, tokens: Credentials) {
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, { ...cookieOptions, maxAge: tokens.expires_in });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
}
export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export async function revokeAccess(access: string) {
  const response = await callAuth('logout', 'POST', access);
  return !!response?.ok;
}
