import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

type Variant = 'primary' | 'dark' | 'danger' | 'weak' | 'ghost' | 'outline' | 'github'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  leftIcon?: IconName
  rightIcon?: IconName
  children?: ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-press',
  dark: 'bg-ink text-white hover:opacity-90',
  danger: 'bg-danger text-white hover:opacity-90',
  weak: 'bg-brand-soft text-brand hover:bg-[#dceafe]',
  ghost: 'bg-transparent text-ink-sub hover:bg-field',
  outline: 'bg-white text-ink border border-line-strong hover:bg-surface',
  github: 'bg-ink text-white hover:opacity-90',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-[10px] gap-1.5',
  md: 'h-11 px-4 text-[14px] rounded-xl gap-2',
  lg: 'h-[54px] px-5 text-[15px] rounded-[14px] gap-2',
}

const ICON_SIZE: Record<Size, number> = { sm: 15, md: 17, lg: 18 }

export default function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT[variant]} ${SIZE[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <Icon name="loader" size={ICON_SIZE[size]} className="spin" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={ICON_SIZE[size]} />}
          {children}
          {rightIcon && <Icon name={rightIcon} size={ICON_SIZE[size]} />}
        </>
      )}
    </button>
  )
}
