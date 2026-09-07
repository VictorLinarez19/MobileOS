import type { AppManifest } from '../kernel/types'

/**
 * Manifiestos de las aplicaciones instaladas (RF-01).
 *
 * Los valores de `memoryMB` estan calibrados para que abrir cinco o seis apps
 * exigentes supere el umbral del 85% y se pueda demostrar el Low Memory Killer
 * (RF-06) sin tener que forzar nada artificialmente.
 */
export const APP_MANIFESTS: AppManifest[] = [
  { id: 'settings', nameKey: 'app.settings', icon: '⚙️', color: '#64748b', memoryMB: 80, cpuDemand: 0.18, priority: 1, essential: false },
  { id: 'devtools', nameKey: 'app.devtools', icon: '🧪', color: '#0ea5e9', memoryMB: 70, cpuDemand: 0.22, priority: 1, essential: true },
  { id: 'clock', nameKey: 'app.clock', icon: '⏰', color: '#f59e0b', memoryMB: 60, cpuDemand: 0.12, priority: 2, essential: false },
  { id: 'messages', nameKey: 'app.messages', icon: '💬', color: '#22c55e', memoryMB: 140, cpuDemand: 0.2, priority: 2, essential: false },
  { id: 'notes', nameKey: 'app.notes', icon: '📝', color: '#eab308', memoryMB: 70, cpuDemand: 0.14, priority: 3, essential: false },
  { id: 'files', nameKey: 'app.files', icon: '📁', color: '#8b5cf6', memoryMB: 90, cpuDemand: 0.24, priority: 3, essential: false },
  { id: 'camera', nameKey: 'app.camera', icon: '📷', color: '#ec4899', memoryMB: 260, cpuDemand: 0.62, priority: 3, essential: false },
  { id: 'gallery', nameKey: 'app.gallery', icon: '🖼️', color: '#14b8a6', memoryMB: 300, cpuDemand: 0.35, priority: 4, essential: false },
  { id: 'maps', nameKey: 'app.maps', icon: '🗺️', color: '#3b82f6', memoryMB: 380, cpuDemand: 0.55, priority: 4, essential: false },
  { id: 'browser', nameKey: 'app.browser', icon: '🌐', color: '#6366f1', memoryMB: 420, cpuDemand: 0.5, priority: 4, essential: false },
  { id: 'music', nameKey: 'app.music', icon: '🎵', color: '#f43f5e', memoryMB: 520, cpuDemand: 0.4, priority: 5, essential: false },
  { id: 'video', nameKey: 'app.video', icon: '🎬', color: '#a855f7', memoryMB: 700, cpuDemand: 0.75, priority: 5, essential: false },
]

export const MANIFEST_BY_ID: Record<string, AppManifest> = Object.fromEntries(
  APP_MANIFESTS.map((m) => [m.id, m]),
)
