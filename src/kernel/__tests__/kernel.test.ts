import { describe, expect, it, beforeEach } from 'vitest'
import { createProcess, resetPidCounter, transition, quantumFor } from '../process'
import { initialSchedulerState, scheduleTick } from '../scheduler'
import { lowMemoryKiller, memoryPressure, memoryUsedMB } from '../memory'
import { applyPowerSavePolicy, batteryTick, computeDrainPerHour, cpuThrottleFor } from '../power'
import {
  LMK_THRESHOLD,
  MEMORY_SYSTEM_RESERVED_MB,
  MEMORY_TOTAL_MB,
  QUANTUM_BACKGROUND,
  QUANTUM_FOREGROUND,
} from '../config'
import type { AppManifest, PCB, SystemSettings } from '../types'

function manifest(over: Partial<AppManifest> = {}): AppManifest {
  return {
    id: 'test',
    nameKey: 'app.settings',
    icon: '*',
    color: '#000',
    memoryMB: 100,
    cpuDemand: 0.5,
    priority: 3,
    essential: false,
    ...over,
  }
}

const settings: SystemSettings = {
  brightness: 0.5,
  wifi: false,
  mobileData: false,
  powerSave: false,
  language: 'es',
  timeZone: 'UTC',
}

beforeEach(() => resetPidCounter(1))

describe('ciclo de vida de procesos (RF-05)', () => {
  it('un proceso nuevo arranca en primer plano con el quantum de foreground', () => {
    const p = createProcess(manifest(), 0)
    expect(p.state).toBe('running')
    expect(p.quantumLeft).toBe(QUANTUM_FOREGROUND)
  })

  it('pasar a segundo plano conserva el pid y libera el turno largo', () => {
    const p = transition(createProcess(manifest(), 0), 'background', 10)
    expect(p.state).toBe('background')
    expect(p.quantumLeft).toBe(QUANTUM_BACKGROUND)
  })

  it('terminar un proceso libera su memoria y registra el tick', () => {
    const p = transition(createProcess(manifest(), 0), 'terminated', 42)
    expect(p.state).toBe('terminated')
    expect(p.memoryMB).toBe(0)
    expect(p.terminatedAt).toBe(42)
  })

  it('el quantum se reduce a la mitad en modo ahorro de energia (RF-08)', () => {
    const fg = createProcess(manifest(), 0)
    expect(quantumFor(fg, false)).toBe(QUANTUM_FOREGROUND)
    expect(quantumFor(fg, true)).toBe(Math.floor(QUANTUM_FOREGROUND / 2))
  })
})

describe('planificador Round-Robin (RF-04)', () => {
  it('reparte el procesador entre los procesos listos', () => {
    let procs = [
      transition(createProcess(manifest({ id: 'a' }), 0), 'background', 0),
      transition(createProcess(manifest({ id: 'b' }), 0), 'background', 0),
      transition(createProcess(manifest({ id: 'c' }), 0), 'background', 0),
    ]
    let sched = initialSchedulerState
    const seen = new Set<string>()

    for (let i = 0; i < 30; i++) {
      const r = scheduleTick(procs, sched, { throttle: 1, powerSave: false, prevCpuLoad: 0 })
      procs = r.procs
      sched = r.sched
      const running = procs.find((p) => p.onCpu)
      if (running) seen.add(running.appId)
    }

    expect(seen).toEqual(new Set(['a', 'b', 'c']))
    expect(sched.contextSwitches).toBeGreaterThan(5)
    for (const p of procs) expect(p.cpuTimeMs).toBeGreaterThan(0)
  })

  it('el proceso en primer plano acumula mas CPU que los de segundo plano', () => {
    let procs = [
      createProcess(manifest({ id: 'fg', cpuDemand: 0.5 }), 0),
      transition(createProcess(manifest({ id: 'bg', cpuDemand: 0.5 }), 0), 'background', 0),
    ]
    let sched = initialSchedulerState
    for (let i = 0; i < 100; i++) {
      const r = scheduleTick(procs, sched, { throttle: 1, powerSave: false, prevCpuLoad: 0 })
      procs = r.procs
      sched = r.sched
    }
    const fg = procs.find((p) => p.appId === 'fg')!
    const bg = procs.find((p) => p.appId === 'bg')!
    expect(fg.cpuTimeMs).toBeGreaterThan(bg.cpuTimeMs * 2)
  })

  it('los procesos suspendidos no reciben procesador', () => {
    let procs = [
      createProcess(manifest({ id: 'fg' }), 0),
      transition(createProcess(manifest({ id: 'susp' }), 0), 'paused', 0),
    ]
    let sched = initialSchedulerState
    for (let i = 0; i < 40; i++) {
      const r = scheduleTick(procs, sched, { throttle: 1, powerSave: false, prevCpuLoad: 0 })
      procs = r.procs
      sched = r.sched
    }
    expect(procs.find((p) => p.appId === 'susp')!.cpuTimeMs).toBe(0)
    expect(procs.find((p) => p.appId === 'fg')!.cpuTimeMs).toBeGreaterThan(0)
  })

  it('el throttling reduce el tiempo de CPU acumulado', () => {
    const run = (throttle: number) => {
      let procs = [createProcess(manifest(), 0)]
      let sched = initialSchedulerState
      for (let i = 0; i < 50; i++) {
        const r = scheduleTick(procs, sched, { throttle, powerSave: false, prevCpuLoad: 0 })
        procs = r.procs
        sched = r.sched
      }
      return procs[0].cpuTimeMs
    }
    expect(run(0.55)).toBeLessThan(run(1))
  })
})

