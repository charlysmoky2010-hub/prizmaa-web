// Server-only local storage module
import { randomBytes, createHash, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";

// Local-only prototype. No third-party identity, tracking, mail or location services.
import { DatabaseSync } from "node:sqlite";
type SqliteDb = { exec(sql: string): void; prepare(sql: string): { run(...args: (string|number|null)[]): unknown; get(...args: (string|number|null)[]): Record<string, unknown>|undefined; all(...args: (string|number|null)[]): Record<string,unknown>[] }; };
const dbPath = () => process.env.PRIZMAA_DB_PATH || (process.env.VERCEL ? join("/tmp", "prizmaa-local.sqlite") : join(process.cwd(), "data", "prizmaa-local.sqlite"));
let active: SqliteDb|undefined;
function db() {
  if (active) return active;
  const file = dbPath(); mkdirSync(dirname(file), { recursive: true });
  const d: SqliteDb = new DatabaseSync(file);
  d.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;");
  d.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, handle TEXT UNIQUE COLLATE NOCASE NOT NULL,
      pass_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL, age INTEGER NOT NULL CHECK(age BETWEEN 18 AND 90),
      city TEXT NOT NULL DEFAULT '', intent TEXT NOT NULL DEFAULT 'Dating',
      bio TEXT NOT NULL DEFAULT '', visible INTEGER NOT NULL DEFAULT 0,
      avatar_color TEXT NOT NULL DEFAULT 'violet',
      avatar_icon TEXT NOT NULL DEFAULT 'prism',
      role TEXT NOT NULL DEFAULT 'Open',
      tags TEXT NOT NULL DEFAULT '',
      is_vip INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS likes (
      from_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      to_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL, PRIMARY KEY(from_id,to_id)
    );
    CREATE TABLE IF NOT EXISTS blocks (
      from_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      to_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL, PRIMARY KEY(from_id,to_id)
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, from_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      to_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      reason TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, from_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      to_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      body TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(from_id,to_id,created_at);
  `);
  try { d.exec("ALTER TABLE profiles ADD COLUMN avatar_color TEXT NOT NULL DEFAULT 'violet';"); } catch {}
  try { d.exec("ALTER TABLE profiles ADD COLUMN avatar_icon TEXT NOT NULL DEFAULT 'prism';"); } catch {}
  try { d.exec("ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'Open';"); } catch {}
  try { d.exec("ALTER TABLE profiles ADD COLUMN tags TEXT NOT NULL DEFAULT '';"); } catch {}
  try { d.exec("ALTER TABLE profiles ADD COLUMN is_vip INTEGER NOT NULL DEFAULT 0;"); } catch {}
  try { d.exec("ALTER TABLE messages ADD COLUMN read_at TEXT;"); } catch {}
  try { chmodSync(file, 0o600); } catch { /* file is local-only */ }
  active=d;
  return d;
}
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
const now=()=>new Date().toISOString();
const digest=(s:string)=>createHash("sha256").update(s).digest("hex");
const bounded=(input: unknown, max:number)=>typeof input==="string" ? input.trim().slice(0,max) : "";
const isBlocked=(a:string,b:string)=>!!db().prepare("SELECT 1 FROM blocks WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").get(a,b,b,a);
export const cookieName="prizmaa_session";
const peppered=(password:string,salt:string)=>scryptSync(password,salt,64).toString("hex");
function passwordRecord(password:string){const salt=randomBytes(24).toString("hex");return salt+":"+peppered(password,salt);}
function passwordValid(password:string,record:string){const [salt,hash]=record.split(":");if(!salt||!hash||hash.length!==128)return false;return timingSafeEqual(Buffer.from(peppered(password,salt),"hex"),Buffer.from(hash,"hex"));}
function issueSession(userId:string){const token=randomBytes(32).toString("hex");db().prepare("INSERT INTO sessions(token_hash,member_id,expires_at) VALUES (?,?,?)").run(digest(token),userId,Date.now()+7*864e5);return token;}
export function currentUser(token:string|undefined){if(!token)return null;const found=db().prepare("SELECT member_id,expires_at FROM sessions WHERE token_hash=?").get(digest(token));return found && Number(found.expires_at)>Date.now()?String(found.member_id):null;}
export function register(input:Record<string,unknown>){
  const handle=bounded(input.handle,24),nickname=bounded(input.nickname,36),password=input.password,age=Number(input.age);
  if(!/^[a-zA-Z0-9_]{3,24}$/.test(handle)||nickname.length<2||!Number.isInteger(age)||age<18||age>90||input.adult!==true||input.acceptRules!==true||typeof password!=="string"||password.length<12||password.length>128) throw new ApiError(400,"INVALID_REGISTRATION");
  const user=randomUUID(), created=now(), pass=passwordRecord(password);
  try {
    db().exec("BEGIN");
    db().prepare("INSERT INTO members(id,handle,pass_hash,created_at) VALUES (?,?,?,?)").run(user,handle,pass,created);
    db().prepare("INSERT INTO profiles(member_id,nickname,age,city,intent,bio,visible,updated_at) VALUES (?,?,?,'','Dating','',0,?)").run(user,nickname,age,created);
    db().exec("COMMIT");
  }catch(e){db().exec("ROLLBACK");if(String(e).includes("UNIQUE"))throw new ApiError(409,"HANDLE_TAKEN");throw e;}
  return issueSession(user);
}
export function login(input:Record<string,unknown>){
  const handle=bounded(input.handle,24);const password=input.password;
  if(typeof password!=="string")throw new ApiError(401,"INVALID_LOGIN");
  const found=db().prepare("SELECT id,pass_hash FROM members WHERE handle=?").get(handle);
  if(!found||!passwordValid(password,String(found.pass_hash)))throw new ApiError(401,"INVALID_LOGIN");
  return issueSession(String(found.id));
}
export function logout(token:string|undefined){if(token)db().prepare("DELETE FROM sessions WHERE token_hash=?").run(digest(token));}
export function self(user:string){
  return db().prepare("SELECT m.id,m.handle,p.nickname,p.age,p.city,p.intent,p.bio,p.visible,p.avatar_color,p.avatar_icon,p.role,p.tags,p.is_vip FROM members m JOIN profiles p ON m.id=p.member_id WHERE m.id=?").get(user);
}
export function setProfile(user:string,input:Record<string,unknown>){
  const nickname=bounded(input.nickname,36),city=bounded(input.city,44),bio=bounded(input.bio,400);
  const age=Number(input.age),intent=bounded(input.intent,24),visible=input.visible===true?1:0;
  const avatar_color=bounded(input.avatar_color,20)||"violet";
  const avatar_icon=bounded(input.avatar_icon,20)||"prism";
  const role=bounded(input.role,24)||"Open";
  const tags=bounded(input.tags,140)||"";
  if(nickname.length<2||!Number.isInteger(age)||age<18||age>90||!["Hookup","Flirting","Dating","Relationship"].includes(intent))throw new ApiError(400,"INVALID_PROFILE");
  db().prepare("UPDATE profiles SET nickname=?,age=?,city=?,intent=?,bio=?,visible=?,avatar_color=?,avatar_icon=?,role=?,tags=?,updated_at=? WHERE member_id=?")
    .run(nickname,age,city,intent,bio,visible,avatar_color,avatar_icon,role,tags,now(),user);
  return self(user);
}
export function people(user:string, filters?:{intent?:string; search?:string; tag?:string}){
  let sql = `SELECT m.id,p.nickname,p.age,p.city,p.intent,p.bio,p.avatar_color,p.avatar_icon,p.role,p.tags FROM members m
    JOIN profiles p ON p.member_id=m.id
    WHERE m.id<>? AND p.visible=1
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.from_id=? AND b.to_id=m.id) OR (b.from_id=m.id AND b.to_id=?))`;
  const params: (string|number)[] = [user,user,user];
  if (filters?.intent && filters.intent !== "All") {
    sql += ` AND p.intent = ?`;
    params.push(filters.intent);
  }
  if (filters?.search && filters.search.trim()) {
    sql += ` AND (p.nickname LIKE ? OR p.city LIKE ? OR p.bio LIKE ?)`;
    const s = `%${filters.search.trim()}%`;
    params.push(s, s, s);
  }
  if (filters?.tag && filters.tag.trim()) {
    sql += ` AND p.tags LIKE ?`;
    params.push(`%${filters.tag.trim()}%`);
  }
  sql += ` ORDER BY p.updated_at DESC LIMIT 100`;
  return db().prepare(sql).all(...params);
}
function targetAvailable(user:string,target:string){if(!target||target===user||isBlocked(user,target))throw new ApiError(403,"TARGET_UNAVAILABLE");const t=db().prepare("SELECT visible FROM profiles WHERE member_id=?").get(target);if(!t||!Number(t.visible))throw new ApiError(404,"TARGET_UNAVAILABLE");}
export function isMatch(a:string,b:string){return !isBlocked(a,b)&&!!db().prepare("SELECT 1 FROM likes a INNER JOIN likes b ON b.from_id=a.to_id AND b.to_id=a.from_id WHERE a.from_id=? AND a.to_id=?").get(a,b);}
export function like(user:string,target:string){
  targetAvailable(user,target);const exists=db().prepare("SELECT 1 FROM likes WHERE from_id=? AND to_id=?").get(user,target);
  if(exists)db().prepare("DELETE FROM likes WHERE from_id=? AND to_id=?").run(user,target);
  else db().prepare("INSERT INTO likes(from_id,to_id,created_at) VALUES (?,?,?)").run(user,target,now());
  return {liked:!exists,mutual:isMatch(user,target)};
}
export function matches(user:string){
  return db().prepare(`SELECT m.id,p.nickname,p.age,p.city,p.intent,p.avatar_color,p.avatar_icon,p.role,p.tags,
  (SELECT COUNT(*) FROM messages msg WHERE msg.from_id=m.id AND msg.to_id=? AND msg.read_at IS NULL) as unread_count
  FROM likes a JOIN likes b ON a.from_id=b.to_id AND a.to_id=b.from_id
  JOIN members m ON m.id=a.to_id JOIN profiles p ON p.member_id=m.id
  WHERE a.from_id=? AND p.visible=1
  AND NOT EXISTS(SELECT 1 FROM blocks x WHERE (x.from_id=? AND x.to_id=m.id) OR (x.from_id=m.id AND x.to_id=?))
  ORDER BY b.created_at DESC LIMIT 50`).all(user,user,user,user);
}
export function chat(user:string,target:string){
  if(!isMatch(user,target))throw new ApiError(403,"MATCH_REQUIRED");
  db().prepare("UPDATE messages SET read_at=? WHERE to_id=? AND from_id=? AND read_at IS NULL").run(now(), user, target);
  return db().prepare(`SELECT id,from_id,to_id,body,created_at,read_at FROM messages WHERE
  (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)
  ORDER BY created_at ASC LIMIT 100`).all(user,target,target,user);
}
export function send(user:string,target:string,input:unknown){
  if(!isMatch(user,target))throw new ApiError(403,"MATCH_REQUIRED");
  const body=bounded(input,600);
  if(body.length<1)throw new ApiError(400,"EMPTY_MESSAGE");
  const id=randomUUID();
  db().prepare("INSERT INTO messages(id,from_id,to_id,body,created_at) VALUES (?,?,?,?,?)").run(id,user,target,body,now());
  return {id,body};
}
export function block(user:string,target:string){
  if(!target||user===target||!db().prepare("SELECT 1 FROM members WHERE id=?").get(target))throw new ApiError(404,"TARGET_UNAVAILABLE");
  db().prepare("INSERT OR IGNORE INTO blocks(from_id,to_id,created_at) VALUES (?,?,?)").run(user,target,now());
  db().prepare("DELETE FROM likes WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").run(user,target,target,user);
  return {blocked:true};
}
export function report(user:string,target:string,reason:string){
  if(!["Harassment","Fake profile","Underage concern","Non-consensual content","Other"].includes(reason))throw new ApiError(400,"INVALID_REASON");
  if(user===target||!db().prepare("SELECT 1 FROM members WHERE id=?").get(target))throw new ApiError(404,"TARGET_UNAVAILABLE");
  db().prepare("INSERT INTO reports(id,from_id,to_id,reason,created_at) VALUES (?,?,?,?,?)").run(randomUUID(),user,target,reason,now());
  return block(user,target);
}
export function erase(user:string){db().prepare("DELETE FROM members WHERE id=?").run(user);return {deleted:true};}
export function exportData(user:string){
  const p = self(user);
  const m = matches(user);
  const msgs = db().prepare("SELECT id,from_id,to_id,body,created_at,read_at FROM messages WHERE from_id=? OR to_id=? ORDER BY created_at ASC").all(user,user);
  return { exported_at: now(), profile: p, matches_count: m.length, messages: msgs };
}
export function whoLikedMe(user:string){
  const p = self(user);
  if (!p) throw new ApiError(404, "USER_NOT_FOUND");
  const countRow = db().prepare(`
    SELECT COUNT(*) as count FROM likes l
    JOIN members m ON m.id = l.from_id
    JOIN profiles pr ON pr.member_id = m.id
    WHERE l.to_id = ? AND pr.visible = 1
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.from_id = ? AND b.to_id = m.id) OR (b.from_id = m.id AND b.to_id = ?))
    AND NOT EXISTS (SELECT 1 FROM likes rev WHERE rev.from_id = ? AND rev.to_id = m.id)
  `).get(user, user, user, user);
  const count = Number(countRow?.count || 0);

  if (!Number(p.is_vip)) {
    return { locked: true, count, people: [] };
  }

  const peopleRows = db().prepare(`
    SELECT m.id, pr.nickname, pr.age, pr.city, pr.intent, pr.avatar_color, pr.avatar_icon, pr.role, pr.tags
    FROM likes l
    JOIN members m ON m.id = l.from_id
    JOIN profiles pr ON pr.member_id = m.id
    WHERE l.to_id = ? AND pr.visible = 1
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.from_id = ? AND b.to_id = m.id) OR (b.from_id = m.id AND b.to_id = ?))
    AND NOT EXISTS (SELECT 1 FROM likes rev WHERE rev.from_id = ? AND rev.to_id = m.id)
    ORDER BY l.created_at DESC LIMIT 50
  `).all(user, user, user, user);

  return { locked: false, count, people: peopleRows };
}
export function upgradeVip(user:string, status:boolean = true){
  db().prepare("UPDATE profiles SET is_vip=? WHERE member_id=?").run(status ? 1 : 0, user);
  return self(user);
}


