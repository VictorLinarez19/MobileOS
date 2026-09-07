import { useEffect, useState } from 'react'

/** Proporcion de pantalla del dispositivo simulado (equivalente a un 6.1"). */
const ASPECT = 390 / 844

export type DeviceMode = 'framed' | 'fullscreen'

export interface DeviceLayout {
  mode: DeviceMode
  width: number
  height: number
}

/**
 * Decide como presentar el dispositivo.
 *
 * En un escritorio se dibuja un telefono con bisel centrado en la ventana; en un
 * telefono real el marco desaparece y el simulador ocupa toda la pantalla,
 * porque un telefono dibujado dentro de otro telefono desperdicia espacio y
 * confunde los gestos.
 */
function detectMode(): DeviceMode {
  if (typeof window === 'undefined') return 'framed'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  return coarse && window.innerWidth < 820 ? 'fullscreen' : 'framed'
}

function compute(): DeviceLayout {
  const mode = detectMode()
  if (mode === 'fullscreen') {
    return { mode, width: window.innerWidth, height: window.innerHeight }
  }
  // El telefono se ajusta al alto disponible en lugar de escalarse con
  // transform: asi los eventos de puntero conservan sus coordenadas reales.
  const height = Math.min(844, Math.max(560, window.innerHeight - 48))
  return { mode, width: Math.round(height * ASPECT), height }
}

export function useDeviceLayout(): DeviceLayout {
  const [layout, setLayout] = useState<DeviceLayout>(compute)

  useEffect(() => {
    const onResize = () => setLayout(compute())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    // En iOS la altura util cambia al mostrarse u ocultarse la barra de Safari.
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [])

  return layout
}
