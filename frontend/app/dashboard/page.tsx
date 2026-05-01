'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTransactions, getMonthlyStats, getCategoryStats } from '@/lib/api'
import type { Transaction, MonthlyStatRow, CategoryStatRow } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'
import MonthlyBar from '@/components/charts/MonthlyBar'
import MonthPicker from '@/components/ui/MonthPicker'
import ExportModal from '@/components/ui/ExportModal'

function fmt(n: number) {
  return new Intl.NumberFormat('es').format(Math.round(n))
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function monthLabel() {
  return new Date().toLocaleString('es', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

const CAT_COLORS: Record<string, string> = {
  comida: '#f87171',
  alimentación: '#f87171',
  transporte: '#fb923c',
  servicios: '#60a5fa',
  salud: '#34d399',
  ocio: '#a78bfa',
  educación: '#fbbf24',
}

function getCatColor(name: string, color: string): string {
  return CAT_COLORS[name.toLowerCase()] ?? color ?? '#94a3b8'
}

const quickActions = [
  { label: 'Agregar gasto', href: '/transactions/new?type=expense', iconBg: '#e0f2fe', iconColor: '#0284c7' },
  { label: 'Agregar ingreso', href: '/transactions/new?type=income', iconBg: '#dcfce7', iconColor: '#16a34a' },
  { label: 'Ver historial', href: '/transactions', iconBg: '#fef9c3', iconColor: '#ca8a04' },
  { label: 'Nueva categoría', href: '/categories', iconBg: '#f3e8ff', iconColor: '#9333ea' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthly, setMonthly] = useState<MonthlyStatRow[]>([])
  const [catStats, setCatStats] = useState<CategoryStatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      getTransactions({ month: selectedMonth }),
      getMonthlyStats(),
      getCategoryStats(),
    ]).then(([txsResult, monResult, catsResult]) => {
      if (txsResult.status === 'fulfilled') setTransactions(txsResult.value)
      if (monResult.status === 'fulfilled') setMonthly(monResult.value)
      if (catsResult.status === 'fulfilled') setCatStats(catsResult.value)
    }).finally(() => setLoading(false))
  }, [selectedMonth])

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const netBalance = monthly.reduce((s, m) => s + m.income - m.expense, 0)

  const topCats = catStats
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
  const maxCat = topCats[0]?.total || 1

  const recent = transactions.slice(0, 4)

  const displayName = user?.email?.split('@')[0] ?? 'usuario'
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'

  const headerRight = (
    <>
      <MonthPicker month={selectedMonth} onChange={setSelectedMonth} />
      <button
        onClick={() => setExportOpen(true)}
        className="h-[30px] px-3.5 rounded-[7px] text-[11px] font-medium flex items-center transition-colors hover:opacity-80"
        style={{ background: '#f7f7f2', color: '#555', border: '0.5px solid #d0d0cc' }}
      >
        Exportar
      </button>
      <Link
        href="/transactions/new"
        className="h-[30px] px-3.5 rounded-[7px] text-[11px] font-medium text-white flex items-center"
        style={{ background: '#1a1a2e' }}
      >
        + Nueva transacción
      </Link>
    </>
  )

  return (
    <AppShell title={`${greeting()}, ${displayName}`} headerRight={headerRight}>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      {/* ── HEADER MOBILE ── */}
      <div
        className="md:hidden -mx-4 -mt-4 px-3.5 pt-3 pb-4 mb-4"
        style={{ background: '#1a1a2e' }}
      >
        <div className="text-[8px] mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {greeting()}
        </div>
        <div className="text-[13px] font-medium text-white mb-2.5">{displayName}</div>
        <div className="text-[8px] mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Balance del mes
        </div>
        <div className="text-[28px] font-medium text-white leading-none">
          <sup className="text-[14px] leading-none">$</sup>
          {fmt(balance)}
        </div>
        <div className="flex gap-1.5 mt-2.5">
          <div
            className="flex-1 rounded-[7px] px-2 py-1.5"
            style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            <div className="text-[7px] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Ingresos</div>
            <div className="text-[9px] font-medium" style={{ color: '#4ade80' }}>+${fmt(income)}</div>
          </div>
          <div
            className="flex-1 rounded-[7px] px-2 py-1.5"
            style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            <div className="text-[7px] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Gastos</div>
            <div className="text-[9px] font-medium" style={{ color: '#f87171' }}>−${fmt(expense)}</div>
          </div>
          <button
            onClick={() => setExportOpen(true)}
            className="rounded-[7px] px-2 py-1.5 flex flex-col items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            <div className="text-[7px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Exportar</div>
            <div className="text-[9px] font-medium text-white">CSV</div>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-6xl">
          {/* ── STAT CARDS — solo desktop ── */}
          <div className="hidden md:grid grid-cols-4 gap-3">
            {[
              { label: 'Balance disponible', value: `$${fmt(netBalance)}`, sub: 'Últimos meses', subColor: netBalance >= 0 ? '#16a34a' : '#dc2626' },
              { label: 'Ingresos del mes', value: `$${fmt(income)}`, sub: 'Este mes', subColor: '#16a34a' },
              { label: 'Gastos del mes', value: `$${fmt(expense)}`, sub: 'Este mes', subColor: '#dc2626' },
              { label: 'Balance neto', value: `$${fmt(balance)}`, sub: balance >= 0 ? 'Superávit del mes' : 'Déficit del mes', subColor: balance >= 0 ? '#16a34a' : '#dc2626' },
            ].map(card => (
              <div
                key={card.label}
                className="bg-white rounded-[10px] p-4"
                style={{ border: '0.5px solid #e8e8e0' }}
              >
                <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5">{card.label}</div>
                <div className="text-[20px] font-medium text-[var(--color-text-primary)] leading-none">{card.value}</div>
                <div className="text-[10px] mt-1" style={{ color: card.subColor }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3.5">
            {/* Panel principal: gráfico (desktop) / categorías (mobile) */}
            <div
              className="bg-white rounded-[10px] p-4"
              style={{ border: '0.5px solid #e8e8e0' }}
            >
              {/* Desktop: bar chart */}
              <div className="hidden md:block">
                <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-3">
                  Ingresos vs gastos — últimos 6 meses
                </div>
                <MonthlyBar data={monthly} />
                <div className="flex gap-3.5 mt-2.5">
                  {[['#4ade80', 'Ingresos'], ['#f87171', 'Gastos']].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile: categorías */}
              <div className="md:hidden">
                <div className="text-[8px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-3">
                  Gastos por categoría
                </div>
                {topCats.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">Sin datos este mes</p>
                ) : topCats.map(cat => {
                  const color = getCatColor(cat.category_name, cat.color)
                  const pct = (cat.total / maxCat) * 100
                  return (
                    <div key={cat.category_id} className="flex items-center gap-2 mb-2.5">
                      <div className="text-[8px] text-[var(--color-text-muted)] w-[52px] shrink-0 truncate">
                        {cat.category_name}
                      </div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#f0f0ea' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                      <div className="text-[8px] font-medium text-[var(--color-text-primary)] w-8 text-right shrink-0">
                        ${fmt(cat.total)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="flex flex-col gap-3.5">
              {/* Últimos movimientos */}
              <div
                className="bg-white rounded-[10px] p-4"
                style={{ border: '0.5px solid #e8e8e0' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-medium text-[var(--color-text-primary)]">
                    Últimos movimientos
                  </div>
                  <Link
                    href="/transactions"
                    className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    Ver todos →
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="text-[11px] text-[var(--color-text-muted)] py-2">Sin movimientos</p>
                ) : recent.map((tx, i) => {
                  const isIncome = tx.type === 'income'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-2.5 py-1.5"
                      style={{ borderBottom: i < recent.length - 1 ? '0.5px solid #e8e8e0' : 'none' }}
                    >
                      <div
                        className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0"
                        style={{ background: '#f7f7f2' }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ background: isIncome ? '#4ade80' : '#f87171' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-[var(--color-text-primary)] truncate">
                          {tx.description || '—'}
                        </div>
                        <div className="text-[9px] text-[var(--color-text-muted)]">
                          {fmtDate(tx.date)}
                        </div>
                      </div>
                      <div
                        className="text-[11px] font-medium shrink-0"
                        style={{ color: isIncome ? '#16a34a' : '#dc2626' }}
                      >
                        {isIncome ? '+' : '−'}${fmt(tx.amount)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Acciones rápidas */}
              <div
                className="bg-white rounded-[10px] p-4"
                style={{ border: '0.5px solid #e8e8e0' }}
              >
                <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-3">
                  Acciones rápidas
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickActions.map(action => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-1.5 p-2.5 rounded-[8px] transition-colors hover:opacity-80"
                      style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
                    >
                      <div
                        className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
                        style={{ background: action.iconBg }}
                      >
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: action.iconColor }} />
                      </div>
                      <span className="text-[11px] text-[var(--color-text-primary)]">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── ACCIONES RÁPIDAS MOBILE (debajo del gráfico) ── */}
          <div className="md:hidden">
            <div className="text-[8px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-2">
              Acciones rápidas
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map(action => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-1 py-2 rounded-[9px] transition-colors"
                  style={{ background: '#f7f7f2', border: '0.5px solid #e0e0d8' }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center"
                    style={{ background: action.iconBg }}
                  >
                    <div className="w-2 h-2 rounded-sm" style={{ background: action.iconColor }} />
                  </div>
                  <span className="text-[7px] text-[var(--color-text-secondary)] text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
