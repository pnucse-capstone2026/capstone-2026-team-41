import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import Icon, { type IconName } from './Icon'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: IconName
  /** Renders a show/hide toggle for password fields. */
  reveal?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, reveal, type = 'text', className = '', ...rest },
  ref,
) {
  const { t } = useTranslation('common')
  const [show, setShow] = useState(false)
  const inputType = reveal ? (show ? 'text' : 'password') : type

  return (
    <label className="flex flex-col gap-2 w-full">
      {label && <span className="text-[13px] font-medium text-ink-sub">{label}</span>}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            <Icon name={leftIcon} size={18} />
          </span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full h-[52px] rounded-xl bg-field border px-4 text-[15px] text-ink
            placeholder:text-ink-faint outline-none transition-colors
            focus:bg-white
            ${leftIcon ? 'pl-11' : ''} ${reveal ? 'pr-11' : ''}
            ${error ? 'border-danger focus:border-danger' : 'border-line focus:border-brand'}
            ${className}`}
          {...rest}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-sub"
            aria-label={show ? t('input.hidePassword') : t('input.showPassword')}
          >
            <Icon name={show ? 'eye-off' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {error ? (
        <span className="text-[12.5px] text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[12.5px] text-ink-muted">{hint}</span>
      ) : null}
    </label>
  )
})

export default Input
