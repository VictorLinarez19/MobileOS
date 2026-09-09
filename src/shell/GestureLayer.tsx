import { useKernel } from '../kernel/store'
import { useDrag } from './useDrag'

const SWIPE_PX = 55
const FLICK_V = 0.5

/**
 * RF-03: franjas transparentes en los bordes que traducen arrastres en gestos
 * de navegacion del sistema (no del contenido de la app):
 *
 * - Deslizar hacia abajo desde la barra de estado: abrir notificaciones.
 * - Deslizar hacia arriba desde el borde inferior: ir a inicio / recientes.
 *
 * Solo cubren los bordes reservados a la barra de estado y al indicador de
 * inicio, que no tienen contenido interactivo debajo; el resto de la pantalla
 * queda libre para que las apps (y los iconos del launcher) reciban sus
 * propios toques. El deslizamiento lateral entre paginas del launcher se
 * gestiona en el propio `Launcher`, no aqui.
 */
export function GestureLayer({ inApp }: { inApp: boolean }) {
  const goBack = useKernel((s) => s.goBack)
  const setRecentsOpen = useKernel((s) => s.setRecentsOpen)
  const setNotificationsOpen = useKernel((s) => s.setNotificationsOpen)

  const bottomBar = useDrag({
    onEnd: (info) => {
      if (info.dy > -SWIPE_PX && info.vy > -FLICK_V) return
      const longSwipe = info.dy < -140 || info.vy < -0.9
      if (inApp && !longSwipe) {
        // Mismo comportamiento que el boton "Atras" de la NavBar: primero
        // la navegacion interna de la app, y si no tiene, sale a inicio.
        goBack()
      } else {
        setRecentsOpen(true)
      }
    },
  })

  const topBar = useDrag({
    onEnd: (info) => {
      if (info.dy > SWIPE_PX || info.vy > FLICK_V) setNotificationsOpen(true)
    },
  })

  return (
    <>
      <div className="gesture-strip absolute inset-x-0 top-0 z-30" style={{ height: 'var(--status-h)' }} {...topBar} />
      <div className="gesture-strip absolute inset-x-0 bottom-0 z-30" style={{ height: 'var(--home-h)' }} {...bottomBar} />
    </>
  )
}
