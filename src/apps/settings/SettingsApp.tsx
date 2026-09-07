import { useKernel } from '../../kernel/store'
import { AppScreen, Row, Section, Switch } from '../../shell/ui'
import type { Lang } from '../../i18n'

const TIME_ZONES = [
  'America/Caracas',
  'America/Bogota',
  'America/Mexico_City',
  'America/New_York',
  'Europe/Madrid',
]

/** RF-13: panel de ajustes globales del sistema. */
export function SettingsApp() {
  const settings = useKernel((s) => s.settings)
  const metrics = useKernel((s) => s.metrics)
  const patch = useKernel((s) => s.patchSettings)
  const setCharging = useKernel((s) => s.setCharging)
  const resetSystem = useKernel((s) => s.resetSystem)
  const storageUsed = useKernel((s) => s.storageUsedBytes())
  const uptimeTicks = useKernel((s) => s.metrics.uptimeTicks)
  const t = useKernel((s) => s.t)

  return (
    <AppScreen title={t('set.title')}>
      <Section title={t('set.display')}>
        <Row label={t('set.brightness')} hint={t('set.brightnessHint')} value={`${Math.round(settings.brightness * 100)}%`}>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={settings.brightness}
            onChange={(e) => patch({ brightness: Number(e.target.value) })}
            className="w-full"
          />
        </Row>
      </Section>

      <Section title={t('set.connectivity')}>
        <Row label={t('set.wifi')} onClick={() => patch({ wifi: !settings.wifi })}>
          <Switch checked={settings.wifi} onChange={(v) => patch({ wifi: v })} />
        </Row>
        <Row label={t('set.mobileData')} onClick={() => patch({ mobileData: !settings.mobileData })}>
          <Switch checked={settings.mobileData} onChange={(v) => patch({ mobileData: v })} />
        </Row>
      </Section>

      <Section title={t('set.battery')}>
        <Row label={t('set.level')} value={`${Math.round(metrics.battery)}%`} />
        <Row label={t('set.drain')} value={`${metrics.drainPerHour.toFixed(1)}%/h`} />
        <Row label={t('set.powerSave')} hint={t('set.powerSaveHint')} onClick={() => patch({ powerSave: !settings.powerSave })}>
          <Switch checked={settings.powerSave} onChange={(v) => patch({ powerSave: v })} />
        </Row>
        <Row label={t('set.charger')} onClick={() => setCharging(!metrics.charging)}>
          <Switch checked={metrics.charging} onChange={setCharging} />
        </Row>
      </Section>

      <Section title={t('set.regional')}>
        <Row label={t('set.language')}>
          <div className="flex gap-2">
            {(['es', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => patch({ language: l })}
                className={`rounded-lg px-3 py-1.5 text-[13px] ${
                  settings.language === l ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                {l === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </Row>
        <Row label={t('set.timeZone')}>
          <select
            value={settings.timeZone}
            onChange={(e) => patch({ timeZone: e.target.value })}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-[13px] text-slate-100"
          >
            {TIME_ZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-slate-800">
                {tz}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title={t('set.about')}>
        <Row label={t('set.model')} value="UJAP Virtual Phone" />
        <Row label={t('set.ram')} value={`${metrics.memoryTotalMB} MB`} />
        <Row label={t('set.storage')} value={`${(storageUsed / (1024 * 1024)).toFixed(2)} MB`} />
        <Row label={t('set.uptime')} value={`${uptimeTicks} ticks`} />
      </Section>

      <Section>
        <Row
          label={<span className="text-rose-400">{t('set.reset')}</span>}
          hint={t('set.resetHint')}
          onClick={() => {
            if (confirm(t('set.resetConfirm'))) void resetSystem()
          }}
        />
      </Section>
    </AppScreen>
  )
}
