// PRIZMAA Founder private account deletion: only caller may delete own identity.
// Deploy ONLY to isolated project iyxmfiyvikrbfrscsaja (never historical projects).
// No service/admin key in browser, no request-body target ID accepted.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
const trusted = new Set([
  "https://prizmaa-founder-access-certan-berrus-projects.vercel.app",
  "https://prizmaa-founder-access-18zilu7zm-certan-berrus-projects.vercel.app"
]);
const baseHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};
function reply(status:number,code:string,headers:Record<string,string>={}) {
  return new Response(JSON.stringify({ok:status===200,status:code}),{status,headers:{...baseHeaders,...headers}});
}
Deno.serve(async(req:Request):Promise<Response>=>{
  const origin=req.headers.get("origin")||"";
  if(!trusted.has(origin))return reply(403,"origin_not_allowed");
  const cors={
    "access-control-allow-origin":origin,
    "access-control-allow-methods":"POST, OPTIONS",
    "access-control-allow-headers":"authorization, apikey, content-type",
    "vary":"Origin"
  };
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{...baseHeaders,...cors}});
  if(req.method!=="POST")return reply(405,"method_not_allowed",cors);
  if(req.headers.get("content-type")?.split(";")[0].trim()!=="application/json")
    return reply(415,"json_required",cors);
  const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url=Deno.env.get("SUPABASE_URL");
  const anon=Deno.env.get("SUPABASE_ANON_KEY");
  if(!url||!secret||!anon)return reply(503,"service_not_configured",cors);
  const authorization=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(authorization))return reply(401,"missing_token",cors);
  const token=authorization.slice(7);
  // Explicitly validate token with Auth on every destructive request.
  const verifier=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
  const result=await verifier.auth.getUser(token);
  const user=result.data?.user;
  if(result.error||!user?.id||user.is_anonymous)return reply(401,"invalid_session",cors);
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  // No user_id from caller; the only possible target is the verified current user.
  const deleted=await admin.auth.admin.deleteUser(user.id);
  if(deleted.error)return reply(503,"deletion_unavailable",cors);
  const remaining=await admin.from("prizmaa_private_members").select("user_id").eq("user_id",user.id);
  if(remaining.error||remaining.data?.length)return reply(503,"deletion_unconfirmed",cors);
  return reply(200,"account_deleted",cors);
});
