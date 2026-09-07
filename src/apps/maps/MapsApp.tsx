import { useKernel } from '../../kernel/store'
import { AppScreen, Row, Section } from '../../shell/ui'

const NEARBY = ['Plaza Bolivar', 'Centro Comercial', 'Parque Central', 'Terminal de pasajeros']

/** RF-12: consume el GPS virtual expuesto por el kernel. */
export function MapsApp() {
  const geo = useKernel((s) => s.geo)
  const t = useKernel((s) => s.t)

  // Cuadricula simple que da sensacion de mapa sin depender de un servicio externo.
  const dotStyle = {
    left: `${50 + (((geo.longitude + 180) % 20) - 10) * 4}%`,
    top: `${50 - (((geo.latitude + 90) % 20) - 10) * 4}%`,
  }

  return (
    <AppScreen title={t('maps.title')}>
      <div className="relative mb-4 h-56 overflow-hidden rounded-2xl ring-1 ring-white/10" style={{
        backgroundImage:
          'linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundColor: '#0f172a',
      }}>
        <span
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_0_8px_rgba(56,189,248,0.25)]"
          style={dotStyle}
        />
      </div>

      <Section>
        <Row label={t('maps.position')} value={geo.label} />
        <Row label={t('dev.latitude')} value={geo.latitude.toFixed(5)} />
        <Row label={t('dev.longitude')} value={geo.longitude.toFixed(5)} />
        <Row label={t('maps.accuracy')} value={`±${geo.accuracyM} m`} />
      </Section>

      <p className="mb-3 px-2 text-[12px] text-slate-500">{t('maps.hint')}</p>

      <Section title={t('maps.nearby')}>
        {NEARBY.map((n) => (
          <Row key={n} label={n} value="•" />
        ))}
      </Section>
    </AppScreen>
  )
}
