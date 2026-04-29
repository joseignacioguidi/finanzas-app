'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthPickerProps {
  month: string // YYYY-MM
  onChange: (month: string) => void
}

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1)
    .toLocaleString('es', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

function addMonths(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-[6px] overflow-hidden"
      style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
    >
      <button
        onClick={() => onChange(addMonths(month, -1))}
        className="flex items-center justify-center w-[22px] h-[26px] hover:bg-[#ededea] transition-colors"
        style={{ color: '#888' }}
      >
        <ChevronLeft size={12} />
      </button>
      <span
        className="text-[11px] text-[var(--color-text-muted)] px-1 select-none"
        style={{ minWidth: 100, textAlign: 'center' }}
      >
        {monthLabel(month)}
      </span>
      <button
        onClick={() => onChange(addMonths(month, 1))}
        className="flex items-center justify-center w-[22px] h-[26px] hover:bg-[#ededea] transition-colors"
        style={{ color: '#888' }}
      >
        <ChevronRight size={12} />
      </button>
    </div>
  )
}
