import { del, get, set } from 'idb-keyval'
import type { VDir } from './vfs'
import type { GeoPosition, SystemSettings } from './types'

/**
 * Persistencia en IndexedDB (RF-09).
 *
 * Se usa IndexedDB y no localStorage por dos razones: localStorage no almacena
 * binarios (las fotos del RF-11) y su cuota ronda los 5 MB. Todas las llamadas
 * van envueltas en try/catch porque Safari en modo privado puede denegar el
 * acceso al almacenamiento, y en ese caso el simulador debe seguir funcionando
 * en memoria.
 */

const SNAPSHOT_KEY = 'mobileos:snapshot'
const BLOB_PREFIX = 'mobileos:blob:'

export interface Snapshot {
  version: number
  fs: VDir
  settings: SystemSettings
  battery: number
  geo: GeoPosition
}

export const SNAPSHOT_VERSION = 1

export async function loadSnapshot(): Promise<Snapshot | null> {
  try {
    const snap = await get<Snapshot>(SNAPSHOT_KEY)
    if (!snap || snap.version !== SNAPSHOT_VERSION) return null
    return snap
  } catch {
    return null
  }
}

export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  try {
    await set(SNAPSHOT_KEY, snapshot)
  } catch {
    /* almacenamiento no disponible: el simulador continua solo en memoria */
  }
}

export async function putBlob(key: string, blob: Blob): Promise<void> {
  try {
    await set(BLOB_PREFIX + key, blob)
  } catch {
    /* ignorado */
  }
}

export async function getBlob(key: string): Promise<Blob | undefined> {
  try {
    return await get<Blob>(BLOB_PREFIX + key)
  } catch {
    return undefined
  }
}

export async function deleteBlob(key: string): Promise<void> {
  try {
    await del(BLOB_PREFIX + key)
  } catch {
    /* ignorado */
  }
}

export async function wipeAll(): Promise<void> {
  try {
    await del(SNAPSHOT_KEY)
  } catch {
    /* ignorado */
  }
}
