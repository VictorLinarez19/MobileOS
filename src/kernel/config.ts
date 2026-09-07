/** Constantes de configuracion del kernel simulado. */

/** Periodo del reloj del kernel en milisegundos (10 Hz). */
export const TICK_MS = 100

/** RAM total simulada del dispositivo. */
export const MEMORY_TOTAL_MB = 4096

/** RAM reservada permanentemente por el sistema operativo. */
export const MEMORY_SYSTEM_RESERVED_MB = 780

/** RF-06: umbral por encima del cual actua el Low Memory Killer. */
export const LMK_THRESHOLD = 0.85

/** Umbral al que intenta bajar el LMK tras matar procesos, para evitar oscilar. */
export const LMK_TARGET = 0.75

/** Quantum en ticks para el proceso en primer plano. */
export const QUANTUM_FOREGROUND = 4

/** Quantum en ticks para los procesos en segundo plano. */
export const QUANTUM_BACKGROUND = 1

/** Factor de throttling de CPU aplicado en modo ahorro de energia (RF-08). */
export const POWERSAVE_CPU_THROTTLE = 0.55

/** Multiplicador de consumo aplicado en modo ahorro de energia. */
export const POWERSAVE_DRAIN_FACTOR = 0.6

/**
 * Aceleracion del tiempo para la bateria: 1 segundo real = 60 segundos simulados.
 * Sin esto la descarga seria imperceptible durante una demostracion.
 */
export const BATTERY_TIME_SCALE = 60

/** Almacenamiento interno simulado en bytes (32 GB). */
export const STORAGE_TOTAL_BYTES = 32 * 1024 * 1024 * 1024

/** Coeficientes del modelo de consumo de bateria (RF-07), en % por hora simulada. */
export const DRAIN = {
  /** Consumo en reposo con la pantalla encendida al minimo. */
  base: 1.2,
  /** Contribucion de la carga de CPU. */
  cpu: 5.0,
  /** Contribucion del brillo de pantalla. */
  brightness: 3.6,
  /** Contribucion de la radio Wi-Fi encendida. */
  wifi: 0.7,
  /** Contribucion de los datos moviles encendidos. */
  mobileData: 1.5,
  /** Contribucion por cada proceso vivo ademas del de primer plano. */
  perProcess: 0.2,
} as const

/** Velocidad de carga en % por hora simulada cuando el cargador esta conectado. */
export const CHARGE_PER_HOUR = 55
