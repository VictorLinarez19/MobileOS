import { useKernel } from '../kernel/store'
import { Button } from './ui'

function relTime(at: number, lang: string) {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (s < 5) return lang === 'es' ? 'ahora' : 'now'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h`
}

/** RF-02: panel de notificaciones desplegable, arrastrado desde la barra superior. */
export function NotificationPanel() {
  const open = useKernel((s) => s.notificationsOpen)
  const notifications = useKernel((s) => s.notifications)
  const dismiss = useKernel((s) => s.dismissNotification)
  const clearAll = useKernel((s) => s.clearNotifications)
  const setOpen = useKernel((s) => s.setNotificationsOpen)
  const lang = useKernel((s) => s.settings.language)
  const t = useKernel((s) => s.t)

  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-50 animate-panel-drop bg-black/55 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="mx-3 mt-[calc(var(--safe-top)+8px)] max-h-[70%] overflow-hidden rounded-3xl bg-slate-900/95 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 className="text-[13px] font-semibold text-slate-300">{t('sys.notifications')}</h2>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="text-[12px] text-sky-400 active:opacity-60">
              {t('sys.clearAll')}
            </button>
          )}
        </div>
        <div className="app-scroll max-h-72 px-3 pb-3">
          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] text-slate-500">{t('sys.noNotifications')}</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-2xl bg-white/8 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-slate-300">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">{relTime(n.at, lang)}</span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button onClick={() => dismiss(n.id)}>OK</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
