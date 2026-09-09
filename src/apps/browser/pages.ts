export interface BrowserPage {
  url: string
  title: string
  body: string
  /** Falso solo en la pagina de demostracion; el resto son "https" simuladas. */
  secure?: boolean
}

/** Paginas internas del navegador (ver nota del plan: no se cargan sitios reales en iframe). */
export const BROWSER_PAGES: Record<string, BrowserPage> = {
  'inicio.os': {
    url: 'inicio.os',
    title: 'Inicio',
    body: 'Bienvenido al navegador del simulador. Prueba visitar ujap.os, clima.os, noticias.os o descargas.os.',
  },
  'ujap.os': {
    url: 'ujap.os',
    title: 'Universidad Jose Antonio Paez',
    body: 'Sistemas de Operacion — Especificacion de Requisitos Funcionales del Simulador de SO Movil.',
  },
  'clima.os': {
    url: 'clima.os',
    title: 'El Clima',
    body: 'Valencia, Venezuela: 29°C, parcialmente nublado. Humedad 68%.',
  },
  'noticias.os': {
    url: 'noticias.os',
    title: 'Noticias',
    body: 'El Low Memory Killer del simulador cerro 3 procesos hoy para liberar RAM.',
  },
  'servidor-viejo.os': {
    url: 'servidor-viejo.os',
    title: 'Portal del Servidor Viejo',
    body: 'Este servidor todavia no migro a cifrado. Fijate en el icono de la barra de direcciones: muestra una advertencia en vez del candado.',
    secure: false,
  },
}
