# Recordatorios Web Push

## Diagnóstico y arquitectura

Antes, `useClockTicker` ejecutaba `new Notification` únicamente con React abierto,
solo para la siguiente actividad. No había suscripción Push, servidor, handler
`push` ni confirmación de permisos; el interruptor se iniciaba activado. El conjunto
de avisos enviados vivía en memoria y se perdía al recargar. Tampoco se restringían
los avisos a la fecha del evento.

Ahora se conserva el Service Worker de Workbox y su caché offline. Importa
`public/push-sw.js`, que muestra los mensajes con `showNotification`, descarta
actividades iniciadas y abre `/#detail-ID` al pulsar. No hay temporizadores de
notificaciones en la página.

`usePushReminders` sincroniza la preferencia persistida con el Worker. El permiso
solo se solicita mediante el botón o interruptor. Activar crea una suscripción
con VAPID; cada instalación tiene una credencial aleatoria de 256 bits, cuyo hash
identifica el registro D1. Las claves privadas nunca se incluyen en Vite. No hay
cuentas ni sincronización entre dispositivos distintos. Las pestañas del mismo
origen comparten preferencia y suscripción.

El Cron consulta la agenda oficial publicada y la configuración actual de cada
dispositivo cada minuto. La fecha es la de `src/data/agenda.json` (actualmente
2026-11-07), con UTC-06:00 correspondiente a America/Managua, no la fecha simulada.
Cada actividad, incluidas las simultáneas, se evalúa por separado. El cálculo es
`inicio - minutos configurados`; los valores admitidos son 1, 5, 10, 15 y 20.

Un cambio de minutos sustituye la configuración del servidor y una desactivación
cancela los envíos posteriores y la prueba pendiente. No se reconstruye una cola
obsoleta: el Cron calcula lo pendiente desde los datos actuales. Se permite recuperar
retrasos menores a dos minutos, nunca después del inicio ni para horarios de aviso
anteriores a la activación/cambio de preferencia. Cambiar a una anticipación cuyo
instante ya pasó no produce un aviso inmediato tardío.

`npm run build` publica automáticamente la fuente de la agenda como
`public/data/agenda.json`. Edita únicamente `src/data/agenda.json` y vuelve a
desplegar Pages para cambiar horarios. El Cron recoge los cambios sin que la PWA
esté abierta; la agenda local se actualiza al cargar la nueva versión. Las reglas
de caché personalizadas de Cloudflare deben respetar el `no-store` de esta ruta.

## Configurar Cloudflare

Requisitos: Node 22 o posterior, cuenta Cloudflare y Pages publicado con HTTPS.
Los comandos se ejecutan en la raíz del repositorio. No se ha desplegado este
Worker ni se han creado recursos en tu cuenta desde esta implementación.

1. Instala dependencias y autentícate:

   ```powershell
   npm ci
   npx wrangler login
   npx wrangler d1 create fsy-agenda-push
   ```

2. En `worker/wrangler.jsonc`, reemplaza `database_id` con el ID obtenido,
   `APP_ORIGIN` con el origen exacto de la PWA (sin barra final, por ejemplo
   `https://tu-agenda.pages.dev`) y `VAPID_SUBJECT` con un correo real `mailto:...`.
   El Cron `* * * * *` ya está incluido. No uses un origen de preview cambiante.

3. Aplica el esquema de D1:

   ```powershell
   npx wrangler d1 migrations apply fsy-agenda-push --remote --config worker/wrangler.jsonc
   ```

4. Genera un único par de claves y consérvalo de forma segura:

   ```powershell
   npm run push:keys
   npx wrangler secret put VAPID_PUBLIC_KEY --config worker/wrangler.jsonc
   npx wrangler secret put VAPID_PRIVATE_KEY --config worker/wrangler.jsonc
   ```

   Pega cada valor cuando Wrangler lo solicite. La clave pública se entrega al
   navegador mediante `/api/push/config`; la privada solo reside como secret.
   No regeneres las claves en cada despliegue. Si las rotas, cada dispositivo
   tendrá que pulsar «Activar / renovar» para crear una suscripción nueva.

5. Despliega el Worker:

   ```powershell
   npm run push:deploy
   ```

6. En Pages → Settings → Variables and Secrets configura para el build de
   producción `VITE_PUSH_API_URL=https://fsy-agenda-push.TU-SUBDOMINIO.workers.dev`.
   Usa la URL real que devuelve Wrangler, sin barra final. Vuelve a desplegar
   Pages con `npm run build` y directorio de salida `dist`. `.env.example` sirve
   como guía local; nunca añadas claves privadas a variables `VITE_*`.

7. Revisa en Workers → Triggers que el Cron esté activo. Los cambios de Cron
   pueden tardar varios minutos en propagarse. Usa `npx wrangler tail --config
   worker/wrangler.jsonc` para inspeccionar fallos. Si utilizas Cloudflare Access,
   permite acceso público a la agenda JSON y a la API Push (la API ya valida origen
   y credencial del dispositivo). Aplica límites de solicitudes en Cloudflare
   para un sitio público; no expongas una API administrativa ni D1 al cliente.

