import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

export interface DragInfo {
  dx: number
  dy: number
  /** Duracion del gesto en milisegundos. */
  dt: number
  /** Velocidad vertical en px/ms, util para distinguir un flick de un arrastre. */
  vy: number
  vx: number
}

export interface DragHandlers {
  onStart?: () => void
  onMove?: (info: DragInfo) => void
  onEnd?: (info: DragInfo) => void
  onCancel?: () => void
}

/** Movimiento minimo, en pixeles, antes de considerar el gesto un arrastre. */
const DRAG_THRESHOLD = 8

/**
 * RF-03: traduce eventos de puntero en gestos de arrastre.
 *
 * Se usan Pointer Events y no eventos de raton o de tactil por separado: la API
 * unifica raton, dedo y lapiz, de modo que el mismo codigo cumple el requisito
 * de "clic y arrastre del raton" en el PC y responde a gestos tactiles reales
 * en el telefono.
 *
 * El puntero solo se captura una vez superado un pequeno umbral de movimiento.
 * Si se capturara desde el primer `pointerdown`, un simple toque sobre un boton
 * (por ejemplo un icono del launcher) quedaria retenido por el elemento que
 * escucha el gesto y su evento de clic nunca llegaria al boton: todo tap se
 * convertiria en un arrastre fallido. Con el umbral, un toque corto se resuelve
 * como clic normal y solo un movimiento real se interpreta como gesto.
 */
export function useDrag(handlers: DragHandlers) {
  const start = useRef<{ x: number; y: number; t: number; id: number; captured: boolean } | null>(
    null,
  )

  const info = (e: { clientX: number; clientY: number }): DragInfo => {
    const s = start.current!
    const dt = Math.max(1, performance.now() - s.t)
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    return { dx, dy, dt, vx: dx / dt, vy: dy / dt }
  }

  return {
    onPointerDown(e: ReactPointerEvent) {
      start.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, captured: false }
    },
    onPointerMove(e: ReactPointerEvent) {
      const s = start.current
      if (!s || s.id !== e.pointerId) return
      const result = info(e)
      if (!s.captured && Math.hypot(result.dx, result.dy) >= DRAG_THRESHOLD) {
        s.captured = true
        e.currentTarget.setPointerCapture(e.pointerId)
        handlers.onStart?.()
      }
      if (s.captured) handlers.onMove?.(result)
    },
    onPointerUp(e: ReactPointerEvent) {
      const s = start.current
      if (!s || s.id !== e.pointerId) return
      const result = info(e)
      start.current = null
      // Solo se reporta el gesto si llego a capturarse; un tap corto se deja
      // resolver como clic nativo sobre el elemento tocado.
      if (s.captured) handlers.onEnd?.(result)
    },
    onPointerCancel() {
      start.current = null
      handlers.onCancel?.()
    },
  }
}
