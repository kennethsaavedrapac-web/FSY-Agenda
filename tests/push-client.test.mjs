import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const server = await createServer({ configFile: false, define: { 'import.meta.env.VITE_PUSH_API_URL': JSON.stringify('https://push.test') }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
after(() => server.close());
const { PreferencesProvider, usePreferences } = await server.ssrLoadModule('/src/context/PreferencesContext.tsx');
const { usePushReminders } = await server.ssrLoadModule('/src/hooks/usePushReminders.ts');

test('client requests permission only on activation, syncs changes, reports denial/offline and receives proof', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://fsy.test' });
  const previous = Object.fromEntries(['window', 'document', 'navigator', 'localStorage', 'Notification', 'fetch'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const calls = [];
  let permissionCalls = 0, subscription = null, permission = 'default';
  const notifications = { get permission() { return permission; }, requestPermission: async () => { permissionCalls++; return permission; } };
  const sw = new dom.window.EventTarget();
  sw.getRegistration = async () => ({ active: {}, pushManager: {
    getSubscription: async () => subscription,
    subscribe: async () => {
      subscription = { toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/test' }), unsubscribe: async () => { subscription = null; return true; } };
      return subscription;
    },
  } });
  Object.defineProperty(dom.window, 'isSecureContext', { value: true });
  Object.defineProperty(dom.window.navigator, 'serviceWorker', { value: sw });
  Object.defineProperty(dom.window.navigator, 'onLine', { value: true, configurable: true });
  dom.window.Notification = notifications;
  dom.window.PushManager = function () {};
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, Notification: notifications, fetch: async (url, options) => {
    calls.push({ url, ...options });
    return Response.json(url.endsWith('/config') ? { publicKey: Buffer.alloc(65, 1).toString('base64url') } : { enabled: true });
  } })) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let reminders, prefs;
  function Probe() {
    const currentReminders = usePushReminders();
    const currentPrefs = usePreferences();
    React.useEffect(() => { reminders = currentReminders; prefs = currentPrefs; });
    return null;
  }
  const root = createRoot(document.getElementById('root'));
  const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 30)));
  try {
    await act(() => root.render(React.createElement(PreferencesProvider, null, React.createElement(Probe))));
    await settle();
    assert.equal(permissionCalls, 0);
    assert.equal(reminders.active, false);
    permission = 'denied';
    await act(() => reminders.enable());
    assert.equal(reminders.active, false);
    assert.match(reminders.status, /Permiso no concedido/);
    permission = 'granted';
    await act(() => reminders.enable());
    await settle();
    assert.equal(reminders.active, true);
    for (const advance of [1, 5, 10, 15]) {
      await act(() => prefs.setAdvanceMinutes(advance));
      await settle();
      assert.equal(JSON.parse(calls.filter(call => call.method === 'PUT').at(-1).body).advance, advance);
    }
    await act(() => reminders.test());
    assert.match(reminders.status, /esperando recepción/);
    await act(() => sw.dispatchEvent(new window.MessageEvent('message', { data: { type: 'FSY_PUSH_RECEIVED', test: true } })));
    assert.match(reminders.status, /recibida y mostrada/);
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await act(() => reminders.disable());
    await settle();
    assert.equal(subscription, null);
    assert.equal(reminders.active, false);
    assert.match(reminders.status, /Sin conexión/);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await act(() => window.dispatchEvent(new window.Event('online')));
    await settle();
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.match(reminders.status, /desactivados/);
  } finally {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
