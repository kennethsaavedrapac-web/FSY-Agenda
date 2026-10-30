import { useLayoutEffect, useRef, useState } from 'react';
import type { FsyTab } from '../components/layout/BottomNav';
import type { AgendaFilter } from '../models/types';

type Route = { tab: FsyTab; activityId: number | null };
export type AgendaView = { searchQuery: string; selectedFilter: AgendaFilter };
type Entry = Route & { key: string; index: number; scrollY: number; agenda: AgendaView };
const stateKey = 'fsyNavigationV1';

function parseRoute(): Route {
  const match = /^#detail-(\d+)$/.exec(window.location.hash);
  if (match) return { tab: 'agenda', activityId: Number(match[1]) };
  return { tab: window.location.hash === '#agenda' ? 'agenda' : window.location.hash === '#perfil' ? 'settings' : 'home', activityId: null };
}
function hash(route: Route) {
  return route.activityId !== null ? `#detail-${route.activityId}` : route.tab === 'settings' ? '#perfil' : route.tab === 'agenda' ? '#agenda' : '#inicio';
}
function createEntry(route: Route, index = 0): Entry {
  return { ...route, key: crypto.randomUUID(), index, scrollY: 0, agenda: { searchQuery: '', selectedFilter: 'ALL' } };
}
function readEntry(): Entry {
  const route = parseRoute();
  const saved = window.history.state?.[stateKey] as Entry | undefined;
  return saved && typeof saved.key === 'string' && Number.isInteger(saved.index) && saved.index >= 0 && saved.agenda && hash(saved) === hash(route)
    ? saved : createEntry(route);
}
function replace(entry: Entry) {
  window.history.replaceState({ ...window.history.state, [stateKey]: entry }, '', hash(entry));
}

export function useNavigation(contentReady: boolean) {
  const [entry, setEntry] = useState(readEntry);
  const current = useRef(entry);
  const visits = useRef(new Map<string, Entry>());

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    replace(current.current);
    const save = () => {
      const saved = { ...current.current, scrollY: window.scrollY };
      visits.current.set(saved.key, saved);
      return saved;
    };
    const onPop = () => {
      const incoming = readEntry();
      if (incoming.key === current.current.key) return;
      save();
      const restored = visits.current.get(incoming.key) ?? incoming;
      current.current = restored;
      replace(restored);
      setEntry(restored);
    };
    const onPageHide = () => replace(save());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useLayoutEffect(() => {
    if (contentReady) window.scrollTo({ top: entry.scrollY, behavior: 'instant' });
  }, [entry.key, entry.scrollY, contentReady]);

  const navigate = (route: Route) => {
    if (hash(route) === hash(current.current)) return;
    const saved = { ...current.current, scrollY: window.scrollY };
    visits.current.set(saved.key, saved);
    replace(saved);
    const next = createEntry(route, saved.index + 1);
    window.history.pushState({ [stateKey]: next }, '', hash(next));
    current.current = next;
    setEntry(next);
  };
  const back = () => {
    if (current.current.index > 0) window.history.back();
    else {
      // A direct link has no internal predecessor. Replace it without trapping
      // the native Back button or adding a synthetic history entry.
      const fallback = createEntry({ tab: current.current.activityId !== null ? 'agenda' : 'home', activityId: null });
      replace(fallback);
      current.current = fallback;
      setEntry(fallback);
    }
  };
  const setAgendaView = (agenda: AgendaView) => {
    const next = { ...current.current, agenda };
    current.current = next;
    replace(next);
    setEntry(next);
  };
  return { entry, back, setAgendaView, navigateTab: (tab: FsyTab) => navigate({ tab, activityId: null }), openDetail: (activityId: number) => navigate({ tab: current.current.tab, activityId }) };
}
