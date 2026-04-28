'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'h-10 w-full rounded-md px-3 text-sm',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
            'border outline-none transition-all duration-150',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:ring-2 focus:ring-[var(--color-brand-glow)]',
            error
              ? 'border-[var(--color-expense)] focus:border-[var(--color-expense)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-brand)]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-expense)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
