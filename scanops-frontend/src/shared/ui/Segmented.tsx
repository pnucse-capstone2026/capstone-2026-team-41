interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}

/** Toss-style segmented control — pill track, white active thumb. */
export default function Segmented<T extends string>({ options, value, onChange, className = '' }: SegmentedProps<T>) {
  return (
    <div className={`inline-flex p-1 rounded-xl bg-field ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-4 h-9 rounded-lg text-sm font-semibold transition-all ${
              active
                ? 'bg-white text-ink shadow-[0px_2px_4px_rgba(0,0,0,0.06)]'
                : 'text-ink-muted hover:text-ink-sub'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
