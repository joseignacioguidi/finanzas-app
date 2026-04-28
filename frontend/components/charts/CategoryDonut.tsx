'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategoryStatRow } from '@/lib/types'

interface CategoryDonutProps {
  data: CategoryStatRow[]
}

const FALLBACK_COLORS = [
  '#10D9A0', '#6B9FDB', '#F5A623', '#C084FC',
  '#F0516A', '#38BDF8', '#FB923C', '#A3E635',
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 shadow-[var(--shadow-lg)] text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color || FALLBACK_COLORS[0] }} />
        <span className="text-[var(--color-text-primary)] font-medium">{item.name}</span>
      </div>
      <p className="mt-1 font-semibold font-mono text-[var(--color-text-primary)]">
        {new Intl.NumberFormat('es').format(item.value)}
      </p>
    </div>
  )
}

export default function CategoryDonut({ data }: CategoryDonutProps) {
  if (!data.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        Sin datos este mes
      </div>
    )
  }

  const total = data.reduce((acc, row) => acc + row.total, 0)

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category_name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.category_id}
                fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {data.map((entry, index) => {
          const pct = total > 0 ? ((entry.total / total) * 100).toFixed(1) : '0'
          const color = entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
          return (
            <div key={entry.category_id} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--color-text-secondary)] truncate flex-1">{entry.category_name}</span>
              <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
