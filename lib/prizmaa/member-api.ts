// Shared PRIZMAA browser adapter for the single Next.js member workspace.
// The key below is a PUBLIC publishable key (not a service-role or secret key).
// No session tokens are persisted or sent to PRIZMAA's server.
export const SUPABASE_ORIGIN = "https://iyxmfiyvikrbfrscsaja.supabase.co";
export const PUBLIC_PUBLISHABLE_KEY = "sb_publishable_atY2p6cb7N0qpQrhCngO6A_LrSdBCDw";

export type Session = { accessToken: string; userId: string; email: string };
export type Member = { member_role: "founder" | "tester"; membership_state: string; adult_review_state: string };
export type Profile = { user_id: string; display_name: string; location_label: string; bio: string; visible_in_discovery: boolean; updated_at: string };
export type Rating = { feedback_id: string; area: string; rating: number; created_at: string };
export type Match = { user_id: string; display_name: string; location_label: string; bio: string };
export type Message = { message_id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
export type ReportReason = "harassment" | "spam" | "fake_profile" | "unsafe_behavior" | "other";

export function verified(member: Member | null) {
  return member?.membership_state === "active" && member?.adult_review_state === "verified";
}
export function cleanProfile(name: string, region: string, bio: string) {
  const display_name = name.trim();
  const location_label = region.trim();
  const description = bio.trim();
  if(display_name.length < 2 || display_name.length > 36) throw Error("Choose a name between 2 and 36 characters.");
  if(location_label.length > 44 || /(\d{3,}|-?\d+\.\d+[,; ]+-?\d+\.\d+)/.test(location_label))
    throw Error("Use a general region, not precise coordinates or postal codes.");
  if(description.length > 400) throw Error("Bio must not exceed 400 characters.");
  return {display_name,location_label,bio:description,visible_in_discovery:false as const};
}
export function assertUUID(id:string) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw Error("Invalid member identifier.");
  return id;
}
async function transport<T>(path:string, opts:RequestInit, token?:string):Promise<T> {
  if(!path.startsWith("/auth/v1/") && !path.startsWith("/rest/v1/")) throw Error("Unapproved API path.");
  const response=await fetch(SUPABASE_ORIGIN+path,{
    ...opts, credentials:"omit",cache:"no-store",redirect:"error",
    headers:{"apikey":PUBLIC_PUBLISHABLE_KEY, "content-type":"application/json",
      ...(token?{Authorization:"Bearer "+token}:{}),...opts.headers},
    signal:AbortSignal.timeout(12000)
  });
  if(!response.ok) throw Error("The server could not confirm this action (HTTP "+response.status+").");
  if(response.status===204 || response.headers.get("content-length")==="0") return null as T;
  return await response.json() as T;
}
export async function login(email:string,password:string):Promise<Session> {
  const auth=await transport<{access_token:string}>("/auth/v1/token?grant_type=password",{
    method:"POST",body:JSON.stringify({email:email.trim(),password})});
  if(!auth.access_token) throw Error("Login could not be verified.");
  const user=await transport<{id:string;email:string}>("/auth/v1/user",{method:"GET"},auth.access_token);
  return {accessToken:auth.access_token,userId:assertUUID(user.id),email:user.email};
}
export async function ownData<T>(s:Session,path:string,opts:RequestInit={}) {
  if(!path.startsWith("/rest/v1/") && path!=="/auth/v1/logout") throw Error("Unexpected authenticated endpoint.");
  return transport<T>(path,opts,s.accessToken);
}
export async function logout(s:Session) { return transport<null>("/auth/v1/logout",{method:"POST"},s.accessToken); }
export function ownId(s:Session) {return encodeURIComponent(assertUUID(s.userId));}
export function saveDownload(filename:string,data:unknown) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download=filename;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
