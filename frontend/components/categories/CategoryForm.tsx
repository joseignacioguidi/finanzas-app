'use client'

import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { createCategory, updateCategory } from '@/lib/api'
import type { Category, CategoryInput, CategoryType } from '@/lib/types'
import { CATEGORY_TYPE_LABELS, CATEGORY_TYPE_COLORS } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const PRESET_COLORS = [
  '#10D9A0', '#6B9FDB', '#F5A623', '#C084FC',
  '#F0516A', '#38BDF8', '#FB923C', '#A3E635',
  '#F472B6', '#818CF8', '#34D399', '#FBBF24',
]

const ICON_OPTIONS = [
  'Utensils', 'Pizza', 'Coffee', 'ShoppingCart', 'ShoppingBag',
  'Car', 'Bus', 'Bike', 'Plane', 'Train',
  'Home', 'Building2', 'Landmark', 'Wrench', 'Zap',
  'HeartPulse', 'Pill', 'Stethoscope', 'Dumbbell', 'Baby',
  'Film', 'Music', 'Gamepad2', 'BookOpen', 'GraduationCap',
  'Smartphone', 'Shirt', 'Dog', 'Gift', 'Globe',
  'TrendingUp', 'PiggyBank', 'Banknote', 'CreditCard', 'Briefcase',
  'Droplets', 'Wifi', 'Sun', 'Star', 'Tag',
]

function LucideIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = (LucideIcons as Record<string, any>)[name]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

interface CategoryFormProps {
  initial?: Category
  onSuccess: () => void
  onCancel?: () => void
}

const CATEGORY_TYPES: CategoryType[] = ['income', 'expense', 'savings', 'investment']

export default function CategoryForm({ initial, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [type, setType] = useState<CategoryType>(initial?.type ?? 'expense')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const typeChanged = !!initial && initial.type !== type

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('El nombre es requerido'); return }

    setLoading(true)
    try {
      const input: CategoryInput = { name: name.trim(), color, icon: icon || undefined, type }
      if (initial) {
        await updateCategory(initial.id, input)
      } else {
        await createCategory(input)
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Tipo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Tipo
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border"
              style={{
                borderColor: type === t ? CATEGORY_TYPE_COLORS[t] : 'var(--color-border)',
                backgroundColor: type === t ? `${CATEGORY_TYPE_COLORS[t]}15` : 'var(--color-bg-overlay)',
                color: type === t ? CATEGORY_TYPE_COLORS[t] : 'var(--color-text-muted)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: type === t ? CATEGORY_TYPE_COLORS[t] : 'var(--color-border)' }}
              />
              {CATEGORY_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {typeChanged && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1">
            Este cambio aplica a nuevos reportes. El historial anterior no se recalcula.
          </p>
        )}
      </div>

      <Input
        label="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Ej: Alimentación"
        maxLength={100}
        required
        autoFocus
      />

      {/* Color */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0"
            title="Color personalizado"
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-mono text-[var(--color-text-muted)]">{color}</span>
        </div>
      </div>

      {/* Ícono */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Ícono
        </label>
        <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {/* opción "ninguno" */}
          <button
            type="button"
            onClick={() => setIcon('')}
            title="Sin ícono"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors"
            style={{
              backgroundColor: icon === '' ? `${color}30` : 'var(--color-bg-overlay)',
              outline: icon === '' ? `2px solid ${color}` : 'none',
              outlineOffset: 1,
              color: 'var(--color-text-muted)',
            }}
          >
            —
          </button>
          {ICON_OPTIONS.map(iconName => (
            <button
              key={iconName}
              type="button"
              onClick={() => setIcon(iconName)}
              title={iconName}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: icon === iconName ? `${color}30` : 'var(--color-bg-overlay)',
                outline: icon === iconName ? `2px solid ${color}` : 'none',
                outlineOffset: 1,
                color: icon === iconName ? color : 'var(--color-text-muted)',
              }}
            >
              <LucideIcon name={iconName} size={15} />
            </button>
          ))}
        </div>
        {icon && (
          <div className="flex items-center gap-2 mt-0.5">
            <span style={{ color }}><LucideIcon name={icon} size={14} /></span>
            <span className="text-xs text-[var(--color-text-muted)]">{icon}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--color-expense)] bg-[var(--color-expense-bg)] border border-[var(--color-expense-border)] rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}
