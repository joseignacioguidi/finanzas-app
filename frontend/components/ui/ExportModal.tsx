'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { getCategories, exportTransactions } from '@/lib/api'
import type { Category } from '@/lib/types'

function defaultDates() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

type TxType = '' | 'income' | 'expense'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const defaults = defaultDates()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [type, setType] = useState<TxType>('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) getCategories().then(setCategories)
  }, [open])

  const visibleCats = type === ''
    ? categories
    : categories.filter(c => c.type === type)

  function toggleCat(id: string) {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  function toggleAll() {
    const visibleIds = visibleCats.map(c => c.id)
    const allSelected = visibleIds.every(id => selectedCats.includes(id))
    if (allSelected) {
      setSelectedCats(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedCats(prev => [...new Set([...prev, ...visibleIds])])
    }
  }

  async function handleExport() {
    if (!from || !to) {
      setError('Completá el rango de fechas')
      return
    }
    setError('')
    setLoading(true)
    try {
      const blob = await exportTransactions(
        from,
        to,
        type || undefined,
        selectedCats.length > 0 ? selectedCats : undefined,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transacciones_${from}_${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch {
      setError('Error al exportar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const allVisibleSelected =
    visibleCats.length > 0 && visibleCats.every(c => selectedCats.includes(c.id))

  return (
    <Modal open={open} onClose={onClose} title="Exportar transacciones">
      <div className="flex flex-col gap-4">

        {/* Rango de fechas */}
        <div>
          <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5">Rango de fechas</div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="flex-1 h-9 px-3 rounded-[8px] text-[12px] text-[var(--color-text-primary)] outline-none"
              style={{ border: '0.5px solid #d0d0cc', background: '#fff' }}
            />
            <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">–</span>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="flex-1 h-9 px-3 rounded-[8px] text-[12px] text-[var(--color-text-primary)] outline-none"
              style={{ border: '0.5px solid #d0d0cc', background: '#fff' }}
            />
          </div>
        </div>

        {/* Tipo */}
        <div>
          <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5">Tipo</div>
          <div className="flex gap-1.5">
            {([
              { value: '' as TxType, label: 'Ambos' },
              { value: 'income' as TxType, label: 'Ingresos' },
              { value: 'expense' as TxType, label: 'Gastos' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setType(opt.value)
                  setSelectedCats([])
                }}
                className="flex-1 h-8 rounded-[8px] text-[11px] font-medium transition-colors"
                style={{
                  background: type === opt.value ? '#1a1a2e' : '#f7f7f2',
                  color: type === opt.value ? '#fff' : '#555',
                  border: type === opt.value ? '0.5px solid #1a1a2e' : '0.5px solid #e0e0d8',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categorías */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[11px] text-[var(--color-text-muted)]">Categorías</div>
            {visibleCats.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-[10px] transition-colors"
                style={{ color: allVisibleSelected ? '#dc2626' : '#1a1a2e' }}
              >
                {allVisibleSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            )}
          </div>
          <div
            className="rounded-[8px] overflow-y-auto"
            style={{
              border: '0.5px solid #e0e0d8',
              background: '#fafaf8',
              maxHeight: '160px',
            }}
          >
            {visibleCats.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-[var(--color-text-muted)]">
                Sin categorías
              </div>
            ) : visibleCats.map((cat, i) => {
              const checked = selectedCats.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white"
                  style={{
                    borderBottom: i < visibleCats.length - 1 ? '0.5px solid #ebebE5' : 'none',
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      background: checked ? '#1a1a2e' : 'transparent',
                      border: checked ? '1px solid #1a1a2e' : '1px solid #d0d0cc',
                    }}
                  >
                    {checked && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-[11px] text-[var(--color-text-primary)] truncate">{cat.name}</span>
                  {selectedCats.length === 0 && (
                    <span className="ml-auto text-[9px] text-[var(--color-text-muted)] shrink-0">
                      {cat.type === 'income' ? 'Ingreso' : cat.type === 'expense' ? 'Gasto' : cat.type}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {selectedCats.length > 0 && (
            <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
              {selectedCats.length} {selectedCats.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
            </div>
          )}
        </div>

        {error && (
          <div className="text-[11px] text-[#dc2626]">{error}</div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-[8px] text-[12px] transition-colors hover:bg-[#f0f0ea]"
            style={{ border: '0.5px solid #d0d0cc', color: '#555' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 h-9 rounded-[8px] text-[12px] font-medium text-white flex items-center justify-center gap-1.5 transition-opacity"
            style={{ background: '#1a1a2e', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download size={13} />
                Exportar CSV
              </>
            )}
          </button>
        </div>

      </div>
    </Modal>
  )
}
