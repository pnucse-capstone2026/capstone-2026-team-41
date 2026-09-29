interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

/** Toss-style switch — brand when on, grey track when off. */
export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-[44px] h-[26px] rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        checked ? 'bg-brand' : 'bg-line-strong'
      }`}
    >
      <span
        className="absolute top-1 left-1 w-[18px] h-[18px] rounded-full bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.2)] transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}
