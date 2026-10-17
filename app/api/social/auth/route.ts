import { NextRequest } from "next/server";
import {
  clearSession, memberSession, noStore, passwordLogin,
  revoke, sameOrigin, sessionResponse, validConfig, verifyTokens, writeSession
} from "@/lib/prizmaa/auth-session";

function reject(code: string, status: number) {
  return noStore({ ok: false, error: code }, status);
}

export async function GET(request: NextRequest) {
  const session = await memberSession(request);
  if (!session.ok) return sessionResponse(reject(session.code, session.status), session);
  return sessionResponse(noStore({ ok: true, email: session.email, membership: "active", profilePrivateByDefault: true }), session);
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return reject("INVALID_ORIGIN", 403);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reject("JSON_REQUIRED", 415);
    if (Number(request.headers.get("content-length") || 0) > 4096) return reject("BODY_TOO_LARGE", 413);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return reject("INVALID_BODY", 400);
    const input = body as Record<string, unknown>;
    if (input.action === "logout") {
      await revoke(request);
      return clearSession(noStore({ ok: true }));
    }
    if (input.action !== "login") return reject("INVALID_ACTION", 400);
    if (!validConfig()) return reject("BACKEND_NOT_CONFIGURED", 503);
    if (typeof input.email !== "string" || typeof input.password !== "string" ||
        input.email.length > 254 || input.email.length < 3 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ||
        input.password.length < 8 || input.password.length > 128)
      return reject("INVALID_CREDENTIALS", 401);
    // Supabase Auth handles password validation. No application-side sign-up: invite-only.
    const tokens = await passwordLogin(input.email, input.password);
    if (!tokens) return reject("INVALID_CREDENTIALS", 401);
    const session = await verifyTokens(tokens);
    if (!session.ok) return reject(session.code, session.status);
    return writeSession(noStore({ ok: true, email: session.email, membership: "active" }), tokens);
  } catch {
    return reject("AUTH_UNAVAILABLE", 502);
  }
}
