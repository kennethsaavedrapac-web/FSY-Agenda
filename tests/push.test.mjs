import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { createECDH, hkdfSync, createDecipheriv } from 'node:crypto';
import vm from 'node:vm';
import worker, { runScheduled, sendPush } from '../worker/index.mjs';
import { parseAgenda, isDue, validateSubscription } from '../worker/schedule.mjs';

const agenda = JSON.parse(await readFile(new URL('../src/data/agenda.json', import.meta.url)));
const migration = await readFile(new URL('../worker/migrations/0001_push.sql', import.meta.url), 'utf8');
const swSource = await readFile(new URL('../public/push-sw.js', import.meta.url), 'utf8');
const activity = parseAgenda(agenda)[0];
const token = 'a'.repeat(64);
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) } };

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(migration);
  return {
    raw: db,
    prepare(sql) {
      const statement = db.prepare(sql);
      const wrap = args => ({
        bind: (...values) => wrap(values),
        run: async () => ({ meta: { changes: Number(statement.run(...args).changes) } }),
        first: async () => statement.get(...args) || null,
        all: async () => ({ results: statement.all(...args) }),
      });
      return wrap([]);
    },
  };
}
function environment() {
  return { DB: database(), APP_ORIGIN: 'https://fsy.test', VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private', VAPID_SUBJECT: 'mailto:test@example.com' };
}
async function request(env, path, method = 'PUT', body, auth = token, origin = env.APP_ORIGIN) {
  return worker.fetch(new Request(`https://push.test/api/push/${path}`, {
    method, headers: { Origin: origin, Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), env);
}
async function withAgenda(callback, data = agenda) {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => Response.json(data);
  try { await callback(); } finally { globalThis.fetch = previous; }
}

test('exact advance times, Managua date, simultaneous activities and no past reminders', () => {
  for (const advance of [1, 5, 10, 15, 20]) {
    const due = activity.startsAt - advance * 60000;
    assert.equal(isDue(activity, advance, due - 1), false);
    assert.equal(isDue(activity, advance, due), true);
    assert.equal(isDue(activity, advance, activity.startsAt), false);
    assert.equal(isDue(activity, advance, due + 120000), false);
    assert.equal(isDue(activity, advance, due, due + 1), false);
  }
  assert.equal(new Date(activity.startsAt).toISOString(), '2026-11-07T13:00:00.000Z');
  assert.equal(isDue(activity, 5, activity.startsAt - 86400000), false);
  const simultaneous = parseAgenda({ ...agenda, activities: [agenda.activities[0], { ...agenda.activities[0], id: 99 }] });
  assert.equal(simultaneous.filter(a => isDue(a, 5, activity.startsAt - 300000)).length, 2);
});

test('API isolates devices, rejects unsafe endpoints, persists preferences and cancels', async () => {
  const env = environment();
  try {
    assert.equal((await request(env, 'subscription', 'PUT', { subscription, advance: 5 })).status, 200);
    assert.equal((await request(env, 'subscription', 'PUT', { subscription, advance: 5 }, 'b'.repeat(64))).status, 409);
    assert.equal((await request(env, 'subscription', 'DELETE', undefined, 'b'.repeat(64))).status, 200);
    assert.equal(env.DB.raw.prepare('SELECT enabled FROM subscriptions').get().enabled, 1);
    assert.equal((await request(env, 'subscription', 'PUT', { subscription, advance: 10 })).status, 200);
    assert.equal(env.DB.raw.prepare('SELECT advance FROM subscriptions').get().advance, 10);
    assert.equal((await request(env, 'subscription', 'PUT', { subscription, advance: 7 })).status, 400);
    assert.equal((await request(env, 'subscription', 'DELETE', undefined, token, 'https://evil.test')).status, 403);
    await request(env, 'subscription', 'DELETE');
    assert.equal(env.DB.raw.prepare('SELECT enabled FROM subscriptions').get().enabled, 0);
    for (const endpoint of ['https://localhost/push', 'http://fcm.googleapis.com/x', 'https://fcm.googleapis.com.evil.test/x', 'https://fcm.googleapis.com:444/x']) assert.throws(() => validateSubscription({ ...subscription, endpoint }));
  } finally { env.DB.raw.close(); }
});

test('scheduler sends each simultaneous activity once, honors changes and stops disabled devices', async () => {
  const env = environment();
  const sent = [];
  const sender = async (_env, sub, payload) => { sent.push({ sub, payload }); return new Response(null, { status: 201 }); };
  const schedule = { ...agenda, activities: [agenda.activities[0], { ...agenda.activities[0], id: 99 }] };
  try {
    await request(env, 'subscription', 'PUT', { subscription, advance: 5 });
    env.DB.raw.exec('UPDATE subscriptions SET enabled_at = 0');
    await withAgenda(async () => {
      await runScheduled(env, activity.startsAt - 600000, sender);
      assert.equal(sent.length, 0);
      await Promise.all([runScheduled(env, activity.startsAt - 300000, sender), runScheduled(env, activity.startsAt - 300000, sender)]);
      assert.equal(sent.length, 2);
      assert.match(sent[0].payload.body, /5 minutos/);
      await request(env, 'subscription', 'PUT', { subscription, advance: 1 });
      await runScheduled(env, activity.startsAt - 60000, sender);
      assert.equal(sent.length, 2, 'changing advance cannot redeliver an already sent activity');
      env.DB.raw.exec('DELETE FROM deliveries');
      await request(env, 'subscription', 'DELETE');
      await runScheduled(env, activity.startsAt - 60000, sender);
      assert.equal(sent.length, 2);
      await request(env, 'subscription', 'PUT', { subscription, advance: 10 });
      env.DB.raw.exec('UPDATE subscriptions SET enabled_at = 0');
      await runScheduled(env, activity.startsAt - 600000, sender);
      assert.equal(sent.length, 4);
    }, schedule);
    // A revised official start time is read on the next cron, without an open app.
    await withAgenda(async () => {
      await runScheduled(env, activity.startsAt + 3600000 - 600000, sender);
      assert.equal(sent.length, 5);
    }, { ...agenda, activities: [{ ...agenda.activities[0], startTime: '08:00' }] });
  } finally { env.DB.raw.close(); }
});

test('expired subscriptions are disabled; explicit temporary failures retry without duplicate acceptance', async () => {
  for (const code of [410, 404, 503, 429]) {
    const env = environment();
    try {
      await request(env, 'subscription', 'PUT', { subscription, advance: 5 });
      env.DB.raw.exec('UPDATE subscriptions SET enabled_at = 0');
      await withAgenda(async () => {
        await runScheduled(env, activity.startsAt - 300000, async () => new Response(null, { status: code }));
        const enabled = env.DB.raw.prepare('SELECT enabled FROM subscriptions').get().enabled;
        assert.equal(enabled, [404, 410].includes(code) ? 0 : 1);
        assert.equal(env.DB.raw.prepare('SELECT count(*) AS n FROM deliveries').get().n, [404, 410].includes(code) ? 1 : 0);
      });
    } finally { env.DB.raw.close(); }
  }
});

test('delayed test goes through cron once and cancellation removes it', async () => {
  const env = environment();
  try {
    await request(env, 'subscription', 'PUT', { subscription, advance: 5 });
    assert.equal((await request(env, 'test-delayed', 'POST')).status, 200);
    assert.equal((await request(env, 'test-delayed', 'POST')).status, 429);
    const due = env.DB.raw.prepare('SELECT test_due FROM subscriptions').get().test_due;
    let count = 0;
    const sender = async () => { count++; return new Response(null, { status: 201 }); };
    await withAgenda(async () => {
      await runScheduled(env, due - 1, sender);
      assert.equal(count, 0);
      await runScheduled(env, due, sender);
      await runScheduled(env, due + 60000, sender);
      assert.equal(count, 1);
      env.DB.raw.exec('UPDATE subscriptions SET last_test = 0');
      await request(env, 'test-delayed', 'POST');
      await request(env, 'subscription', 'DELETE');
      await runScheduled(env, due, sender);
      assert.equal(count, 1);
    });
  } finally { env.DB.raw.close(); }
});

test('encrypted Web Push roundtrip reaches the real service worker handler and opens activity', async () => {
  const ua = createECDH('prime256v1'); ua.generateKeys();
  const vapid = createECDH('prime256v1'); vapid.generateKeys();
  const auth = Buffer.alloc(16, 7);
  const sub = { endpoint: subscription.endpoint, expirationTime: null, keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
  const env = { VAPID_SUBJECT: 'mailto:test@example.com', VAPID_PUBLIC_KEY: vapid.getPublicKey().toString('base64url'), VAPID_PRIVATE_KEY: vapid.getPrivateKey().toString('base64url') };
  let decoded;
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, sub.endpoint);
    const headers = new Headers(options.headers);
    assert.equal(headers.get('Content-Encoding'), 'aes128gcm');
    assert.match(headers.get('Authorization'), /^vapid /);
    assert.equal(headers.get('TTL'), '60');
    const body = Buffer.from(options.body);
    const salt = body.subarray(0, 16);
    const serverKey = body.subarray(21, 21 + body[20]);
    const secret = ua.computeSecret(serverKey);
    const ikm = hkdfSync('sha256', secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), serverKey]), 32);
    const key = hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
    const nonce = hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);
    const encrypted = body.subarray(21 + body[20]);
    const decipher = createDecipheriv('aes-128-gcm', key, nonce);
    decipher.setAuthTag(encrypted.subarray(-16));
    const plaintext = Buffer.concat([decipher.update(encrypted.subarray(0, -16)), decipher.final()]);
    let end = plaintext.length - 1;
    while (plaintext[end] === 0) end--;
    assert.equal(plaintext[end], 2);
    decoded = JSON.parse(plaintext.subarray(0, end).toString());
    return new Response(null, { status: 201 });
  };
  try {
    await sendPush(env, sub, { title: '⏰ Próxima actividad: Prueba', body: 'Comienza en 5 minutos', startsAt: Date.now() + 300000, tag: 'unique', url: '/#detail-1' });
  } finally { globalThis.fetch = previous; }
  const handlers = {}, shown = [], opened = [];
  vm.runInNewContext(swSource, { URL, Date, self: {
    location: { origin: 'https://fsy.test' },
    addEventListener: (name, handler) => { handlers[name] = handler; },
    registration: { showNotification: async (...args) => shown.push(args) },
    clients: { matchAll: async () => [], openWindow: async url => opened.push(url) },
  } });
  let work;
  handlers.push({ data: { json: () => decoded }, waitUntil: promise => { work = promise; } });
  await work;
  assert.equal(shown.length, 1, 'works without any window clients');
  assert.equal(shown[0][1].body, 'Comienza en 5 minutos');
  handlers.notificationclick({ notification: { close() {}, data: shown[0][1].data }, waitUntil: promise => { work = promise; } });
  await work;
  assert.deepEqual(opened, ['https://fsy.test/#detail-1']);
  decoded.startsAt = Date.now() - 1;
  handlers.push({ data: { json: () => decoded }, waitUntil: promise => { work = promise; } });
  await work;
  assert.equal(shown.length, 1, 'expired offline messages are not shown');
});
