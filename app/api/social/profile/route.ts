import { NextRequest, NextResponse } from "next/server";
import {
  memberSession, noStore, sameOrigin, sessionResponse,
  supabaseUrl, userHeaders
} from "@/lib/prizmaa/auth-session";

function reject(status: number, error: string) {
  return noStore({ ok: false, error }, status);
}

const selected = "user_id,display_name,location_label,bio,visible_in_discovery,updated_at";
function profileUrl(userId: string) {
  return supabaseUrl() + "/rest/v1/prizmaa_private_profiles?user_id=eq." +
    encodeURIComponent(userId) + "&select=" + selected;
}

function cleanProfile(input: unknown, creating: boolean) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  const allowed = ["display_name", "location_label", "bio", "visible_in_discovery"];
  const entries = Object.entries(data);
  if (entries.length === 0 || entries.some(([key]) => !allowed.includes(key))) return null;
  const payload: Record<string, string | boolean> = {};
  for (const field of ["display_name", "location_label", "bio"]) {
    if (!(field in data)) continue;
    const value = data[field];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    const max = field === "bio" ? 400 : field === "location_label" ? 44 : 36;
    if (trimmed.length > max || (field === "display_name" && trimmed.length < 2)) return null;
    payload[field] = trimmed;
  }
  if ("visible_in_discovery" in data) {
    if (typeof data.visible_in_discovery !== "boolean") return null;
    payload.visible_in_discovery = data.visible_in_discovery;
  } else if (creating) payload.visible_in_discovery = false;
  if (creating && !("display_name" in payload)) return null;
  return payload;
}

export async function GET(request: NextRequest) {
  const session = await memberSession(request);
  if (!session.ok) return sessionResponse(reject(session.status, session.code), session);
  try {
    const response = await fetch(profileUrl(session.userId), {
      headers: userHeaders(session.token), cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return sessionResponse(reject(502, "PROFILE_READ_FAILED"), session);
    const records: unknown = await response.json();
    if (!Array.isArray(records)) return sessionResponse(reject(502, "PROFILE_READ_FAILED"), session);
    return sessionResponse(noStore({ ok: true, profile: records[0] || null }), session);
  } catch {
    return sessionResponse(reject(502, "BACKEND_UNAVAILABLE"), session);
  }
}

async function write(request: NextRequest, creating: boolean) {
  if (!sameOrigin(request)) return reject(403, "INVALID_ORIGIN");
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reject(415, "JSON_REQUIRED");
  if (Number(request.headers.get("content-length") || 0) > 3072) return reject(413, "BODY_TOO_LARGE");
  const session = await memberSession(request);
  if (!session.ok) return sessionResponse(reject(session.status, session.code), session);
  try {
    const payload = cleanProfile(await request.json(), creating);
    if (!payload) return sessionResponse(reject(400, "INVALID_PROFILE"), session);
    const response = await fetch(
      creating ? supabaseUrl() + "/rest/v1/prizmaa_private_profiles?select=" + selected : profileUrl(session.userId),
      {
        method: creating ? "POST" : "PATCH",
        headers: { ...userHeaders(session.token), Prefer: "return=representation" },
        body: JSON.stringify(creating ? { ...payload, user_id: session.userId } : payload),
        cache: "no-store",
        signal: AbortSignal.timeout(10000)
      }
    );
    if (response.status === 409) return sessionResponse(reject(409, "PROFILE_ALREADY_EXISTS"), session);
    if (response.status === 401 || response.status === 403) return sessionResponse(reject(403, "PROFILE_NOT_AUTHORIZED"), session);
    if (!response.ok) return sessionResponse(reject(502, "PROFILE_WRITE_FAILED"), session);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== 1) return sessionResponse(reject(403, "PROFILE_UNAVAILABLE"), session);
    return sessionResponse(noStore({ ok: true, profile: rows[0] }, creating ? 201 : 200), session);
  } catch {
    return sessionResponse(reject(502, "BACKEND_UNAVAILABLE"), session);
  }
}

export async function POST(request: NextRequest) { return write(request, true); }
export async function PATCH(request: NextRequest) { return write(request, false); }
