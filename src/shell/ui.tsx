import type { ReactNode } from 'react'

export function AppScreen({
  title,
  actions,
  children,
  accent,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
  accent?: string
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-end justify-between px-5 pb-3 pt-1">
        <h1 className="text-[26px] font-bold leading-tight" style={{ color: accent }}>
          {title}
        </h1>
        <div className="flex items-center gap-2 pb-1">{actions}</div>
      </header>
      <div className="app-scroll flex-1 px-4 pb-20">{children}</div>
    </div>
  )
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      {title && (
        <h2 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-2xl bg-white/6 ring-1 ring-white/10">{children}</div>
    </section>
  )
}

export function Row({
  label,
  hint,
  value,
  children,
  onClick,
}: {
  label: ReactNode
  hint?: ReactNode
  value?: ReactNode
  children?: ReactNode
  onClick?: () => void
}) {
  // Se renderiza un <div> con rol de boton, no un <button>: varias filas
  // (por ejemplo las que muestran un Switch) anidan otro elemento interactivo,
  // y un <button> dentro de otro <button> es HTML invalido — el navegador lo
  // reordena de forma impredecible y rompe el toque tanto en Safari como en
  // Chrome. Con un div+role la fila sigue siendo clicable y accesible por
  // teclado sin arriesgar esa anidacion invalida.
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`flex w-full items-center gap-3 border-b border-white/8 px-4 py-3 text-left last:border-b-0 ${
        onClick ? 'cursor-pointer active:bg-white/10' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] text-slate-100">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] leading-snug text-slate-400">{hint}</div>}
        {children && <div className="mt-2">{children}</div>}
      </div>
      {value !== undefined && (
        <div className="shrink-0 text-[14px] tabular-nums text-slate-300">{value}</div>
      )}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[25px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

/** Barra de progreso usada por el monitor de recursos y el gestor de archivos. */
export function Bar({ value, color = '#38bdf8' }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/12">
      <div
        className="h-full rounded-full transition-[width] duration-200"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
      />
    </div>
  )
}

export function Button({
  children,
  onClick,
  tone = 'default',
  full,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'default' | 'primary' | 'danger'
  full?: boolean
}) {
  const tones = {
    default: 'bg-white/10 text-slate-100 active:bg-white/20',
    primary: 'bg-sky-500 text-white active:bg-sky-600',
    danger: 'bg-rose-500/90 text-white active:bg-rose-600',
  }
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${tones[tone]} ${
        full ? 'w-full' : ''
      }`}
    >
      {children}
    </button>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center px-8 text-center text-[14px] leading-relaxed text-slate-400">
      {children}
    </div>
  )
}
