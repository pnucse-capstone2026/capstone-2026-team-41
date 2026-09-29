import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 'flat' = 1px border, 'raised' = soft shadow (default), 'plain' = none. */
  elevation?: 'flat' | 'raised' | 'plain'
  pad?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  children?: ReactNode
}

const PAD = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export default function Card({
  elevation = 'flat',
  pad = 'md',
  interactive,
  className = '',
  children,
  ...rest
}: CardProps) {
  const elev =
    elevation === 'raised'
      ? 'bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.07)]'
      : elevation === 'flat'
        ? 'bg-white border border-line'
        : 'bg-white'
  return (
    <div
      {...rest}
      className={`rounded-2xl ${elev} ${PAD[pad]} ${
        interactive ? 'transition-all hover:border-line-strong hover:shadow-[0px_4px_16px_rgba(0,0,0,0.08)] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
