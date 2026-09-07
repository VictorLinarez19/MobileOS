import type { ComponentType } from 'react'
import { SettingsApp } from './settings/SettingsApp'
import { DevToolsApp } from './devtools/DevToolsApp'
import { FilesApp } from './files/FilesApp'
import { CameraApp } from './camera/CameraApp'
import { GalleryApp } from './gallery/GalleryApp'
import { MapsApp } from './maps/MapsApp'
import { ClockApp } from './clock/ClockApp'
import { NotesApp } from './notes/NotesApp'
import { MessagesApp } from './messages/MessagesApp'
import { BrowserApp } from './browser/BrowserApp'
import { MusicApp } from './music/MusicApp'
import { VideoApp } from './video/VideoApp'

/** Une cada id de app de `manifests.ts` con el componente que la renderiza. */
export const APP_COMPONENTS: Record<string, ComponentType> = {
  settings: SettingsApp,
  devtools: DevToolsApp,
  files: FilesApp,
  camera: CameraApp,
  gallery: GalleryApp,
  maps: MapsApp,
  clock: ClockApp,
  notes: NotesApp,
  messages: MessagesApp,
  browser: BrowserApp,
  music: MusicApp,
  video: VideoApp,
}

export { APP_MANIFESTS, MANIFEST_BY_ID } from './manifests'
