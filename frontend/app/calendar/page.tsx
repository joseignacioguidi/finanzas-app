'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, RefreshCw, Trash2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { getTransactions, getCategories, getRecurringTransactions, deactivateRecurringTransaction } from '@/lib/api'
import type { Transaction, Category, RecurringTransaction } from '@/lib/types'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' ' + currency
}

interface MonthSummary {
  month: number // 1-12
  transactions: Transaction[]
  confirmedIncome: number
  confirmedExpense: number
  pendingCount: number
}

function buildSummaries(transactions: Transaction[], year: number): MonthSummary[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const txs = transactions.filter(t => t.date.startsWith(monthStr))
    const confirmed = txs.filter(t => t.status === 'confirmed')
    const pending = txs.filter(t => t.status === 'pending')
    return {
      month,
      transactions: txs,
      confirmedIncome: confirmed.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      confirmedExpense: confirmed.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      pendingCount: pending.length,
    }
  })
}

export default function CalendarPage() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [year, setYear] = useState(currentYear)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMonth, setExpandedMonth] = useState<number | null>(currentMonth)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, cats, recs] = await Promise.all([
        getTransactions({ year: String(year) }),
        getCategories(),
        getRecurringTransactions(),
      ])
      setTransactions(txs)
      setCategories(cats)
      setRecurring(recs)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  const summaries = buildSummaries(transactions, year)

  async function handleDeactivate(id: string) {
    setDeactivating(id)
    try {
      await deactivateRecurringTransaction(id)
      await load()
    } finally {
      setDeactivating(null)
    }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Encabezado + navegación de año */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Calendario financiero</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Confirmados y proyecciones para {year}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-[var(--color-text)] w-10 text-center">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--color-text-muted)] py-12 text-center">Cargando…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaries.map(s => {
              const isCurrentMonth = year === currentYear && s.month === currentMonth
              const isPast = year < currentYear || (year === currentYear && s.month < currentMonth)
              const isExpanded = expandedMonth === s.month
              const net = s.confirmedIncome - s.confirmedExpense

              return (
                <div
                  key={s.month}
                  className={[
                    'rounded-xl border transition-all duration-150',
                    isCurrentMonth
                      ? 'border-[var(--color-accent)] bg-[var(--color-bg-elevated)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]',
                    isPast && !isCurrentMonth ? 'opacity-70' : '',
                  ].join(' ')}
                >
                  {/* Cabecera del mes */}
                  <button
                    className="w-full text-left px-4 py-3 flex items-start justify-between"
                    onClick={() => setExpandedMonth(isExpanded ? null : s.month)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                          {MONTH_NAMES[s.month - 1]}
                        </span>
                        {isCurrentMonth && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)] text-white font-medium">
                            Ahora
                          </span>
                        )}
                        {s.pendingCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]">
                            <Clock size={10} />
                            {s.pendingCount}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex gap-3 text-xs">
                        {s.confirmedIncome > 0 && (
                          <span className="text-[var(--color-income)]">
                            +{formatAmount(s.confirmedIncome, 'ARS')}
                          </span>
                        )}
                        {s.confirmedExpense > 0 && (
                          <span className="text-[var(--color-expense)]">
                            -{formatAmount(s.confirmedExpense, 'ARS')}
                          </span>
                        )}
                        {s.confirmedIncome === 0 && s.confirmedExpense === 0 && s.pendingCount === 0 && (
                          <span className="text-[var(--color-text-muted)]">Sin movimientos</span>
                        )}
                      </div>
                    </div>
                    <div className={[
                      'text-xs font-medium mt-0.5',
                      net > 0 ? 'text-[var(--color-income)]' : net < 0 ? 'text-[var(--color-expense)]' : 'text-[var(--color-text-muted)]',
                    ].join(' ')}>
                      {net !== 0 && (net > 0 ? '+' : '')}{net !== 0 ? formatAmount(net, '') : ''}
                    </div>
                  </button>

                  {/* Detalle expandido */}
                  {isExpanded && s.transactions.length > 0 && (
                    <div className="border-t border-[var(--color-border)] px-4 py-2 space-y-1.5 max-h-64 overflow-y-auto">
                      {s.transactions
                        .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
                        .map(tx => {
                          const cat = catMap[tx.category_id]
                          const day = new Date(tx.date).getUTCDate()
                          const isPending = tx.status === 'pending'
                          return (
                            <div
                              key={tx.id}
                              className={[
                                'flex items-center gap-2 py-1 text-xs rounded',
                                isPending ? 'opacity-50' : '',
                              ].join(' ')}
                            >
                              <span className="w-5 text-[var(--color-text-muted)] shrink-0 text-right">{day}</span>
                              {cat && (
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: cat.color }}
                                />
                              )}
                              <span className="flex-1 truncate text-[var(--color-text)]">
                                {tx.description || cat?.name || '—'}
                              </span>
                              {isPending && <Clock size={10} className="text-[var(--color-text-muted)] shrink-0" />}
                              <span className={tx.type === 'income' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}>
                                {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {isExpanded && s.transactions.length === 0 && (
                    <div className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
                      Sin movimientos para este mes.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Sección de recurrentes activas */}
        {recurring.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
              <RefreshCw size={14} />
              Fijos activos
            </h2>
            <div className="space-y-2">
              {recurring.map(rt => {
                const cat = catMap[rt.category_id]
                return (
                  <div
                    key={rt.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
                  >
                    {cat && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: cat.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--color-text)] truncate">
                        {rt.description || cat?.name || '—'}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Día {rt.day_of_month} de cada mes · {rt.currency}
                      </div>
                    </div>
                    <span className={[
                      'text-sm font-medium',
                      rt.type === 'income' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]',
                    ].join(' ')}>
                      {rt.type === 'income' ? '+' : '-'}{formatAmount(rt.amount, '')}
                    </span>
                    <button
                      onClick={() => handleDeactivate(rt.id)}
                      disabled={deactivating === rt.id}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-expense)] transition-colors disabled:opacity-40"
                      title="Desactivar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