describe('Low Memory Killer (RF-06)', () => {
  /** Construye procesos que juntos superan el umbral del 85%. */
  function overloaded(): PCB[] {
    const budget = MEMORY_TOTAL_MB * 0.95 - MEMORY_SYSTEM_RESERVED_MB
    const each = budget / 4
    return [
      createProcess(manifest({ id: 'fg', memoryMB: each, priority: 2 }), 0),
      transition(createProcess(manifest({ id: 'vieja', memoryMB: each, priority: 5 }), 0), 'background', 1),
      transition(createProcess(manifest({ id: 'nueva', memoryMB: each, priority: 5 }), 0), 'background', 90),
      transition(createProcess(manifest({ id: 'importante', memoryMB: each, priority: 1 }), 0), 'background', 2),
    ]
  }

  it('no hace nada por debajo del umbral', () => {
    const procs = [createProcess(manifest({ memoryMB: 100 }), 0)]
    expect(memoryPressure(procs)).toBeLessThan(LMK_THRESHOLD)
    expect(lowMemoryKiller(procs, 1).killed).toHaveLength(0)
  })

  it('mata primero el proceso de segundo plano con menor prioridad', () => {
    const { killed } = lowMemoryKiller(overloaded(), 100)
    expect(killed.length).toBeGreaterThan(0)
    expect(killed[0].priority).toBe(5)
  })

  it('a igual prioridad elige el que lleva mas tiempo sin estar en primer plano', () => {
    const { killed } = lowMemoryKiller(overloaded(), 100)
    expect(killed[0].appId).toBe('vieja')
  })

  it('nunca elige el proceso en primer plano', () => {
    const { killed } = lowMemoryKiller(overloaded(), 100)
    expect(killed.some((p) => p.appId === 'fg')).toBe(false)
  })

  it('respeta los procesos marcados como esenciales', () => {
    const budget = MEMORY_TOTAL_MB * 0.95 - MEMORY_SYSTEM_RESERVED_MB
    const procs = [
      createProcess(manifest({ id: 'fg', memoryMB: budget / 2 }), 0),
      transition(
        createProcess(manifest({ id: 'esencial', memoryMB: budget / 2, essential: true }), 0),
        'background',
        1,
      ),
    ]
    const { killed } = lowMemoryKiller(procs, 10)
    expect(killed).toHaveLength(0)
  })

  it('deja el sistema por debajo del umbral cuando hay victimas suficientes', () => {
    const { procs } = lowMemoryKiller(overloaded(), 100)
    expect(memoryPressure(procs.filter((p) => p.state !== 'terminated'))).toBeLessThanOrEqual(
      LMK_THRESHOLD,
    )
  })

  it('la memoria usada incluye la reserva del sistema', () => {
    expect(memoryUsedMB([])).toBe(MEMORY_SYSTEM_RESERVED_MB)
  })
})

describe('gestion de energia (RF-07 y RF-08)', () => {
  it('mas brillo implica mas consumo', () => {
    const low = computeDrainPerHour(0.3, { ...settings, brightness: 0.1 }, 1)
    const high = computeDrainPerHour(0.3, { ...settings, brightness: 1 }, 1)
    expect(high).toBeGreaterThan(low)
  })

  it('mas carga de CPU implica mas consumo', () => {
    expect(computeDrainPerHour(0.9, settings, 1)).toBeGreaterThan(
      computeDrainPerHour(0.1, settings, 1),
    )
  })

  it('las radios encendidas suman consumo', () => {
    expect(computeDrainPerHour(0.3, { ...settings, wifi: true, mobileData: true }, 1)).toBeGreaterThan(
      computeDrainPerHour(0.3, settings, 1),
    )
  })

  it('con la pantalla apagada el consumo cae', () => {
    expect(computeDrainPerHour(0.3, settings, 1, false)).toBeLessThan(
      computeDrainPerHour(0.3, settings, 1, true),
    )
  })

  it('el ahorro de energia reduce consumo y limita la CPU', () => {
    const saver: SystemSettings = { ...settings, powerSave: true }
    expect(computeDrainPerHour(0.5, saver, 3)).toBeLessThan(computeDrainPerHour(0.5, settings, 3))
    expect(cpuThrottleFor(saver)).toBeLessThan(cpuThrottleFor(settings))
  })

  it('el ahorro de energia suspende los procesos de segundo plano no esenciales', () => {
    const procs = [
      createProcess(manifest({ id: 'fg' }), 0),
      transition(createProcess(manifest({ id: 'bg' }), 0), 'background', 0),
      transition(createProcess(manifest({ id: 'sys', essential: true }), 0), 'background', 0),
    ]
    const saved = applyPowerSavePolicy(procs, true, 5)
    expect(saved.find((p) => p.appId === 'fg')!.state).toBe('running')
    expect(saved.find((p) => p.appId === 'bg')!.state).toBe('paused')
    expect(saved.find((p) => p.appId === 'sys')!.state).toBe('background')

    const restored = applyPowerSavePolicy(saved, false, 6)
    expect(restored.find((p) => p.appId === 'bg')!.state).toBe('background')
  })

  it('la bateria baja al descargar y sube al cargar, sin salirse de 0..100', () => {
    expect(batteryTick(50, 10, false)).toBeLessThan(50)
    expect(batteryTick(50, 10, true)).toBeGreaterThan(50)
    expect(batteryTick(0.0001, 999, false)).toBe(0)
    expect(batteryTick(99.999, 0, true)).toBe(100)
  })
})
