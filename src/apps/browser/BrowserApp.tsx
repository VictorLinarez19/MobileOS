import { useMemo, useRef, useState } from 'react'
import type { TranslationKey } from '../../i18n'
import { useKernel } from '../../kernel/store'
import { makeSyscalls } from '../../kernel/syscalls'
import { useBackHandler } from '../../shell/useBackHandler'
import { AppScreen, Bar, Button, Empty, Row, Section, Switch } from '../../shell/ui'
import { BROWSER_PAGES } from './pages'

const HOME_URL = 'inicio.os'

type DownloadStatus = 'downloading' | 'scanning' | 'completed' | 'blocked'

interface DownloadItem {
  id: number
  name: string
  progress: number
  status: DownloadStatus
  malicious: boolean
}

/**
 * Cadena de prueba estandar de la industria (EICAR): la usan de verdad los
 * antivirus para probarse sin manejar malware real. Es inofensiva por diseno,
 * por eso es segura de incluir aqui para simular una "descarga maliciosa".
 */
const EICAR_TEST_STRING = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'

function guessMime(filename: string): string {
  if (filename.endsWith('.pdf')) return 'application/pdf'
  if (filename.endsWith('.zip')) return 'application/zip'
  return 'text/plain'
}

/**
 * Navegador con paginas internas (los sitios reales bloquean su carga en un
 * iframe por X-Frame-Options/CSP) mas navegacion con historial real, un
 * indicador SSL y un panel de descargas con un antivirus simulado que puede
 * bloquear un archivo malicioso de prueba — adaptado de las pautas de
 * AceBrowser a esta arquitectura (React + Zustand + VFS propio, sin Electron
 * ni <webview>: este simulador corre como PWA en el navegador real del
 * telefono, no en un proceso de escritorio).
 */
