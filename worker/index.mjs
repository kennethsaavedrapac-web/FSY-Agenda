import { buildPushPayload } from '@block65/webcrypto-web-push';
import { ADVANCES, parseAgenda, isDue, notification, validateSubscription } from './schedule.mjs';

const json = (data, status = 200) => Response.json(data, { status });
const hash = async (text) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, '0')).join('');

export async function sendPush(env, subscription, data, ttl = 60) {
  const payload = await buildPushPayload({ data: JSON.stringify(data), options: { ttl, urgency: 'high' } }, subscription, {
    subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY,
  });
  return fetch(subscription.endpoint, { ...payload, redirect: 'error', signal: AbortSignal.timeout(10000) });
}

async function api(request, env) {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.DB) return json({ error: 'Recordatorios pendientes de configurar en Cloudflare.' }, 503);
  const path = new URL(request.url).pathname;
  if (path === '/api/push/config' && request.method === 'GET') return json({ publicKey: env.VAPID_PUBLIC_KEY });
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return json({ error: 'Credencial de dispositivo inválida.' }, 401);
  const id = await hash(token);
  if (path === '/api/push/subscription' && request.method === 'DELETE') {
    await env.DB.prepare('UPDATE subscriptions SET enabled = 0, test_due = NULL, revision = ? WHERE id = ?').bind(crypto.randomUUID(), id).run();
    return json({ enabled: false });
  }
  if (path === '/api/push/subscription' && request.method === 'PUT') {
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON requerido.' }, 415);
    const text = await request.text();
    if (text.length > 5000) return json({ error: 'Solicitud demasiado grande.' }, 413);
    let body;
    try {
      body = JSON.parse(text);
      validateSubscription(body.subscription);
      if (!ADVANCES.includes(body.advance)) throw new Error();
    } catch { return json({ error: 'Suscripción o anticipación inválida.' }, 400); }
    // A device token cannot replace another device's subscription.
    const owner = await env.DB.prepare('SELECT id FROM subscriptions WHERE endpoint = ?').bind(body.subscription.endpoint).first();
    if (owner && owner.id !== id) return json({ error: 'Renueva la suscripción de este dispositivo.' }, 409);
    await env.DB.prepare(`INSERT INTO subscriptions (id, subscription, endpoint, advance, enabled, enabled_at, revision)
      VALUES (?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription, endpoint=excluded.endpoint,
      enabled_at=CASE WHEN subscriptions.enabled=0 OR subscriptions.advance != excluded.advance THEN excluded.enabled_at ELSE subscriptions.enabled_at END,
      advance=excluded.advance, enabled=1, revision=excluded.revision`)
      .bind(id, JSON.stringify(body.subscription), body.subscription.endpoint, body.advance, Date.now(), crypto.randomUUID()).run();
    return json({ enabled: true, advance: body.advance });
  }
  if (path === '/api/push/test-delayed' && request.method === 'POST') {
    const now = Date.now();
    const row = await env.DB.prepare('UPDATE subscriptions SET last_test = ?, test_due = ? WHERE id = ? AND enabled = 1 AND last_test < ? RETURNING id').bind(now, now + 60000, id, now - 30000).first();
    return row ? json({ scheduled: true }) : json({ error: 'Activa los recordatorios y espera 30 segundos entre pruebas.' }, 429);
  }
  if (path === '/api/push/test' && request.method === 'POST') {
    const now = Date.now();
    const row = await env.DB.prepare('UPDATE subscriptions SET last_test = ? WHERE id = ? AND enabled = 1 AND last_test < ? RETURNING *').bind(now, id, now - 30000).first();
    if (!row) return json({ error: 'Activa los recordatorios y espera 30 segundos entre pruebas.' }, 429);
    const response = await sendPush(env, JSON.parse(row.subscription), { title: 'FSY Agenda · Prueba', body: 'Notificación recibida mediante Web Push.', tag: `fsy-test:${now}`, url: '/#perfil', test: true });
    if ([404, 410].includes(response.status)) await env.DB.prepare('UPDATE subscriptions SET enabled = 0 WHERE id = ?').bind(id).run();
    return response.ok ? json({ accepted: true }) : json({ error: 'El servicio Push rechazó el envío. Desactiva y vuelve a activar los recordatorios.' }, 502);
  }
  return json({ error: 'Ruta no encontrada.' }, 404);
}

