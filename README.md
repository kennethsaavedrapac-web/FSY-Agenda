# FSY Agenda — Distrito Granada 2026

La agenda funciona como el día del FSY cualquier día del año. El reloj compartido
usa `new Date()` y extrae únicamente la hora de `America/Managua`; la fecha oficial
del 7 de noviembre de 2026 es informativa y no afecta estados ni cuentas regresivas.
Las actividades sin hora de finalización conservan su cierre abierto.

Cada inicio o recarga activa Hora real e ignora las preferencias antiguas de
simulación. La simulación de Ajustes es manual, permanece solo durante la sesión y
permite volver inmediatamente a Hora real. Su fecha tampoco altera los estados.
Un único temporizador actualiza al cambiar de minuto, se pausa en segundo plano y
se sincroniza al recuperar visibilidad, foco o la página. Durante la simulación,
el mismo temporizador actualiza la fecha real de la cabecera a medianoche en Nicaragua.

Validación: `npm test`, `npm run build` y `npm run lint`. Las pruebas cubren fechas
anteriores y posteriores al evento, otras zonas del dispositivo, estados y
contadores, preferencias antiguas, reanudación, simulación, recarga y medianoche.

## Navegación

Las rutas `#inicio`, `#agenda`, `#perfil` y `#detail-ID` usan el historial del
navegador. Cada cambio de pantalla agrega una entrada; pulsar de nuevo la pestaña
activa no agrega ninguna. Atrás y Adelante restauran la visita, incluidos los
filtros, búsqueda y desplazamiento de Agenda. El botón «Actual» permite saltar a
la actividad en curso sin interferir con la restauración del desplazamiento.

Los botones visibles «Volver» usan el historial interno. En un enlace directo,
reemplazan la ruta por Agenda (desde detalles) o Inicio (desde Agenda/Perfil).
El botón Atrás del sistema conserva su comportamiento normal cuando no existe
historial interno. No se crean entradas ficticias para impedir salir.

Los fragmentos no se envían al servidor: abrir o recargar estas rutas en Cloudflare
solicita la misma página `/`, sin reglas nuevas de redirección ni BrowserRouter.
El modo instalado usa la misma navegación; los gestos disponibles dependen del SO.

Pruebas automatizadas: `npm test` cubre recorridos entre pestañas, detalles,
Atrás/Adelante, recarga, enlaces directos y restauración de filtros/desplazamiento.
La comprobación física en Android y Safari/PWA instalada de iOS requiere esos
dispositivos; no queda sustituida por las pruebas automatizadas del navegador.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
