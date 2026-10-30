import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
after(() => server.close());

const { PreferencesProvider, usePreferences, useTheme } = await server.ssrLoadModule('/src/context/PreferencesContext.tsx');
const { getCategoryStyle } = await server.ssrLoadModule('/src/utils/iconUtils.ts');

class FakeMediaQueryList extends EventTarget {
  constructor(query, matches = false) {
    super();
    this.media = query;
    this._matches = matches;
  }
  get matches() {
    return this._matches;
  }
  setMatches(value) {
    this._matches = value;
    const event = new Event('change');
    Object.defineProperty(event, 'matches', { value });
    this.dispatchEvent(event);
  }
  addListener(fn) {
    this.addEventListener('change', fn);
  }
  removeListener(fn) {
    this.removeEventListener('change', fn);
  }
}

function setupDOM(initialStorage = {}, systemPrefersDark = false) {
  const dom = new JSDOM('<!doctype html><html lang="es"><head><meta name="theme-color" content="#0284C7" /></head><body><div id="root"></div></body></html>', {
    url: 'https://fsy.test/'
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // Mock matchMedia
  const mql = new FakeMediaQueryList('(prefers-color-scheme: dark)', systemPrefersDark);
  window.matchMedia = (query) => {
    if (query === '(prefers-color-scheme: dark)') return mql;
    return new FakeMediaQueryList(query, false);
  };

  // Seed localStorage
  window.localStorage.clear();
  for (const [key, val] of Object.entries(initialStorage)) {
    window.localStorage.setItem(key, val);
  }

  let prefContext;
  let themeContext;

  function Probe() {
    const p = usePreferences();
    const t = useTheme();
    React.useLayoutEffect(() => {
      prefContext = p;
      themeContext = t;
    });
    return React.createElement('div', { id: 'test-probe' }, t.resolvedTheme);
  }

  let root = createRoot(document.getElementById('root'));

  const mount = () => act(() => {
    root.render(
      React.createElement(
        PreferencesProvider,
        null,
        React.createElement(Probe)
      )
    );
  });

  return {
    mql,
    get prefs() { return prefContext; },
    get theme() { return themeContext; },
    mount,
    async changeTheme(newTheme) {
      await act(async () => {
        themeContext.setTheme(newTheme);
      });
    },
    async setSystemDark(dark) {
      await act(async () => {
        mql.setMatches(dark);
      });
    },
    async reload() {
      await act(() => root.unmount());
      root = createRoot(document.getElementById('root'));
      await mount();
    },
    async cleanup() {
      await act(() => root.unmount());
      dom.window.close();
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.localStorage;
      delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    }
  };
}

test('Theme system: defaults to auto and follows system preference', async () => {
  const env = setupDOM({}, false);
  await env.mount();

  try {
    assert.equal(env.theme.theme, 'auto');
    assert.equal(env.theme.resolvedTheme, 'light');
    assert.equal(env.theme.isDark, false);
    assert.equal(document.documentElement.classList.contains('dark'), false);
    assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(document.querySelector('meta[name="theme-color"]').getAttribute('content'), '#0284C7');

    // Switch system to dark
    await env.setSystemDark(true);
    assert.equal(env.theme.theme, 'auto');
    assert.equal(env.theme.resolvedTheme, 'dark');
    assert.equal(env.theme.isDark, true);
    assert.equal(document.documentElement.classList.contains('dark'), true);
    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(document.querySelector('meta[name="theme-color"]').getAttribute('content'), '#0B1220');
  } finally {
    await env.cleanup();
  }
});

test('Theme system: switches from auto to dark and light immediately and persists in localStorage', async () => {
  const env = setupDOM({}, false);
  await env.mount();

  try {
    // 1. Switch to dark
    await env.changeTheme('dark');
    assert.equal(env.theme.theme, 'dark');
    assert.equal(env.theme.resolvedTheme, 'dark');
    assert.equal(env.theme.isDark, true);
    assert.equal(document.documentElement.classList.contains('dark'), true);
    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(document.querySelector('meta[name="theme-color"]').getAttribute('content'), '#0B1220');
    assert.equal(window.localStorage.getItem('fsy_theme'), 'dark');

    // System change should NOT override explicit dark setting
    await env.setSystemDark(false);
    assert.equal(env.theme.theme, 'dark');
    assert.equal(env.theme.resolvedTheme, 'dark');
    assert.equal(document.documentElement.classList.contains('dark'), true);

    // 2. Switch to light
    await env.changeTheme('light');
    assert.equal(env.theme.theme, 'light');
    assert.equal(env.theme.resolvedTheme, 'light');
    assert.equal(env.theme.isDark, false);
    assert.equal(document.documentElement.classList.contains('dark'), false);
    assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(document.querySelector('meta[name="theme-color"]').getAttribute('content'), '#0284C7');
    assert.equal(window.localStorage.getItem('fsy_theme'), 'light');

    // 3. Switch back to auto
    await env.changeTheme('auto');
    assert.equal(env.theme.theme, 'auto');
    assert.equal(window.localStorage.getItem('fsy_theme'), 'auto');
  } finally {
    await env.cleanup();
  }
});

test('Theme system: restores user preference across reloads and sessions', async () => {
  const env = setupDOM({ fsy_theme: 'dark' }, false);
  await env.mount();

  try {
    assert.equal(env.theme.theme, 'dark');
    assert.equal(env.theme.resolvedTheme, 'dark');
    assert.equal(document.documentElement.classList.contains('dark'), true);

    // Simulate reloading the application
    await env.reload();
    assert.equal(env.theme.theme, 'dark');
    assert.equal(env.theme.resolvedTheme, 'dark');
    assert.equal(document.documentElement.classList.contains('dark'), true);
  } finally {
    await env.cleanup();
  }
});

test('Category styles provide accessible dark and light palettes', () => {
  const categories = [
    { cat: 'Traslado', title: 'Traslado a cancha' },
    { cat: 'Devocional', title: 'Devocional matutino' },
    { cat: 'Descanso', title: 'Almuerzo' },
    { cat: 'Cierre', title: 'Despedida final' },
    { cat: 'Recreación', title: 'Actividades deportivas' },
    { cat: 'Porras', title: 'Porras y estandartes' },
    { cat: 'Recreación', title: 'Fiesta FSY' },
    { cat: 'Foto', title: 'Foto oficial' },
    { cat: 'Compañía', title: 'Actividad de compañía' },
    { cat: 'Evangelio', title: 'Estudio del evangelio' }
  ];

  for (const item of categories) {
    const style = getCategoryStyle(item.cat, item.title);
    assert.ok(style.tint, `tint missing for ${item.title}`);
    assert.ok(style.background, `background missing for ${item.title}`);
    assert.ok(style.darkTint, `darkTint missing for ${item.title}`);
    assert.ok(style.darkBackground, `darkBackground missing for ${item.title}`);
    assert.notEqual(style.background, style.darkBackground, `darkBackground should be different from light for ${item.title}`);
  }
});
