import type { ReactNode } from 'react'
import Icon from './Icon'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label?: ReactNode
  bold?: boolean
  className?: string
}

export default function Checkbox({ checked, onChange, label, bold, className = '' }: CheckboxProps) {
  return (
    <button type="button" onClick={onChange} className={`flex items-center gap-2.5 text-left ${className}`}>
      <span
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
          checked ? 'bg-brand border-brand text-white' : 'bg-white border-line-strong text-transparent'
        }`}
      >
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
      {label && <span className={`text-sm ${bold ? 'text-ink font-semibold' : 'text-ink-sub'}`}>{label}</span>}
    </button>
  )
}
