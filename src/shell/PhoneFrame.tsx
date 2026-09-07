import type { ReactNode } from 'react'
import type { DeviceLayout } from './useDeviceLayout'

/**
 * Bisel del telefono para el modo escritorio (RF-01 shell).
 * En modo `fullscreen` (telefono real) no se renderiza marco alguno.
 */
export function PhoneFrame({ layout, children }: { layout: DeviceLayout; children: ReactNode }) {
  if (layout.mode === 'fullscreen') {
    return (
      <div
        className="relative h-full w-full overflow-hidden bg-black text-white"
        style={{
          // @ts-expect-error variables CSS personalizadas
          '--status-h': 'calc(env(safe-area-inset-top, 0px) + 30px)',
          '--home-h': 'calc(env(safe-area-inset-bottom, 0px) + 22px)',
          '--safe-top': 'env(safe-area-inset-top, 0px)',
          '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="relative overflow-hidden rounded-[46px] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-[10px] ring-slate-800"
        style={{
          width: layout.width,
          height: layout.height,
          // @ts-expect-error variables CSS personalizadas
          '--status-h': '44px',
          '--home-h': '30px',
          '--safe-top': '0px',
          '--safe-bottom': '0px',
        }}
      >
        {/* Boton fisico lateral, puramente decorativo */}
        <span className="absolute -right-[10px] top-24 h-14 w-[4px] rounded-full bg-slate-700" />
        <span className="absolute -left-[10px] top-20 h-8 w-[4px] rounded-full bg-slate-700" />
        <span className="absolute -left-[10px] top-32 h-8 w-[4px] rounded-full bg-slate-700" />
        <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-slate-950">{children}</div>
      </div>
    </div>
  )
}
