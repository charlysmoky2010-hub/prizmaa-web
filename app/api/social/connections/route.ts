import { NextRequest } from "next/server";
import { memberSession, noStore, sameOrigin, sessionResponse, supabaseUrl, userHeaders } from "@/lib/prizmaa/auth-session";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const no = (code: string, status: number) => noStore({ ok: false, error: code }, status);
type Session = Extract<Awaited<ReturnType<typeof memberSession>>, { ok: true }>;

async function fetchAsMember(session: Session, path: string, init: RequestInit = {}) {
  return fetch(supabaseUrl() + "/rest/v1/" + path, {
    ...init,
    headers: { ...userHeaders(session.token), ...(init.headers as Record<string, string> | undefined) },
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });
}
function failStatus(upstream: number): number { return upstream === 401 || upstream === 403 ? 403 : upstream === 409 ? 409 : 502; }

export async function GET(request: NextRequest) {
  const session = await memberSession(request);
  if (!session.ok) return sessionResponse(no(session.code, session.status), session);
  try {
    const mode = request.nextUrl.searchParams.get("view");
    if (mode === "matches") {
      const response = await fetchAsMember(session, "rpc/prizmaa_my_matches", { method: "POST", body: "{}" });
      if (!response.ok) return sessionResponse(no("MATCH_READ_FAILED", failStatus(response.status)), session);
      const matches: unknown = await response.json();
      if (!Array.isArray(matches)) return sessionResponse(no("MATCH_READ_FAILED", 502), session);
      return sessionResponse(noStore({ ok: true, matches }), session);
    }
    if (mode === "thread") {
      const peer = request.nextUrl.searchParams.get("peer") || "";
      if (!uuid.test(peer) || peer === session.userId) return no("INVALID_PEER", 400);
      const clauses = [
        "and(sender_id.eq." + session.userId + ",recipient_id.eq." + peer + ")",
        "and(sender_id.eq." + peer + ",recipient_id.eq." + session.userId + ")"
      ];
      const query = new URLSearchParams({
        select: "message_id,sender_id,recipient_id,body,created_at",
        or: "(" + clauses.join(",") + ")",
        order: "created_at.desc",
        limit: "100"
      });
      const response = await fetchAsMember(session, "prizmaa_messages?" + query.toString());
      if (!response.ok) return sessionResponse(no("THREAD_READ_FAILED", failStatus(response.status)), session);
      const messages: unknown = await response.json();
      if (!Array.isArray(messages)) return sessionResponse(no("THREAD_READ_FAILED", 502), session);
      return sessionResponse(noStore({ ok: true, messages: messages.reverse() }), session);
    }
    return no("INVALID_VIEW", 400);
  } catch { return sessionResponse(no("SOCIAL_BACKEND_UNAVAILABLE", 502), session); }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return no("INVALID_ORIGIN", 403);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return no("JSON_REQUIRED", 415);
    if (Number(request.headers.get("content-length") || 0) > 2400) return no("BODY_TOO_LARGE", 413);
    const session = await memberSession(request);
    if (!session.ok) return sessionResponse(no(session.code, session.status), session);
    const json: unknown = await request.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) return no("INVALID_BODY", 400);
    const input = json as Record<string, unknown>;
    const action = input.action;
    const peer = input.peer;
    if (typeof peer !== "string" || !uuid.test(peer) || peer === session.userId) return no("INVALID_PEER", 400);

    let method = "POST", path = "", payload: Record<string, unknown> | undefined;
    if (action === "like") {
      path = "prizmaa_likes"; payload = { from_user_id: session.userId, to_user_id: peer };
    } else if (action === "unlike") {
      method = "DELETE";
      path = "prizmaa_likes?from_user_id=eq." + session.userId + "&to_user_id=eq." + peer;
    } else if (action === "block") {
      path = "prizmaa_blocks"; payload = { blocker_id: session.userId, blocked_id: peer };
    } else if (action === "message") {
      if (typeof input.body !== "string" || input.body.trim().length < 1 || input.body.trim().length > 1000)
        return no("INVALID_MESSAGE", 400);
      path = "prizmaa_messages";
      payload = { sender_id: session.userId, recipient_id: peer, body: input.body.trim() };
    } else if (action === "report") {
      if (typeof input.reason !== "string" || !["harassment","spam","fake_profile","unsafe_behavior","other"].includes(input.reason) ||
          typeof input.details !== "string" || input.details.length > 400) return no("INVALID_REPORT", 400);
      path = "prizmaa_reports";
      payload = { reporter_id: session.userId, reported_id: peer, reason: input.reason, details: input.details };
    } else return no("INVALID_ACTION", 400);

    const response = await fetchAsMember(session, path, {
      method, headers: { Prefer: "return=minimal" },
      ...(payload ? { body: JSON.stringify(payload) } : {})
    });
    if (!response.ok) return sessionResponse(no(
      response.status === 409 ? "ALREADY_EXISTS" : response.status === 401 || response.status === 403
        ? "ACTION_NOT_PERMITTED" : "SOCIAL_WRITE_FAILED", failStatus(response.status)), session);
    return sessionResponse(noStore({ ok: true }, 200), session);
  } catch { return no("SOCIAL_BACKEND_UNAVAILABLE", 502); }
}
