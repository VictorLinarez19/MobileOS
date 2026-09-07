import { useState } from 'react'
import { useKernel } from '../../kernel/store'
import { AppScreen, Button, Empty } from '../../shell/ui'
import { BROWSER_PAGES } from './pages'

/** Navegador con paginas internas: los sitios reales bloquean su carga en iframe. */
export function BrowserApp() {
  const [url, setUrl] = useState('inicio.os')
  const [address, setAddress] = useState('inicio.os')
  const online = useKernel((s) => s.settings.wifi || s.settings.mobileData)
  const t = useKernel((s) => s.t)

  const page = BROWSER_PAGES[url]

  return (
    <AppScreen title={t('br.title')}>
      <div className="mb-3 flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setUrl(address.trim())}
          placeholder={t('br.placeholder')}
          className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-[14px] text-slate-100 outline-none"
        />
        <Button tone="primary" onClick={() => setUrl(address.trim())}>
          {t('br.go')}
        </Button>
      </div>

      {!online ? (
        <Empty>
          <p className="font-semibold text-slate-200">{t('br.offline')}</p>
          <p>{t('br.offlineBody')}</p>
        </Empty>
      ) : !page ? (
        <Empty>{t('br.notFound')}</Empty>
      ) : (
        <div className="rounded-2xl bg-white/6 p-5 ring-1 ring-white/10">
          <h2 className="mb-2 text-lg font-semibold text-slate-100">{page.title}</h2>
          <p className="text-[14px] leading-relaxed text-slate-300">{page.body}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.keys(BROWSER_PAGES).map((k) => (
          <button
            key={k}
            onClick={() => {
              setUrl(k)
              setAddress(k)
            }}
            className="rounded-full bg-white/10 px-3 py-1 text-[12px] text-sky-300"
          >
            {k}
          </button>
        ))}
      </div>
    </AppScreen>
  )
}
