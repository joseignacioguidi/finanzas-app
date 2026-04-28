import { ReactNode } from 'react'

type BadgeVariant = 'income' | 'expense' | 'neutral' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  style?: React.CSSProperties
}

const variantClasses: Record<BadgeVariant, string> = {
  income:
    'bg-[var(--color-income-bg)] text-[var(--color-income)] border border-[var(--color-income-border)]',
  expense:
    'bg-[var(--color-expense-bg)] text-[var(--color-expense)] border border-[var(--color-expense-border)]',
  neutral:
    'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]',
  default:
    'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
}

export default function Badge({ variant = 'default', children, style }: BadgeProps) {
  return (
    <span
      style={style}
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variantClasses[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
