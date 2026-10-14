import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const { email, consent } = await req.json();
  const ok = typeof email === 'string' && /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email);
  if (!ok || consent !== true) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(path.join(dir, 'waitlist.csv'), `${new Date().toISOString()},${email}\n`);
  return NextResponse.json({ ok: true });
}
