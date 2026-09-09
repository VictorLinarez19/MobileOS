import { useKernel } from '../kernel/store'

/** Cuanto se oscurece la pantalla en el extremo minimo de brillo (0 = negro total). */
const MAX_DIM = 0.78

/**
 * RF-13: aplica visualmente el brillo de pantalla mediante un velo negro
 * semitransparente sobre todo el contenido del telefono.
 *
 * Antes de este componente, mover el control de brillo en Ajustes no tenia
 * ningun efecto visible: `settings.brightness` solo alimentaba el modelo de
 * consumo de bateria (RF-07), asi que subir o bajar el brillo no se notaba en
 * pantalla. El velo se dibuja por encima de todo (barra de estado, apps,
 * notificaciones, pantalla de bloqueo) porque en un telefono real el brillo
 * afecta la retroiluminacion completa, no solo el contenido de una app.
 */
export function BrightnessOverlay() {
  const brightness = useKernel((s) => s.settings.brightness)
  const dim = (1 - brightness) * MAX_DIM

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[60] bg-black transition-opacity duration-150"
      style={{ opacity: dim }}
    />
  )
}
