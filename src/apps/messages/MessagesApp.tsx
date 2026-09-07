import { useMemo, useState } from 'react'
import { useKernel } from '../../kernel/store'
import { makeSyscalls } from '../../kernel/syscalls'
import { AppScreen, Button } from '../../shell/ui'

interface Msg {
  id: string
  from: 'me' | 'them'
  text: string
  at: number
}

const CONTACT = 'Ana (UJAP)'

/** Chat local de un solo hilo, persistido como JSON en /data/messages. */
export function MessagesApp() {
  const sys = useMemo(() => makeSyscalls('messages'), [])
  const online = useKernel((s) => s.settings.wifi || s.settings.mobileData)
  const t = useKernel((s) => s.t)
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const raw = sys.readText(`${sys.homeDir}/thread.json`)
    return raw ? (JSON.parse(raw) as Msg[]) : []
  })

  const persist = (next: Msg[]) => {
    setMsgs(next)
    sys.writeText(`${sys.homeDir}/thread.json`, JSON.stringify(next))
  }

  const send = () => {
    if (!text.trim() || !online) return
    const mine: Msg = { id: `${Date.now()}`, from: 'me', text: text.trim(), at: Date.now() }
    persist([...msgs, mine])
    setText('')
    setTimeout(() => {
      persist([
        ...msgs,
        mine,
        { id: `${Date.now()}-r`, from: 'them', text: '👍 Recibido', at: Date.now() },
      ])
    }, 900)
  }

  return (
    <AppScreen title={`${t('msg.title')} · ${CONTACT}`}>
      <div className="flex h-[calc(100%-56px)] flex-col">
        <div className="app-scroll flex-1 space-y-2 pb-3">
          {msgs.length === 0 && <p className="pt-10 text-center text-[13px] text-slate-500">{t('msg.empty')}</p>}
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <span
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] ${
                  m.from === 'me' ? 'bg-sky-500 text-white' : 'bg-white/12 text-slate-100'
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>

        {!online && <p className="mb-2 text-[12px] text-amber-400">{t('msg.offline')}</p>}

        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('msg.placeholder')}
            className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-[14px] text-slate-100 outline-none"
          />
          <Button tone="primary" onClick={send}>
            {t('msg.send')}
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}
