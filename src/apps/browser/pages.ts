export interface BrowserPage {
  url: string
  title: string
  body: string
}

/** Paginas internas del navegador (ver nota del plan: no se cargan sitios reales en iframe). */
export const BROWSER_PAGES: Record<string, BrowserPage> = {
  'inicio.os': {
    url: 'inicio.os',
    title: 'Inicio',
    body: 'Bienvenido al navegador del simulador. Prueba visitar ujap.os, clima.os o noticias.os.',
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
}
