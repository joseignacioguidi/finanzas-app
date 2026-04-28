'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { getTransactions, deleteTransaction, getCategories } from '@/lib/api'
import type { Transaction, Category } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import TransactionForm from './TransactionForm'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + currency
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonth())
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, cats] = await Promise.all([
        getTransactions({ month, type: typeFilter, category: categoryFilter }),
        getCategories(),
      ])
      setTransactions(txs)
      setCategories(cats)
    } catch {}
    finally { setLoading(false) }
  }, [month, typeFilter, categoryFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch {}
    finally { setDeletingId(null) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Mes</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="h-10 rounded-md px-3 text-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-brand)]"
          />
        </div>
        <div className="w-36">
          <Select label="Tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </Select>
        </div>
        <div className="w-44">
          <Select label="Categoría" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
            Sin transacciones para este período
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const cat = catMap[tx.category_id]
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)] max-w-[200px] truncate">
                      {tx.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {cat ? (
                        <Badge style={{ backgroundColor: `${cat.color}22`, color: cat.color, borderColor: `${cat.color}44` }}>
                          {cat.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                        {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold font-mono whitespace-nowrap"
                      style={{ color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                      {tx.type === 'income' ? '+' : '−'} {formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditTx(tx)}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                        >
                          <Pencil size={14} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)] transition-colors"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
