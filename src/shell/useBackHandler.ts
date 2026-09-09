import { useEffect } from 'react'
import { useKernel } from '../kernel/store'

/**
 * Permite que una app registre su propia navegacion interna en el boton/gesto
 * de sistema "Atras" (por ejemplo, subir un nivel de carpeta en Archivos o
 * cancelar la edicion de una nota).
 *
 * `handler` debe devolver `true` si consumio el retroceso (y por tanto el
 * sistema no debe salir a inicio) o `false` si no hay nada que retroceder
 * dentro de la app. Pasar `null` (o desmontar el componente) libera el
 * manejador, y el boton "Atras" vuelve a comportarse como salir a inicio.
 */
export function useBackHandler(handler: (() => boolean) | null) {
  const setBackHandler = useKernel((s) => s.setBackHandler)

  useEffect(() => {
    setBackHandler(handler)
    return () => setBackHandler(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler, setBackHandler])
}
