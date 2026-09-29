import type { ReactNode } from 'react'

type Tone =
  | 'brand' | 'neutral' | 'success' | 'danger' | 'warning' | 'purple' | 'info'
  | 'critical' | 'high' | 'medium' | 'low'

const TONE: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand',
  neutral: 'bg-field text-ink-sub',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-[#c4760a]',
  purple: 'bg-purple-soft text-purple',
  info: 'bg-[#e6f6f6] text-info',
  critical: 'bg-[#fde7e9] text-[#e02d3c]',
  high: 'bg-danger-soft text-danger',
  medium: 'bg-warning-soft text-[#c4760a]',
  low: 'bg-brand-soft text-brand',
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  size?: 'sm' | 'md'
  solid?: boolean
  className?: string
}

const SOLID: Partial<Record<Tone, string>> = {
  brand: 'bg-brand text-white',
  success: 'bg-success text-white',
  danger: 'bg-danger text-white',
  critical: 'bg-[#e02d3c] text-white',
  high: 'bg-danger text-white',
  medium: 'bg-warning text-white',
  low: 'bg-brand text-white',
  neutral: 'bg-ink-sub text-white',
}

export default function Badge({ tone = 'neutral', size = 'md', solid, children, className = '' }: BadgeProps) {
  const sz = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-[12px] px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${
        solid ? SOLID[tone] ?? TONE[tone] : TONE[tone]
      } ${sz} ${className}`}
    >
      {children}
    </span>
  )
}

/** Maps a vulnerability severity to its badge label + tone. */
export function SeverityBadge({ severity, size = 'md' }: { severity: string; size?: 'sm' | 'md' }) {
  const s = severity.toUpperCase()
  const map: Record<string, { tone: Tone; label: string }> = {
    CRITICAL: { tone: 'critical', label: 'Critical' },
    HIGH: { tone: 'high', label: 'High' },
    MEDIUM: { tone: 'medium', label: 'Medium' },
    LOW: { tone: 'low', label: 'Low' },
    INFO: { tone: 'neutral', label: 'Info' },
  }
  const m = map[s] ?? map.INFO
  return <Badge tone={m.tone} size={size}>{m.label}</Badge>
}
