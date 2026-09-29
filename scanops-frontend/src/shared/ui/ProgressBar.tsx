interface ProgressBarProps {
  value: number // 0–100
  color?: string
  height?: number
  className?: string
}

export default function ProgressBar({ value, color = 'var(--color-brand)', height = 8, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full rounded-full bg-field overflow-hidden ${className}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}
