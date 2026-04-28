'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
    <div className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm text-sm">
      <p className="mb-2 font-medium text-[var(--color-text-muted)] uppercase tracking-wider text-xs">{label}</p>
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
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} barGap={4} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fill: '#888', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAmount}
          tick={{ fill: '#888', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f0ea' }} />
        <Bar dataKey="income" name="Ingresos" fill="#4ade80" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" name="Gastos" fill="#f87171" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
