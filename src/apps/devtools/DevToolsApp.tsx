import { useKernel } from '../../kernel/store'
import { MANIFEST_BY_ID } from '../manifests'
import { AppScreen, Bar, Button, Row, Section } from '../../shell/ui'
import { LMK_THRESHOLD } from '../../kernel/config'

const PRESETS = [
  { label: 'Valencia, VE', latitude: 10.162, longitude: -68.0077 },
  { label: 'Bogota, CO', latitude: 4.711, longitude: -74.0721 },
  { label: 'Ciudad de Mexico', latitude: 19.4326, longitude: -99.1332 },
  { label: 'Madrid, ES', latitude: 40.4168, longitude: -3.7038 },
  { label: 'Tokio, JP', latitude: 35.6762, longitude: 139.6503 },
]

/** RF-14: monitor de recursos y opciones de diagnostico en tiempo real. */
export function DevToolsApp() {
  const metrics = useKernel((s) => s.metrics)
  const procs = useKernel((s) => s.procs)
  const sched = useKernel((s) => s.sched)
  const settings = useKernel((s) => s.settings)
  const geo = useKernel((s) => s.geo)
  const setGeo = useKernel((s) => s.setGeo)
  const kill = useKernel((s) => s.killProcess)
  const t = useKernel((s) => s.t)

  const memPressure = metrics.memoryUsedMB / metrics.memoryTotalMB
  const alive = procs.filter((p) => p.state !== 'terminated')

  return (
    <AppScreen title={t('dev.title')}>
      <Section title={t('dev.monitor')}>
        <Row label={t('dev.cpu')} value={`${Math.round(metrics.cpuLoad * 100)}%`}>
          <Bar value={metrics.cpuLoad} color="#38bdf8" />
        </Row>
        <Row label={t('dev.ram')} value={`${Math.round(metrics.memoryUsedMB)} / ${metrics.memoryTotalMB} MB`}>
          <Bar value={memPressure} color={memPressure > LMK_THRESHOLD ? '#f87171' : '#a78bfa'} />
        </Row>
        <Row label={t('dev.battery')} value={`${Math.round(metrics.battery)}%`}>
          <Bar value={metrics.battery / 100} color="#4ade80" />
        </Row>
        <Row label={t('dev.throttle')} value={`${Math.round(metrics.cpuThrottle * 100)}%`} />
        <Row label={t('dev.uptime')} value={metrics.uptimeTicks} />
      </Section>

      <Section title={t('dev.scheduler')}>
        <Row label={t('dev.switches')} value={sched.contextSwitches} />
        <Row label={t('dev.onCpu')} value={MANIFEST_BY_ID[procs.find((p) => p.onCpu)?.appId ?? '']?.nameKey ? t(MANIFEST_BY_ID[procs.find((p) => p.onCpu)!.appId].nameKey as never) : t('dev.none')} />
        <Row label={t('dev.threshold')} value={`${Math.round(LMK_THRESHOLD * 100)}%`} />
      </Section>

      <Section title={`${t('dev.processes')} (${alive.length})`}>
        {alive.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-slate-500">{t('dev.none')}</p>
        ) : (
          <div className="app-scroll max-h-[300px]">
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-slate-800/95 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('dev.app')}</th>
                  <th className="px-2 py-2 font-medium">{t('dev.pid')}</th>
                  <th className="px-2 py-2 font-medium">{t('dev.state')}</th>
                  <th className="px-2 py-2 font-medium">{t('dev.cpuCol')}</th>
                  <th className="px-2 py-2 font-medium">{t('dev.ramCol')}</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {alive.map((p) => {
                  const app = MANIFEST_BY_ID[p.appId]
                  return (
                    <tr key={p.pid} className={`border-t border-white/8 ${p.onCpu ? 'bg-sky-500/10' : ''}`}>
                      <td className="px-3 py-2">
                        {app?.icon} {app ? t(app.nameKey as never) : p.appId}
                      </td>
                      <td className="px-2 py-2 tabular-nums text-slate-400">{p.pid}</td>
                      <td className="px-2 py-2 text-slate-300">{t(`st.${p.state}` as never)}</td>
                      <td className="px-2 py-2 tabular-nums text-slate-300">{Math.round(p.cpuUsage * 100)}%</td>
                      <td className="px-2 py-2 tabular-nums text-slate-300">{Math.round(p.memoryMB)}</td>
                      <td className="px-3 py-2 text-right">
                        {!app?.essential && (
                          <button onClick={() => kill(p.pid)} className="text-rose-400 active:opacity-60">
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title={t('dev.gps')}>
        <Row label={t('dev.latitude')} value={geo.latitude.toFixed(4)}>
          <input
            type="range"
            min={-85}
            max={85}
            step={0.01}
            value={geo.latitude}
            onChange={(e) => setGeo({ latitude: Number(e.target.value), label: 'Custom' })}
            className="w-full"
          />
        </Row>
        <Row label={t('dev.longitude')} value={geo.longitude.toFixed(4)}>
          <input
            type="range"
            min={-180}
            max={180}
            step={0.01}
            value={geo.longitude}
            onChange={(e) => setGeo({ longitude: Number(e.target.value), label: 'Custom' })}
            className="w-full"
          />
        </Row>
        <Row label={t('dev.presets')}>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} onClick={() => setGeo({ ...p })}>
                {p.label}
              </Button>
            ))}
          </div>
        </Row>
      </Section>

      {settings.powerSave && (
        <p className="px-2 pb-4 text-[12px] text-amber-400">
          {t('set.powerSave')}: {t('common.on')}
        </p>
      )}
    </AppScreen>
  )
}
