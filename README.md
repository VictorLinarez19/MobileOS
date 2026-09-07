# MobileOS

Simulador de Sistema Operativo Móvil — Universidad José Antonio Páez, materia Sistemas de Operación.

Cumple los 14 requisitos funcionales de `SISTEMA OPERATIVO MÓVIL.md`: gestor de ventanas con gestos táctiles, planificador de procesos Round-Robin, ciclo de vida de apps (foreground/background/paused/terminated), Low Memory Killer al 85% de RAM, consumo dinámico de batería con modo ahorro, sistema de archivos virtual persistente, gestor de archivos, cámara y galería, GPS virtual, panel de ajustes y monitor de recursos en tiempo real.

Es una PWA (React + TypeScript + Vite + Zustand): se abre en el navegador y funciona igual en PC, Android e iPhone, sin compilar nada nativo.

## Ejecutar en el PC

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. En escritorio se muestra un marco de teléfono; los gestos se controlan con el ratón (clic y arrastre).

## Probarlo en un iPhone conectado por USB

1. Conecta el iPhone por cable a la PC.
2. En el iPhone: **Ajustes → Compartir Internet** y actívalo. Si pide confiar en el equipo, acepta.
3. En la PC, averigua la IP asignada en la nueva interfaz de red:
   ```bash
   ip -4 addr
   ```
   Busca una interfaz nueva (normalmente `172.20.10.x`).
4. Levanta el servidor accesible desde la red:
   ```bash
   npm run dev:host
   ```
5. En Safari del iPhone, abre `http://<IP-de-la-PC>:5173`.
6. Opcional: en Safari, **Compartir → Añadir a pantalla de inicio** para verlo a pantalla completa, sin marco ni barra de Safari.

Si prefieres Wi-Fi en vez de USB, usa la IP de la LAN de la PC en su lugar — pero si tienes una VPN activa (por ejemplo Surfshark), es probable que bloquee el acceso desde otros dispositivos de la red local; desactívala o excluye la red local en su configuración.

## Probarlo en Android

Igual que en Wi-Fi, o con USB usando `adb reverse tcp:5173 tcp:5173` y abriendo `http://localhost:5173` en Chrome.

## Pruebas del kernel

```bash
npm run test
```

Cubre el planificador, el Low Memory Killer y el modelo de energía (`src/kernel/__tests__`).

## Estructura

- `src/kernel/` — el "sistema operativo": reloj, procesos, planificador, memoria, energía, sistema de archivos virtual y las syscalls que exponen todo esto a las apps.
- `src/shell/` — gestor de ventanas: launcher, barra de estado, notificaciones, recientes, gestos.
- `src/apps/` — las aplicaciones instaladas (Ajustes, Opciones de desarrollador, Archivos, Cámara, Galería, Mapas, Reloj, Mensajes, Notas, Navegador, Música, Video).
