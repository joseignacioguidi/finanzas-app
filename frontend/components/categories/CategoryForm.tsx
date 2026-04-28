'use client'

import { useState } from 'react'
import { createCategory, updateCategory } from '@/lib/api'
import type { Category, CategoryInput } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const PRESET_COLORS = [
  '#10D9A0', '#6B9FDB', '#F5A623', '#C084FC',
  '#F0516A', '#38BDF8', '#FB923C', '#A3E635',
  '#F472B6', '#818CF8', '#34D399', '#FBBF24',
]

interface CategoryFormProps {
  initial?: Category
  onSuccess: () => void
  onCancel?: () => void
}

export default function CategoryForm({ initial, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('El nombre es requerido'); return }

    setLoading(true)
    try {
      const input: CategoryInput = { name: name.trim(), color }
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
      <Input
        label="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Ej: Alimentación"
        maxLength={100}
        required
        autoFocus
      />

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
