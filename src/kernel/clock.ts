import { TICK_MS } from './config'
import { useKernel } from './store'

/**
 * Reloj del kernel.
 *
 * Se apoya en el tiempo real transcurrido en lugar de asumir que `setInterval`
 * dispara exactamente cada 100 ms: los navegadores moviles ralentizan los
 * temporizadores cuando la pestana pierde el foco, y sin esta correccion la
 * bateria y el planificador se quedarian congelados. Los ticks atrasados se
 * recuperan hasta un maximo para no bloquear el hilo al volver de segundo plano.
 */
const MAX_CATCH_UP_TICKS = 10

export function startKernelClock(): () => void {
  let last = performance.now()
  let accumulator = 0

  const id = setInterval(() => {
    const now = performance.now()
    accumulator += now - last
    last = now

    let ticks = Math.floor(accumulator / TICK_MS)
    accumulator -= ticks * TICK_MS
    if (ticks > MAX_CATCH_UP_TICKS) ticks = MAX_CATCH_UP_TICKS

    const { doTick } = useKernel.getState()
    for (let i = 0; i < ticks; i++) doTick()
  }, TICK_MS)

  return () => clearInterval(id)
}
