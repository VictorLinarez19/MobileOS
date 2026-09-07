import { useKernel } from './store'
import { getBlob } from './persist'
import { resolve, type VDir, type VFile, type VNode } from './vfs'
import type { GeoPosition, SystemSettings } from './types'
import { translate, type TranslationKey } from '../i18n'

/**
 * Capa de llamadas al sistema.
 *
 * Las aplicaciones no tocan el store del kernel directamente: piden todo a
 * traves de esta interfaz, identificandose con su `appId`. Esa frontera es lo
 * que convierte el proyecto en un simulador de sistema operativo y no en una
 * simple coleccion de pantallas: el kernel decide donde vive cada archivo y que
 * puede leer cada aplicacion.
 */
export interface Syscalls {
  appId: string
  /** Directorio privado de la aplicacion, equivalente a /data/data/<pkg>. */
  homeDir: string
  /** Directorio de cache de la aplicacion, que el gestor de archivos puede vaciar. */
  cacheDir: string

  readText: (path: string) => string | undefined
  writeText: (path: string, text: string, opts?: { cache?: boolean; mime?: string }) => void
  readBlob: (path: string) => Promise<Blob | undefined>
  list: (path: string) => VNode[]
  remove: (path: string) => void
  stat: (path: string) => VNode | null

  /** RF-12: consulta de la posicion del GPS virtual. */
  getLocation: () => GeoPosition
  /** RF-11: guarda una captura en la galeria y devuelve su ruta. */
  savePhoto: (blob: Blob, name: string, meta?: Record<string, unknown>) => Promise<string>

  getSettings: () => SystemSettings
  getBattery: () => { level: number; charging: boolean; powerSave: boolean }
  /** True si hay alguna radio de red activa. */
  isOnline: () => boolean

  notify: (title: string, body: string) => void
  toast: (message: string) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

export function makeSyscalls(appId: string): Syscalls {
  const homeDir = `/data/${appId}`
  const cacheDir = `/cache/${appId}`

  return {
    appId,
    homeDir,
    cacheDir,

    readText(path) {
      const node = resolve(useKernel.getState().fs, path)
      return node && node.type === 'file' ? node.text : undefined
    },

    writeText(path, text, opts) {
      const now = Date.now()
      const existing = resolve(useKernel.getState().fs, path)
      useKernel.getState().fsWrite(path, {
        createdAt: existing && existing.type === 'file' ? existing.createdAt : now,
        modifiedAt: now,
        size: new Blob([text]).size,
        mime: opts?.mime ?? 'text/plain',
        text,
        cache: opts?.cache,
      })
    },

    async readBlob(path) {
      const node = resolve(useKernel.getState().fs, path)
      if (!node || node.type !== 'file' || !node.blobKey) return undefined
      return getBlob(node.blobKey)
    },

    list(path) {
      const node = resolve(useKernel.getState().fs, path)
      return node && node.type === 'dir' ? node.children : []
    },

    remove(path) {
      useKernel.getState().fsRemove(path)
    },

    stat(path) {
      return resolve(useKernel.getState().fs, path)
    },

    getLocation() {
      return useKernel.getState().geo
    },

    savePhoto(blob, name, meta) {
      return useKernel.getState().savePhoto(blob, name, meta)
    },

    getSettings() {
      return useKernel.getState().settings
    },

    getBattery() {
      const { metrics, settings } = useKernel.getState()
      return { level: metrics.battery, charging: metrics.charging, powerSave: settings.powerSave }
    },

    isOnline() {
      const { wifi, mobileData } = useKernel.getState().settings
      return wifi || mobileData
    },

    notify(title, body) {
      useKernel.getState().notify({ appId, title, body })
    },

    toast(message) {
      useKernel.getState().showToast(message)
    },

    t(key, vars) {
      return translate(useKernel.getState().settings.language, key, vars)
    },
  }
}

export type { VDir, VFile, VNode }
