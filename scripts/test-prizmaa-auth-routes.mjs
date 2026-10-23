// Fail-closed route checks against a production build with NO Supabase credentials.
// This is not a substitute for a later real-user end-to-end test.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

const port = await new Promise((resolve, reject) => {
  const listener = createServer();
  listener.once('error', reject);
  listener.listen(0, '127.0.0.1', () => {
    const selected = listener.address().port;
    listener.close(() => resolve(selected));
  });
});
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  env: {
    ...process.env,
    SUPABASE_URL: '',
    SUPABASE_PUBLISHABLE_KEY: '',
    PRIZMAA_LOCAL_MVP: '0',
    ALLOW_PUBLIC_PREVIEW: '0',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverOutput = '';
for (const stream of [child.stdout, child.stderr]) {
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => { serverOutput = (serverOutput + chunk).slice(-12000); });
}
async function request(path, options = {}) {
  return fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(4000), ...options });
}
function postOptions(originHeader) {
  return {
    method: 'POST',
    headers: { 'Origin': originHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid@example.invalid', password: 'invalid' }),
  };
}

try {
  let started = false;
  for (let attempt = 0; attempt < 70; attempt++) {
    if (child.exitCode !== null) throw new Error('Next server exited before readiness');
    try {
      const response = await request('/login');
      if (response.status === 200) { started = true; break; }
    } catch { /* server not listening yet */ }
    await sleep(400);
  }
  assert.ok(started, 'Next server never became ready');

  const member = await request('/members');
  assert.ok([307, 308].includes(member.status), `/members must redirect, got ${member.status}`);
  assert.equal(new URL(member.headers.get('location'), origin).pathname, '/login');

  const memberApi = await request('/api/member/me');
  assert.equal(memberApi.status, 401, 'Private member API must fail closed');

  const noAuth = await request('/api/auth/login', postOptions(origin));
  assert.equal(noAuth.status, 503, 'Login without Supabase configuration must fail closed');

  const forgedOrigin = await request('/api/auth/login', postOptions('https://attacker.example'));
  assert.equal(forgedOrigin.status, 403, 'Cross-site credential submission must be rejected');

  const forgedLogout = await request('/api/auth/logout', postOptions('https://attacker.example'));
  assert.equal(forgedLogout.status, 403, 'Cross-site logout must be rejected');

  console.log('PASS: PRIZMAA protected routes, missing-config gate and origin checks');
} catch (error) {
  console.error(serverOutput);
  throw error;
} finally {
  child.kill('SIGTERM');
}
