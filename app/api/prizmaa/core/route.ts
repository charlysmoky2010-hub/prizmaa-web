import { NextRequest, NextResponse } from "next/server";
import { ApiError, cookieName, currentUser, register, login, logout, self, setProfile, people, like, matches, chat, send, block, report, erase, exportData, whoLikedMe } from "@/lib/prizmaa/store";

const limiter = new Map<string,{count:number,reset:number}>();
function limited(key:string,limit=15,period=60000) {
  const clock=Date.now();
  if(limiter.size>3000)for(const [k,v] of limiter)if(v.reset<clock)limiter.delete(k);
  const entry=limiter.get(key);
  if(!entry||entry.reset<clock){limiter.set(key,{count:1,reset:clock+period});return;}
  if(entry.count>=limit)throw new ApiError(429,"RATE_LIMITED");
  entry.count++;
}
function guard(request:NextRequest,write=false) {
  const url=new URL(request.url);
  const host=request.headers.get("host")||"";
  // Development storage is local SQLite, not a durable multi-user production database.
  // Never accept public registration/messages on Vercel even when preview flags are set.
  if(process.env.VERCEL ||
      process.env.PRIZMAA_LOCAL_MVP!=="1" ||
      !["127.0.0.1","localhost","[::1]"].includes(url.hostname) ||
      !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
    throw new ApiError(503,"PRIVATE_LOCAL_MVP_DISABLED");
  }
  if(write){
    const origin=request.headers.get("origin");
    if(origin){
      let parsed:URL;
      try{parsed=new URL(origin);}catch{throw new ApiError(403,"ORIGIN_MISMATCH");}
      if(parsed.origin!==url.origin)throw new ApiError(403,"ORIGIN_MISMATCH");
    }
    if(request.headers.get("sec-fetch-site")==="cross-site")
      throw new ApiError(403,"ORIGIN_MISMATCH");
    if(request.headers.get("content-type")?.split(";")[0].trim()!=="application/json")
      throw new ApiError(415,"JSON_ONLY");
    if(Number(request.headers.get("content-length")||0)>8192)
      throw new ApiError(413,"BODY_TOO_LARGE");
  }
}
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
function handleError(e:unknown){const error=e instanceof ApiError?e:new ApiError(500,"INTERNAL_ERROR");return response({ok:false,error:error.code},error.status);}
async function body(request:NextRequest):Promise<Record<string,unknown>>{
  try{const json=await request.json();if(!json||Array.isArray(json)||typeof json!=="object")throw new Error("shape");return json;}catch{throw new ApiError(400,"INVALID_JSON");}
}
const session=(request:NextRequest)=>currentUser(request.cookies.get(cookieName)?.value);
function required(request:NextRequest){const user=session(request);if(!user)throw new ApiError(401,"LOGIN_REQUIRED");return user;}
function target(v:unknown){const id=typeof v==="string"?v:"";if(!/^[0-9a-f-]{36}$/.test(id))throw new ApiError(400,"INVALID_TARGET");return id;}
export async function GET(request:NextRequest){
  try {
    guard(request);
    const op=new URL(request.url).searchParams.get("op")||"health";
    if(op==="health")return response({ok:true,mode:process.env.VERCEL?"PUBLIC_PREVIEW":"PRIVATE_LOCAL_MVP",features:["accounts","profiles","mutual-matches","messages","block","report","delete"],public:false,ageVerification:"self-attested"});
    const user=required(request);
    if(op==="me")return response({ok:true,profile:self(user)});
    if(op==="people"){
      const u = new URL(request.url);
      return response({ok:true,people:people(user, {
        intent: u.searchParams.get("intent") || undefined,
        search: u.searchParams.get("q") || undefined,
        tag: u.searchParams.get("tag") || undefined
      })});
    }
    if(op==="matches")return response({ok:true,matches:matches(user)});
    if(op==="chat")return response({ok:true,messages:chat(user,target(new URL(request.url).searchParams.get("with")))});
    if(op==="export")return response({ok:true,export:exportData(user)});
    if(op==="who_liked_me")return response({ok:true,...whoLikedMe(user)});
    throw new ApiError(404,"UNKNOWN_OPERATION");
  }catch(e){return handleError(e);}
}
export async function POST(request:NextRequest){
  try{
    guard(request,true);
    const b=await body(request);
    const op=String(b.op||"");
    if(op==="signup"||op==="login"){
      limited("auth-"+op,op==="signup"?5:15,op==="signup"?600000:300000);
      const token=op==="signup"?register(b):login(b);
      const r=response({ok:true,profile:self(currentUser(token)!)});
      r.cookies.set(cookieName,token,{httpOnly:true,sameSite:"strict",secure:new URL(request.url).protocol==="https:",path:"/",maxAge:604800});
      return r;
    }
    if(op==="logout"){
      logout(request.cookies.get(cookieName)?.value);
      const r=response({ok:true});r.cookies.set(cookieName,"",{path:"/",httpOnly:true,sameSite:"strict",maxAge:0});return r;
    }
    const user=required(request);
    limited("user-"+user,40,60000);
    if(op==="profile")return response({ok:true,profile:setProfile(user,b)});
    if(op==="like")return response({ok:true,...like(user,target(b.target))});
    if(op==="message"){limited("chat-"+user,12,60000);return response({ok:true,...send(user,target(b.target),b.text)});}
    if(op==="block")return response({ok:true,...block(user,target(b.target))});
    if(op==="report")return response({ok:true,...report(user,target(b.target),String(b.reason||""))});
    // Entitlements must be granted by a verified server-side payment webhook only.
    if(op==="upgrade_vip")throw new ApiError(503,"PAYMENT_VERIFICATION_NOT_CONFIGURED");
    if(op==="delete_account"){
      if(b.confirm!=="DELETE MY ACCOUNT")throw new ApiError(400,"CONFIRM_DELETION");
      const outcome=erase(user);const r=response({ok:true,...outcome});
      r.cookies.set(cookieName,"",{path:"/",httpOnly:true,sameSite:"strict",maxAge:0});return r;
    }
    throw new ApiError(404,"UNKNOWN_OPERATION");
  }catch(e){return handleError(e);}
}