No hay servicio de pago externo. Workers y D1 están sujetos a las cuotas del plan
Cloudflare: comprueba número de dispositivos, operaciones D1 y subrequests por
ejecución antes del evento. El procesamiento pagina de 50 en 50; eventos que
superen las cuotas de una sola ejecución requerirán particionar el trabajo o
ajustar el plan. No se ha realizado una prueba de carga con usuarios reales.

## Validación en producción (pendiente)

1. Android o escritorio compatible: abre Configuración, activa y concede permiso.
   Verifica «activos» y prueba inmediata. El éxito HTTP solo significa aceptación
   por el proveedor; la UI confirma recepción cuando el Service Worker responde.
2. Pulsa «Probar con la PWA cerrada (1 min)», cierra la PWA y espera 1–2 minutos.
   Repite dejándola en segundo plano. Abre la notificación y comprueba navegación.
   Las pruebas tienen un intervalo mínimo de 30 segundos y TTL de 60 segundos.
3. iPhone/iPad con iOS 16.4 o posterior: añade la PWA a Inicio, ábrela desde su
   icono y repite ambas pruebas. Si faltan APIs o instalación, la UI lo informa.
4. En un despliegue de ensayo, cambia actividades de la agenda a unos minutos
   en el futuro y prueba 1, 5, 10 y 15 minutos, incluyendo dos inicios simultáneos.
   La simulación de pantalla no altera ni adelanta los envíos reales.
5. Cambia minutos antes del instante de aviso y verifica el nuevo horario.
   Desactiva antes del aviso: no deben salir más envíos. Reactiva y comprueba
   futuras actividades. Las ya enviadas no se vuelven a enviar por cambiar minutos.
6. Deniega/revoca permisos: no debe mostrarse estado activo. Desconecta internet,
   cambia/desactiva y verifica el estado pendiente; al reconectar se sincroniza.
   No debe aparecer una notificación de actividad después de su inicio.
7. Cambia un horario y despliega Pages manteniendo la PWA cerrada: el Cron debe
   usar el nuevo horario. Verifica también que el mismo aviso no se repite al
   recargar, abrir otra pestaña o ejecutarse dos Crons.

No se garantiza entrega exacta al segundo. Cron tiene resolución de un minuto,
y red, ahorro de batería, concentración, navegador detenido por el usuario y
sistema operativo pueden retrasar o impedir la entrega. En iOS el permiso debe
solicitarse desde una interacción en la PWA instalada.

Un dispositivo sin internet no puede cambiar inmediatamente el servidor. La
desactivación intenta cancelar también la suscripción local; la UI informa si
la sincronización quedó pendiente. Un Push que ya salió hacia el proveedor no
puede retirarse. Una modificación exactamente concurrente con el envío también
tiene esa limitación.

## Duplicados, errores y evidencias

D1 reclama atómicamente cada `(dispositivo, fecha, actividad, inicio)`, comprueba
la revisión de preferencias antes de enviar y guarda `accepted`, `rejected:N` o
`unknown`. El tag estable evita notificaciones visibles simultáneas del mismo
aviso. Un 404/410 desactiva la suscripción; 429/5xx explícitos permiten reintento
en el siguiente minuto dentro de la ventana. Si la conexión se corta después
del envío, el resultado es ambiguo: no se reintenta automáticamente, para evitar
duplicados. Un fallo entre la reclamación y el envío puede perder ese aviso.
Web Push no permite garantizar simultáneamente entrega y exactamente una vez.

Validación automatizada: `npm test`, `npm run build`, `npm run lint` y
`npx wrangler deploy --config worker/wrangler.jsonc --dry-run`.
Las pruebas ejecutan la API y SQL real en SQLite, Crons superpuestos, tiempos,
cancelación, reactivación, cambios de agenda, suscripciones caducadas, prueba
programada, permisos, desconexión y reconexión. Un test cifra el mensaje con la
biblioteca real, lo descifra como receptor RFC 8291 y ejecuta el handler del
Service Worker sin ventanas abiertas, verificando notificación y enlace.
Esto no reemplaza recepción en un dispositivo físico ni una ejecución real
del Cron en Cloudflare; ambas quedan pendientes de configurar y desplegar.

Referencias oficiales:

- [Cron Triggers de Cloudflare](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Web Push en iOS/iPadOS](https://webkit.org/blog/13878/)
- [Biblioteca Web Push y Web Crypto](https://github.com/block65/webcrypto-web-push)

## Archivos de la implementación

- Frontend: `src/hooks/usePushReminders.ts`, `src/App.tsx`,
  `src/pages/SettingsPage.tsx`, `src/context/PreferencesContext.tsx` y
  `src/hooks/useClockTicker.ts`.
- Service Worker y publicación: `public/push-sw.js`, `public/_headers`,
  `vite.config.ts`, `.env.example`.
- Servidor: `worker/index.mjs`, `worker/schedule.mjs`,
  `worker/migrations/0001_push.sql`, `worker/wrangler.jsonc`.
- Agenda y claves: `src/db/seed.ts`, `scripts/sync-agenda.mjs`,
  `scripts/generate-vapid.mjs`.
- Pruebas: `tests/push.test.mjs`, `tests/push-client.test.mjs`.
- Dependencias y documentación: `package.json`, `package-lock.json`, `.gitignore`,
  `README.md`, `docs/recordatorios.md`.

El directorio `dist` se genera con el build de producción; no despliegues una
copia antigua del repositorio sin ejecutar `npm run build` con la URL del Worker.
