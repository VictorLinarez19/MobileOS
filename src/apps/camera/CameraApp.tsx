import { useRef, useState } from 'react'
import { useKernel } from '../../kernel/store'
import { AppScreen, Button, Row, Section, Switch } from '../../shell/ui'

/** RF-11: captura una foto (camara real en el telefono, selector de archivo en PC). */
export function CameraApp() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [tagGps, setTagGps] = useState(true)
  const savePhoto = useKernel((s) => s.savePhoto)
  const geo = useKernel((s) => s.geo)
  const notify = useKernel((s) => s.notify)
  const t = useKernel((s) => s.t)

  const handleFile = async (file: File | null) => {
    if (!file) return
    const name = `IMG_${Date.now()}.jpg`
    await savePhoto(file, name, tagGps ? { lat: geo.latitude, lon: geo.longitude } : undefined)
    setLastUrl(URL.createObjectURL(file))
    notify({ appId: 'camera', title: t('sys.photoSaved'), body: t('sys.photoSavedBody', { name }) })
  }

  return (
    <AppScreen title={t('cam.title')}>
      <Section>
        <Row label={t('cam.hint')} />
      </Section>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10">
          {lastUrl ? (
            <img src={lastUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] text-slate-500">{t('cam.none')}</span>
          )}
        </div>

        <Section>
          <Row label={t('cam.gps')}>
            <Switch checked={tagGps} onChange={setTagGps} />
          </Row>
        </Section>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <Button full tone="primary" onClick={() => inputRef.current?.click()}>
          📷 {t('cam.take')}
        </Button>
      </div>
    </AppScreen>
  )
}
