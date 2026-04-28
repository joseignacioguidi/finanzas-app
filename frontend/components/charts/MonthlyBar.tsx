'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { MonthlyStatRow } from '@/lib/types'

interface MonthlyBarProps {
  data: MonthlyStatRow[]
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleString('es', { month: 'short' }).replace('.', '')
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 shadow-[var(--shadow-lg)] text-sm">
      <p className="mb-2 font-medium text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
          <span className="text-[var(--color-text-secondary)]">{entry.name}:</span>
          <span className="font-semibold font-mono" style={{ color: entry.fill }}>
            {new Intl.NumberFormat('es').format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyBar({ data }: MonthlyBarProps) {
  const formatted = data.map(row => ({
    ...row,
    mes: formatMonth(row.month),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} barGap={4} barCategoryGap="30%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="mes"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAmount}
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-overlay)' }} />
        <Legend
          formatter={(value) => (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{value}</span>
          )}
        />
        <Bar dataKey="income" name="Ingresos" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Gastos" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
