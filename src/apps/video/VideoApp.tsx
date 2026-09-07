import { useState } from 'react'
import { useKernel } from '../../kernel/store'
import { AppScreen, Button } from '../../shell/ui'

/** App decorativa: el proceso mas exigente del catalogo, util para provocar el LMK rapido. */
export function VideoApp() {
  const [playing, setPlaying] = useState(false)
  const t = useKernel((s) => s.t)

  return (
    <AppScreen title={t('video.title')}>
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="flex h-56 w-full items-center justify-center rounded-2xl bg-black text-5xl ring-1 ring-white/10">
          {playing ? '🎬' : '▶️'}
        </div>
        <p className="text-[13px] text-slate-400">{t('video.hint')}</p>
        <p className="text-[13px] font-medium text-slate-200">
          {playing ? t('video.playing') : t('video.stopped')}
        </p>
        <Button full tone={playing ? 'danger' : 'primary'} onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸' : '▶️'}
        </Button>
      </div>
    </AppScreen>
  )
}
