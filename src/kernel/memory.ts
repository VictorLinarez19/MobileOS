import type { PCB, SystemNotification } from './types'
import {
  LMK_TARGET,
  LMK_THRESHOLD,
  MEMORY_SYSTEM_RESERVED_MB,
  MEMORY_TOTAL_MB,
} from './config'
import { transition } from './process'

/** RAM ocupada por los procesos vivos mas la reservada por el sistema. */
export function memoryUsedMB(procs: PCB[]): number {
  const byProcs = procs
    .filter((p) => p.state !== 'terminated')
    .reduce((sum, p) => sum + p.memoryMB, 0)
  return MEMORY_SYSTEM_RESERVED_MB + byProcs
}

/** Fraccion de RAM ocupada, 0..1. */
export function memoryPressure(procs: PCB[]): number {
  return memoryUsedMB(procs) / MEMORY_TOTAL_MB
}

/**
 * Hace evolucionar la RAM de cada proceso hacia el objetivo propio de su estado.
 *
 * Una app en primer plano infla su huella (buffers, cache de imagenes); al pasar
 * a segundo plano el sistema le recorta memoria, y suspendida se queda en lo
 * minimo. La aproximacion es exponencial para que el cambio se vea progresivo.
 */
export function growMemory(procs: PCB[]): PCB[] {
  return procs.map((p) => {
    if (p.state === 'terminated') return p
    const factor = p.state === 'running' ? 1.9 : p.state === 'background' ? 1.15 : 0.6
    const target = p.baseMemoryMB * factor
    const memoryMB = p.memoryMB + (target - p.memoryMB) * 0.03
    if (Math.abs(memoryMB - p.memoryMB) < 0.01) return p
    return { ...p, memoryMB }
  })
}

export interface LmkResult {
  procs: PCB[]
  killed: PCB[]
}

/**
 * RF-06: Low Memory Killer.
 *
 * Cuando la memoria ocupada supera el 85% termina procesos de segundo plano
 * hasta bajar del umbral objetivo. Elige siempre el de menor prioridad y, a
 * igualdad de prioridad, el que lleva mas tiempo sin estar en primer plano.
 * Los procesos esenciales y el de primer plano quedan exentos.
 */
export function lowMemoryKiller(procs: PCB[], tick: number): LmkResult {
  if (memoryPressure(procs) <= LMK_THRESHOLD) return { procs, killed: [] }

  let current = procs
  const killed: PCB[] = []

  while (memoryPressure(current) > LMK_TARGET) {
    const candidates = current.filter(
      (p) => !p.essential && (p.state === 'background' || p.state === 'paused'),
    )
    if (candidates.length === 0) break

    const victim = [...candidates].sort(
      (a, b) => b.priority - a.priority || a.lastForegroundAt - b.lastForegroundAt,
    )[0]

    killed.push(victim)
    current = current.map((p) => (p.pid === victim.pid ? transition(p, 'terminated', tick) : p))
  }

  return { procs: current, killed }
}

/** Construye la notificacion que anuncia una muerte por falta de memoria. */
export function lmkNotification(victim: PCB, appName: string): SystemNotification {
  return {
    id: `lmk-${victim.pid}-${Date.now()}`,
    appId: 'system',
    title: 'Memoria insuficiente',
    body: `Se cerro "${appName}" (PID ${victim.pid}) para liberar RAM.`,
    at: Date.now(),
  }
}

export { MEMORY_TOTAL_MB }
