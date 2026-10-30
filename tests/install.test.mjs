import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
after(() => server.close());
const { usePwaInstall, getInstallPlatform } = await server.ssrLoadModule('/src/hooks/usePwaInstall.ts');
const { InstallInstructionsDialog } = await server.ssrLoadModule('/src/components/InstallInstructionsDialog.tsx');

const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
test('platform detection includes iPhone, alternative iOS browsers and iPad desktop mode', () => {
  assert.deepEqual(getInstallPlatform({ userAgent: iphone, platform: 'iPhone', maxTouchPoints: 5 }), { ios: true, safari: true, android: false });
  assert.equal(getInstallPlatform({ userAgent: iphone.replace('Version/18.0', 'CriOS/130'), platform: 'iPhone', maxTouchPoints: 5 }).safari, false);
  assert.equal(getInstallPlatform({ userAgent: 'Macintosh Version/18 Safari/605', platform: 'MacIntel', maxTouchPoints: 5 }).ios, true);
  assert.equal(getInstallPlatform({ userAgent: 'Mozilla Android Chrome', platform: 'Linux', maxTouchPoints: 5 }).android, true);
});

async function setup({ standalone = false, iosStandalone = false, userAgent = 'Mozilla Android Chrome' } = {}) {
  const dom = new JSDOM('<button id="install-app">Instalar aplicación</button><div id="root"></div>', { url: 'https://fsy.test' });
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(dom.window.navigator, 'userAgent', { value: userAgent });
  Object.defineProperty(dom.window.navigator, 'standalone', { value: iosStandalone });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const media = new dom.window.EventTarget();
  media.matches = standalone;
  window.matchMedia = query => query.includes('standalone') ? media : { matches: true };
  // jsdom has no native top layer; browser verification covers focus containment.
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  let latest;
  let setOpen;
  function Probe() {
    const install = usePwaInstall();
    const [open, changeOpen] = React.useState(false);
    React.useLayoutEffect(() => { latest = install; setOpen = changeOpen; }, [install, changeOpen]);
    return React.createElement(InstallInstructionsDialog, { open, installation: install, onClose: () => changeOpen(false) });
  }
  const root = createRoot(document.getElementById('root'));
  await act(() => root.render(React.createElement(React.StrictMode, null, React.createElement(Probe))));
  return {
    get install() { return latest; },
    media,
    async open() { await act(() => setOpen(true)); },
    async event(outcome = 'dismissed', fails = false) {
      const event = new window.Event('beforeinstallprompt', { cancelable: true });
      let calls = 0;
      event.prompt = async () => { calls++; if (fails) throw new Error('Unavailable'); };
      event.userChoice = Promise.resolve({ outcome });
      await act(() => window.dispatchEvent(event));
      return { event, get calls() { return calls; } };
    },
    async close() {
      await act(() => root.unmount());
      // Effect cleanup must stop interception.
      const event = new window.Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => {};
      window.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false);
      dom.window.close();
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    }
  };
}

test('captures install event early, consumes it once, handles dismissal and confirms only real installation signals', async () => {
  const app = await setup();
  try {
    assert.equal(document.activeElement.tagName, 'BODY', 'a closed dialog must not steal focus on mount');
    assert.equal(await app.install.requestInstall(), 'instructions');
    const prompt = await app.event();
    assert.equal(prompt.event.defaultPrevented, true);
    assert.equal(prompt.calls, 0, 'capture must not display a prompt automatically');
    await act(async () => {
      await Promise.all([app.install.requestInstall(), app.install.requestInstall()]);
    });
    assert.equal(prompt.calls, 1);
    assert.match(app.install.message, /cancelada/);
    assert.equal(app.install.installed, false);
    assert.equal(await app.install.requestInstall(), 'instructions');
    await app.event('accepted');
    await act(() => app.install.requestInstall());
    assert.equal(app.install.installed, false, 'acceptance alone is not proof of completed installation');
    await act(() => window.dispatchEvent(new window.Event('appinstalled')));
    assert.equal(app.install.installed, true);
    assert.equal(await app.install.requestInstall(), 'handled');
  } finally { await app.close(); }
});

test('failed prompt falls back to instructions and display mode updates installed state', async () => {
  const app = await setup();
  try {
    await app.event('accepted', true);
    let result;
    await act(async () => { result = await app.install.requestInstall(); });
    assert.equal(result, 'instructions');
    assert.equal(app.install.busy, false);
    await act(() => { app.media.matches = true; app.media.dispatchEvent(new window.Event('change')); });
    assert.equal(app.install.installed, true);
  } finally { await app.close(); }
  for (const options of [{ standalone: true }, { iosStandalone: true }]) {
    const installed = await setup(options);
    try { assert.equal(installed.install.installed, true); }
    finally { await installed.close(); }
  }
});

test('iOS instructions include Safari steps, accessible focus and return focus after closing', async () => {
  const app = await setup({ userAgent: iphone.replace('Version/18.0', 'CriOS/130') });
  try {
    const prompt = await app.event();
    assert.equal(await app.install.requestInstall(), 'instructions');
    assert.equal(prompt.calls, 0);
    document.getElementById('install-app').focus();
    await app.open();
    assert.equal(document.activeElement.id, 'install-title');
    assert.equal(document.querySelector('dialog').getAttribute('aria-modal'), 'true');
    assert.equal(document.querySelectorAll('ol li').length, 5);
    assert.match(document.querySelector('dialog').textContent, /copia la dirección/);
    assert.match(document.querySelector('dialog').textContent, /Abrir como app/);
    await act(async () => {
      document.querySelector('dialog').dispatchEvent(new window.Event('cancel', { cancelable: true }));
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 10)));
    assert.equal(document.querySelector('dialog').open, false);
    assert.equal(document.activeElement.id, 'install-app');
    assert.equal(document.documentElement.style.overflow, '');
  } finally { await app.close(); }
});
