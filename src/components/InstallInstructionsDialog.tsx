import { useEffect, useLayoutEffect, useRef } from 'react';
import { Check, CheckCircle2, Compass, Download, Ellipsis, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import type { PwaInstall } from '../hooks/usePwaInstall';

interface Props {
  open: boolean;
  onClose: () => void;
  installation: PwaInstall;
}

export function InstallInstructionsDialog({ open, onClose, installation }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef<string | null>(null);
  const dismissing = useRef(false);
  const { platform, installed } = installation;

  const restore = () => {
    if (previousOverflow.current === null && previousFocus.current === null) return;
    if (previousOverflow.current !== null) {
      document.documentElement.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
    const target = previousFocus.current?.isConnected ? previousFocus.current : document.getElementById('install-app');
    target?.focus({ preventScroll: true });
    previousFocus.current = null;
  };

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    if (open) {
      dismissing.current = false;
      delete dialog.dataset.closing;
      if (!dialog.open) {
        previousFocus.current = document.activeElement === document.body
          ? document.getElementById('install-app') : document.activeElement as HTMLElement;
        previousOverflow.current = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        dialog.showModal(); // Native focus containment and inert background.
        titleRef.current?.focus({ preventScroll: true });
      }
    } else if (dialog.open) {
      dialog.dataset.closing = 'true';
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
      const timer = setTimeout(() => { dialog.close(); restore(); }, duration);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => { dialog?.close(); restore(); };
  }, []);

  const dismiss = () => {
    if (!open || dismissing.current) return;
    dismissing.current = true;
    onClose();
  };
  const steps = platform.ios ? [
    { Icon: Compass, text: 'Abre esta página en Safari.' },
    { Icon: Share, text: 'Pulsa el botón Compartir (cuadrado con flecha hacia arriba). Según la versión de Safari, puede encontrarse directamente en la barra o dentro del menú de la página.' },
    { Icon: PlusSquare, text: 'Selecciona «Añadir a pantalla de inicio».' },
    { Icon: Smartphone, text: 'Si aparece la opción «Abrir como app», mantenla activada.' },
    { Icon: Check, text: 'Pulsa «Añadir».' }
  ] : [
    { Icon: Ellipsis, text: platform.android ? 'Abre el menú ⋮ del navegador.' : 'Abre el menú del navegador o busca el icono de instalación en la barra de direcciones.' },
    { Icon: Download, text: 'Selecciona «Instalar aplicación» o «Añadir a pantalla de inicio», según tu navegador.' },
    { Icon: Check, text: 'Confirma con «Instalar» o «Añadir» y sigue las indicaciones del navegador.' }
  ];

  return (
    <dialog ref={dialogRef} className="install-surface install-dialog" aria-modal="true"
      aria-labelledby="install-title" aria-describedby="install-description"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}>
      <div className="flex items-start justify-between gap-3">
        <div className="install-icon w-12 h-12 rounded-[14px] flex items-center justify-center">
          {installed ? <CheckCircle2 className="w-6 h-6" aria-hidden="true" /> : <Download className="w-6 h-6" aria-hidden="true" />}
        </div>
        <button type="button" onClick={dismiss} aria-label="Cerrar instrucciones" className="install-close w-11 h-11 inline-flex items-center justify-center rounded-full">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <h2 id="install-title" ref={titleRef} tabIndex={-1} className="text-[22px] font-extrabold leading-tight mt-4 outline-none">
        {installed ? 'Aplicación instalada' : 'Instala FSY Agenda'}
      </h2>
      <p id="install-description" className="install-muted text-[14px] leading-[21px] mt-2">
        {installed ? 'FSY Agenda ya está disponible como aplicación.' : 'Lleva la agenda del FSY a tu pantalla de inicio para acceder fácilmente cuando la necesites.'}
      </p>
      {!installed && <>
        {platform.ios && !platform.safari && (
          <p className="install-icon rounded-[12px] p-3 text-[13px] font-semibold mt-4">
            Para seguir estos pasos, copia la dirección de esta página y ábrela en Safari.
          </p>
        )}
        <ol className="space-y-3 mt-5">
          {steps.map(({ Icon, text }, index) => (
            <li key={text} className="flex gap-3 text-[13px] leading-[20px]">
              <span className="install-icon rounded-[10px] w-8 h-8 flex-shrink-0 inline-flex items-center justify-center"><Icon className="w-4 h-4" aria-hidden="true" /></span>
              <span className="pt-1"><strong>{index + 1}.</strong> {text}</span>
            </li>
          ))}
        </ol>
        {!platform.ios && <p className="install-muted text-[12px] leading-[18px] mt-4">Si no aparece esa opción, abre esta página en Chrome o Edge actualizado, fuera del navegador interno de otras aplicaciones. Si ya la instalaste, busca FSY Agenda entre tus aplicaciones.</p>}
        <p className="text-[13px] font-semibold mt-5">¡Listo! FSY Agenda aparecerá entre tus aplicaciones.</p>
      </>}
      <button type="button" onClick={dismiss} className="install-confirm w-full mt-5 min-h-11 py-2.5 px-4 rounded-[12px] text-[14px] font-bold">Entendido</button>
    </dialog>
  );
}
