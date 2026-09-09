import { useMemo, useState } from 'react'
import { useKernel } from '../../kernel/store'
import { makeSyscalls } from '../../kernel/syscalls'
import { walkFiles } from '../../kernel/vfs'
import { AppScreen, Button, Empty, Section } from '../../shell/ui'
import { useBackHandler } from '../../shell/useBackHandler'

/** Demuestra la persistencia del RF-09: cada nota es un archivo de texto en /storage/Documentos. */
export function NotesApp() {
  const sys = useMemo(() => makeSyscalls('notes'), [])
  const fs = useKernel((s) => s.fs)
  const t = useKernel((s) => s.t)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  // RF-03: el boton/gesto "Atras" del sistema cierra el editor (sin guardar)
  // antes de salir a inicio; en la lista de notas no hay nada que retroceder.
  useBackHandler(
    editing !== null
      ? () => {
          setEditing(null)
          return true
        }
      : null,
  )

  const notes = walkFiles(fs)
    .filter(({ path }) => path.startsWith('/storage/Documentos/') && path.endsWith('.txt'))
    .sort((a, b) => (b.file.modifiedAt ?? 0) - (a.file.modifiedAt ?? 0))

  const openNew = () => {
    const name = `Nota-${Date.now()}.txt`
    setEditing(`/storage/Documentos/${name}`)
    setDraft('')
  }

  const save = () => {
    if (!editing) return
    sys.writeText(editing, draft)
    setEditing(null)
  }

  if (editing) {
    return (
      <AppScreen
        title={t('notes.title')}
        actions={
          <Button tone="primary" onClick={save}>
            {t('notes.save')}
          </Button>
        }
      >
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('notes.placeholder')}
          className="app-scroll h-64 w-full resize-none rounded-2xl bg-white/8 p-4 text-[14px] text-slate-100 outline-none ring-1 ring-white/10"
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen
      title={t('notes.title')}
      actions={
        <Button tone="primary" onClick={openNew}>
          + {t('notes.new')}
        </Button>
      }
    >
      {notes.length === 0 ? (
        <Empty>{t('notes.empty')}</Empty>
      ) : (
        <Section>
          {notes.map(({ path, file }) => (
            <div key={path} className="flex items-center gap-2 border-b border-white/8 px-4 py-3 last:border-b-0">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  setEditing(path)
                  setDraft(file.text ?? '')
                }}
              >
                <p className="truncate text-[14px] text-slate-100">{file.text?.slice(0, 40) || file.name}</p>
                <p className="text-[11px] text-slate-500">{new Date(file.modifiedAt).toLocaleString()}</p>
              </button>
              <button onClick={() => sys.remove(path)} className="text-[12px] text-rose-400">
                {t('notes.delete')}
              </button>
            </div>
          ))}
        </Section>
      )}
    </AppScreen>
  )
}
