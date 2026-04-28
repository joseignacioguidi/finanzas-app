'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', id, children, ...props }, ref) => {
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
        <select
          ref={ref}
          id={inputId}
          className={[
            'h-10 w-full rounded-md px-3 text-sm appearance-none',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
            'border outline-none transition-all duration-150 cursor-pointer',
            'focus:ring-2 focus:ring-[var(--color-brand-glow)]',
            error
              ? 'border-[var(--color-expense)] focus:border-[var(--color-expense)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-brand)]',
            className,
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[var(--color-expense)]">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
