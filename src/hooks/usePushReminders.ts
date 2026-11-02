import { useCallback, useEffect, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';

const apiBase = (import.meta.env.VITE_PUSH_API_URL || '').replace(/\/$/, '');

export function pushSupport(): string | null {
  if (!window.isSecureContext) return 'Las notificaciones requieren HTTPS.';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !window.matchMedia('(display-mode: standalone)').matches && !(navigator as Navigator & { standalone?: boolean }).standalone) return 'En iPhone/iPad, añade la PWA a la pantalla de inicio y ábrela desde su icono (iOS 16.4 o posterior).';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'Este navegador no admite notificaciones en segundo plano.';
  if (!apiBase) return 'Recordatorios pendientes de configurar en Cloudflare.';
  return null;
}

function deviceToken() {
  let token = localStorage.getItem('fsy_push_token');
  if (!token) {
    token = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('fsy_push_token', token);
  }
  return token;
}

async function api(path: string, method = 'GET', body?: unknown) {
  if (!navigator.onLine) throw new Error('Sin conexión: cambio guardado en este dispositivo, pendiente de sincronizar.');
  const response = await fetch(`${apiBase}/api/push/${path}`, {
    method, headers: { Authorization: `Bearer ${deviceToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo sincronizar con Cloudflare.');
  return data;
}

async function registration() {
  const ready = await navigator.serviceWorker.getRegistration();
  if (ready?.active) return ready;
  // Do not leave the settings stuck when running Vite without a production SW.
  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Service Worker no disponible. Recarga la PWA publicada.')), 10000);
    navigator.serviceWorker.ready.then(value => { clearTimeout(timer); resolve(value); }, reject);
  });
}

export function usePushReminders() {
  const { notificationsEnabled, advanceMinutes, setNotificationsEnabled } = usePreferences();
  const [status, setStatus] = useState('Comprobando notificaciones…');
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [revision, refresh] = useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const desired = useRef({ enabled: notificationsEnabled, advance: advanceMinutes });
  useEffect(() => { desired.current = { enabled: notificationsEnabled, advance: advanceMinutes }; }, [notificationsEnabled, advanceMinutes]);
  const serial = useCallback((work: () => Promise<void>) => {
    queue.current = queue.current.catch(() => {}).then(work);
    return queue.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void serial(async () => {
      if (cancelled) return;
      setActive(false);
      const support = pushSupport();
      if (support) { setStatus(support); return; }
      setPermission(Notification.permission);
      setBusy(true);
      try {
        const reg = await registration();
        const sub = await reg.pushManager.getSubscription();
        if (!notificationsEnabled || Notification.permission !== 'granted') {
          // Unsubscribe locally even offline, then synchronize server cancellation.
          if (sub) await sub.unsubscribe();
          if (localStorage.getItem('fsy_push_token')) await api('subscription', 'DELETE');
          if (!cancelled) setStatus(notificationsEnabled ? 'Permiso pendiente o bloqueado. Pulsa activar para continuar.' : 'Recordatorios desactivados.');
          return;
        }
        if (!sub) { if (!cancelled) setStatus('La suscripción necesita renovarse. Pulsa activar.'); return; }
        await api('subscription', 'PUT', { subscription: sub.toJSON(), advance: advanceMinutes });
        if (!cancelled) { setActive(true); setStatus(`Recordatorios activos: ${advanceMinutes} min antes, incluso con la PWA cerrada.`); }
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : 'No se pudo sincronizar. Vuelve a intentar.');
      } finally { if (!cancelled) setBusy(false); }
    });
    return () => { cancelled = true; };
  }, [notificationsEnabled, advanceMinutes, revision, serial]);

  useEffect(() => {
    const resume = () => { if (document.visibilityState === 'visible') refresh(n => n + 1); };
    const reconnect = () => refresh(n => n + 1);
    const received = (event: MessageEvent) => {
      if (event.data?.type === 'FSY_PUSH_RECEIVED' && event.data.test) setStatus('Prueba recibida y mostrada por el Service Worker.');
    };
    window.addEventListener('online', reconnect);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    navigator.serviceWorker?.addEventListener('message', received);
    const storage = (event: StorageEvent) => {
      // Reload persisted preferences when another tab changes this device's settings.
      if (['fsy_notifications_enabled', 'fsy_advance_minutes'].includes(event.key || '')) window.location.reload();
    };
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener('online', reconnect); window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
      navigator.serviceWorker?.removeEventListener('message', received);
      window.removeEventListener('storage', storage);
    };
  }, []);

  const enable = async () => {
    const support = pushSupport();
    if (support) { setStatus(support); return; }
    setBusy(true);
    try {
      // Must be called directly from the user's click, before any network await.
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') throw new Error('Permiso no concedido. Puedes cambiarlo en los ajustes del navegador o dispositivo.');
      await serial(async () => {
        const { publicKey } = await api('config');
        const reg = await registration();
        const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        let sub = await reg.pushManager.getSubscription();
        // Recreate on explicit activation to recover expired subscriptions or VAPID rotation.
        if (sub) await sub.unsubscribe();
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
        await api('subscription', 'PUT', { subscription: sub.toJSON(), advance: desired.current.advance });
        setNotificationsEnabled(true);
        refresh(n => n + 1);
      });
    } catch (error) { setActive(false); setStatus(error instanceof Error ? error.message : 'No se pudo activar.'); }
    finally { setBusy(false); }
  };

  const test = async (delayed = false) => {
    setBusy(true);
    setStatus('Enviando prueba Web Push; esperando recepción…');
    try {
      await api(delayed ? 'test-delayed' : 'test', 'POST');
      if (delayed) setStatus('Prueba programada. Puedes cerrar la PWA; llegará en 1–2 minutos si el Cron está activo.');
      /* Acceptance is not proof of device receipt. */
    }
    catch (error) { setStatus(error instanceof Error ? error.message : 'No se pudo enviar la prueba.'); }
    finally { setBusy(false); }
  };

  return { status, active, busy, permission, enable, test, retry: () => refresh(n => n + 1), disable: () => { setActive(false); setNotificationsEnabled(false); refresh(n => n + 1); } };
}

export type PushReminders = ReturnType<typeof usePushReminders>;
