import { create } from 'zustand'
import type {
  GeoPosition,
  KernelMetrics,
  PCB,
  SystemNotification,
  SystemSettings,
} from './types'
import {
  LMK_THRESHOLD,
  MEMORY_TOTAL_MB,
  QUANTUM_BACKGROUND,
  QUANTUM_FOREGROUND,
  STORAGE_TOTAL_BYTES,
} from './config'
import { createProcess, transition } from './process'
import { initialSchedulerState, scheduleTick, type SchedulerState } from './scheduler'
import { growMemory, lowMemoryKiller, memoryUsedMB } from './memory'
import { applyPowerSavePolicy, batteryTick, computeDrainPerHour, cpuThrottleFor } from './power'
import {
  createRootFs,
  emptyDir,
  removeNode,
  resolve,
  walkFiles,
  writeFile,
  type VDir,
  type VFile,
} from './vfs'
import { deleteBlob, loadSnapshot, putBlob, saveSnapshot, SNAPSHOT_VERSION, wipeAll } from './persist'
import { MANIFEST_BY_ID } from '../apps/manifests'
import { translate, type TranslationKey } from '../i18n'

/** Ticks que un proceso terminado permanece visible en el monitor (RF-05). */
const REAP_AFTER_TICKS = 40

const DEFAULT_SETTINGS: SystemSettings = {
  brightness: 0.6,
  wifi: true,
  mobileData: false,
  powerSave: false,
  language: 'es',
  timeZone: 'America/Caracas',
}

const DEFAULT_GEO: GeoPosition = {
  latitude: 10.162,
  longitude: -68.0077,
  accuracyM: 12,
  label: 'Valencia, Venezuela',
}

const INITIAL_METRICS: KernelMetrics = {
  cpuLoad: 0,
  memoryUsedMB: 0,
  memoryTotalMB: MEMORY_TOTAL_MB,
  battery: 82,
  charging: false,
  drainPerHour: 0,
  cpuThrottle: 1,
  uptimeTicks: 0,
}

export interface KernelStore {
  booted: boolean
  tick: number
  procs: PCB[]
  sched: SchedulerState
  metrics: KernelMetrics
  settings: SystemSettings
  notifications: SystemNotification[]
  fs: VDir
  geo: GeoPosition
  foregroundPid: number | null

  // Estado del shell (gestor de ventanas)
  screenOn: boolean
  locked: boolean
  launcherPage: number
  notificationsOpen: boolean
  recentsOpen: boolean
  toast: string | null

  /** Nivel de bateria en el que ya se aviso al usuario, para no repetir el aviso. */
  batteryWarnedAt: number | null

  boot: () => Promise<void>
  doTick: () => void

  launchApp: (appId: string) => void
  focusProcess: (pid: number) => void
  goHome: () => void
  killProcess: (pid: number) => void
  killAllBackground: () => void

  patchSettings: (patch: Partial<SystemSettings>) => void
  setCharging: (charging: boolean) => void
  setScreenOn: (on: boolean) => void
  unlock: () => void
  setLauncherPage: (page: number) => void
  setNotificationsOpen: (open: boolean) => void
  setRecentsOpen: (open: boolean) => void
  showToast: (message: string) => void

  notify: (n: Omit<SystemNotification, 'id' | 'at'>) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void

  setGeo: (geo: Partial<GeoPosition>) => void

