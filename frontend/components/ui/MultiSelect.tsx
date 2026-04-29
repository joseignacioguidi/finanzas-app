'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface MultiSelectOption {
  value: string
  label: string
  color?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  allLabel?: string
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  allLabel = 'Todas',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  function clearAll() {
    onChange([])
  }

  const label =
    selected.length === 0
      ? allLabel
      : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? placeholder
      : `${selected.length} categorías`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[11px] transition-colors whitespace-nowrap"
        style={{
          background: selected.length > 0 ? '#1a1a2e' : '#fff',
          color: selected.length > 0 ? '#fff' : '#888',
          border: selected.length > 0 ? '0.5px solid #1a1a2e' : '0.5px solid #d0d0cc',
        }}
      >
        {label}
        <ChevronDown
          size={10}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-50 rounded-[10px] py-1 min-w-[160px] max-h-[220px] overflow-y-auto"
          style={{ background: '#fff', border: '0.5px solid #e0e0d8', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        >
          {selected.length > 0 && (
            <>
              <button
                onClick={clearAll}
                className="w-full text-left px-3 py-1.5 text-[10px] text-[#888] hover:text-[#1a1a2e] transition-colors"
              >
                Limpiar selección
              </button>
              <div style={{ borderBottom: '0.5px solid #e8e8e0', margin: '2px 0' }} />
            </>
          )}
          {options.map(opt => {
            const isSelected = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-[#f7f7f2] transition-colors"
                style={{ color: isSelected ? '#1a1a2e' : '#555' }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: isSelected ? '#1a1a2e' : 'transparent',
                    border: isSelected ? '1px solid #1a1a2e' : '1px solid #d0d0cc',
                  }}
                >
                  {isSelected && <Check size={8} color="#fff" />}
                </div>
                {opt.color && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: opt.color }}
                  />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
