import { useEffect, useState } from 'react'
import { useKernel } from '../../kernel/store'
import { getBlob } from '../../kernel/persist'
import { walkFiles } from '../../kernel/vfs'
import { AppScreen, Empty } from '../../shell/ui'

/** RF-11: galeria de fotos, accesible por otras apps a traves del mismo VFS. */
export function GalleryApp() {
  const fs = useKernel((s) => s.fs)
  const remove = useKernel((s) => s.fsRemove)
  const t = useKernel((s) => s.t)
  const [urls, setUrls] = useState<Record<string, string>>({})

  const dcim = walkFiles(fs).filter(({ path }) => path.startsWith('/storage/DCIM/'))

  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    ;(async () => {
      for (const { path, file } of dcim) {
        if (!file.blobKey || urls[path]) continue
        const blob = await getBlob(file.blobKey)
        if (blob && !cancelled) {
          const url = URL.createObjectURL(blob)
          created.push(url)
          setUrls((u) => ({ ...u, [path]: url }))
        }
      }
    })()
    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs])

  return (
    <AppScreen title={`${t('gal.title')} · ${t('gal.photos', { n: dcim.length })}`}>
      {dcim.length === 0 ? (
        <Empty>{t('gal.empty')}</Empty>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {dcim
            .slice()
            .reverse()
            .map(({ path, file }) => (
              <button
                key={path}
                onClick={() => confirm(t('files.confirmDelete', { name: file.name })) && remove(path)}
                className="aspect-square overflow-hidden rounded-lg bg-white/8"
                title={t('gal.delete')}
              >
                {urls[path] && <img src={urls[path]} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
        </div>
      )}
    </AppScreen>
  )
}
