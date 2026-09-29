import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

type ToastTone = 'default' | 'success' | 'danger'
interface ToastItem { id: number; message: string; tone: ToastTone }

interface ToastCtx {
  toast: (message: string, tone?: ToastTone, durationMs?: number) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be used within ToastProvider')
  return c
}

const ICON: Record<ToastTone, IconName> = {
  default: 'info',
  success: 'check-circle',
  danger: 'alert-circle',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, tone: ToastTone = 'default', durationMs = 2800) => {
    const id = Date.now() + Math.random()
    setItems((arr) => [...arr, { id, message, tone }])
    setTimeout(() => setItems((arr) => arr.filter((t) => t.id !== id)), durationMs)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-5 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink text-white px-4 py-3 text-sm font-medium shadow-[0px_4px_12px_rgba(0,0,0,0.18)] max-w-[420px]"
          >
            <span
              className={
                t.tone === 'success' ? 'text-success' : t.tone === 'danger' ? 'text-danger' : 'text-brand'
              }
            >
              <Icon name={ICON[t.tone]} size={18} />
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
