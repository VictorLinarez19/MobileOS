/**
 * RF-09: sistema de archivos virtual jerarquico.
 *
 * El arbol es inmutable: cada operacion devuelve una raiz nueva, lo que permite
 * guardarlo en el store de Zustand y persistirlo en IndexedDB sin sorpresas.
 * El contenido binario (fotos) no vive en el arbol sino en IndexedDB bajo la
 * clave `blobKey`, para que el arbol siga siendo ligero de serializar.
 */

export interface VFile {
  type: 'file'
  name: string
  createdAt: number
  modifiedAt: number
  /** Tamano en bytes. */
  size: number
  mime: string
  /** Clave del blob asociado en IndexedDB, si el archivo es binario. */
  blobKey?: string
  /** Contenido textual embebido, para archivos de configuracion y notas. */
  text?: string
  /** RF-10: marca los archivos que el gestor puede borrar como cache. */
  cache?: boolean
}

export interface VDir {
  type: 'dir'
  name: string
  createdAt: number
  children: VNode[]
  /** Directorio protegido: el gestor de archivos no permite eliminarlo. */
  system?: boolean
}

export type VNode = VFile | VDir

export function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean)
}

export function joinPath(...parts: string[]): string {
  return '/' + parts.flatMap(splitPath).join('/')
}

export function parentOf(path: string): string {
  const segs = splitPath(path)
  segs.pop()
  return '/' + segs.join('/')
}

export function baseName(path: string): string {
  const segs = splitPath(path)
  return segs[segs.length - 1] ?? '/'
}

function dir(name: string, children: VNode[] = [], system = false): VDir {
  return { type: 'dir', name, createdAt: Date.now(), children, system }
}

/** Arbol inicial que el sistema crea en el primer arranque. */
export function createRootFs(): VDir {
  return dir(
    '',
    [
      dir('system', [textFile('build.prop', BUILD_PROP, 'text/plain')], true),
      dir('data', [], true),
      dir('storage', [dir('DCIM'), dir('Descargas'), dir('Documentos')]),
      dir('cache', [], true),
    ],
    true,
  )
}

const BUILD_PROP = [
  'ro.product.model=UJAP Virtual Phone',
  'ro.product.brand=SimuladorSO',
  'ro.build.version=1.0.0',
  'ro.hardware.ram=4096MB',
].join('\n')

export function textFile(name: string, text: string, mime = 'text/plain'): VFile {
  const now = Date.now()
  return {
    type: 'file',
    name,
    createdAt: now,
    modifiedAt: now,
    size: new Blob([text]).size,
    mime,
    text,
  }
}

/** Localiza un nodo por su ruta absoluta. Devuelve null si no existe. */
export function resolve(root: VDir, path: string): VNode | null {
  let node: VNode = root
  for (const seg of splitPath(path)) {
    if (node.type !== 'dir') return null
    const children: VNode[] = node.children
    const child: VNode | undefined = children.find((c) => c.name === seg)
    if (!child) return null
    node = child
  }
  return node
}

export function resolveDir(root: VDir, path: string): VDir | null {
  const node = resolve(root, path)
  return node && node.type === 'dir' ? node : null
}

/** Aplica `fn` al directorio indicado y reconstruye el camino hasta la raiz. */
function updateDir(node: VDir, segments: string[], fn: (d: VDir) => VDir): VDir {
  if (segments.length === 0) return fn(node)
  const [head, ...rest] = segments
  const idx = node.children.findIndex((c) => c.name === head && c.type === 'dir')
  if (idx === -1) return node
  const child = node.children[idx] as VDir
  const updated = updateDir(child, rest, fn)
  if (updated === child) return node
  const children = [...node.children]
  children[idx] = updated
  return { ...node, children }
}

/** Crea un directorio y todos sus ancestros que falten. */
export function mkdirp(root: VDir, path: string): VDir {
  const segments = splitPath(path)
  let current = root
  for (let i = 0; i < segments.length; i++) {
    const ancestors = segments.slice(0, i)
    const name = segments[i]
    current = updateDir(current, ancestors, (d) =>
      d.children.some((c) => c.name === name && c.type === 'dir')
        ? d
        : { ...d, children: [...d.children, dir(name)] },
    )
  }
  return current
}

/** Escribe (o reemplaza) un archivo, creando los directorios necesarios. */
export function writeFile(root: VDir, path: string, file: Omit<VFile, 'type' | 'name'>): VDir {
  const parent = parentOf(path)
  const name = baseName(path)
  const withDirs = mkdirp(root, parent)
  return updateDir(withDirs, splitPath(parent), (d) => {
    const node: VFile = { type: 'file', name, ...file }
    const idx = d.children.findIndex((c) => c.name === name)
    const children = [...d.children]
    if (idx === -1) children.push(node)
    else children[idx] = { ...node, createdAt: (d.children[idx] as VFile).createdAt ?? node.createdAt }
    return { ...d, children }
  })
}

/** Elimina un nodo. Devuelve la raiz sin cambios si la ruta no existe. */
export function removeNode(root: VDir, path: string): VDir {
  const parent = parentOf(path)
  const name = baseName(path)
  if (!name) return root
  return updateDir(root, splitPath(parent), (d) => {
    if (!d.children.some((c) => c.name === name)) return d
    return { ...d, children: d.children.filter((c) => c.name !== name) }
  })
}

/** Vacia el contenido de un directorio sin eliminarlo. */
export function emptyDir(root: VDir, path: string): VDir {
  return updateDir(root, splitPath(path), (d) =>
    d.children.length === 0 ? d : { ...d, children: [] },
  )
}

/** Tamano total en bytes de un nodo, recorriendo los subdirectorios. */
export function sizeOf(node: VNode): number {
  if (node.type === 'file') return node.size
  return node.children.reduce((sum, c) => sum + sizeOf(c), 0)
}

/** Recorre el arbol devolviendo cada archivo junto a su ruta absoluta. */
export function walkFiles(node: VDir, prefix = ''): { path: string; file: VFile }[] {
  const out: { path: string; file: VFile }[] = []
  for (const child of node.children) {
    const path = `${prefix}/${child.name}`
    if (child.type === 'file') out.push({ path, file: child })
    else out.push(...walkFiles(child, path))
  }
  return out
}

/** Todas las claves de blob referenciadas por el arbol, para depurar huerfanos. */
export function referencedBlobKeys(root: VDir): Set<string> {
  return new Set(
    walkFiles(root)
      .map(({ file }) => file.blobKey)
      .filter((k): k is string => Boolean(k)),
  )
}

/** Formatea bytes de forma legible para el gestor de archivos. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}