export function BrowserApp() {
  const sys = useMemo(() => makeSyscalls('browser'), [])
  const online = useKernel((s) => s.settings.wifi || s.settings.mobileData)
  const t = useKernel((s) => s.t)

  // --- Navegacion con historial real (atras / adelante / recargar) ---
  const [history, setHistory] = useState([HOME_URL])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [address, setAddress] = useState(HOME_URL)
  const [loading, setLoading] = useState(false)
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const url = history[historyIndex]
  const page = BROWSER_PAGES[url]
  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  const flashLoading = (ms: number) => {
    setLoading(true)
    if (loadingTimer.current) clearTimeout(loadingTimer.current)
    loadingTimer.current = setTimeout(() => setLoading(false), ms)
  }

  const navigate = (target: string) => {
    const clean = target.trim()
    if (!clean) return
    setAddress(clean)
    setHistory((h) => [...h.slice(0, historyIndex + 1), clean])
    setHistoryIndex((i) => i + 1)
    flashLoading(300 + Math.random() * 300)
  }

  const historyBack = (): boolean => {
    if (!canGoBack) return false
    setHistoryIndex((i) => i - 1)
    setAddress(history[historyIndex - 1])
    flashLoading(180)
    return true
  }

  const goForward = () => {
    if (!canGoForward) return
    setHistoryIndex((i) => i + 1)
    setAddress(history[historyIndex + 1])
    flashLoading(180)
  }

  const reload = () => flashLoading(280)
  const goHome = () => navigate(HOME_URL)

  // RF-03: el boton/gesto de sistema "Atras" primero navega el historial del
  // navegador (como en un navegador real); solo si ya esta en la primera
  // pagina visitada cae a salir a inicio del sistema.
  useBackHandler(canGoBack ? historyBack : null)

  // --- Panel de descargas + antivirus simulado ---
  const [view, setView] = useState<'page' | 'downloads'>('page')
  const [antivirusOn, setAntivirusOn] = useState(true)
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [threatAlert, setThreatAlert] = useState<string | null>(null)
  const nextDownloadId = useRef(1)

  const startDownload = (filename: string, malicious: boolean) => {
    const id = nextDownloadId.current++
    setView('downloads')
    setDownloads((d) => [{ id, name: filename, progress: 0, status: 'downloading', malicious }, ...d])

    const progressTimer = setInterval(() => {
      setDownloads((list) =>
        list.map((dl) =>
          dl.id === id && dl.status === 'downloading'
            ? { ...dl, progress: Math.min(100, dl.progress + 20) }
            : dl,
        ),
      )
    }, 400)

    setTimeout(() => {
      clearInterval(progressTimer)
      setDownloads((list) =>
        list.map((dl) => (dl.id === id ? { ...dl, progress: 100, status: 'scanning' } : dl)),
      )

      setTimeout(() => {
        const blocked = malicious && antivirusOn
        setDownloads((list) =>
          list.map((dl) => (dl.id === id ? { ...dl, status: blocked ? 'blocked' : 'completed' } : dl)),
        )

        if (blocked) {
          setThreatAlert(filename)
          sys.notify(t('br.threatTitle'), t('br.threatBody', { name: filename }))
        } else {
          const content = malicious
            ? `${EICAR_TEST_STRING}\n\n(Antivirus desactivado: el archivo de prueba se guardo igual.)`
            : `Contenido simulado de ${filename}, descargado desde ${url}.`
          sys.writeText(`/storage/Descargas/${filename}`, content, { mime: guessMime(filename) })
          sys.notify(t('br.savedTitle'), t('br.savedBody', { name: filename }))
        }
      }, 1100)
    }, 5 * 400 + 80)
  }

  return (
    <div className="relative h-full">
      <AppScreen
        title={t('br.title')}
        actions={
          <button
            onClick={() => setView(view === 'downloads' ? 'page' : 'downloads')}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
              view === 'downloads' ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            📥 {t('br.downloads')}
            {downloads.some((d) => d.status === 'downloading' || d.status === 'scanning') && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        }
      >
        {/* Barra de navegacion: atras / adelante / recargar / inicio */}
        <div className="mb-2 flex items-center gap-1">
          <button
            onClick={historyBack}
            disabled={!canGoBack}
            aria-label={t('br.back')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 disabled:opacity-30 active:bg-white/10"
          >
            ←
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            aria-label={t('br.forward')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 disabled:opacity-30 active:bg-white/10"
          >
            →
          </button>
          <button
            onClick={reload}
            aria-label={t('br.reload')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 active:bg-white/10"
          >
            {loading ? <span className="inline-block animate-spin">⟳</span> : '⟳'}
          </button>
          <button
            onClick={goHome}
            aria-label={t('br.home')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 active:bg-white/10"
          >
            ⌂
          </button>
        </div>

        {/* Barra de direcciones con indicador SSL y spinner de carga */}
        <div className="mb-3 flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <span
              title={page?.secure === false ? t('br.insecureTitle') : t('br.secureTitle')}
              className={page?.secure === false ? 'text-amber-400' : 'text-emerald-400'}
            >
              {page?.secure === false ? '⚠️' : '🔒'}
            </span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(address)}
              placeholder={t('br.placeholder')}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-100 outline-none"
            />
            {loading && <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />}
          </div>
          <Button tone="primary" onClick={() => navigate(address)}>
            {t('br.go')}
          </Button>
        </div>

        {view === 'downloads' ? (
          <DownloadsPanel
            downloads={downloads}
            antivirusOn={antivirusOn}
            setAntivirusOn={setAntivirusOn}
            online={online}
            onDownloadSafe={() => startDownload('Guia_Alumno.pdf', false)}
            onDownloadVirus={() => startDownload('eicar_test.zip', true)}
            t={t}
          />
        ) : !online ? (
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

        {view === 'page' && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(BROWSER_PAGES).map((k) => (
              <button
                key={k}
                onClick={() => navigate(k)}
                className="rounded-full bg-white/10 px-3 py-1 text-[12px] text-sky-300"
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </AppScreen>

      {threatAlert && (
        <SecurityAlert filename={threatAlert} onClose={() => setThreatAlert(null)} t={t} />
      )}
    </div>
  )
}

function DownloadsPanel({
  downloads,
  antivirusOn,
  setAntivirusOn,
  online,
  onDownloadSafe,
  onDownloadVirus,
  t,
}: {
  downloads: DownloadItem[]
  antivirusOn: boolean
  setAntivirusOn: (v: boolean) => void
  online: boolean
  onDownloadSafe: () => void
  onDownloadVirus: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}) {
  return (
    <div>
      <Section>
        <Row label={t('br.antivirus')} hint={t('br.antivirusHint')}>
          <Switch checked={antivirusOn} onChange={setAntivirusOn} />
        </Row>
      </Section>

      {/*
        Los enlaces de prueba quedan siempre visibles, no solo cuando la lista
        esta vacia: si se ocultaran en cuanto hay una descarga (como en la
        referencia original), no habria forma de disparar una segunda
        descarga de prueba desde la interfaz.
      */}
      <Section title={t('br.testLinks')}>
        <div className="flex flex-col gap-2 p-3">
          {!online && <p className="text-[12px] text-amber-400">{t('br.offlineDownloadsHint')}</p>}
          <Button tone="primary" onClick={onDownloadSafe}>
            📄 {t('br.downloadPdf')}
          </Button>
          <Button tone="danger" onClick={onDownloadVirus}>
            ⚠️ {t('br.downloadVirus')}
          </Button>
        </div>
      </Section>

      {downloads.length === 0 ? (
        <p className="px-2 py-4 text-center text-[13px] text-slate-500">{t('br.noDownloads')}</p>
      ) : (
        <Section title={t('br.downloadsTitle')}>
          {downloads.map((dl) => (
            <Row
              key={dl.id}
              label={
                <span>
                  {dl.malicious ? '⚠️' : '📄'} {dl.name}
                </span>
              }
              hint={
                dl.status === 'downloading'
                  ? t('br.statusDownloading', { n: dl.progress })
                  : dl.status === 'scanning'
                    ? t('br.statusScanning')
                    : dl.status === 'completed'
                      ? t('br.statusCompleted')
                      : t('br.statusBlocked')
              }
            >
              <Bar
                value={dl.progress / 100}
                color={
                  dl.status === 'blocked' ? '#ef4444' : dl.status === 'scanning' ? '#f59e0b' : '#10b981'
                }
              />
            </Row>
          ))}
        </Section>
      )}
    </div>
  )
}

function SecurityAlert({
  filename,
  onClose,
  t,
}: {
  filename: string
  onClose: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl border-2 border-rose-500 bg-slate-900 p-5 text-center shadow-[0_10px_30px_rgba(239,68,68,0.4)]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-3xl">
          ⚠️
        </div>
        <h2 className="mb-2 text-[16px] font-bold text-rose-400">{t('br.threatTitle')}</h2>
        <p className="mb-3 text-[13px] leading-relaxed text-slate-300">{t('br.threatDesc')}</p>
        <p className="mb-1 text-[12px] text-slate-400">
          {t('br.threatFile')} <span className="font-mono text-rose-300">{filename}</span>
        </p>
        <p className="mb-4 text-[12px] text-slate-400">
          {t('br.threatActionLabel')} {t('br.threatActionValue')}
        </p>
        <Button full tone="danger" onClick={onClose}>
          {t('br.threatButton')}
        </Button>
      </div>
    </div>
  )
}
