/* Imported by the existing Workbox worker. No timers or second worker. */
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let data;
    try { data = event.data?.json(); } catch { return; }
    if (!data || typeof data.title !== 'string') return;
    if (data.startsAt && Date.now() >= data.startsAt) return;
    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      tag: data.tag,
      renotify: false,
      data: { url: data.url || '/#perfil' },
    });
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) client.postMessage({ type: 'FSY_PUSH_RECEIVED', test: !!data.test });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || '/', self.location.origin);
    if (target.origin !== self.location.origin) return;
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (new URL(client.url).origin === target.origin) {
        await client.navigate(target.href);
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(target.href);
  })());
});
