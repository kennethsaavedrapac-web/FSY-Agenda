export const ADVANCES = [1, 5, 10, 15, 20];

export function parseAgenda(agenda) {
  if (agenda.timeZone !== 'America/Managua' || !/^\d{4}-\d{2}-\d{2}$/.test(agenda.eventDate) || !Array.isArray(agenda.activities)) {
    throw new Error('Invalid official agenda');
  }
  const ids = new Set();
  return agenda.activities.map((activity) => {
    if (!Number.isInteger(activity.id) || ids.has(activity.id) || typeof activity.title !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(activity.startTime)) throw new Error('Invalid activity');
    ids.add(activity.id);
    // Nicaragua is UTC-06:00, without DST. Never use the server/device timezone.
    const startsAt = Date.parse(`${agenda.eventDate}T${activity.startTime}:00-06:00`);
    if (!Number.isFinite(startsAt)) throw new Error('Invalid activity date');
    return { ...activity, startsAt, key: `${agenda.eventDate}:${activity.id}:${startsAt}` };
  });
}

export function isDue(activity, advance, now, enabledAt = 0) {
  const due = activity.startsAt - advance * 60000;
  // Catch up transient outages for at most two minutes, never after the start.
  return due >= enabledAt && due <= now && now < activity.startsAt && now - due < 120000;
}

export function notification(activity, advance) {
  return {
    title: `⏰ Próxima actividad: ${activity.title}`,
    body: `Comienza en ${advance} ${advance === 1 ? 'minuto' : 'minutos'}`,
    startsAt: activity.startsAt,
    tag: `fsy:${activity.key}`,
    url: `/#detail-${activity.id}`,
  };
}

export function validateSubscription(subscription) {
  const url = new URL(subscription?.endpoint);
  const host = url.hostname;
  const allowed = host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host.endsWith('.push.services.mozilla.com') || host === 'web.push.apple.com' || host.endsWith('.push.apple.com') || host === 'wns.windows.com' || host.endsWith('.notify.windows.com');
  if (!allowed || url.protocol !== 'https:' || url.port || url.username || url.password || url.hash) throw new Error('Invalid push endpoint');
  if (!/^[A-Za-z0-9_-]{87}$/.test(subscription.keys?.p256dh) || !/^[A-Za-z0-9_-]{22}$/.test(subscription.keys?.auth)) throw new Error('Invalid push keys');
  if (subscription.endpoint.length > 2048) throw new Error('Invalid push endpoint');
  return subscription;
}
