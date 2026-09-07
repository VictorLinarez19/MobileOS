import { APP_MANIFESTS } from '../apps/manifests'
import { useKernel } from '../kernel/store'
import { useDrag } from './useDrag'

const PER_PAGE = 8

/** RF-01: pantalla de inicio con una cuadricula de iconos interactivos. */
export function Launcher({ page }: { page: number }) {
  const launch = useKernel((s) => s.launchApp)
  const t = useKernel((s) => s.t)
  const procs = useKernel((s) => s.procs)
  const setLauncherPage = useKernel((s) => s.setLauncherPage)
  const pages: (typeof APP_MANIFESTS)[] = []
  for (let i = 0; i < APP_MANIFESTS.length; i += PER_PAGE) {
    pages.push(APP_MANIFESTS.slice(i, i + PER_PAGE))
  }

  // RF-03: deslizar hacia los lados cambia de pagina del launcher. Los
  // handlers van en el mismo contenedor que los iconos (sin overlay encima)
  // para que un simple toque siga llegando al boton de cada app.
  const swipe = useDrag({
    onEnd: (info) => {
      if (Math.abs(info.dx) < 60 || Math.abs(info.dx) < Math.abs(info.dy)) return
      if (info.dx < 0 && page < pages.length - 1) setLauncherPage(page + 1)
      else if (info.dx > 0 && page > 0) setLauncherPage(page - 1)
    },
  })

  return (
    <div className="relative h-full w-full" {...swipe}>
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${page * 100}%)` }}
      >
        {pages.map((apps, i) => (
          <div key={i} className="grid h-full w-full shrink-0 grid-cols-4 content-start gap-y-5 px-5 pt-3">
            {apps.map((app) => {
              const running = procs.some((p) => p.appId === app.id && p.state !== 'terminated')
              return (
                <button
                  key={app.id}
                  onClick={() => launch(app.id)}
                  className="flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <span
                    className="relative flex h-14 w-14 items-center justify-center rounded-[16px] text-2xl shadow-lg"
                    style={{ background: app.color }}
                  >
                    {app.icon}
                    {running && (
                      <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                  </span>
                  <span className="text-[11px] text-slate-200">{t(app.nameKey as never)}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === page ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const LAUNCHER_PAGE_COUNT = Math.ceil(APP_MANIFESTS.length / PER_PAGE)
