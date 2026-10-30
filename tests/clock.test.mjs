import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

// Load the actual TS/TSX modules through the application's existing compiler.
const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const { TimeUtils } = await server.ssrLoadModule('/src/utils/timeUtils.ts');
const { PreferencesProvider, usePreferences } = await server.ssrLoadModule('/src/context/PreferencesContext.tsx');
const { ClockProvider } = await server.ssrLoadModule('/src/context/ClockContext.tsx');
const { DetailPage } = await server.ssrLoadModule('/src/pages/DetailPage.tsx');
const { useClockTicker, getActivityStatus, getActivityRemainingMinutes, getActivityMinutesUntilStart } = await server.ssrLoadModule('/src/hooks/useClockTicker.ts');
const agenda = JSON.parse(await readFile(new URL('../src/data/agenda.json', import.meta.url), 'utf8'));
const activities = agenda.activities.map((activity) => ({
  ...activity,
  startMinutes: TimeUtils.parseTimeToMinutes(activity.startTime),
  endMinutes: activity.endTime === null ? null : TimeUtils.parseTimeToMinutes(activity.endTime)
}));

test('Nicaragua time and activity states are independent of the calendar date and device zone', () => {
  const originalZone = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Asia/Tokyo', 'America/Los_Angeles']) {
      process.env.TZ = zone;
      for (const day of ['2026-10-30', '2026-11-07', '2026-12-15']) {
        for (const [hour, minutes] of [['08', 480], ['14', 840], ['17', 1020]]) {
          const date = new Date(`${day}T${hour}:00:00-06:00`);
          assert.equal(TimeUtils.getAgendaMinutes(date), minutes);
          assert.equal(activities.filter((a) => getActivityStatus(a, minutes) === 'CURRENT').length, 1);
        }
      }
      assert.equal(TimeUtils.getAgendaMinutes(new Date('2026-11-08T05:59:00Z')), 1439);
      assert.equal(TimeUtils.getAgendaMinutes(new Date('2026-11-08T06:00:00Z')), 0);
    }
  } finally {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  }
  assert.equal(agenda.eventDate, '2026-11-07');
  assert.equal(getActivityStatus(activities[0], 480), 'CURRENT');
  assert.equal(getActivityStatus(activities[0], 500), 'FINISHED');
  assert.equal(getActivityStatus(activities[1], 500), 'CURRENT');
  assert.equal(getActivityMinutesUntilStart(activities[1], 480), 20);
  assert.equal(getActivityRemainingMinutes(activities[0], 480), 20);
  assert.equal(getActivityStatus(activities.at(-1), 1439), 'CURRENT');
  assert.equal(getActivityRemainingMinutes(activities.at(-1), 1439), null);
});

test('shared clock starts real, ticks, resumes, simulates manually and resets on remount', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://fsy.test' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { get: () => visibility });
  localStorage.setItem('fsy_simulation_active', 'true');
  localStorage.setItem('fsy_simulated_minutes', '518');
  let latest;
  function Probe() {
    const state = { ...usePreferences(), ...useClockTicker(activities) };
    React.useLayoutEffect(() => { latest = state; });
    return React.createElement(DetailPage, { activity: activities[0], currentMinutes: state.currentMinutes, onNavigateBack() {} });
  }
  const tree = () => React.createElement(React.StrictMode, null,
    React.createElement(PreferencesProvider, null,
      React.createElement(ClockProvider, null, React.createElement(Probe))));
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: new Date('2026-10-30T08:19:30-06:00').getTime() });
  const setTimeoutMock = globalThis.setTimeout;
  const clearTimeoutMock = globalThis.clearTimeout;
  const pendingTimers = new Set();
  globalThis.setTimeout = (callback, delay, ...args) => {
    const handle = setTimeoutMock(() => { pendingTimers.delete(handle); callback(...args); }, delay);
    pendingTimers.add(handle);
    return handle;
  };
  globalThis.clearTimeout = (handle) => { pendingTimers.delete(handle); clearTimeoutMock(handle); };
  let root = createRoot(document.getElementById('root'));
  try {
    await act(() => root.render(tree()));
    assert.equal(latest.simulationActive, false);
    assert.equal(latest.currentMinutes, 499);
    assert.equal(latest.currentActivity.id, 1);
    assert.match(document.body.textContent, /En curso/);
    assert.equal(pendingTimers.size, 1, 'StrictMode leaves exactly one clock timer');
    assert.equal(localStorage.getItem('fsy_simulation_active'), null);
    await act(() => t.mock.timers.tick(30000));
    assert.equal(latest.currentMinutes, 500);
    assert.equal(latest.currentActivity.id, 2);
    assert.equal(latest.nextActivity.id, 3);
    assert.match(document.body.textContent, /Actividad finalizada/);
    assert.equal(pendingTimers.size, 1);

    visibility = 'hidden';
    await act(() => document.dispatchEvent(new window.Event('visibilitychange')));
    assert.equal(pendingTimers.size, 0, 'clock pauses in the background');
    t.mock.timers.setTime(new Date('2026-12-15T14:00:00-06:00').getTime());
    visibility = 'visible';
    await act(() => document.dispatchEvent(new window.Event('visibilitychange')));
    assert.equal(latest.currentMinutes, 840);
    assert.equal(latest.currentActivity.startTime, '14:00');

    await act(() => { latest.setSimulationActive(true); latest.setSimulatedMinutes(518); latest.setSimulatedDate('2026-01-01'); });
    assert.equal(latest.currentMinutes, 518);
    assert.equal(latest.currentActivity.id, 3);
    assert.equal(pendingTimers.size, 0, 'manual simulation needs no clock timer');
    await act(() => t.mock.timers.tick(120000));
    assert.equal(latest.currentMinutes, 518);
    await act(() => latest.resetSimulation());
    assert.equal(latest.currentMinutes, 842);
    await act(() => latest.setSimulationActive(true));
    await act(() => root.unmount());
    root = createRoot(document.getElementById('root'));
    await act(() => root.render(tree()));
    assert.equal(latest.simulationActive, false);
    assert.equal(latest.currentMinutes, 842);

    t.mock.timers.setTime(new Date('2026-12-15T23:59:00-06:00').getTime());
    await act(() => window.dispatchEvent(new window.Event('focus')));
    assert.equal(latest.currentActivity.id, 25);
    await act(() => t.mock.timers.tick(60000));
    assert.equal(latest.currentMinutes, 0);
    assert.equal(latest.currentActivity, null);
    assert.equal(latest.nextActivity.id, 1);
    assert.equal(latest.isBeforeEvent, true);
  } finally {
    await act(() => root.unmount());
    assert.equal(pendingTimers.size, 0, 'unmount cleans up the clock');
    globalThis.setTimeout = setTimeoutMock;
    globalThis.clearTimeout = clearTimeoutMock;
    t.mock.timers.reset();
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
