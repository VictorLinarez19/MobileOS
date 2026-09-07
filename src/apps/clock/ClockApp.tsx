import { useEffect, useRef, useState } from 'react'
import { useKernel } from '../../kernel/store'
import { AppScreen, Button, Row, Section } from '../../shell/ui'

const ZONES = [
  { label: 'Caracas', tz: 'America/Caracas' },
  { label: 'Madrid', tz: 'Europe/Madrid' },
  { label: 'Nueva York', tz: 'America/New_York' },
  { label: 'Tokio', tz: 'Asia/Tokyo' },
]

function fmt(tz: string) {
  try {
    return new Intl.DateTimeFormat('es-VE', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date())
  } catch {
    return '--:--'
  }
}

export function ClockApp() {
  const [, setTick] = useState(0)
  const settings = useKernel((s) => s.settings)
  const t = useKernel((s) => s.t)

  const [running, setRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsedMs(performance.now() - startRef.current), 60)
    return () => clearInterval(id)
  }, [running])

  const toggle = () => {
    if (!running) startRef.current = performance.now() - elapsedMs
    setRunning((r) => !r)
  }

  const total = Math.floor(elapsedMs / 10)
  const cs = total % 100
  const s = Math.floor(total / 100) % 60
  const m = Math.floor(total / 6000)

  return (
    <AppScreen title={t('clock.title')}>
      <div className="mb-6 flex flex-col items-center py-6">
        <span className="text-6xl font-thin tabular-nums">{fmt(settings.timeZone)}</span>
      </div>

      <Section title={t('clock.timer')}>
        <div className="flex flex-col items-center gap-4 px-4 py-6">
          <span className="text-4xl font-mono tabular-nums">
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}.{String(cs).padStart(2, '0')}
          </span>
          <div className="flex w-full gap-2">
            <Button full tone={running ? 'danger' : 'primary'} onClick={toggle}>
              {running ? t('clock.stop') : t('clock.start')}
            </Button>
            <Button
              full
              onClick={() => {
                setRunning(false)
                setElapsedMs(0)
              }}
            >
              {t('clock.reset')}
            </Button>
          </div>
        </div>
      </Section>

      <Section title={t('clock.zones')}>
        {ZONES.map((z) => (
          <Row key={z.tz} label={z.label} value={fmt(z.tz)} />
        ))}
      </Section>
    </AppScreen>
  )
}
