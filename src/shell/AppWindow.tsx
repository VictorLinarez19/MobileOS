import { APP_COMPONENTS } from '../apps/registry'
import { MANIFEST_BY_ID } from '../apps/manifests'
import type { PCB } from '../kernel/types'

/** Ventana de una app en primer plano. Se apila una por proceso `running`. */
export function AppWindow({ proc }: { proc: PCB }) {
  const Comp = APP_COMPONENTS[proc.appId]
  const manifest = MANIFEST_BY_ID[proc.appId]
  if (!Comp) return null

  return (
    <div
      className="animate-app-enter absolute inset-0 z-20 overflow-hidden"
      style={{
        background: manifest ? `linear-gradient(180deg, ${manifest.color}14, #0b1020 40%)` : '#0b1020',
        paddingTop: 'var(--status-h)',
        paddingBottom: 'var(--home-h)',
      }}
    >
      <Comp />
    </div>
  )
}