export async function runScheduled(env, now = Date.now(), sender = sendPush) {
  // Read the published schedule every run; closed clients need no resynchronization.
  const response = await fetch(`${env.APP_ORIGIN}/data/agenda.json`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Official agenda unavailable');
  const activities = parseAgenda(await response.json());
  let cursor = '';
  while (true) {
    const { results } = await env.DB.prepare('SELECT * FROM subscriptions WHERE enabled = 1 AND id > ? ORDER BY id LIMIT 50').bind(cursor).all();
    if (!results.length) break;
    for (const row of results) {
      if (row.test_due && row.test_due <= now) {
        const claimed = await env.DB.prepare('UPDATE subscriptions SET test_due = NULL WHERE id = ? AND enabled = 1 AND test_due = ? RETURNING id').bind(row.id, row.test_due).first();
        if (claimed && now - row.test_due < 120000) {
          try {
            const result = await sender(env, JSON.parse(row.subscription), { title: 'FSY Agenda · Prueba programada', body: 'Recibida desde el Cron de Cloudflare, incluso con la PWA cerrada.', tag: `fsy-test:${row.test_due}`, url: '/#perfil', test: true }, 60);
            if ([404, 410].includes(result.status)) {
              await env.DB.prepare('UPDATE subscriptions SET enabled = 0 WHERE id = ? AND revision = ?').bind(row.id, row.revision).run();
              continue;
            }
          } catch { console.error('Scheduled test delivery outcome unknown'); }
        }
      }
      for (const activity of activities) {
        if (!isDue(activity, row.advance, now, row.enabled_at)) continue;
        // Atomic claim plus revision check: overlapping crons cannot send twice.
        const claim = await env.DB.prepare(`INSERT OR IGNORE INTO deliveries (subscription_id, activity_key, claimed_at, status)
          SELECT id, ?, ?, 'claimed' FROM subscriptions WHERE id = ? AND enabled = 1 AND revision = ?`)
          .bind(activity.key, now, row.id, row.revision).run();
        if (!claim.meta.changes) continue;
        try {
          // A final check avoids sending after most concurrent preference changes.
          const current = await env.DB.prepare('SELECT id FROM subscriptions WHERE id = ? AND enabled = 1 AND revision = ?').bind(row.id, row.revision).first();
          if (!current) {
            await env.DB.prepare('DELETE FROM deliveries WHERE subscription_id = ? AND activity_key = ?').bind(row.id, activity.key).run();
            continue;
          }
          const result = await sender(env, JSON.parse(row.subscription), notification(activity, row.advance), Math.max(0, Math.floor((activity.startsAt - Date.now()) / 1000)));
          if ([404, 410].includes(result.status)) await env.DB.prepare('UPDATE subscriptions SET enabled = 0 WHERE id = ? AND revision = ?').bind(row.id, row.revision).run();
          // Explicit rejection is safe to retry next minute. Unknown delivery is not.
          if (result.status === 429 || result.status >= 500) {
            await env.DB.prepare('DELETE FROM deliveries WHERE subscription_id = ? AND activity_key = ?').bind(row.id, activity.key).run();
          } else {
            await env.DB.prepare('UPDATE deliveries SET status = ? WHERE subscription_id = ? AND activity_key = ?').bind(result.ok ? 'accepted' : `rejected:${result.status}`, row.id, activity.key).run();
          }
        } catch {
          await env.DB.prepare("UPDATE deliveries SET status = 'unknown' WHERE subscription_id = ? AND activity_key = ?").bind(row.id, activity.key).run();
          console.error('Push outcome unknown; no automatic retry to avoid duplicates');
        }
      }
    }
    cursor = results.at(-1).id;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (origin !== env.APP_ORIGIN) return json({ error: 'Origen no autorizado.' }, 403);
    const headers = { 'Access-Control-Allow-Origin': env.APP_ORIGIN, 'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    let response;
    try { response = await api(request, env); }
    catch { response = json({ error: 'No se pudo completar la operación. Inténtalo de nuevo.' }, 503); }
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return response;
  },
  async scheduled(_event, env, ctx) { ctx.waitUntil(runScheduled(env)); },
};
