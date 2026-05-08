'use client'

import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { Target, Tag } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import MonthPicker from '@/components/ui/MonthPicker'
import { getBudgets } from '@/lib/api'
import type { BudgetResult, BudgetStatus } from '@/lib/types'

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon = (LucideIcons as Record<string, any>)[name]
  if (!Icon) return <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
  return <Icon size={16} style={{ color }} />
}

const STATUS_COLORS: Record<BudgetStatus, string> = {
  ok: '#16a34a',
  warning: '#d97706',
  exceeded: '#dc2626',
}

const STATUS_BG: Record<BudgetStatus, string> = {
  ok: '#16a34a18',
  warning: '#d9770618',
  exceeded: '#dc262618',
}

const STATUS_LABELS: Record<BudgetStatus, string> = {
  ok: 'Ok',
  warning: 'Atención',
  exceeded: 'Excedido',
}

const STATUS_BAR: Record<BudgetStatus, string> = {
  ok: '#16a34a',
  warning: '#d97706',
  exceeded: '#dc2626',
}

function formatAmount(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function currentMonthStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonthStr)
  const [budgets, setBudgets] = useState<BudgetResult[]>([])
  const [loading, setLoading] = useState(true)

  const [year, m] = month.split('-').map(Number)

  useEffect(() => {
    setLoading(true)
    getBudgets(m, year)
      .then(setBudgets)
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false))
  }, [month])

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-xl font-bold text-[var(--color-text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Presupuestos
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Control de gasto máximo por categoría
            </p>
          </div>
          <MonthPicker month={month} onChange={setMonth} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-bg-overlay)' }}
            >
              <Target size={26} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                No hay presupuestos para este mes
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Seteá un monto máximo desde cada categoría
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md transition-colors"
              style={{ color: 'var(--color-brand)', background: 'var(--color-brand-glow)' }}
            >
              <Tag size={13} />
              Ir a Categorías
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgets.map(b => {
              const barPct = Math.min(b.percentage, 100)
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${b.category_color}20` }}
                    >
                      <CategoryIcon name={b.category_icon} color={b.category_color} />
                    </span>
                    <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {b.category_name}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        color: STATUS_COLORS[b.status],
                        backgroundColor: STATUS_BG[b.status],
                      }}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-bg-overlay)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barPct}%`,
                          background: STATUS_BAR[b.status],
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ${formatAmount(b.spent)} gastado
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        {b.percentage.toFixed(1)}% de ${formatAmount(b.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
