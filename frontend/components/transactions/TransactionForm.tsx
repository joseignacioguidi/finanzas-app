'use client'

import { useState, useEffect } from 'react'
import { getCategories, createTransaction, updateTransaction } from '@/lib/api'
import type { Category, Transaction, TransactionInput } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL']

interface TransactionFormProps {
  initial?: Transaction
  onSuccess: () => void
  onCancel?: () => void
}

export default function TransactionForm({ initial, onSuccess, onCancel }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<TransactionInput>({
    category_id: initial?.category_id ?? '',
    type: initial?.type ?? 'expense',
    amount: initial?.amount ?? 0,
    currency: initial?.currency ?? 'ARS',
    description: initial?.description ?? '',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  function set<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.category_id) { setError('Seleccioná una categoría'); return }
    if (!form.amount || form.amount <= 0) { setError('El monto debe ser mayor a 0'); return }

    setLoading(true)
    try {
      if (initial) {
        await updateTransaction(initial.id, form)
      } else {
        await createTransaction(form)
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
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => set('type', t)}
            className={[
              'flex-1 h-10 rounded-md text-sm font-medium border transition-all duration-150',
              form.type === t
                ? t === 'income'
                  ? 'bg-[var(--color-income-bg)] text-[var(--color-income)] border-[var(--color-income-border)]'
                  : 'bg-[var(--color-expense-bg)] text-[var(--color-expense)] border-[var(--color-expense-border)]'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
            ].join(' ')}
          >
            {t === 'income' ? '↑ Ingreso' : '↓ Gasto'}
          </button>
        ))}
      </div>

      {/* Monto + Moneda */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Monto"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount || ''}
            onChange={e => set('amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="w-28">
          <Select
            label="Moneda"
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      {/* Categoría */}
      <Select
        label="Categoría"
        value={form.category_id}
        onChange={e => set('category_id', e.target.value)}
        required
      >
        <option value="">Seleccionar…</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </Select>

      {/* Fecha */}
      <Input
        label="Fecha"
        type="date"
        value={form.date}
        onChange={e => set('date', e.target.value)}
        required
      />

      {/* Descripción */}
      <Input
        label="Descripción (opcional)"
        type="text"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        placeholder="Ej: supermercado, Netflix…"
        maxLength={255}
      />

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
          {initial ? 'Guardar cambios' : 'Crear transacción'}
        </Button>
      </div>
    </form>
  )
}
