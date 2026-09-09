import { useState } from 'react'
import { useKernel } from '../../kernel/store'
import { formatBytes, joinPath, parentOf, resolveDir, sizeOf, splitPath, type VDir } from '../../kernel/vfs'
import { STORAGE_TOTAL_BYTES } from '../../kernel/config'
import { AppScreen, Bar, Button, Empty, Row, Section } from '../../shell/ui'
import { useBackHandler } from '../../shell/useBackHandler'

/** RF-10: explorador del sistema de archivos virtual jerarquico. */
export function FilesApp() {
  const [path, setPath] = useState('/')
  const fs = useKernel((s) => s.fs)
  const remove = useKernel((s) => s.fsRemove)
  const clearCache = useKernel((s) => s.fsClearCache)
  const used = useKernel((s) => s.storageUsedBytes())
  const t = useKernel((s) => s.t)

  const dir: VDir | null = resolveDir(fs, path)
  const segments = splitPath(path)

  // RF-03: el boton/gesto "Atras" del sistema sube un nivel de carpeta antes
  // de salir a inicio; en la raiz no hay nada que retroceder dentro de la app.
  useBackHandler(
    path !== '/'
      ? () => {
          setPath(parentOf(path))
          return true
        }
      : null,
  )

  return (
    <AppScreen title={t('files.title')}>
      <Section>
        <Row label={t('files.used')} value={formatBytes(used)}>
          <Bar value={used / STORAGE_TOTAL_BYTES} color="#8b5cf6" />
          <p className="mt-1 text-[11px] text-slate-500">
            {t('files.free')}: {formatBytes(STORAGE_TOTAL_BYTES - used)}
          </p>
        </Row>
      </Section>

      <div className="mb-3 flex items-center gap-2 overflow-x-auto px-1 text-[13px] text-slate-300">
        <button onClick={() => setPath('/')} className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1">
          /
        </button>
        {segments.map((seg, i) => (
          <button
            key={i}
            onClick={() => setPath(joinPath(...segments.slice(0, i + 1)))}
            className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1"
          >
            {seg}
          </button>
        ))}
      </div>

      {!dir ? (
        <Empty>{t('files.empty')}</Empty>
      ) : (
        <Section>
          {dir.children.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-slate-500">{t('files.empty')}</p>
          ) : (
            [...dir.children]
              .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1))
              .map((node) => (
                <Row
                  key={node.name}
                  label={
                    <span>
                      {node.type === 'dir' ? '📁' : '📄'} {node.name}
                    </span>
                  }
                  value={formatBytes(sizeOf(node))}
                  onClick={() => {
                    if (node.type === 'dir') setPath(joinPath(path, node.name))
                  }}
                >
                  <div className="mt-1 flex justify-end">
                    {!(node.type === 'dir' && node.system) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(t('files.confirmDelete', { name: node.name })))
                            remove(joinPath(path, node.name))
                        }}
                        className="text-[12px] text-rose-400 active:opacity-60"
                      >
                        {t('files.delete')}
                      </button>
                    )}
                  </div>
                </Row>
              ))
          )}
        </Section>
      )}

      <Button full tone="danger" onClick={clearCache}>
        {t('files.clearCache')}
      </Button>
    </AppScreen>
  )
}
