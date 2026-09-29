import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Width of the centered card. */
  width?: number
  footer?: ReactNode
}

export default function Modal({ open, onClose, title, children, width = 440, footer }: ModalProps) {
  const { t } = useTranslation('common')
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(2,9,19,0.5)' }}
      onClick={onClose}
    >
      <div
        className="fade-up w-full bg-white rounded-2xl shadow-[0px_12px_32px_rgba(0,0,0,0.16)] overflow-hidden"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-1">
            <h3 className="text-[18px] font-bold text-ink">{title}</h3>
            <button onClick={onClose} className="text-ink-faint hover:text-ink-sub" aria-label={t('modal.close')}>
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 pb-5 pt-1 flex gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}
