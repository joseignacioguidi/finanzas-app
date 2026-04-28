'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Search } from 'lucide-react'
import { getTransactions, deleteTransaction, getCategories } from '@/lib/api'
import type { Transaction, Category } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import TransactionForm from './TransactionForm'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function hexToLight(hex: string): { bg: string; text: string } {
  return { bg: hex + '22', text: hex }
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter, setCatFilter] = useState('')
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, cats] = await Promise.all([
        getTransactions({ month: currentMonth() }),
        getCategories(),
      ])
      setTransactions(txs)
      setCategories(cats)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch {}
    finally { setDeletingId(null) }
  }

  const filtered = transactions.filter(tx => {
    if (typeFilter === 'income' && tx.type !== 'income') return false
    if (typeFilter === 'expense' && tx.type !== 'expense') return false
    if (catFilter && tx.category_id !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const cat = catMap[tx.category_id]
      if (
        !tx.description?.toLowerCase().includes(q) &&
        !cat?.name?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const typePills: { key: 'all' | 'income' | 'expense'; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'income', label: 'Ingresos' },
    { key: 'expense', label: 'Gastos' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Buscador */}
        <div
          className="flex items-center gap-2 px-3 h-8 rounded-[8px] flex-1 min-w-0"
          style={{ background: '#fff', border: '0.5px solid #e0e0d8' }}
        >
          <Search size={11} style={{ color: '#bbb', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descripción, categoría..."
            className="flex-1 text-[11px] bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[#bbb]"
          />
        </div>

        {/* Pills tipo */}
        <div className="flex gap-1.5 flex-wrap">
          {typePills.map(pill => (
            <button
              key={pill.key}
              onClick={() => setTypeFilter(pill.key)}
              className="text-[10px] px-3 py-1 rounded-[10px] transition-colors"
              style={
                typeFilter === pill.key
                  ? { background: '#1a1a2e', color: '#fff', border: '0.5px solid #1a1a2e' }
                  : { background: '#fff', color: '#888', border: '0.5px solid #d0d0cc' }
              }
            >
              {pill.label}
            </button>
          ))}
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(prev => prev === cat.id ? '' : cat.id)}
              className="text-[10px] px-3 py-1 rounded-[10px] transition-colors"
              style={
                catFilter === cat.id
                  ? { background: '#1a1a2e', color: '#fff', border: '0.5px solid #1a1a2e' }
                  : { background: '#fff', color: '#888', border: '0.5px solid #d0d0cc' }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div
        className="bg-white rounded-[10px] overflow-hidden"
        style={{ border: '0.5px solid #e8e8e0' }}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-[var(--color-text-muted)]">
            Sin transacciones para este período
          </div>
        ) : (
          <>
            {/* Cabecera — solo desktop */}
            <div
              className="hidden md:grid px-4 py-2.5"
              style={{
                gridTemplateColumns: '2fr 1.2fr 1fr 1fr 90px 40px',
                borderBottom: '0.5px solid #e8e8e0',
                background: '#fafaf7',
              }}
            >
              {['Descripción', 'Categoría', 'Fecha', 'Tipo', 'Monto', ''].map(h => (
                <div
                  key={h}
                  className="text-[10px] font-semibold uppercase tracking-[0.05em]"
                  style={{ color: '#aaa', textAlign: h === 'Monto' ? 'right' : 'left' }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Filas */}
            {filtered.map(tx => {
              const cat = catMap[tx.category_id]
              const isIncome = tx.type === 'income'
              const catColors = cat ? hexToLight(cat.color) : null

              return (
                <div
                  key={tx.id}
                  className="group"
                  style={{ borderBottom: '0.5px solid #e8e8e0' }}
                >
                  {/* Desktop row */}
                  <div
                    className="hidden md:grid px-4 py-2.5 items-center hover:bg-[#fafaf7] transition-colors"
                    style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 90px 40px' }}
                  >
                    {/* Descripción */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0"
                        style={{ background: '#f7f7f2' }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ background: isIncome ? '#4ade80' : '#f87171' }}
                        />
                      </div>
                      <span className="text-[11px] text-[var(--color-text-primary)] truncate">
                        {tx.description || '—'}
                      </span>
                    </div>

                    {/* Categoría */}
                    <div>
                      {cat && catColors ? (
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-[10px] font-medium"
                          style={{ background: catColors.bg, color: catColors.text }}
                        >
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-muted)]">—</span>
                      )}
                    </div>

                    {/* Fecha */}
                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      {formatDate(tx.date)}
                    </div>

                    {/* Tipo badge */}
                    <div>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-[10px] font-medium"
                        style={
                          isIncome
                            ? { background: '#f0fdf4', color: '#166534' }
                            : { background: '#fef2f2', color: '#991b1b' }
                        }
                      >
                        {isIncome ? 'Ingreso' : 'Egreso'}
                      </span>
                    </div>

                    {/* Monto */}
                    <div
                      className="text-[11px] font-medium text-right"
                      style={{ color: isIncome ? '#16a34a' : '#dc2626' }}
                    >
                      {isIncome ? '+' : '−'}${formatAmount(tx.amount)}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditTx(tx)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)] transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden flex items-center gap-2.5 px-4 py-3">
                    <div
                      className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ background: '#f7f7f2' }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: isIncome ? '#4ade80' : '#f87171' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                        {tx.description || '—'}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {cat?.name ?? '—'} · {formatDate(tx.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="text-[13px] font-medium"
                        style={{ color: isIncome ? '#16a34a' : '#dc2626' }}
                      >
                        {isIncome ? '+' : '−'}${formatAmount(tx.amount)}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-expense)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Modal editar */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Editar transacción">
        {editTx && (
          <TransactionForm
            initial={editTx}
            onSuccess={() => { setEditTx(null); fetchAll() }}
            onCancel={() => setEditTx(null)}
          />
        )}
      </Modal>
    </div>
  )
}
