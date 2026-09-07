import { useEffect, useState } from 'react'
import { useKernel } from '../kernel/store'

/** Reloj en tiempo real, respetando la zona horaria elegida en Ajustes (RF-13). */
function useClockText(timeZone: string, lang: string) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  try {
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-VE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: lang !== 'es',
      timeZone,
    }).format(now)
  } catch {
    // Una zona horaria invalida no debe tumbar la barra de estado.
    return now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  const color = charging ? '#4ade80' : level <= 10 ? '#f87171' : level <= 20 ? '#fbbf24' : '#e2e8f0'
  return (
    <span className="flex items-center gap-1">
      <span className="tabular-nums text-[11px]">{Math.round(level)}%</span>
      <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
        <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.45" />
        <rect x="2" y="2" width={Math.max(1, (level / 100) * 18)} height="9" rx="2" fill={color} />
        <path d="M23 4.5v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.45" />
      </svg>
    </span>
  )
}

/** RF-02: barra superior persistente con indicadores en tiempo real. */
export function StatusBar({ notch }: { notch: boolean }) {
  const settings = useKernel((s) => s.settings)
  const metrics = useKernel((s) => s.metrics)
  const time = useClockText(settings.timeZone, settings.language)

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 text-[13px] font-semibold text-slate-100"
      style={{ height: 'var(--status-h)', paddingTop: 'var(--safe-top)' }}
    >
      <span className="tabular-nums">{time}</span>

      {notch && (
        <span className="absolute left-1/2 top-2 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
      )}

      <span className="flex items-center gap-1.5">
        {settings.powerSave && <span title="Ahorro de bateria">🔋</span>}
        {settings.mobileData && <span className="text-[11px] tracking-tight">LTE</span>}
        {settings.wifi && (
          <svg width="16" height="13" viewBox="0 0 16 13" aria-label="Wi-Fi">
            <path d="M8 11.5 5.6 8.9a3.4 3.4 0 0 1 4.8 0z" fill="currentColor" />
            <path d="M2.9 6.2a7.3 7.3 0 0 1 10.2 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M0.9 3.6a10.2 10.2 0 0 1 14.2 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
          </svg>
        )}
        {!settings.wifi && !settings.mobileData && <span className="text-[11px]">✈︎</span>}
        <BatteryIcon level={metrics.battery} charging={metrics.charging} />
      </span>
    </div>
  )
}