  fsWrite: (path: string, file: Omit<VFile, 'type' | 'name'>) => void
  fsRemove: (path: string) => void
  fsClearCache: () => void
  savePhoto: (blob: Blob, name: string, meta?: Record<string, unknown>) => Promise<string>
  storageUsedBytes: () => number
  resetSystem: () => Promise<void>

  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

/** Guardado en IndexedDB con antirrebote: el arbol se persiste como mucho cada segundo. */
let persistTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersist(get: () => KernelStore) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const s = get()
    void saveSnapshot({
      version: SNAPSHOT_VERSION,
      fs: s.fs,
      settings: s.settings,
      battery: s.metrics.battery,
      geo: s.geo,
    })
  }, 800)
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useKernel = create<KernelStore>((set, get) => ({
  booted: false,
  tick: 0,
  procs: [],
  sched: initialSchedulerState,
  metrics: INITIAL_METRICS,
  settings: DEFAULT_SETTINGS,
  notifications: [],
  fs: createRootFs(),
  geo: DEFAULT_GEO,
  foregroundPid: null,

  screenOn: true,
  locked: false,
  launcherPage: 0,
  notificationsOpen: false,
  recentsOpen: false,
  toast: null,
  batteryWarnedAt: null,

  t: (key, vars) => translate(get().settings.language, key, vars),

  async boot() {
    const snap = await loadSnapshot()
    set((s) => ({
      booted: true,
      fs: snap?.fs ?? s.fs,
      settings: snap?.settings ? { ...DEFAULT_SETTINGS, ...snap.settings } : s.settings,
      geo: snap?.geo ?? s.geo,
      metrics: {
        ...s.metrics,
        battery: snap?.battery ?? s.metrics.battery,
        memoryUsedMB: memoryUsedMB([]),
      },
    }))
  },

  /** Un tick del reloj del kernel: planificar, contabilizar memoria, energia. */
  doTick() {
    set((s) => {
      if (!s.booted) return s
      const tick = s.tick + 1
      const { powerSave } = s.settings
      const throttle = cpuThrottleFor(s.settings)

      // 1. Politica de ahorro de energia sobre el ciclo de vida (RF-08).
      let procs = applyPowerSavePolicy(s.procs, powerSave, tick)

      // 2. Evolucion de la huella de memoria de cada proceso.
      procs = growMemory(procs)

      // 3. Planificador Round-Robin (RF-04).
      const scheduled = scheduleTick(procs, s.sched, {
        throttle,
        powerSave,
        prevCpuLoad: s.metrics.cpuLoad,
      })
      procs = scheduled.procs

      // 4. Low Memory Killer (RF-06).
      const lmk = lowMemoryKiller(procs, tick)
      procs = lmk.procs

      let notifications = s.notifications
      if (lmk.killed.length > 0) {
        const created = lmk.killed.map((victim) => ({
          id: `lmk-${victim.pid}`,
          appId: 'system',
          title: translate(s.settings.language, 'sys.lowMemoryTitle'),
          body: translate(s.settings.language, 'sys.lowMemoryBody', {
            app: translate(
              s.settings.language,
              (MANIFEST_BY_ID[victim.appId]?.nameKey ?? victim.appId) as TranslationKey,
            ),
            pid: victim.pid,
          }),
          at: Date.now(),
        }))
        notifications = [...created, ...notifications].slice(0, 20)
      }

      // 5. Recoleccion de procesos terminados tras un margen visible en el monitor.
      procs = procs.filter(
        (p) => p.state !== 'terminated' || tick - (p.terminatedAt ?? tick) < REAP_AFTER_TICKS,
      )

      const alive = procs.filter((p) => p.state !== 'terminated')

      // 6. Gestion de energia (RF-07).
      const drainPerHour = computeDrainPerHour(
        scheduled.cpuLoad,
        s.settings,
        alive.length,
        s.screenOn,
      )
      const battery = batteryTick(s.metrics.battery, drainPerHour, s.metrics.charging)

      let batteryWarnedAt = s.batteryWarnedAt
      for (const level of [20, 10, 5]) {
        if (battery <= level && s.metrics.battery > level && batteryWarnedAt !== level) {
          batteryWarnedAt = level
          notifications = [
            {
              id: `battery-${level}`,
              appId: 'system',
              title: translate(s.settings.language, 'sys.batteryLow'),
              body: translate(s.settings.language, 'sys.batteryLowBody', { n: level }),
              at: Date.now(),
            },
            ...notifications,
          ].slice(0, 20)
          break
        }
      }
      if (battery > 25) batteryWarnedAt = null

      // 7. Apagado por bateria agotada: el sistema termina todos los procesos.
      if (battery <= 0 && s.metrics.battery > 0) {
        return {
          tick,
          procs: [],
          sched: initialSchedulerState,
          foregroundPid: null,
          screenOn: false,
          locked: true,
          notifications,
          batteryWarnedAt,
          metrics: {
            ...s.metrics,
            battery: 0,
            cpuLoad: 0,
            drainPerHour: 0,
            memoryUsedMB: memoryUsedMB([]),
            uptimeTicks: tick,
            cpuThrottle: throttle,
          },
        }
      }

      return {
        tick,
        procs,
        sched: scheduled.sched,
        notifications,
        batteryWarnedAt,
        metrics: {
          ...s.metrics,
          cpuLoad: scheduled.cpuLoad,
          memoryUsedMB: memoryUsedMB(alive),
          memoryTotalMB: MEMORY_TOTAL_MB,
          battery,
          drainPerHour,
          cpuThrottle: throttle,
          uptimeTicks: tick,
        },
      }
    })

    // La bateria se persiste con poca frecuencia para no castigar a IndexedDB.
    if (get().tick % 100 === 0) schedulePersist(get)
  },

  launchApp(appId) {
    const manifest = MANIFEST_BY_ID[appId]
    if (!manifest) return
    set((s) => {
      const tick = s.tick
      const existing = s.procs.find((p) => p.appId === appId && p.state !== 'terminated')
      let procs = s.procs.map((p) =>
        p.pid === s.foregroundPid && p.state === 'running' ? transition(p, 'background', tick) : p,
      )
      let foregroundPid: number
      if (existing) {
        foregroundPid = existing.pid
        procs = procs.map((p) => (p.pid === existing.pid ? transition(p, 'running', tick) : p))
      } else {
        const proc = createProcess(manifest, tick)
        foregroundPid = proc.pid
        procs = [...procs, proc]
      }
      return { procs, foregroundPid, recentsOpen: false, notificationsOpen: false }
    })
  },

  focusProcess(pid) {
    set((s) => {
      const target = s.procs.find((p) => p.pid === pid && p.state !== 'terminated')
      if (!target) return s
      const tick = s.tick
      const procs = s.procs.map((p) => {
        if (p.pid === pid) return transition(p, 'running', tick)
        if (p.state === 'running') return transition(p, 'background', tick)
        return p
      })
      return { procs, foregroundPid: pid, recentsOpen: false, notificationsOpen: false }
    })
  },

  goHome() {
    set((s) => {
      if (s.foregroundPid === null) return { recentsOpen: false, notificationsOpen: false }
      const procs = s.procs.map((p) =>
        p.pid === s.foregroundPid && p.state === 'running'
          ? transition(p, 'background', s.tick)
          : p,
      )
      return { procs, foregroundPid: null, recentsOpen: false, notificationsOpen: false }
    })
  },

  killProcess(pid) {
    set((s) => ({
      procs: s.procs.map((p) => (p.pid === pid ? transition(p, 'terminated', s.tick) : p)),
      foregroundPid: s.foregroundPid === pid ? null : s.foregroundPid,
    }))
  },

  killAllBackground() {
    set((s) => ({
      procs: s.procs.map((p) =>
        p.state === 'background' || p.state === 'paused' ? transition(p, 'terminated', s.tick) : p,
      ),
      recentsOpen: false,
    }))
  },

  patchSettings(patch) {
    set((s) => {
      const settings = { ...s.settings, ...patch }
      let notifications = s.notifications
      if (patch.powerSave === true && !s.settings.powerSave) {
        notifications = [
          {
            id: `powersave-${Date.now()}`,
            appId: 'system',
            title: translate(settings.language, 'sys.powerSaveOn'),
            body: translate(settings.language, 'sys.powerSaveOnBody'),
            at: Date.now(),
          },
          ...notifications,
        ].slice(0, 20)
      }
      return { settings, notifications }
    })
    schedulePersist(get)
  },

  setCharging(charging) {
    set((s) => ({ metrics: { ...s.metrics, charging } }))
  },

  setScreenOn(on) {
    set((s) => ({ screenOn: on, locked: on ? s.locked : true, notificationsOpen: false }))
  },

  unlock() {
    set({ locked: false, screenOn: true })
  },

  setLauncherPage(page) {
    set({ launcherPage: page })
  },

  setNotificationsOpen(open) {
    set({ notificationsOpen: open, recentsOpen: false })
  },

  setRecentsOpen(open) {
    set({ recentsOpen: open, notificationsOpen: false })
  },

  showToast(message) {
    set({ toast: message })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 2200)
  },

  notify(n) {
    set((s) => ({
      notifications: [
        { ...n, id: `${n.appId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() },
        ...s.notifications,
      ].slice(0, 20),
    }))
  },

  dismissNotification(id) {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
  },

  clearNotifications() {
    set({ notifications: [] })
  },

  setGeo(geo) {
    set((s) => ({ geo: { ...s.geo, ...geo } }))
    schedulePersist(get)
  },

  fsWrite(path, file) {
    set((s) => ({ fs: writeFile(s.fs, path, file) }))
    schedulePersist(get)
  },

  fsRemove(path) {
    const node = resolve(get().fs, path)
    if (node && node.type === 'file' && node.blobKey) void deleteBlob(node.blobKey)
    if (node && node.type === 'dir') {
      for (const { file } of walkFiles(node)) {
        if (file.blobKey) void deleteBlob(file.blobKey)
      }
    }
    set((s) => ({ fs: removeNode(s.fs, path) }))
    schedulePersist(get)
  },

  /** RF-10: vacia /cache liberando tambien los blobs asociados. */
  fsClearCache() {
    const cacheDir = resolve(get().fs, '/cache')
    if (cacheDir && cacheDir.type === 'dir') {
      for (const { file } of walkFiles(cacheDir)) {
        if (file.blobKey) void deleteBlob(file.blobKey)
      }
    }
    set((s) => ({ fs: emptyDir(s.fs, '/cache') }))
    schedulePersist(get)
  },

  /** RF-11: guarda una captura en /storage/DCIM y devuelve su ruta. */
  async savePhoto(blob, name, meta) {
    const blobKey = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await putBlob(blobKey, blob)
    const path = `/storage/DCIM/${name}`
    const now = Date.now()
    set((s) => ({
      fs: writeFile(s.fs, path, {
        createdAt: now,
        modifiedAt: now,
        size: blob.size,
        mime: blob.type || 'image/jpeg',
        blobKey,
        text: meta ? JSON.stringify(meta) : undefined,
      }),
    }))
    schedulePersist(get)
    return path
  },

  storageUsedBytes() {
    return walkFiles(get().fs).reduce((sum, { file }) => sum + file.size, 0)
  },

  async resetSystem() {
    await wipeAll()
    set({
      fs: createRootFs(),
      settings: DEFAULT_SETTINGS,
      geo: DEFAULT_GEO,
      procs: [],
      sched: initialSchedulerState,
      foregroundPid: null,
      notifications: [],
      metrics: { ...INITIAL_METRICS },
      tick: 0,
    })
  },
}))

export { LMK_THRESHOLD, MEMORY_TOTAL_MB, QUANTUM_BACKGROUND, QUANTUM_FOREGROUND, STORAGE_TOTAL_BYTES }
