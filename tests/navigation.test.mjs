import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
after(() => server.close());
const { useNavigation } = await server.ssrLoadModule('/src/hooks/useNavigation.ts');

async function setup(hash = '') {
  const dom = new JSDOM('<div id="root"></div>', { url: `https://fsy.test/${hash}` });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = ({ top }) => { window.scrollY = top; };
  let navigation;
  function Probe() {
    const value = useNavigation(true);
    React.useLayoutEffect(() => { navigation = value; });
    return React.createElement('div', null, value.entry.tab);
  }
  let root = createRoot(document.getElementById('root'));
  const mount = () => act(() => root.render(React.createElement(React.StrictMode, null, React.createElement(Probe))));
  await mount();
  const travel = async (direction) => {
    await act(async () => {
      const popped = new Promise(resolve => window.addEventListener('popstate', resolve, { once: true }));
      window.history[direction]();
      await popped;
    });
  };
  return {
    get nav() { return navigation; },
    travel,
    async reload() {
      window.dispatchEvent(new window.Event('pagehide'));
      await act(() => root.unmount());
      root = createRoot(document.getElementById('root'));
      await mount();
    },
    async close() {
      await act(() => root.unmount());
      dom.window.close();
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    }
  };
}

test('native history traverses tabs and details, skips duplicates and restores each visit', async () => {
  const app = await setup();
  try {
    const initialLength = window.history.length;
    assert.equal(initialLength, 1, 'mount and StrictMode do not add artificial history');
    await act(() => app.nav.navigateTab('agenda'));
    await act(() => app.nav.navigateTab('agenda'));
    assert.equal(window.history.length, initialLength + 1);
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'home');
    await act(() => app.nav.navigateTab('settings'));
    window.scrollY = 200;
    await act(() => app.nav.openInstallInstructions());
    assert.equal(app.nav.entry.overlay, 'install');
    assert.equal(window.scrollY, 200);
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'settings');
    assert.equal(app.nav.entry.overlay, undefined);
    assert.equal(window.scrollY, 200);
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'home');
    await act(() => app.nav.navigateTab('agenda'));
    await act(() => app.nav.setAgendaView({ searchQuery: 'traslado', selectedFilter: 'TRANSFERS' }));
    window.scrollY = 780;
    await act(() => app.nav.openDetail(2));
    assert.equal(window.location.hash, '#detail-2');
    assert.equal(window.scrollY, 0);
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'agenda');
    assert.equal(app.nav.entry.activityId, null);
    assert.equal(app.nav.entry.agenda.searchQuery, 'traslado');
    assert.equal(app.nav.entry.agenda.selectedFilter, 'TRANSFERS');
    assert.equal(window.scrollY, 780);
    await app.travel('forward');
    assert.equal(app.nav.entry.activityId, 2);
    await app.reload();
    assert.equal(app.nav.entry.activityId, 2);
    await app.travel('back');
    assert.equal(window.scrollY, 780);
    assert.equal(app.nav.entry.agenda.searchQuery, 'traslado');
    await act(() => app.nav.navigateTab('settings'));
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'agenda');
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'home');
    assert.equal(app.nav.entry.index, 0);

    // Returning to Home through the navbar does not discard internal history.
    await act(() => app.nav.navigateTab('agenda'));
    await act(() => app.nav.navigateTab('home'));
    await app.travel('back');
    assert.equal(app.nav.entry.tab, 'agenda');
  } finally { await app.close(); }
});

test('direct detail and profile links have safe visible Back fallbacks without fake entries', async () => {
  const app = await setup('#detail-25');
  try {
    assert.equal(app.nav.entry.activityId, 25);
    assert.equal(app.nav.entry.index, 0);
    await act(() => app.nav.back());
    assert.equal(window.location.hash, '#agenda');
    assert.equal(window.history.length, 1);
    await act(() => app.nav.back());
    assert.equal(window.location.hash, '#inicio');
    assert.equal(window.history.length, 1);
  } finally { await app.close(); }
  const profile = await setup('#perfil');
  try {
    assert.equal(profile.nav.entry.tab, 'settings');
    await act(() => profile.nav.back());
    assert.equal(profile.nav.entry.tab, 'home');
    assert.equal(window.history.length, 1);
  } finally { await profile.close(); }
  const instructions = await setup('#perfil/instalar');
  try {
    assert.equal(instructions.nav.entry.overlay, 'install');
    await act(() => instructions.nav.back());
    assert.equal(window.location.hash, '#perfil');
    assert.equal(window.history.length, 1);
  } finally { await instructions.close(); }
});
