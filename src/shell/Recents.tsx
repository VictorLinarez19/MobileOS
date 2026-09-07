import { APP_MANIFESTS, MANIFEST_BY_ID } from '../apps/manifests'
import { useKernel } from '../kernel/store'
import { Button } from './ui'

/** RF-03/RF-05: vista de aplicaciones recientes, con cierre por gesto o boton. */
export function Recents() {
  const open = useKernel((s) => s.recentsOpen)
  const procs = useKernel((s) => s.procs)
  const focus = useKernel((s) => s.focusProcess)
  const kill = useKernel((s) => s.killProcess)
  const killAll = useKernel((s) => s.killAllBackground)
  const setOpen = useKernel((s) => s.setRecentsOpen)
  const t = useKernel((s) => s.t)

  if (!open) return null

  const visible = procs.filter((p) => p.state === 'running' || p.state === 'background' || p.state === 'paused')

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-slate-950/92 backdrop-blur-md" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="flex items-center justify-between px-5 py-3">
        <h2 className="text-[15px] font-semibold text-slate-200">{t('sys.recents')}</h2>
        {visible.length > 0 && (
          <button onClick={killAll} className="text-[13px] text-sky-400 active:opacity-60">
            {t('sys.closeAll')}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-slate-500">
          {t('sys.noRecents')}
        </p>
      ) : (
        <div className="app-scroll flex flex-1 gap-3 px-5 pb-6">
          {visible.map((p) => {
            const app = MANIFEST_BY_ID[p.appId] ?? APP_MANIFESTS[0]
            return (
              <div key={p.pid} className="flex w-36 shrink-0 flex-col">
                <button
                  onClick={() => focus(p.pid)}
                  className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl ring-1 ring-white/10 active:scale-95"
                  style={{ background: `${app.color}33` }}
                >
                  <span className="text-4xl">{app.icon}</span>
                  <span className="text-[12px] text-slate-200">{t(app.nameKey as never)}</span>
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-slate-300">
                    {t(`st.${p.state}` as never)}
                  </span>
                </button>
                <div className="mt-2">
                  <Button full onClick={() => kill(p.pid)}>
                    ✕
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setOpen(false)}
        className="mx-auto mb-[calc(var(--safe-bottom)+14px)] h-9 w-32 rounded-full bg-white/15"
        aria-label={t('sys.home')}
      />
    </div>
  )
}
