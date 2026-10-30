import { useEffect, useRef, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
type InstallNavigator = Navigator & { standalone?: boolean; userAgentData?: { platform?: string } };

export function getInstallPlatform(nav: Pick<InstallNavigator, 'userAgent' | 'platform' | 'maxTouchPoints' | 'userAgentData'>) {
  const ios = /iPad|iPhone|iPod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  const safari = ios && /Version\/.*Safari/i.test(nav.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(nav.userAgent);
  return { ios, safari, android: /Android/i.test(nav.userAgentData?.platform ?? nav.userAgent) };
}
function inStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as InstallNavigator).standalone === true;
}

// Mounted once in App, independently of the active tab.
export function usePwaInstall() {
  const [installed, setInstalled] = useState(inStandaloneMode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const deferred = useRef<InstallPromptEvent | null>(null);
  const prompting = useRef(false);
  const confirmed = useRef(false);
  const mounted = useRef(false);
  const platform = getInstallPlatform(navigator);

  useEffect(() => {
    mounted.current = true;
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(confirmed.current || inStandaloneMode());
    const capture = (event: Event) => {
      const candidate = event as InstallPromptEvent;
      if (typeof candidate.prompt !== 'function') return;
      event.preventDefault();
      if (!confirmed.current && !inStandaloneMode()) deferred.current = candidate;
    };
    const onInstalled = () => {
      confirmed.current = true;
      deferred.current = null;
      setMessage('');
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('pageshow', sync);
    if (displayMode.addEventListener) displayMode.addEventListener('change', sync);
    else displayMode.addListener(sync);
    return () => {
      mounted.current = false;
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pageshow', sync);
      if (displayMode.removeEventListener) displayMode.removeEventListener('change', sync);
      else displayMode.removeListener(sync);
    };
  }, []);

  const requestInstall = async (): Promise<'instructions' | 'handled'> => {
    if (installed || inStandaloneMode() || prompting.current) return 'handled';
    const event = deferred.current;
    if (platform.ios || !event) return 'instructions';
    deferred.current = null; // Each event can be prompted only once, even after dismissal.
    prompting.current = true;
    setBusy(true);
    setMessage('');
    try {
      await event.prompt(); // Called immediately inside the user's click handler.
      const choice = await event.userChoice;
      if (mounted.current && !confirmed.current) setMessage(choice.outcome === 'dismissed'
        ? 'Instalación cancelada. Puedes volver a intentarlo cuando quieras.'
        : 'Solicitud aceptada. El navegador completará la instalación.');
      return 'handled';
    } catch {
      return 'instructions';
    } finally {
      prompting.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return { installed, busy, message, platform, requestInstall };
}
export type PwaInstall = ReturnType<typeof usePwaInstall>;
