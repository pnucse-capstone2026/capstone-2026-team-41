interface AvatarProps {
  name?: string
  src?: string | null
  size?: number
  className?: string
}

/** Circular avatar: image when available, otherwise an initial on ink bg. */
export default function Avatar({ name, src, size = 32, className = '' }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? 'U').toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'avatar'}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className={`rounded-full bg-ink text-white inline-flex items-center justify-center font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
