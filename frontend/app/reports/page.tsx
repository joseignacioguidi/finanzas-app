'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import MonthlyBar from '@/components/charts/MonthlyBar'
import {
  getReportSummary,
  getReportByCategory,
  getReportMonthly,
  getTopTransactions,
} from '@/lib/api'
import type {
  ReportSummary,
  ReportByCategoryRow,
  ReportMonthlyRow,
  TopTransactionsResult,
} from '@/lib/types'

function fmt(n: number) {
  return new Intl.NumberFormat('es').format(Math.round(n))
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

type Preset = 'mes' | 'anterior' | 'año' | 'custom'

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (preset === 'mes') {
    return {
      from: new Date(y, m, 1).toISOString().slice(0, 10),
      to: new Date(y, m + 1, 0).toISOString().slice(0, 10),
    }
  }
  if (preset === 'anterior') {
    return {
      from: new Date(y, m - 1, 1).toISOString().slice(0, 10),
      to: new Date(y, m, 0).toISOString().slice(0, 10),
    }
  }
  // año
  return {
    from: new Date(y, 0, 1).toISOString().slice(0, 10),
    to: new Date(y, 11, 31).toISOString().slice(0, 10),
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'mes', label: 'Este mes' },
  { key: 'anterior', label: 'Mes anterior' },
  { key: 'año', label: 'Este año' },
  { key: 'custom', label: 'Personalizado' },
]

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()

  const [preset, setPreset] = useState<Preset>('mes')
  const initialRange = getPresetRange('mes')
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [year, setYear] = useState(currentYear)

  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [byCategory, setByCategory] = useState<ReportByCategoryRow[]>([])
  const [monthly, setMonthly] = useState<ReportMonthlyRow[]>([])
  const [topTx, setTopTx] = useState<TopTransactionsResult | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, cats, mon, top] = await Promise.all([
        getReportSummary(from, to),
        getReportByCategory(from, to),
        getReportMonthly(year),
        getTopTransactions(from, to, 5),
      ])
      setSummary(s)
      setByCategory(cats)
      setMonthly(mon)
      setTopTx(top)
    } finally {
      setLoading(false)
    }
  }, [from, to, year])

  useEffect(() => { load() }, [load])

  function handlePreset(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      const r = getPresetRange(p)
      setFrom(r.from)
      setTo(r.to)
    }
  }

  const maxCat = byCategory[0]?.total || 1

  return (
    <AppShell title="Reportes">
      {/* Filtros */}
      <div
        className="bg-white rounded-[10px] p-3.5 mb-4 flex flex-wrap items-center gap-2"
        style={{ border: '0.5px solid #e8e8e0' }}
      >
        <div className="flex gap-1 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className="h-[28px] px-3 rounded-[7px] text-[11px] transition-colors"
              style={{
                background: preset === p.key ? '#1a1a2e' : '#f7f7f2',
                color: preset === p.key ? '#fff' : '#555',
                border: preset === p.key ? 'none' : '0.5px solid #d0d0cc',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="h-[28px] px-2 rounded-[7px] text-[11px] outline-none"
              style={{ border: '0.5px solid #d0d0cc', color: '#333' }}
            />
            <span className="text-[11px] text-[var(--color-text-muted)]">→</span>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="h-[28px] px-2 rounded-[7px] text-[11px] outline-none"
              style={{ border: '0.5px solid #d0d0cc', color: '#333' }}
            />
            <button
              onClick={load}
              className="h-[28px] px-3 rounded-[7px] text-[11px] text-white"
              style={{ background: '#1a1a2e' }}
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[#1a1a2e] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-6xl">

          {/* ── RESUMEN ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Ingresos',
                value: `$${fmt(summary?.total_income ?? 0)}`,
                color: '#16a34a',
              },
              {
                label: 'Gastos',
                value: `$${fmt(summary?.total_expense ?? 0)}`,
                color: '#dc2626',
              },
              {
                label: 'Balance',
                value: `$${fmt(summary?.balance ?? 0)}`,
                color: (summary?.balance ?? 0) >= 0 ? '#16a34a' : '#dc2626',
              },
              {
                label: 'Tasa de ahorro',
                value: `${(summary?.savings_rate ?? 0).toFixed(1)}%`,
                color: '#0284c7',
              },
            ].map(card => (
              <div
                key={card.label}
                className="bg-white rounded-[10px] p-4"
                style={{ border: '0.5px solid #e8e8e0' }}
              >
                <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5">{card.label}</div>
                <div className="text-[20px] font-medium leading-none" style={{ color: card.color }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── CATEGORÍAS + TOP TRANSACCIONES ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">

            {/* Desglose por categoría */}
            <div
              className="bg-white rounded-[10px] p-4"
              style={{ border: '0.5px solid #e8e8e0' }}
            >
              <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-4">
                Desglose por categoría
              </div>
              {byCategory.length === 0 ? (
                <p className="text-[11px] text-[var(--color-text-muted)] py-4 text-center">
                  Sin datos en el período
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {byCategory.map(cat => (
                    <div key={cat.category_id} className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: cat.color || '#94a3b8' }}
                      />
                      <div className="text-[11px] text-[var(--color-text-secondary)] w-[110px] shrink-0 truncate">
                        {cat.category_name}
                      </div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#f0f0ea' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(cat.total / maxCat) * 100}%`,
                            background: cat.color || '#94a3b8',
                          }}
                        />
                      </div>
                      <div className="text-[11px] font-medium text-[var(--color-text-primary)] w-[72px] text-right shrink-0">
                        ${fmt(cat.total)}
                      </div>
                      <div
                        className="text-[10px] w-[36px] text-right shrink-0"
                        style={{ color: 'rgba(0,0,0,0.35)' }}
                      >
                        {cat.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top transacciones */}
            <div
              className="bg-white rounded-[10px] p-4"
              style={{ border: '0.5px solid #e8e8e0' }}
            >
              <div className="text-[12px] font-medium text-[var(--color-text-primary)] mb-4">
                Top transacciones del período
              </div>

              {/* Top gastos */}
              <div className="mb-4">
                <div
                  className="text-[9px] uppercase tracking-[0.06em] mb-2"
                  style={{ color: 'rgba(0,0,0,0.35)' }}
                >
                  Mayores gastos
                </div>
                {(topTx?.expense ?? []).length === 0 ? (
                  <p className="text-[11px] text-[var(--color-text-muted)]">Sin datos</p>
                ) : (topTx?.expense ?? []).map((tx, i) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-2 py-1.5"
                    style={{ borderBottom: i < (topTx?.expense.length ?? 0) - 1 ? '0.5px solid #f0f0ea' : 'none' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: tx.category_color || '#f87171' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[var(--color-text-primary)] truncate">
                        {tx.description || tx.category_name}
                      </div>
                      <div className="text-[9px] text-[var(--color-text-muted)]">
                        {fmtDate(tx.date)} · {tx.category_name}
                      </div>
                    </div>
                    <div className="text-[11px] font-medium shrink-0" style={{ color: '#dc2626' }}>
                      −${fmt(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top ingresos */}
              <div>
                <div
                  className="text-[9px] uppercase tracking-[0.06em] mb-2"
                  style={{ color: 'rgba(0,0,0,0.35)' }}
                >
                  Mayores ingresos
                </div>
                {(topTx?.income ?? []).length === 0 ? (
                  <p className="text-[11px] text-[var(--color-text-muted)]">Sin datos</p>
                ) : (topTx?.income ?? []).map((tx, i) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-2 py-1.5"
                    style={{ borderBottom: i < (topTx?.income.length ?? 0) - 1 ? '0.5px solid #f0f0ea' : 'none' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: tx.category_color || '#4ade80' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[var(--color-text-primary)] truncate">
                        {tx.description || tx.category_name}
                      </div>
                      <div className="text-[9px] text-[var(--color-text-muted)]">
                        {fmtDate(tx.date)} · {tx.category_name}
                      </div>
                    </div>
                    <div className="text-[11px] font-medium shrink-0" style={{ color: '#16a34a' }}>
                      +${fmt(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RESUMEN MENSUAL ANUAL ── */}
          <div
            className="bg-white rounded-[10px] p-4"
            style={{ border: '0.5px solid #e8e8e0' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-[12px] font-medium text-[var(--color-text-primary)]">
                Resumen mensual
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setYear(y => y - 1)}
                  className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[11px] transition-colors hover:opacity-70"
                  style={{ background: '#f7f7f2', border: '0.5px solid #d0d0cc', color: '#555' }}
                >
                  ‹
                </button>
                <span
                  className="text-[11px] font-medium px-2"
                  style={{ color: '#333' }}
                >
                  {year}
                </span>
                <button
                  onClick={() => setYear(y => y + 1)}
                  className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[11px] transition-colors hover:opacity-70"
                  style={{ background: '#f7f7f2', border: '0.5px solid #d0d0cc', color: '#555' }}
                  disabled={year >= currentYear}
                >
                  ›
                </button>
              </div>
            </div>

            <MonthlyBar data={monthly as any} />

            <div className="flex gap-4 mt-3">
              {[['#4ade80', 'Ingresos'], ['#f87171', 'Gastos']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </AppShell>
  )
}
