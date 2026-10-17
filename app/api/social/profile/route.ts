import { NextRequest, NextResponse } from "next/server";


// Isolated first step toward durable Supabase storage. This endpoint does NOT
// accept legacy SQLite session tokens; callers need a verified Supabase Auth JWT.
const url = process.env.PRIZMAA_SUPABASE_URL;
const publicKey = process.env.PRIZMAA_SUPABASE_PUBLISHABLE_KEY;

function error(status: number, code: string) {
  return NextResponse.json({ ok: false, error: code }, { status, headers: { "Cache-Control": "no-store" } });
}
function headers(jwt: string) {
  return { apikey: publicKey!, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}
async function verified(request: NextRequest) {
  if (!url || !publicKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
    return { code: "PERSISTENT_BACKEND_NOT_CONFIGURED" } as const;
  const auth = request.headers.get("authorization") || "";
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(auth)) return { code: "AUTH_REQUIRED" } as const;
  const token = auth.slice(7);
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: headers(token), cache: "no-store"
  });
  if (!response.ok) return { code: "AUTH_REQUIRED" } as const;
  const user = await response.json();
  if (typeof user?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(user.id)) return { code: "AUTH_REQUIRED" } as const;
  return { token, id: user.id } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verified(request);
    if ("code" in auth) return error(auth.code === "PERSISTENT_BACKEND_NOT_CONFIGURED" ? 503 : 401, auth.code);
    const response = await fetch(
      `${url}/rest/v1/prizmaa_private_profiles?user_id=eq.${encodeURIComponent(auth.id!)}&select=user_id,display_name,location_label,bio,visible_in_discovery,updated_at`,
      { headers: headers(auth.token), cache: "no-store" }
    );
    if (!response.ok) return error(502, "PROFILE_READ_FAILED");
    const records = await response.json();
    return NextResponse.json({ ok: true, profile: records[0] || null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error(502, "BACKEND_UNAVAILABLE");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verified(request);
    if ("code" in auth) return error(auth.code === "PERSISTENT_BACKEND_NOT_CONFIGURED" ? 503 : 401, auth.code);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return error(400, "INVALID_BODY");
    const allowed = ["display_name", "location_label", "bio", "visible_in_discovery"];
    if (Object.keys(body).some((key) => !allowed.includes(key))) return error(400, "INVALID_FIELDS");
    if (Object.keys(body).length === 0) return error(400, "EMPTY_UPDATE");
    const payload: Record<string, string | boolean> = {};
    for (const key of ["display_name", "location_label", "bio"]) {
      if (key in body) {
        if (typeof body[key] !== "string" || body[key].trim().length > (key === "bio" ? 400 : 64))
          return error(400, "INVALID_FIELD_VALUE");
        payload[key] = body[key].trim();
      }
    }
    if ("visible_in_discovery" in body) {
      if (typeof body.visible_in_discovery !== "boolean") return error(400, "INVALID_FIELD_VALUE");
      payload.visible_in_discovery = body.visible_in_discovery;
    }
    const response = await fetch(
      `${url}/rest/v1/prizmaa_private_profiles?user_id=eq.${encodeURIComponent(auth.id!)}`,
      {
        method: "PATCH",
        headers: { ...headers(auth.token), Prefer: "return=representation" },
        body: JSON.stringify(payload),
        cache: "no-store"
      }
    );
    if (response.status === 403 || response.status === 401) return error(403, "MEMBERSHIP_NOT_VERIFIED");
    if (!response.ok) return error(502, "PROFILE_UPDATE_FAILED");
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return error(403, "PROFILE_NOT_AVAILABLE");
    return NextResponse.json({ ok: true, profile: rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error(502, "BACKEND_UNAVAILABLE");
  }
}
