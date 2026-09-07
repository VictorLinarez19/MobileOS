                                      SISTEMAS DE OPERACIÓN

UNIVERSIDAD JOSÉ ANTONIO PÁEZ

Especificación de Requisitos Funcionales: Simulador de Sistema Operativo Móvil

1. Módulo de Interfaz de Usuario y Gestor de Ventanas (UI / Window Manager)

    RF-01: Pantalla de Inicio (Launcher): El simulador debe mostrar una interfaz gráfica
principal que contenga una cuadrícula de iconos interactivos correspondientes a las
aplicaciones disponibles (ej. Ajustes, Navegador, Cámara, Reloj, Mensajes).

    RF-02: Barra de Estado y Notificaciones: El sistema debe incluir una barra superior
persistente que muestre indicadores en tiempo real (nivel de batería, conectividad simulada
de red/Wi-Fi y hora actual), además de permitir desplegar un panel de notificaciones
flotantes.

    RF-03: Navegación Táctil / Gestual: El simulador debe registrar eventos de clic y
arrastre del ratón para emular gestos táctiles (tocar para abrir, deslizar hacia los lados para
cambiar de pantalla, o deslizar hacia arriba para cerrar/minimizar una aplicación).

2. Módulo de Gestión de Procesos y Ciclo de Vida de Aplicaciones

    RF-04: Ejecución Concurrente: El simulador debe permitir la ejecución simultánea de
múltiples aplicaciones en un entorno multitarea.

    RF-05: Ciclo de Vida de Apps (Foreground / Background): El sistema operativo
simulado debe gestionar los estados de las aplicaciones móviles:

        Running (en primer plano y activa).

        Paused / Background (en segundo plano, consumiendo recursos mínimos).

                                      SISTEMAS DE OPERACIÓN

UNIVERSIDAD JOSÉ ANTONIO PÁEZ

        Terminated (cerrada explícitamente o por falta de memoria). RF-06: Manejo de
Memoria Estrecha (Low Memory Killer): El simulador debe monitorear el consumo de
RAM de las aplicaciones abiertas y terminar automáticamente la aplicación en segundo
plano con mayor antigüedad o menor prioridad cuando el umbral de memoria simulada
supere el 85%.

3. Módulo de Gestión de Energía y Batería (Power Management)

    RF-07: Consumo Dinámico de Batería: El sistema debe disminuir el porcentaje de la
batería simulada en función de la carga de trabajo actual (ej. mayor consumo si hay
aplicaciones exigentes en primer plano, brillo de pantalla alto o uso del módulo de red).

    RF-08: Modo de Ahorro de Energía: El usuario debe poder activar un interruptor de
"Ahorro de Batería" que limite la frecuencia de procesamiento simulada (CPU throttling) y
suspenda los procesos en segundo plano no esenciales para extender la vida útil de la
batería.

4. Módulo de Almacenamiento y Sistema de Archivos

    RF-09: Almacenamiento Interno Persistente: El simulador debe proveer un sistema de
archivos virtual jerárquico donde las aplicaciones puedan leer y escribir datos persistentes
(ej. configuraciones de usuario, notas guardadas, fotos simuladas).

    RF-10: Gestor de Archivos (App de Explorador): Debe incluir una aplicación utilitaria
que permita al usuario visualizar la estructura de carpetas interna, ver el espacio ocupado y
eliminar archivos temporales o caché de aplicaciones.

                                      SISTEMAS DE OPERACIÓN

UNIVERSIDAD JOSÉ ANTONIO PÁEZ

5. Módulo de Periféricos y Sensores Simulados

    RF-11: Simulación de Cámara y Galería: El simulador debe permitir "tomar una foto"
(cargando una imagen predeterminada o seleccionada desde el PC anfitrión) y almacenarla
en una galería de fotos accesible por otras aplicaciones.

    RF-12: Geolocalización (GPS Virtual): El sistema debe proveer una interfaz para
modificar o simular coordenadas geográficas (latitud y longitud) que las aplicaciones
basadas en ubicación puedan consultar mediante una API simulada.

6. Módulo de Ajustes y Configuración del Sistema

    RF-13: Panel de Control (Settings): Una aplicación de configuración que permita
modificar parámetros globales del sistema operativo móvil:

        Brillo de pantalla (con impacto directo en el consumo de batería).

        Conectividad (activar/desactivar Wi-Fi o Datos Móviles).

        Idioma y zona horaria.

    RF-14: Monitor de Recursos (Developer Options): Una sección de diagnóstico que
permita visualizar en tiempo real el uso de CPU simulada, memoria RAM consumida por
cada proceso activo y el estado actual de la batería.

