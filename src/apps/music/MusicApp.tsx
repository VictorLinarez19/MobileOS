import { useState } from 'react'
import { useKernel } from '../../kernel/store'
import { AppScreen, Button, Row, Section } from '../../shell/ui'

const TRACKS = ['Modo Kernel', 'Round Robin Blues', 'Segundo Plano', 'Bateria al 100%']

/** App decorativa que demuestra un proceso con demanda de CPU constante mientras "reproduce". */
export function MusicApp() {
  const [playing, setPlaying] = useState<string | null>(null)
  const t = useKernel((s) => s.t)

  return (
    <AppScreen title={t('music.title')}>
      <div className="mb-4 flex flex-col items-center gap-3 py-6">
        <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-5xl">
          🎵
        </div>
        <p className="text-[14px] text-slate-300">{playing ?? t('music.hint')}</p>
      </div>

      <Section>
        {TRACKS.map((track) => (
          <Row
            key={track}
            label={track}
            value={playing === track ? '⏸' : '▶️'}
            onClick={() => setPlaying(playing === track ? null : track)}
          />
        ))}
      </Section>

      {playing && (
        <Button full tone="danger" onClick={() => setPlaying(null)}>
          {t('music.pause')}
        </Button>
      )}

      {/*
        Unico enlace externo real del simulador: sale de la app decorativa
        hacia Spotify de verdad. Un <a> con toque directo del usuario es la
        forma mas confiable de que iOS/Android intercepten el universal link
        y abran la app instalada en vez de la web — un window.open() disparado
        desde JS no tiene esa garantia, y menos corriendo como PWA standalone.
      */}
      <a
        href="https://open.spotify.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full rounded-xl bg-[#1DB954] px-4 py-2.5 text-center text-[14px] font-medium text-black active:opacity-80"
      >
        🎧 {t('music.openSpotify')}
      </a>
      <p className="mt-2 text-center text-[12px] text-slate-500">{t('music.spotifyHint')}</p>
    </AppScreen>
  )
}
