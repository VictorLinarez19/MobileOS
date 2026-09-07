/**
 * Tipos fundamentales del kernel simulado.
 * Este archivo no depende de React: el kernel debe poder probarse aislado.
 */

/** RF-05: estados del ciclo de vida de una aplicacion movil. */
export type ProcessState = 'running' | 'background' | 'paused' | 'terminated'

/** Bloque de Control de Proceso (PCB). */
export interface PCB {
  pid: number
  appId: string
  state: ProcessState
  /** 0 = maxima prioridad. Las apps de sistema tienen prioridad alta. */
  priority: number
  /** RAM ocupada en MB. Crece mientras el proceso vive y se recorta al pasar a background. */
  memoryMB: number
  /** RAM inicial declarada por la app en su manifiesto. */
  baseMemoryMB: number
  /** Demanda de CPU 0..1 cuando el proceso tiene el procesador. */
  cpuDemand: number
  /** Tick del kernel en el que se creo el proceso. */
  createdAt: number
  /** Ultimo tick en el que el proceso estuvo en primer plano. Desempata el LMK. */
  lastForegroundAt: number
  /** Milisegundos de CPU acumulados. Alimenta el monitor de recursos (RF-14). */
  cpuTimeMs: number
  /** Uso de CPU suavizado (0..1) mostrado en el monitor. */
  cpuUsage: number
  /** Ticks de quantum que le quedan al proceso en su turno actual. */
  quantumLeft: number
  /** Si es true el Low Memory Killer nunca lo elige como victima. */
  essential: boolean
  /** True solo para el proceso que tiene el procesador en el tick actual. */
  onCpu: boolean
  /** Tick en el que se termino el proceso. Se conserva unos segundos para que
   *  el monitor de recursos muestre la transicion a `terminated` (RF-05). */
  terminatedAt?: number
}

/** Notificacion mostrada en el panel desplegable (RF-02). */
export interface SystemNotification {
  id: string
  appId: string
  title: string
  body: string
  /** Marca de tiempo real (Date.now()). */
  at: number
}

/** Coordenadas del GPS virtual (RF-12). */
export interface GeoPosition {
  latitude: number
  longitude: number
  accuracyM: number
  label: string
}

/** Ajustes globales del sistema (RF-13). */
export interface SystemSettings {
  /** Brillo de pantalla 0.1..1. Impacta el consumo de bateria. */
  brightness: number
  wifi: boolean
  mobileData: boolean
  /** RF-08: modo de ahorro de energia. */
  powerSave: boolean
  language: 'es' | 'en'
  timeZone: string
}

/** Instantanea de las metricas globales para el monitor de recursos (RF-14). */
export interface KernelMetrics {
  /** Carga de CPU del sistema 0..1. */
  cpuLoad: number
  /** RAM usada en MB, incluyendo la reservada por el sistema. */
  memoryUsedMB: number
  memoryTotalMB: number
  /** Porcentaje de bateria 0..100. */
  battery: number
  charging: boolean
  /** Consumo instantaneo en % por hora simulada. */
  drainPerHour: number
  /** Factor de throttling de CPU aplicado (1 = sin limitar). */
  cpuThrottle: number
  /** Ticks transcurridos desde el arranque. */
  uptimeTicks: number
}

/**
 * Manifiesto de una aplicacion: los datos que el kernel necesita para crear
 * su proceso. Deliberadamente sin JSX para que el kernel siga siendo testeable.
 */
export interface AppManifest {
  id: string
  /** Clave de traduccion del nombre visible. */
  nameKey: string
  /** Emoji usado como icono en el launcher. */
  icon: string
  /** Color de fondo del icono. */
  color: string
  /** RAM que reserva al arrancar, en MB. */
  memoryMB: number
  /** Demanda de CPU 0..1 cuando tiene el procesador. */
  cpuDemand: number
  /** 0 = maxima prioridad. */
  priority: number
  /** Si es true queda exenta del Low Memory Killer. */
  essential: boolean
}
