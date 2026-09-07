import type { PCB, SystemSettings } from './types'
import {
  BATTERY_TIME_SCALE,
  CHARGE_PER_HOUR,
  DRAIN,
  POWERSAVE_CPU_THROTTLE,
  POWERSAVE_DRAIN_FACTOR,
  TICK_MS,
} from './config'
import { transition } from './process'

/**
 * RF-07: consumo dinamico de bateria en % por hora simulada.
 *
 * El consumo no es una constante: se deriva de la carga real del planificador,
 * del brillo de pantalla, de las radios encendidas y del numero de procesos
 * vivos. Por eso subir el brillo o abrir apps se nota inmediatamente.
 */
export function computeDrainPerHour(
  cpuLoad: number,
  settings: SystemSettings,
  aliveProcesses: number,
  screenOn = true,
): number {
  const raw =
    DRAIN.base * (screenOn ? 1 : 0.35) +
    DRAIN.cpu * cpuLoad +
    (screenOn ? DRAIN.brightness * settings.brightness : 0) +
    (settings.wifi ? DRAIN.wifi : 0) +
    (settings.mobileData ? DRAIN.mobileData : 0) +
    DRAIN.perProcess * Math.max(0, aliveProcesses - 1)

  return settings.powerSave ? raw * POWERSAVE_DRAIN_FACTOR : raw
}

/** Factor de throttling de CPU aplicado al planificador (RF-08). */
export function cpuThrottleFor(settings: SystemSettings): number {
  return settings.powerSave ? POWERSAVE_CPU_THROTTLE : 1
}

/** Horas simuladas que representa un tick del reloj del kernel. */
export const SIM_HOURS_PER_TICK = (TICK_MS / 1000) * BATTERY_TIME_SCALE / 3600

/** Avanza el nivel de bateria un tick. Devuelve el porcentaje 0..100. */
export function batteryTick(battery: number, drainPerHour: number, charging: boolean): number {
  const rate = charging ? CHARGE_PER_HOUR : -drainPerHour
  const next = battery + rate * SIM_HOURS_PER_TICK
  return Math.max(0, Math.min(100, next))
}

/**
 * RF-08: aplica la politica de ahorro de energia al conjunto de procesos.
 *
 * Al activarlo, los procesos de segundo plano no esenciales pasan a `paused` y
 * dejan de recibir CPU; al desactivarlo vuelven a `background`. El proceso en
 * primer plano nunca se suspende.
 */
export function applyPowerSavePolicy(procs: PCB[], powerSave: boolean, tick: number): PCB[] {
  return procs.map((p) => {
    if (p.state === 'terminated' || p.state === 'running' || p.essential) return p
    if (powerSave && p.state === 'background') return transition(p, 'paused', tick)
    if (!powerSave && p.state === 'paused') return transition(p, 'background', tick)
    return p
  })
}
