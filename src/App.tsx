import { useEffect } from 'react'
import { useKernel } from './kernel/store'
import { startKernelClock } from './kernel/clock'
import { useDeviceLayout } from './shell/useDeviceLayout'
import { useDrag } from './shell/useDrag'
import { PhoneFrame } from './shell/PhoneFrame'
import { StatusBar } from './shell/StatusBar'
import { NotificationPanel } from './shell/NotificationPanel'
import { Recents } from './shell/Recents'
import { Launcher } from './shell/Launcher'
import { GestureLayer } from './shell/GestureLayer'
import { HomeIndicator } from './shell/HomeIndicator'
import { AppWindow } from './shell/AppWindow'
import { NavBar } from './shell/NavBar'
import { BrightnessOverlay } from './shell/BrightnessOverlay'

function BootScreen() {
  const t = useKernel((s) => s.t)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-black text-white">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">📱</span>
      <p className="text-[13px] text-slate-400">{t('sys.booting')}</p>
    </div>
  )
}

function LockScreen() {
  const unlock = useKernel((s) => s.unlock)
  const t = useKernel((s) => s.t)
  const drag = useDrag({
    onEnd: (info) => {
      if (info.dy < -70 || info.vy < -0.6) unlock()
    },
  })
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-end gap-3 bg-gradient-to-b from-slate-800 to-black pb-16 text-white"
      {...drag}
    >
      <span className="mb-auto mt-24 text-6xl font-thin tabular-nums">
        {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-3xl">🔒</span>
      <p className="text-[13px] text-slate-300">{t('sys.locked')}</p>
    </div>
  )
}

function Toast() {
  const toast = useKernel((s) => s.toast)
  if (!toast) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 z-50 flex justify-center">
      <span className="animate-toast-in rounded-full bg-black/80 px-4 py-2 text-[13px] text-white shadow-lg">
        {toast}
      </span>
    </div>
  )
}

export default function App() {
  const layout = useDeviceLayout()
  const booted = useKernel((s) => s.booted)
  const boot = useKernel((s) => s.boot)
  const locked = useKernel((s) => s.locked)
  const launcherPage = useKernel((s) => s.launcherPage)
  const foregroundPid = useKernel((s) => s.foregroundPid)
  const runningProc = useKernel((s) => s.procs.find((p) => p.pid === s.foregroundPid))

  useEffect(() => {
    void boot()
  }, [boot])

  useEffect(() => {
    if (!booted) return
    return startKernelClock()
  }, [booted])

  return (
    <div className="h-full w-full">
      <PhoneFrame layout={layout}>
        {!booted ? (
          <BootScreen />
        ) : (
          <>
            <div className="absolute inset-0">
              {foregroundPid === null ? (
                <div style={{ paddingTop: 'var(--status-h)', paddingBottom: 'var(--home-h)', height: '100%' }}>
                  <Launcher page={launcherPage} />
                </div>
              ) : (
                runningProc && <AppWindow proc={runningProc} />
              )}
            </div>

            <StatusBar notch={layout.mode === 'fullscreen'} />
            <GestureLayer inApp={foregroundPid !== null} />
            {foregroundPid !== null && <NavBar />}
            <HomeIndicator />
            <NotificationPanel />
            <Recents />
            <Toast />
            {locked && <LockScreen />}
            <BrightnessOverlay />
          </>
        )}
      </PhoneFrame>
    </div>
  )
}
