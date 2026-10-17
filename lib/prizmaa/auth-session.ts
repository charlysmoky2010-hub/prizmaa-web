import "server-only";
import { NextRequest, NextResponse } from "next/server";

const accessCookie = "__Host-prizmaa_access";
const refreshCookie = "__Host-prizmaa_refresh";
const sessionDays = 7;
const endpoint = process.env.PRIZMAA_SUPABASE_URL;
const publishableKey = process.env.PRIZMAA_SUPABASE_PUBLISHABLE_KEY;

type Tokens = { access_token: string; refresh_token: string; expires_in: number };
export type Session = {
  ok: true;
  token: string;
  userId: string;
  email: string;
  rotated?: Tokens;
};
export type SessionFailure = { ok: false; status: number; code: string; clear?: true };

function isConfigured(): boolean {
  return Boolean(endpoint && publishableKey && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(endpoint));
}

function apiHeaders(bearer?: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: publishableKey!, "Content-Type": "application/json" };
  if (bearer) headers.Authorization = "Bearer " + bearer;
  return headers;
}

export function noStore<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
}

export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  // Browsers send Origin on JSON writes. Fail closed rather than accepting cross-origin cookies.
  return Boolean(origin && origin === request.nextUrl.origin && (!referer || new URL(referer).origin === origin));
}

export function validConfig() { return isConfigured(); }

export async function passwordLogin(email: string, password: string): Promise<Tokens | null> {
  if (!isConfigured()) return null;
  try {
    const response = await fetch(endpoint + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: apiHeaders(),
      body: JSON.stringify({ email, password }), cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return null;
    const json: unknown = await response.json();
    return parseTokens(json);
  } catch { return null; }
}

function parseTokens(json: unknown): Tokens | null {
  if (!json || typeof json !== "object") return null;
  const data = json as Record<string, unknown>;
  if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string" ||
      !Number.isFinite(data.expires_in) || typeof data.expires_in !== "number" ||
      data.expires_in < 1 || data.expires_in > 86400 || data.access_token.length > 8192 ||
      data.refresh_token.length > 1024) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

async function refreshSession(refresh: string): Promise<Tokens | null> {
  try {
    const response = await fetch(endpoint + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", headers: apiHeaders(),
      body: JSON.stringify({ refresh_token: refresh }), cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return null;
    return parseTokens(await response.json());
  } catch { return null; }
}

async function checkIdentity(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const r = await fetch(endpoint + "/auth/v1/user", { headers: apiHeaders(token), cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (typeof data?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(data.id)) return null;
    if (typeof data?.email !== "string") return null;
    return { userId: data.id, email: data.email };
  } catch { return null; }
}

async function activeMember(token: string, userId: string): Promise<boolean> {
  try {
    const r = await fetch(endpoint + "/rest/v1/prizmaa_private_members?user_id=eq." +
      encodeURIComponent(userId) + "&select=membership_state,adult_review_state&limit=1", {
      headers: apiHeaders(token), cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length === 1 &&
      rows[0].membership_state === "active" && rows[0].adult_review_state === "verified";
  } catch { return false; }
}

export async function verifyTokens(tokens: Tokens): Promise<Session | SessionFailure> {
  if (!isConfigured()) return { ok: false, status: 503, code: "BACKEND_NOT_CONFIGURED" };
  const identity = await checkIdentity(tokens.access_token);
  if (!identity) return { ok: false, status: 401, code: "AUTH_REQUIRED" };
  if (!await activeMember(tokens.access_token, identity.userId))
    return { ok: false, status: 403, code: "INVITATION_OR_ADULT_REVIEW_REQUIRED" };
  return { ok: true, token: tokens.access_token, userId: identity.userId, email: identity.email, rotated: tokens };
}

export async function memberSession(request: NextRequest): Promise<Session | SessionFailure> {
  if (!isConfigured()) return { ok: false, status: 503, code: "BACKEND_NOT_CONFIGURED" };
  const access = request.cookies.get(accessCookie)?.value;
  const refresh = request.cookies.get(refreshCookie)?.value;
  if (!access || !refresh) return { ok: false, status: 401, code: "AUTH_REQUIRED" };
  const identity = await checkIdentity(access);
  if (identity) {
    if (!await activeMember(access, identity.userId))
      return { ok: false, status: 403, code: "INVITATION_OR_ADULT_REVIEW_REQUIRED", clear: true };
    return { ok: true, userId: identity.userId, email: identity.email, token: access };
  }
  const tokens = await refreshSession(refresh);
  if (!tokens) return { ok: false, status: 401, code: "AUTH_REQUIRED", clear: true };
  const verified = await verifyTokens(tokens);
  if (!verified.ok) return { ...verified, clear: true };
  return verified;
}

export function writeSession(response: NextResponse, tokens: Tokens) {
  const options = { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/" };
  response.cookies.set(accessCookie, tokens.access_token, { ...options, maxAge: tokens.expires_in });
  response.cookies.set(refreshCookie, tokens.refresh_token, { ...options, maxAge: sessionDays * 86400 });
  return response;
}

export function clearSession(response: NextResponse) {
  const options = { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge: 0 };
  response.cookies.set(accessCookie, "", options);
  response.cookies.set(refreshCookie, "", options);
  return response;
}

export function sessionResponse(response: NextResponse, session: Session | SessionFailure) {
  if (session.ok && session.rotated) writeSession(response, session.rotated);
  if (!session.ok && session.clear) clearSession(response);
  return response;
}

export async function revoke(request: NextRequest) {
  const token = request.cookies.get(accessCookie)?.value;
  if (!token || !isConfigured()) return;
  try {
    await fetch(endpoint + "/auth/v1/logout", {
      method: "POST", headers: apiHeaders(token), cache: "no-store", signal: AbortSignal.timeout(8000)
    });
  } catch { /* Always clear browser cookies; server-side revoke is best effort. */ }
}

export function supabaseUrl() { return endpoint!; }
export function userHeaders(token: string) { return apiHeaders(token); }
