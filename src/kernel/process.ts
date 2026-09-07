import type { AppManifest, PCB, ProcessState } from './types'
import { QUANTUM_BACKGROUND, QUANTUM_FOREGROUND } from './config'

let nextPid = 1000

/** Reinicia el contador de PIDs. Solo se usa en las pruebas. */
export function resetPidCounter(value = 1000): void {
  nextPid = value
}

/** Crea el PCB de un proceso nuevo a partir del manifiesto de su aplicacion. */
export function createProcess(manifest: AppManifest, tick: number): PCB {
  return {
    pid: nextPid++,
    appId: manifest.id,
    state: 'running',
    priority: manifest.priority,
    memoryMB: manifest.memoryMB,
    baseMemoryMB: manifest.memoryMB,
    cpuDemand: manifest.cpuDemand,
    createdAt: tick,
    lastForegroundAt: tick,
    cpuTimeMs: 0,
    cpuUsage: 0,
    quantumLeft: QUANTUM_FOREGROUND,
    essential: manifest.essential,
    onCpu: false,
  }
}

/** Quantum en ticks que le corresponde a un proceso segun su estado. */
export function quantumFor(p: PCB, powerSave: boolean): number {
  const base = p.state === 'running' ? QUANTUM_FOREGROUND : QUANTUM_BACKGROUND
  // RF-08: en ahorro de energia los turnos se acortan (CPU throttling).
  return powerSave ? Math.max(1, Math.floor(base / 2)) : base
}

/** Un proceso es elegible para recibir CPU si no esta suspendido ni terminado. */
export function isSchedulable(p: PCB): boolean {
  return p.state === 'running' || p.state === 'background'
}

/**
 * Aplica una transicion de estado del ciclo de vida (RF-05).
 * Devuelve un PCB nuevo; nunca muta el original.
 */
export function transition(p: PCB, state: ProcessState, tick: number): PCB {
  if (p.state === state) return p
  const next: PCB = { ...p, state }
  if (state === 'running') {
    next.lastForegroundAt = tick
  }
  if (state === 'terminated') {
    next.memoryMB = 0
    next.cpuUsage = 0
    next.onCpu = false
    next.terminatedAt = tick
  }
  // Al cambiar de estado el proceso empieza un turno nuevo.
  next.quantumLeft = quantumFor(next, false)
  return next
}
