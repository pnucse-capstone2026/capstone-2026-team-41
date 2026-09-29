interface LogoProps {
  size?: number
  onClick?: () => void
}

/** ScanOps wordmark with a hexagon mark, matching the V2 light design. */
export default function Logo({ size = 19, onClick }: LogoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 select-none"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 1.5l9.1 5.25v10.5L12 22.5 2.9 17.25V6.75L12 1.5z"
          fill="var(--color-brand)"
        />
      </svg>
      <span
        className="font-bold tracking-tight text-ink"
        style={{ fontSize: size }}
      >
        ScanOps
      </span>
    </button>
  )
}
