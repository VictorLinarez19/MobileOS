import { useKernel } from '../kernel/store'

/**
 * Barra de navegacion del sistema, siempre visible mientras hay una app en
 * primer plano.
 *
 * Los gestos de deslizar (RF-03) siguen funcionando, pero no son
 * descubribles ni fiables en todos los dispositivos y navegadores (con
 * raton, o segun el area exacta que se roce en el telefono). Estos dos
 * botones garantizan una forma de navegar siempre visible y predecible,
 * igual que la barra de gestos o los botones fisicos de un telefono real:
 *
 * - "Atras" delega primero en la navegacion interna de la app (por ejemplo
 *   subir de carpeta en Archivos); si la app no tiene nada que retroceder,
 *   sale a inicio.
 * - "Inicio" siempre sale directo al launcher.
 */
export function NavBar() {
  const goBack = useKernel((s) => s.goBack)
  const goHome = useKernel((s) => s.goHome)
  const t = useKernel((s) => s.t)

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex justify-center"
      style={{ bottom: 'calc(var(--home-h) + 8px)' }}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/70 p-1.5 shadow-lg ring-1 ring-white/15 backdrop-blur">
        <button
          onClick={goBack}
          aria-label={t('sys.back')}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-slate-100 active:bg-white/15"
        >
          <span aria-hidden>←</span> {t('sys.back')}
        </button>
        <span className="h-5 w-px bg-white/15" />
        <button
          onClick={goHome}
          aria-label={t('sys.home')}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-slate-100 active:bg-white/15"
        >
          <span aria-hidden>⌂</span> {t('sys.home')}
        </button>
      </div>
    </div>
  )
}
