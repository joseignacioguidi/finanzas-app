'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react'
import Link from 'next/link'
import { getTransactions, getMonthlyStats, getCategoryStats } from '@/lib/api'
import type { Transaction, MonthlyStatRow, CategoryStatRow } from '@/lib/types'
import AppShell from '@/components/layout/AppShell'
import MonthlyBar from '@/components/charts/MonthlyBar'
import CategoryDonut from '@/components/charts/CategoryDonut'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

interface CurrencySummary {
  currency: string
  income: number
  expense: number
  balance: number
}

function computeSummary(transactions: Transaction[]): CurrencySummary[] {
  const map: Record<string, CurrencySummary> = {}
  for (const tx of transactions) {
    if (!map[tx.currency]) {
      map[tx.currency] = { currency: tx.currency, income: 0, expense: 0, balance: 0 }
    }
    if (tx.type === 'income') map[tx.currency].income += tx.amount
    else map[tx.currency].expense += tx.amount
    map[tx.currency].balance = map[tx.currency].income - map[tx.currency].expense
  }
  return Object.values(map).sort((a, b) => a.currency.localeCompare(b.currency))
}

function formatNum(n: number, currency: string) {
  return new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' ' + currency
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthly, setMonthly] = useState<MonthlyStatRow[]>([])
  const [catStats, setCatStats] = useState<CategoryStatRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTransactions({ month: currentMonth() }),
      getMonthlyStats(),
      getCategoryStats(),
    ])
      .then(([txs, mon, cats]) => {
        setTransactions(txs)
        setMonthly(mon)
        setCatStats(cats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const summaries = computeSummary(transactions)
  const recent = transactions.slice(0, 5)

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {new Date().toLocaleString('es', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link href="/transactions/new">
            <Button size="sm">
              <Plus size={14} strokeWidth={2} />
              Nueva transacción
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-7 h-7 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI cards — una fila por moneda */}
            {summaries.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">Sin transacciones este mes.</p>
                <Link href="/transactions/new" className="mt-3 inline-block text-sm text-[var(--color-brand)] hover:underline">
                  Crear la primera
                </Link>
              </div>
            ) : summaries.map(s => (
              <div key={s.currency} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Ingresos */}
                <div className="rounded-xl border border-[var(--color-income-border)] bg-[var(--color-bg-surface)] p-5 flex flex-col gap-2"
                  style={{ borderLeftWidth: 3, borderLeftColor: 'var(--color-income)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Ingresos · {s.currency}
                    </span>
                    <TrendingUp size={16} strokeWidth={1.5} style={{ color: 'var(--color-income)' }} />
                  </div>
                  <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-income)' }}>
                    {formatNum(s.income, s.currency)}
                  </p>
                </div>

                {/* Gastos */}
                <div className="rounded-xl border border-[var(--color-expense-border)] bg-[var(--color-bg-surface)] p-5 flex flex-col gap-2"
                  style={{ borderLeftWidth: 3, borderLeftColor: 'var(--color-expense)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Gastos · {s.currency}
                    </span>
                    <TrendingDown size={16} strokeWidth={1.5} style={{ color: 'var(--color-expense)' }} />
                  </div>
                  <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-expense)' }}>
                    {formatNum(s.expense, s.currency)}
                  </p>
                </div>

                {/* Balance */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 flex flex-col gap-2"
                  style={{ borderLeftWidth: 3, borderLeftColor: s.balance >= 0 ? 'var(--color-brand)' : 'var(--color-expense)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Balance · {s.currency}
                    </span>
                    <Wallet size={16} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <p className="text-2xl font-bold font-mono"
                    style={{ color: s.balance >= 0 ? 'var(--color-brand)' : 'var(--color-expense)' }}>
                    {s.balance >= 0 ? '+' : ''}{formatNum(s.balance, s.currency)}
                  </p>
                </div>
              </div>
            ))}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
                  Últimos 6 meses
                </h3>
                <MonthlyBar data={monthly} />
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
                  Gastos por categoría · este mes
                </h3>
                <CategoryDonut data={catStats} />
              </div>
            </div>

            {/* Transacciones recientes */}
            {recent.length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Recientes
                  </h3>
                  <Link href="/transactions" className="text-xs text-[var(--color-brand)] hover:underline">
                    Ver todas →
                  </Link>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {recent.map(tx => (
                    <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[var(--color-bg-overlay)] transition-colors">
                      <span className="text-xs font-mono text-[var(--color-text-muted)] w-14 shrink-0">
                        {formatDate(tx.date)}
                      </span>
                      <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
                        {tx.description || '—'}
                      </span>
                      <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                        {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                      <span
                        className="text-sm font-semibold font-mono w-36 text-right shrink-0"
                        style={{ color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}
                      >
                        {tx.type === 'income' ? '+' : '−'} {new Intl.NumberFormat('es').format(tx.amount)} {tx.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
