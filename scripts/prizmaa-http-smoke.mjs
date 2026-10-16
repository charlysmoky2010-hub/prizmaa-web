// End-to-end HTTP smoke test for local-only PRIZMAA. This MUST NOT run against a live domain.
// Every member below is a synthetic test account in an ephemeral CI SQLite database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const origin = 'http://127.0.0.1:3055';
const base = origin + '/api/prizmaa/core';
const stub = randomUUID().slice(0, 8);
const handleA = 'smokea_' + stub;
const handleB = 'smokeb_' + stub;
const password = 'TestOnly!Secret12345';

async function request(op, { payload, cookie } = {}) {
  const chat = op.startsWith('chat&with=');
  const url = payload ? base : base + (chat
    ? '?op=chat&with=' + encodeURIComponent(op.slice('chat&with='.length))
    : '?op=' + encodeURIComponent(op));
  const headers = { ...(cookie ? { cookie } : {}), ...(payload ? { 'content-type': 'application/json' } : {}) };
  const res = await fetch(url, {
    method: payload ? 'POST' : 'GET', headers,
    ...(payload ? { body: JSON.stringify({ op, ...payload }) } : {}),
  });
  const data = await res.json();
  return { status: res.status, data, cookie: res.headers.get('set-cookie')?.split(';')[0] ?? '' };
}
function success(result, message) {
  assert.equal(result.status, 200, message + ' HTTP');
  assert.equal(result.data.ok, true, message + ' payload');
  console.log('PASS:', message);
}
const health = await request('health');
success(health, 'local API is reachable');
assert.equal(health.data.public, false);
assert.equal(health.data.mode, 'PRIVATE_LOCAL_MVP');

const screen = await fetch(origin + '/prizmaa/beta');
assert.equal(screen.status, 200);
const body = await screen.text();
assert.match(body, /Real chemistry/);
assert.match(body, /18\+ only/);
console.log('PASS: beta preview renders age gate');

const a = await request('signup', { payload: { handle: handleA, nickname: 'Smoke Alpha', age: 29, adult: true, acceptRules: true, password } });
const b = await request('signup', { payload: { handle: handleB, nickname: 'Smoke Beta', age: 32, adult: true, acceptRules: true, password } });
success(a, 'account A registration');
success(b, 'account B registration');
assert.ok(a.cookie.includes('prizmaa_session='));
assert.ok(b.cookie.includes('prizmaa_session='));
const idA = a.data.profile.id;
const idB = b.data.profile.id;
assert.match(idA, /^[0-9a-f-]{36}$/);
assert.match(idB, /^[0-9a-f-]{36}$/);

for (const [nickname, age, cookie] of [['Smoke Alpha', 29, a.cookie], ['Smoke Beta', 32, b.cookie]]) {
  const profile = await request('profile', { cookie, payload: {
    nickname, age, city: 'TestCity', intent: 'Dating', bio: 'Fictional automated test account',
    visible: true, avatar_color: 'mint', avatar_icon: 'prism', role: 'Open', tags: 'Cinema,Art',
  } });
  success(profile, nickname + ' opted into local discovery');
}
const discover = await request('people', { cookie: a.cookie });
success(discover, 'discovery endpoint');
assert.ok(discover.data.people.some(p => p.id === idB));

const forbiddenMessage = await request('message', { cookie: a.cookie, payload: { target: idB, text: 'Hello before match' } });
assert.equal(forbiddenMessage.status, 403);
assert.equal(forbiddenMessage.data.error, 'MATCH_REQUIRED');
console.log('PASS: unsolicited message is blocked');

const likeA = await request('like', { cookie: a.cookie, payload: { target: idB } });
success(likeA, 'first private like');
assert.equal(likeA.data.mutual, false);
const likeB = await request('like', { cookie: b.cookie, payload: { target: idA } });
success(likeB, 'reciprocal like');
assert.equal(likeB.data.mutual, true);
const matches = await request('matches', { cookie: a.cookie });
success(matches, 'mutual connections endpoint');
assert.ok(matches.data.matches.some(p => p.id === idB));

const sent = await request('message', { cookie: a.cookie, payload: { target: idB, text: 'Hello from the PRIZMAA integration test.' } });
success(sent, 'mutual match messaging');
const chat = await request('chat&with=' + idA, { cookie: b.cookie });
success(chat, 'recipient can read matched message');
assert.ok(chat.data.messages.some(m => m.body === 'Hello from the PRIZMAA integration test.'));

const upgrade = await request('upgrade_vip', { cookie: a.cookie, payload: {} });
assert.equal(upgrade.status, 403);
assert.equal(upgrade.data.error, 'PAYMENT_VERIFICATION_REQUIRED');
console.log('PASS: unauthorized VIP upgrade refused');

const blocked = await request('block', { cookie: b.cookie, payload: { target: idA } });
success(blocked, 'block user');
const cleared = await request('matches', { cookie: a.cookie });
success(cleared, 'matches after block');
assert.ok(!cleared.data.matches.some(p => p.id === idB));
const rejectedChat = await request('chat&with=' + idB, { cookie: a.cookie });
assert.equal(rejectedChat.status, 403);
assert.equal(rejectedChat.data.error, 'MATCH_REQUIRED');
console.log('PASS: blocked user cannot read chat');

for (const [cookie, name] of [[a.cookie, 'A'], [b.cookie, 'B']]) {
  const deleted = await request('delete_account', { cookie, payload: { confirm: 'DELETE MY ACCOUNT' } });
  success(deleted, 'delete test member ' + name);
}
console.log('PRIZMAA HTTP SMOKE: ALL CHECKS PASSED — test accounts deleted');
