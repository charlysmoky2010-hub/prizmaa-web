// PRIZMAA isolated founder account deletion endpoint.
// Deploy exclusively to NEW dedicated Supabase project AFTER privacy/legal review.
// SUPABASE_SERVICE_ROLE_KEY must NEVER appear in any browser code or commit.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const noStore = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};
function json(code: number, name: string, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify({ok:code===200,status:name}),{status:code,headers:{...noStore,...extra}});
}
Deno.serve(async (req: Request): Promise<Response> => {
  const allowed = Deno.env.get("PRIZMAA_APP_ORIGIN");
  const url = Deno.env.get("SUPABASE_URL");
  const publishable = Deno.env.get("SUPABASE_ANON_KEY");
  const adminSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!allowed || !url || !publishable || !adminSecret) return json(503,"not_configured");
  const origin = req.headers.get("origin");
  // Exact origin only; no wildcard. A non-browser client still needs a bearer token.
  if (origin !== allowed) return json(403,"origin_not_allowed");
  const cors = {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "vary": "Origin",
  };
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:{...noStore,...cors}});
  if (req.method !== "POST") return json(405,"method_not_allowed",{...cors,"allow":"POST, OPTIONS"});
  const auth = req.headers.get("authorization") || "";
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(auth)) return json(401,"missing_token",cors);
  const jwt = auth.slice("Bearer ".length);

  const verify = createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:who,error:verifyError} = await verify.auth.getUser(jwt);
  if(verifyError || !who?.user?.id || who.user.is_anonymous) return json(401,"invalid_session",cors);

  // Never take a user_id from JSON request data. Delete the authenticated caller only.
  // The migration's ON DELETE CASCADE removes their private profile and membership.
  const admin = createClient(url,adminSecret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error:deleteError} = await admin.auth.admin.deleteUser(who.user.id);
  if (deleteError) return json(503,"deletion_unavailable",cors);
  // Supabase access JWTs can remain cryptographically valid until expiry.
  // Because no member/profile rows remain, private RLS access still yields zero data.
  return json(200,"account_deleted",{...cors,"clear-site-data":'"storage", "cookies"'});
});
