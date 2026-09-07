import type { PCB } from './types'
import { TICK_MS } from './config'
import { isSchedulable, quantumFor } from './process'

/** Estado del planificador Round-Robin entre ticks. */
export interface SchedulerState {
  /** Cola circular de PIDs. La cabeza es el proceso que tiene el procesador. */
  queue: number[]
  currentPid: number | null
  /** Numero de cambios de contexto desde el arranque. */
  contextSwitches: number
}

export const initialSchedulerState: SchedulerState = {
  queue: [],
  currentPid: null,
  contextSwitches: 0,
}

/** Suavizado exponencial usado para que las barras del monitor no parpadeen. */
const SMOOTHING = 0.18

export interface ScheduleResult {
  procs: PCB[]
  sched: SchedulerState
  /** Carga de CPU del sistema suavizada, 0..1. */
  cpuLoad: number
}

/**
 * RF-04: ejecuta un tick del planificador Round-Robin.
 *
 * Solo un proceso tiene el procesador en cada tick; la multitarea surge de la
 * rotacion rapida de turnos. El proceso en primer plano recibe un quantum mayor
 * que los de segundo plano, y en modo ahorro de energia todos los quantums se
 * acortan y el tiempo de CPU efectivo se multiplica por `throttle` (RF-08).
 */
export function scheduleTick(
  procs: PCB[],
  sched: SchedulerState,
  opts: { throttle: number; powerSave: boolean; prevCpuLoad: number },
): ScheduleResult {
  const eligible = procs.filter(isSchedulable)
  const eligibleIds = new Set(eligible.map((p) => p.pid))

  // La cola conserva el orden de rotacion; los procesos nuevos entran al final
  // y los que ya no son elegibles salen.
  let queue = sched.queue.filter((pid) => eligibleIds.has(pid))
  for (const p of eligible) {
    if (!queue.includes(p.pid)) queue.push(p.pid)
  }

  let contextSwitches = sched.contextSwitches
  let currentPid = sched.currentPid

  const currentStillValid =
    currentPid !== null &&
    eligibleIds.has(currentPid) &&
    (procs.find((p) => p.pid === currentPid)?.quantumLeft ?? 0) > 0

  if (!currentStillValid) {
    if (queue.length === 0) {
      currentPid = null
    } else {
      // Se agoto el quantum: el proceso actual vuelve al final de la cola.
      if (currentPid !== null && queue.includes(currentPid)) {
        queue = queue.filter((pid) => pid !== currentPid)
        queue.push(currentPid)
      }
      const nextPid = queue[0]
      if (nextPid !== currentPid) contextSwitches++
      currentPid = nextPid
    }
  }

  let instantLoad = 0
  const next = procs.map((p) => {
    const onCpu = p.pid === currentPid
    let quantumLeft = p.quantumLeft
    let cpuTimeMs = p.cpuTimeMs

    if (onCpu) {
      if (quantumLeft <= 0) quantumLeft = quantumFor(p, opts.powerSave)
      quantumLeft -= 1
      cpuTimeMs += TICK_MS * opts.throttle * p.cpuDemand
      instantLoad = p.cpuDemand * opts.throttle
    }

    const instant = onCpu ? p.cpuDemand * opts.throttle : 0
    const cpuUsage = p.cpuUsage + (instant - p.cpuUsage) * SMOOTHING

    if (
      onCpu === p.onCpu &&
      quantumLeft === p.quantumLeft &&
      cpuTimeMs === p.cpuTimeMs &&
      Math.abs(cpuUsage - p.cpuUsage) < 1e-6
    ) {
      return p
    }
    return { ...p, onCpu, quantumLeft, cpuTimeMs, cpuUsage }
  })

  const cpuLoad = opts.prevCpuLoad + (instantLoad - opts.prevCpuLoad) * SMOOTHING

  return {
    procs: next,
    sched: { queue, currentPid, contextSwitches },
    cpuLoad: Math.max(0, Math.min(1, cpuLoad)),
  }
}
