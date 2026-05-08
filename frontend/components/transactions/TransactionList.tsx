'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Pencil, Trash2, Search, Pin, PinOff, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { getTransactions, deleteTransaction, getCategories, createRecurringTransaction, deactivateRecurringTransaction, getMe } from '@/lib/api'
import type { Transaction, Category } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import MultiSelect from '@/components/ui/MultiSelect'
import TransactionForm from './TransactionForm'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function hexToLight(hex: string): { bg: string; text: string } {
  return { bg: hex + '22', text: hex }
}

interface TransactionListProps {
  month: string
  baseCurrency?: string
}

interface TableProps {
  title: string
  type: 'income' | 'expense'
  rows: Transaction[]
  catMap: Record<string, Category>
  loading: boolean
  pinningId: string | null
  deletingId: string | null
  baseCurrency: string
  onPin: (tx: Transaction) => void
  onUnpin: (tx: Transaction) => void
  onEdit: (tx: Transaction) => void
  onDelete: (id: string) => void
}

type SortKey = 'description' | 'category' | 'date' | 'amount'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey | null; dir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown size={10} style={{ opacity: 0.4 }} />
  return dir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
}

function TransactionTable({
  title, type, rows, catMap, loading,
  pinningId, deletingId, baseCurrency, onPin, onUnpin, onEdit, onDelete,
}: TableProps) {
  const isIncome = type === 'income'
  const total = rows.reduce((sum, tx) => sum + tx.amount, 0)
  const accentColor = isIncome ? '#16a34a' : '#dc2626'

  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const isRowClick = useRef(false)

  useEffect(() => {
    function onMouseUp() { setIsSelecting(false) }
    function onMouseMove(e: MouseEvent) { setCursor({ x: e.clientX, y: e.clientY }) }
    function onDocMouseDown(e: MouseEvent) {
      if (!isRowClick.current && !e.ctrlKey) setSelectedIds(new Set())
      isRowClick.current = false
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Control') setIsSelecting(false)
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  function handleRowMouseDown(e: React.MouseEvent, tx: Transaction) {
    if ((e.target as HTMLElement).closest('button')) return
    if (!e.ctrlKey) return
    e.preventDefault()
    isRowClick.current = true
    setIsSelecting(true)
    setSelectedIds(new Set([tx.id]))
  }

  function handleRowMouseEnter(tx: Transaction) {
    if (isSelecting) setSelectedIds(prev => new Set([...prev, tx.id]))
  }

  const selectedTotal = useMemo(
    () => rows.filter(tx => selectedIds.has(tx.id)).reduce((sum, tx) => sum + tx.amount, 0),
    [rows, selectedIds]
  )

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortKey === 'description') { va = a.description?.toLowerCase() ?? ''; vb = b.description?.toLowerCase() ?? '' }
      else if (sortKey === 'category') { va = catMap[a.category_id]?.name?.toLowerCase() ?? ''; vb = catMap[b.category_id]?.name?.toLowerCase() ?? '' }
      else if (sortKey === 'date') { va = a.date; vb = b.date }
      else if (sortKey === 'amount') { va = a.amount; vb = b.amount }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, sortKey, sortDir, catMap])

  const headers: { label: string; key: SortKey | null; align?: string }[] = [
    { label: 'Descripción', key: 'description' },
    { label: 'Categoría', key: 'category' },
    { label: 'Fecha', key: 'date' },
    { label: 'Monto', key: 'amount', align: 'right' },
    { label: 'Acciones', key: null, align: 'center' },
  ]

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      {/* Cabecera de sección */}
      <div className="flex items-center justify-between px-1">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: accentColor }}
        >
          {title}
        </span>
        {!loading && rows.length > 0 && (
          <span className="text-[11px] font-medium" style={{ color: accentColor }}>
            {isIncome ? '+' : '−'}${formatAmount(total)}
          </span>
        )}
      </div>

      <div
        className="bg-white rounded-[10px] overflow-hidden"
        style={{ border: '0.5px solid #e8e8e0' }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[var(--color-text-muted)]">
            Sin {isIncome ? 'ingresos' : 'gastos'} este período
          </div>
        ) : (
          <>
            {/* Cabecera desktop */}
            <div
              className="hidden md:grid px-3 py-2"
              style={{
                gridTemplateColumns: '2fr 1.2fr 1fr 80px 72px',
                borderBottom: '0.5px solid #e8e8e0',
                background: '#fafaf7',
              }}
            >
              {headers.map(h => (
                <div
                  key={h.label}
                  onClick={h.key ? () => handleSort(h.key!) : undefined}
                  className={`flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] select-none${h.key ? ' cursor-pointer hover:text-[#888]' : ''}`}
                  style={{
                    color: sortKey === h.key ? '#555' : '#aaa',
                    justifyContent: h.align === 'right' ? 'flex-end' : h.align === 'center' ? 'center' : 'flex-start',
                  }}
                >
                  {h.label}
                  {h.key && <SortIcon col={h.key} sortKey={sortKey} dir={sortDir} />}
                </div>
              ))}
            </div>

            {/* Filas */}
            {sorted.map(tx => {
              const cat = catMap[tx.category_id]
              const catColors = cat ? hexToLight(cat.color) : null
              const isSelected = selectedIds.has(tx.id)
              const selectedBg = isIncome ? '#dcfce7' : '#fee2e2'

              return (
                <div
                  key={tx.id}
                  style={{ borderBottom: '0.5px solid #e8e8e0' }}
                >
                  {/* Desktop */}
                  <div
                    className="hidden md:grid px-3 py-2 items-center transition-colors"
                    style={{
                      gridTemplateColumns: '2fr 1.2fr 1fr 80px 72px',
                      background: isSelected ? selectedBg : undefined,
                      cursor: 'default',
                      userSelect: 'none',
                    }}
                    onMouseDown={e => handleRowMouseDown(e, tx)}
                    onMouseEnter={() => handleRowMouseEnter(tx)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--color-text-primary)] truncate">
                        {tx.description || '—'}
                      </span>
                    </div>

                    <div className="overflow-hidden">
                      {cat && catColors ? (
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-[10px] font-medium whitespace-nowrap inline-block max-w-full truncate"
                          style={{ background: catColors.bg, color: catColors.text }}
                        >
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-muted)]">—</span>
                      )}
                    </div>

                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      {formatDate(tx.date)}
                    </div>

                    <div className="text-right">
                      <div
                        className="text-[11px] font-medium"
                        style={{ color: accentColor }}
                      >
                        {isIncome ? '+' : '−'}${formatAmount(tx.amount)} {tx.currency !== baseCurrency ? tx.currency : ''}
                      </div>
                      {tx.currency !== baseCurrency && tx.exchange_rate !== 1 && (
                        <div className="text-[9px] text-[var(--color-text-muted)]">
                          = ${formatAmount(tx.base_amount)} {baseCurrency}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-0.5">
                      {tx.recurring_id ? (
                        <button
                          onClick={() => onUnpin(tx)}
                          disabled={pinningId === tx.id}
                          title="Desactivar recurrencia"
                          className="p-1 rounded transition-colors"
                          style={{ color: '#6366f1' }}
                        >
                          <PinOff size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onPin(tx)}
                          disabled={pinningId === tx.id}
                          title="Fijar como mensual"
                          className="p-1 rounded text-[var(--color-text-muted)] hover:text-[#6366f1] hover:bg-[#eef2ff] transition-colors"
                        >
                          <Pin size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)] transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden flex items-center gap-2.5 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                        {tx.description || '—'}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {cat?.name ?? '—'} · {formatDate(tx.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: accentColor }}>
                          {isIncome ? '+' : '−'}${formatAmount(tx.amount)} {tx.currency !== baseCurrency ? tx.currency : ''}
                        </div>
                        {tx.currency !== baseCurrency && tx.exchange_rate !== 1 && (
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            = ${formatAmount(tx.base_amount)} {baseCurrency}
                          </div>
                        )}
                      </div>
                      {tx.recurring_id ? (
                        <button
                          onClick={() => onUnpin(tx)}
                          disabled={pinningId === tx.id}
                          title="Desactivar recurrencia"
                          className="p-1 rounded"
                          style={{ color: '#6366f1' }}
                        >
                          <PinOff size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onPin(tx)}
                          disabled={pinningId === tx.id}
                          title="Fijar como mensual"
                          className="p-1 rounded text-[var(--color-text-muted)]"
                        >
                          <Pin size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(tx.id)}
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
      {selectedIds.size > 0 && cursor && (
        <div
          style={{
            position: 'fixed',
            left: cursor.x + 14,
            top: cursor.y + 14,
            zIndex: 9999,
            pointerEvents: 'none',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          {selectedIds.size === 1 ? '1 fila' : `${selectedIds.size} filas`}
          {' · '}
          {isIncome ? '+' : '−'}${formatAmount(selectedTotal)}
        </div>
      )}
    </div>
  )
}

export default function TransactionList({ month, baseCurrency: baseCurrencyProp }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pinningId, setPinningId] = useState<string | null>(null)
  const [baseCurrency, setBaseCurrency] = useState(baseCurrencyProp ?? 'ARS')

  useEffect(() => {
    if (!baseCurrencyProp) {
      getMe().then(me => setBaseCurrency(me.base_currency)).catch(() => {})
    }
  }, [baseCurrencyProp])

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, cats] = await Promise.all([
        getTransactions({ month }),
        getCategories(),
      ])
      setTransactions(txs)
      setCategories(cats)
    } catch {}
    finally { setLoading(false) }
  }, [month])

  useEffect(() => { fetchAll() }, [fetchAll])

  function nextMonthDate(dateStr: string): string {
    const d = new Date(dateStr)
    d.setUTCMonth(d.getUTCMonth() + 1)
    return d.toISOString().split('T')[0]
  }

  async function handlePin(tx: Transaction) {
    setPinningId(tx.id)
    try {
      await createRecurringTransaction({
        category_id: tx.category_id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        date: nextMonthDate(tx.date),
      })
      await fetchAll()
    } catch {}
    finally { setPinningId(null) }
  }

  async function handleUnpin(tx: Transaction) {
    if (!tx.recurring_id) return
    setPinningId(tx.id)
    try {
      await deactivateRecurringTransaction(tx.recurring_id)
      await fetchAll()
    } catch {}
    finally { setPinningId(null) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch {}
    finally { setDeletingId(null) }
  }

  const filtered = transactions.filter(tx => {
    if (catFilter.length > 0 && !catFilter.includes(tx.category_id)) return false
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

  const expenses = filtered.filter(tx => tx.type === 'expense')
  const incomes = filtered.filter(tx => tx.type === 'income')

  const tableProps = {
    catMap, loading, pinningId, deletingId, baseCurrency,
    onPin: handlePin,
    onUnpin: handleUnpin,
    onEdit: setEditTx,
    onDelete: handleDelete,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-2.5">
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
        <div className="flex gap-1.5 shrink-0">
          <MultiSelect
            options={categories.map(cat => ({ value: cat.id, label: cat.name, color: cat.color }))}
            selected={catFilter}
            onChange={setCatFilter}
            allLabel="Categorías"
          />
        </div>
      </div>

      {/* Dos grillas */}
      <div className="flex flex-col md:flex-row gap-4">
        <TransactionTable
          title="Gastos"
          type="expense"
          rows={expenses}
          {...tableProps}
        />
        <TransactionTable
          title="Ingresos"
          type="income"
          rows={incomes}
          {...tableProps}
        />
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
